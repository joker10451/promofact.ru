/**
 * scripts/sync-catalog.mjs
 * Безопасная синхронизация партнерского каталога PromoFact:
 * 1. Загрузка окружения (.env.local, .env.production).
 * 2. Запрос свежего фида Perfluence API (с таймаутом).
 * 3. Строгая валидация и фильтрация истёкших предложений и некорректных дат.
 * 4. Поддержка предложений без промокода (действующие акции по партнерской ссылке).
 * 5. Защита от случайного обнуления и резкого необъяснимого сокращения каталога.
 * 6. Атомарная запись данных (write-to-temp + rename).
 * 7. Раздельные статусы: 'success', 'fallback', 'failed'.
 * 8. Защита от подмены дат: при недоступности API или аномалиях lastSuccessSync НЕ обновляется.
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// Загрузка локальных переменных окружения (без сторонних зависимостей)
function loadEnv() {
  for (const filename of [".env.local", ".env.production", ".env"]) {
    const filePath = path.resolve(filename);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;

      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
}

loadEnv();

const FEED_PATH = path.resolve("src/data/perfluence-feed.json");
const META_PATH = path.resolve("src/data/sync-meta.json");
const TIMEOUT_MS = 15000;

function atomicWriteJson(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
}

export function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PromoFactCatalogSync/1.0",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (err) {
            reject(new Error(`Невалидный JSON от партнёра: ${err.message}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Таймаут соединения (${TIMEOUT_MS}ms)`));
    });
  });
}

/**
 * Парсинг даты экспирации купона или акции.
 * Возвращает точный timestamp (миллисекунды эпохи) или null, если дата отсутствует/некорректна.
 * Для date-only значений трактуется как конец дня по Москве (23:59:59.999+03:00).
 * При наличии точного времени (HH:mm[:ss]) вычисляет точный timestamp момента.
 */
export function parseDateTs(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Формат DD.MM.YYYY с опциональным временем HH:mm[:ss]
  const ruMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (ruMatch) {
    const day = parseInt(ruMatch[1], 10);
    const month = parseInt(ruMatch[2], 10);
    const year = parseInt(ruMatch[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2040) {
      return null;
    }
    const yyyy = String(year);
    const mm = ruMatch[2];
    const dd = ruMatch[1];
    if (ruMatch[4] !== undefined && ruMatch[5] !== undefined) {
      const hh = ruMatch[4];
      const min = ruMatch[5];
      const ss = ruMatch[6] !== undefined ? ruMatch[6] : "00";
      const ts = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+03:00`).getTime();
      return isNaN(ts) ? null : ts;
    }
    const ts = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999+03:00`).getTime();
    return isNaN(ts) ? null : ts;
  }

  // ISO с явным временем YYYY-MM-DD[T ]HH:mm...
  const isoTimeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)/);
  if (isoTimeMatch) {
    if (/(?:Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
      const ts = new Date(trimmed).getTime();
      return isNaN(ts) ? null : ts;
    }
    const ts = new Date(`${trimmed}+03:00`).getTime();
    return isNaN(ts) ? null : ts;
  }

  // ISO date-only YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ts = new Date(`${trimmed}T23:59:59.999+03:00`).getTime();
    return isNaN(ts) ? null : ts;
  }

  const genericTs = new Date(trimmed).getTime();
  return isNaN(genericTs) ? null : genericTs;
}

/**
 * Очистка фида: фильтрует купоны с некорректной или истёкшей датой.
 * Сохраняет:
 * 1. Промокоды (активные, без истёкшей даты).
 * 2. Предложения без промокода (действующие акции с валидной партнерской ссылкой).
 * Поддерживает legacy-структуры (когда groups отсутствует или [item]).
 */
export function filterExpiredOffers(data, referenceTime = Date.now()) {
  if (!data || !Array.isArray(data.data)) {
    return {
      cleanData: null,
      totalPromos: 0,
      activePromos: 0,
      expiredPromos: 0,
      totalLinkOffers: 0,
      activeLinkOffers: 0,
      expiredLinkOffers: 0,
      totalOffers: 0,
      activeOffers: 0,
      expiredOffers: 0,
    };
  }

  let totalPromos = 0;
  let activePromos = 0;
  let expiredPromos = 0;

  let totalLinkOffers = 0;
  let activeLinkOffers = 0;
  let expiredLinkOffers = 0;

  const cleanProjects = [];

  for (const projectItem of data.data) {
    if (!projectItem || typeof projectItem !== "object") continue;
    const cleanGroups = [];
    const rawGroups = Array.isArray(projectItem.groups) ? projectItem.groups : [projectItem];

    for (const group of rawGroups) {
      if (!group || typeof group !== "object") continue;
      const promos = Array.isArray(group.promocodes) ? group.promocodes : [];

      // ВАРИАНТ А: Группа с промокодами
      if (promos.length > 0) {
        const validPromos = [];
        for (const promo of promos) {
          if (!promo || typeof promo !== "object") continue;
          totalPromos++;
          const dateStr = promo.date || promo.expires || group.date_end || group.dateEnd;
          if (dateStr) {
            const expTs = parseDateTs(dateStr);
            if (expTs === null || expTs < referenceTime) {
              expiredPromos++;
            } else {
              activePromos++;
              validPromos.push(promo);
            }
          } else {
            // Бессрочный промокод без указанной даты окончания (не приписываем фиктивную дату)
            activePromos++;
            validPromos.push(promo);
          }
        }

        if (validPromos.length > 0) {
          cleanGroups.push({ ...group, promocodes: validPromos });
        }
      } else {
        // ВАРИАНТ Б: Предложение без промокода (акция по партнерской ссылке)
        const landing = Array.isArray(group.landing) ? group.landing[0] : group.landing;
        const links = Array.isArray(group.links_for_subscribers) ? group.links_for_subscribers : [];
        const partnerLink =
          (landing && typeof landing.link === "string" ? landing.link : "") ||
          (links[0] && typeof links[0].link === "string" ? links[0].link : "");

        const isValidUrl = Boolean(
          partnerLink &&
            (partnerLink.startsWith("http://") || partnerLink.startsWith("https://"))
        );

        if (isValidUrl) {
          totalLinkOffers++;
          const dateStr =
            group.date_end ||
            group.dateEnd ||
            (landing && landing.date_end) ||
            (links[0] && links[0].date_end);

          if (dateStr) {
            const expTs = parseDateTs(dateStr);
            if (expTs === null || expTs < referenceTime) {
              expiredLinkOffers++;
            } else {
              activeLinkOffers++;
              cleanGroups.push(group);
            }
          } else {
            // Бессрочная акция по партнерской ссылке (не приписываем фиктивную дату)
            activeLinkOffers++;
            cleanGroups.push(group);
          }
        }
      }
    }

    if (cleanGroups.length > 0) {
      cleanProjects.push({ ...projectItem, groups: cleanGroups });
    }
  }

  const totalOffers = totalPromos + totalLinkOffers;
  const activeOffers = activePromos + activeLinkOffers;
  const expiredOffers = expiredPromos + expiredLinkOffers;

  return {
    cleanData: { ...data, data: cleanProjects },
    totalPromos,
    activePromos,
    expiredPromos,
    totalLinkOffers,
    activeLinkOffers,
    expiredLinkOffers,
    totalOffers,
    activeOffers,
    expiredOffers,
  };
}

/**
 * Извлекает точные данные публикаций (exact datetime, clean links, erid)
 * из авторизованного кабинета Perfluence (https://dash.perfluence.net/posts).
 * НЕ падает при отсутствии сессии или сетевых сбоях — возвращает null.
 */
export async function fetchAuthorizedPublicationDetails(sessionFilePath) {
  const sessionPath = sessionFilePath || path.resolve("data/perfluence_session.json");
  if (!fs.existsSync(sessionPath)) {
    console.log("ℹ️ [sync-catalog] exact expiry time source unavailable (no authorized session file); using date-only semantics.");
    return null;
  }

  let cookieHeader = "";
  try {
    const session = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
    const cookies = Array.isArray(session.cookies) ? session.cookies : [];
    cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch (err) {
    console.warn(`⚠️ [sync-catalog] failed to read session file: ${err.message}`);
    return null;
  }

  if (!cookieHeader) {
    console.log("ℹ️ [sync-catalog] empty session cookies; using date-only semantics.");
    return null;
  }

  try {
    const res = await fetch("https://dash.perfluence.net/posts", {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0",
      },
    });

    if (!res.ok) {
      console.warn(`⚠️ [sync-catalog] authorized publication details request failed (HTTP ${res.status}); using date-only semantics.`);
      return null;
    }

    const html = await res.text();
    return parsePublicationTiles(html);
  } catch (err) {
    console.warn(`⚠️ [sync-catalog] authorized publication details fetch error: ${err.message}; using date-only semantics.`);
    return null;
  }
}

/**
 * Generic-парсер плиток публикаций из HTML кабинета блогера
 */
export function parsePublicationTiles(html) {
  if (!html || typeof html !== "string") return new Map();

  const tiles = html.split('<div class="post-tile-widget');
  const projectMap = new Map();

  for (const rawTile of tiles.slice(1)) {
    const projMatch = rawTile.match(/href="\/project\/(\d+)/i);
    if (!projMatch) continue;
    const projId = parseInt(projMatch[1], 10);

    const tile = rawTile
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, " ");

    const promoRegex = /data-clipboard-text="([A-Za-z0-9_-]+)"[\s\S]*?до\s+(\d{2}\.\d{2}\.\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)/g;
    const promos = new Map();
    let m;
    while ((m = promoRegex.exec(tile)) !== null) {
      const code = m[1];
      const expiry = m[2];
      promos.set(code, expiry);
    }

    const linkRegex = /https?:\/\/[a-zA-Z0-9.-]*prfl\.me\/[^\s"<>]+/g;
    const links = [];
    while ((m = linkRegex.exec(tile)) !== null) {
      let l = m[0].replace(/[";,]+$/, "");
      if (!links.includes(l)) {
        links.push(l);
      }
    }

    const eridRegex = /erid[:=\s]+([A-Za-z0-9_-]+)/g;
    const erids = [];
    while ((m = eridRegex.exec(tile)) !== null) {
      if (!erids.includes(m[1])) {
        erids.push(m[1]);
      }
    }

    const existing = projectMap.get(projId) || { promos: new Map(), links: [], erids: [] };
    for (const [code, exp] of promos.entries()) {
      existing.promos.set(code, exp);
    }
    for (const l of links) {
      if (!existing.links.includes(l)) existing.links.push(l);
    }
    for (const e of erids) {
      if (!existing.erids.includes(e)) existing.erids.push(e);
    }
    projectMap.set(projId, existing);
  }

  return projectMap;
}

/**
 * Обогащает live-проекты точными данными публикаций (exact datetime, subscriber links, erid)
 */
export function enrichWithPublicationDetails(projects, pubDetails) {
  if (!Array.isArray(projects)) return projects;
  if (!pubDetails || typeof pubDetails.get !== "function") {
    return projects;
  }

  for (const projectItem of projects) {
    if (!projectItem || typeof projectItem !== "object") continue;
    const projId = projectItem.project?.id || projectItem.project_id;
    if (!projId) continue;

    const details = pubDetails.get(Number(projId)) || pubDetails.get(String(projId));
    const groups = Array.isArray(projectItem.groups) ? projectItem.groups : [];

    for (const group of groups) {
      const promos = Array.isArray(group.promocodes) ? group.promocodes : [];
      for (const p of promos) {
        if (!p || !p.code) continue;
        if (details && details.promos && details.promos.has(p.code)) {
          const exactDate = details.promos.get(p.code);
          p.date = exactDate;
          p.expires = exactDate;
        }
      }

      if (details) {
        if (details.erids && details.erids.length > 0 && !group.ord_marker) {
          group.ord_marker = details.erids[0];
        }
      }
    }
  }

  return projects;
}

/**
 * Снимает снепшот динамических данных живого API по каждому проекту.
 */
export function createLiveSnapshot(projects) {
  const snapshot = new Map();
  for (const p of projects || []) {
    if (!p || typeof p !== "object") continue;
    const projId = p.project?.id || p.project_id;
    if (!projId) continue;

    const promos = (p.groups || []).flatMap((g) => g.promocodes || []);
    const promoMap = new Map();
    for (const pr of promos) {
      if (pr.code) {
        promoMap.set(pr.code, {
          date: pr.date || pr.expires || null,
          ordMarker: pr.ord_marker || null,
        });
      }
    }

    const links = (p.groups || []).flatMap((g) =>
      (g.links_for_subscribers || []).map((l) => l.link).filter(Boolean)
    );
    const ordMarkers = (p.groups || []).map((g) => g.ord_marker).filter(Boolean);

    snapshot.set(projId, {
      projId,
      promoCodes: new Set(promoMap.keys()),
      promos: promoMap,
      links: new Set(links),
      ordMarkers: new Set(ordMarkers),
    });
  }
  return snapshot;
}

/**
 * Проверяет общий инвариант семантической свежести после слияния с supplemental.
 */
export function assertSemanticFreshness(cleanProjects, liveSnapshot) {
  if (!liveSnapshot || liveSnapshot.size === 0) return;
  const cleanMap = new Map(cleanProjects.map((p) => [p.project?.id || p.project_id, p]));

  for (const [projId, live] of liveSnapshot.entries()) {
    const cleanProj = cleanMap.get(projId);
    if (!cleanProj) {
      throw new Error(`Semantic Freshness Violation: live project ${projId} disappeared after supplemental merge!`);
    }

    const cleanPromos = (cleanProj.groups || []).flatMap((g) => g.promocodes || []);
    const cleanPromoMap = new Map(cleanPromos.map((p) => [p.code, p]));

    // 1. Ни один live active промокод не должен исчезнуть
    for (const code of live.promoCodes) {
      if (!cleanPromoMap.has(code)) {
        throw new Error(
          `Semantic Freshness Violation: live active promo code '${code}' in project ${projId} disappeared after supplemental merge!`
        );
      }
      // 2. Expiry live промокода не должен быть заменен
      const livePromo = live.promos.get(code);
      const cleanPromo = cleanPromoMap.get(code);
      const cleanDate = cleanPromo.date || cleanPromo.expires || null;
      if (livePromo.date && cleanDate !== livePromo.date) {
        throw new Error(
          `Semantic Freshness Violation: live promo '${code}' expiry in project ${projId} was mutated from '${livePromo.date}' to '${cleanDate}'!`
        );
      }
      // 3. ord_marker live промокода не должен быть заменен
      if (livePromo.ordMarker && cleanPromo.ord_marker && cleanPromo.ord_marker !== livePromo.ordMarker) {
        throw new Error(
          `Semantic Freshness Violation: live promo '${code}' ord_marker in project ${projId} was mutated!`
        );
      }
    }

    // 4. Проверяем, что supplemental не подмешал лишних промокодов в существующий проект
    for (const code of cleanPromoMap.keys()) {
      if (!live.promoCodes.has(code)) {
        throw new Error(
          `Semantic Freshness Violation: stale promo code '${code}' was injected into live project ${projId} from supplemental!`
        );
      }
    }

    // 5. Проверяем подписные ссылки: live ссылки не должны исчезать
    const cleanLinks = new Set(
      (cleanProj.groups || []).flatMap((g) =>
        (g.links_for_subscribers || []).map((l) => l.link).filter(Boolean)
      )
    );
    for (const link of live.links) {
      if (!cleanLinks.has(link)) {
        throw new Error(
          `Semantic Freshness Violation: live subscriber link in project ${projId} was replaced or removed!`
        );
      }
    }
  }
}

export async function runCatalogSync(options = {}) {
  const feedPath = options.feedPath || FEED_PATH;
  const metaPath = options.metaPath || META_PATH;
  const widgetUrl = options.url !== undefined ? options.url : process.env.PERFLUENCE_WIDGET_URL;
  console.log("=== Синхронизация партнерского каталога PromoFact ===");

  // Читаем текущие метаданные для сохранения исторического lastSuccessSync при сбоях
  let existingMeta = { lastSuccessSync: null, projectCount: 0, activeOffers: 0, status: "initial" };
  if (fs.existsSync(metaPath)) {
    try {
      existingMeta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {
      // Игнорируем повреждения метаданных
    }
  }

  let apiSuccess = false;
  let rawApiData = null;
  let syncError = null;

  if (options.rawFeed !== undefined) {
    rawApiData = options.rawFeed;
    apiSuccess = true;
    console.log(`✓ Тестовый фид передан напрямую: ${rawApiData && Array.isArray(rawApiData.data) ? rawApiData.data.length : "не массив"} проектов.`);
  } else if (widgetUrl) {
    console.log(`Запрос фида из Perfluence API (${widgetUrl.slice(0, 30)}...)...`);
    try {
      rawApiData = await fetchJson(widgetUrl);
      if (rawApiData && Array.isArray(rawApiData.data) && rawApiData.data.length > 0) {
        apiSuccess = true;
        console.log(`✓ Ответ API получен: ${rawApiData.data.length} проектов.`);
      } else {
        syncError = new Error("API вернул пустой массив проектов");
      }
    } catch (err) {
      syncError = err;
      console.warn(`⚠️ Сбой обращения к партнёрскому API: ${err.message}`);
    }
  } else {
    syncError = new Error("PERFLUENCE_WIDGET_URL не настроен");
    console.log("ℹ️ PERFLUENCE_WIDGET_URL не задан.");
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // СЦЕНАРИЙ 1: Обработка ответа API с защитой от случайного обнуления и резкого спада
  if (apiSuccess && rawApiData) {
    if (typeof rawApiData !== "object" || rawApiData === null) {
      const corruptError = "Повреждённая структура фида: входные данные не являются объектом";
      console.warn(`⚠️ ${corruptError}`);
      syncError = new Error(corruptError);
    } else {
      // Попытка обогатить live-данные точным временем экспирации из авторизованного источника
      const pubDetails = await fetchAuthorizedPublicationDetails(options.sessionPath);
      if (pubDetails && Array.isArray(rawApiData.data)) {
        enrichWithPublicationDetails(rawApiData.data, pubDetails);
      }

      let {
        cleanData,
        totalPromos,
        activePromos,
        expiredPromos,
        totalLinkOffers,
        activeLinkOffers,
        expiredLinkOffers,
        totalOffers,
        activeOffers,
        expiredOffers,
      } = filterExpiredOffers(rawApiData, now);

      if (!cleanData || !Array.isArray(cleanData.data)) {
        const corruptError = "Повреждённая структура фида: отсутствует валидный массив data";
        console.warn(`⚠️ ${corruptError}`);
        syncError = new Error(corruptError);
        // Не завершаемся аварийно, переходим в резервный режим
      } else {
      // Снимаем снепшот динамических данных живого API ДО supplemental merge
      const liveSnapshot = createLiveSnapshot(cleanData.data);
      const prevActiveOffers = existingMeta.activeOffers || existingMeta.activePromos || 0;
      const prevProjects = existingMeta.projectCount || 0;
      const newProjects = cleanData.data.length;

      // ЗАЩИТА 1: Аномальное обнуление каталога (были офферы, а стало 0)
      const isWipeout = newProjects === 0 || activeOffers === 0;
      if (isWipeout && prevActiveOffers > 0 && !options.allowEmpty) {
        const wipeoutError = `Аномальное обнуление каталога: получено 0 действующих предложений (было ${prevActiveOffers}). Обновление заблокировано.`;
        console.error(`🚨 ${wipeoutError}`);

        const meta = {
          lastSuccessSync: existingMeta.lastSuccessSync || null, // Сохраняем честную дату!
          lastAttemptAt: nowIso,
          status: "fallback",
          source: "local-bundled-feed",
          projectCount: prevProjects,
          totalPromos: existingMeta.totalPromos || 0,
          activePromos: existingMeta.activePromos || 0,
          expiredPromos: existingMeta.expiredPromos || 0,
          totalOffers: prevActiveOffers,
          activeOffers: prevActiveOffers,
          expiredOffers: 0,
          error: wipeoutError,
          updatedAt: nowIso,
        };

        atomicWriteJson(metaPath, meta);
        return { status: "fallback", meta };
      }

      // ЗАЩИТА 2: Резкое необъяснимое сокращение каталога (>60% потери данных)
      const isCatastrophicDrop =
        prevProjects >= 10 &&
        prevActiveOffers >= 20 &&
        (newProjects < Math.floor(prevProjects * 0.4) || activeOffers < Math.floor(prevActiveOffers * 0.4));

      if (isCatastrophicDrop && !options.allowDrop) {
        const dropError = `Аномальное сокращение каталога: проектов ${newProjects} (было ${prevProjects}), предложений ${activeOffers} (было ${prevActiveOffers}). Обновление заблокировано.`;
        console.warn(`🚨 ${dropError}`);

        const meta = {
          lastSuccessSync: existingMeta.lastSuccessSync || null,
          lastAttemptAt: nowIso,
          status: "fallback",
          source: "local-bundled-feed",
          projectCount: prevProjects,
          totalOffers: prevActiveOffers,
          activeOffers: prevActiveOffers,
          error: dropError,
          updatedAt: nowIso,
        };

        atomicWriteJson(metaPath, meta);
        return { status: "fallback", meta };
      }

      // Дополняем проектами из supplemental-projects.json, если их ещё нет в фиде
      const suppPath = options.supplementalPath || (!options.feedPath ? path.resolve("src/data/supplemental-projects.json") : null);
      if (suppPath && fs.existsSync(suppPath)) {
        try {
          const supp = JSON.parse(fs.readFileSync(suppPath, "utf-8"));
          if (Array.isArray(supp)) {
            const existingMap = new Map(cleanData.data.map((p) => [p.project?.id || p.project_id, p]));
            for (const item of supp) {
              const projId = item.project?.id || item.project_id;
              if (!projId) continue;
              const existing = existingMap.get(projId);
              if (!existing) {
                // Проекта нет в live API: фильтруем акции из supplemental по сроку действия
                const groups = item.groups || [];
                const validGroups = [];
                for (const g of groups) {
                  const validPromos = (g.promocodes || []).filter((p) => {
                    const d = p.date || p.expires;
                    if (!d) return true;
                    const ts = parseDateTs(d);
                    return ts !== null && ts >= now;
                  });
                  const validLinks = (g.links_for_subscribers || []).filter((l) => {
                    const d = l.date_end || l.dateEnd;
                    if (!d) return true;
                    const ts = parseDateTs(d);
                    return ts !== null && ts >= now;
                  });
                  if (validPromos.length > 0 || validLinks.length > 0) {
                    validGroups.push({
                      ...g,
                      promocodes: validPromos,
                      links_for_subscribers: validLinks,
                    });
                  }
                }

                if (validGroups.length > 0) {
                  const cleanItem = {
                    ...item,
                    project: item.project || {
                      id: projId,
                      name: item.project_name || "Проект",
                      logo: item.info?.logo || "",
                      ...item.info,
                    },
                    groups: validGroups,
                  };
                  cleanData.data.push(cleanItem);
                  existingMap.set(projId, cleanItem);
                  for (const g of validGroups) {
                    const pCount = (g.promocodes || []).length;
                    totalPromos += pCount;
                    activePromos += pCount;
                    const lCount = (g.links_for_subscribers || []).length;
                    totalLinkOffers += lCount;
                    activeLinkOffers += lCount;
                  }
                }
              } else {
                // Проект УЖЕ ЕСТЬ в live API.
                // ПРАВИЛО: live API имеет абсолютный приоритет для динамических полей:
                // promocodes, expiration, links_for_subscribers, ord_marker.
                // НЕ восстанавливаем старые промокоды/ссылки/erid из supplemental.
                // Supplemental используется ТОЛЬКО для обогащения данными, отсутствующими в API:
                // medical warning (ПРОТИВОПОКАЗАНИЯ) для ord_custom_text / promo_terms.
                const suppPromos = (item.groups || []).flatMap((g) => g.promocodes || []);
                const suppPromoByCode = new Map(suppPromos.map((p) => [p.code, p]));
                for (const g of existing.groups || []) {
                  for (const p of g.promocodes || []) {
                    const sp = suppPromoByCode.get(p.code);
                    if (sp?.ord_custom_text && !p.ord_custom_text?.includes("ПРОТИВОПОКАЗАНИЯ") && sp.ord_custom_text.includes("ПРОТИВОПОКАЗАНИЯ")) {
                      p.ord_custom_text = sp.ord_custom_text;
                    }
                    if (sp?.promo_terms && !p.promo_terms?.includes("противопоказан") && sp.promo_terms.includes("противопоказан")) {
                      p.promo_terms = `${p.promo_terms || ""}\n${sp.promo_terms}`.trim();
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn("Не удалось загрузить supplemental-projects.json:", e.message);
        }
      }

      // Проверка общего инварианта семантической свежести для ВСЕХ проектов
      assertSemanticFreshness(cleanData.data, liveSnapshot);

      // Успешная валидация: атомарно сохраняем свежий фид
      atomicWriteJson(feedPath, cleanData);
      console.log(
        `✓ Актуальный фид сохранён в ${feedPath} (проектов: ${cleanData.data.length}, акций: ${activeOffers} [кодов: ${activePromos}, ссылок: ${activeLinkOffers}], отфильтровано: ${expiredOffers})`
      );

      const meta = {
        lastSuccessSync: nowIso,
        lastAttemptAt: nowIso,
        status: "success",
        source: "perfluence-api",
        projectCount: cleanData.data.length,
        totalPromos,
        activePromos,
        expiredPromos,
        totalLinkOffers,
        activeLinkOffers,
        expiredLinkOffers,
        totalOffers,
        activeOffers,
        expiredOffers,
        updatedAt: nowIso,
      };

      atomicWriteJson(metaPath, meta);
      console.log(`✓ Статус 'success' записан в ${metaPath}`);
      return { status: "success", meta };
    }
    }
  }

  // СЦЕНАРИЙ 2: API недоступен или повреждён — проверяем наличие резервного локального фида
  console.log("Переход в резервный режим (проверка локального фида)...");
  if (fs.existsSync(feedPath)) {
    try {
      const localFeed = JSON.parse(fs.readFileSync(feedPath, "utf-8"));
      if (Array.isArray(localFeed.data) && localFeed.data.length > 0) {
        const {
          totalPromos,
          activePromos,
          expiredPromos,
          totalLinkOffers,
          activeLinkOffers,
          expiredLinkOffers,
          totalOffers,
          activeOffers,
          expiredOffers,
        } = filterExpiredOffers(localFeed, now);

        console.log(
          `ℹ️ Локальный фид доступен (${localFeed.data.length} проектов, активных предложений: ${activeOffers}).`
        );
        console.log(`⚠️ ВНИМАНИЕ: lastSuccessSync НЕ обновляется, так как API был недоступен.`);

        const meta = {
          lastSuccessSync: existingMeta.lastSuccessSync || null, // Сохраняем исходное реальное время
          lastAttemptAt: nowIso,
          status: "fallback",
          source: "local-bundled-feed",
          projectCount: localFeed.data.length,
          totalPromos,
          activePromos,
          expiredPromos,
          totalLinkOffers,
          activeLinkOffers,
          expiredLinkOffers,
          totalOffers,
          activeOffers,
          expiredOffers,
          error: syncError?.message || "Unknown error",
          updatedAt: nowIso,
        };

        atomicWriteJson(metaPath, meta);
        console.log(`✓ Статус 'fallback' записан в ${metaPath}`);
        return { status: "fallback", meta };
      }
    } catch (err) {
      console.error(`Критический сбой чтения локального фида: ${err.message}`);
    }
  }

  // СЦЕНАРИЙ 3: Полный сбой (нет ни API, ни локального фида)
  const meta = {
    lastSuccessSync: existingMeta.lastSuccessSync || null,
    lastAttemptAt: nowIso,
    status: "failed",
    source: "none",
    projectCount: 0,
    totalPromos: 0,
    activePromos: 0,
    expiredPromos: 0,
    totalOffers: 0,
    activeOffers: 0,
    expiredOffers: 0,
    error: syncError?.message || "No feed source available",
    updatedAt: nowIso,
  };

  atomicWriteJson(metaPath, meta);
  console.error(`❌ Критический сбой синхронизации: статус 'failed' записан в ${metaPath}`);
  return { status: "failed", meta };
}

// Запуск напрямую из CLI
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve("scripts/sync-catalog.mjs");
if (isDirectRun) {
  runCatalogSync()
    .then(({ status }) => {
      if (status === "failed") process.exit(1);
    })
    .catch((err) => {
      console.error("Необработанная ошибка синхронизации:", err);
      process.exit(1);
    });
}
