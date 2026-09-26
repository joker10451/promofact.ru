/**
 * scripts/sync-catalog.mjs
 * Безопасная синхронизация партнерского каталога PromoFact:
 * 1. Загрузка окружения (.env.local, .env.production).
 * 2. Запрос свежего фида Perfluence API (с таймаутом).
 * 3. Строгая валидация и фильтрация истёкших предложений и некорректных дат.
 * 4. Атомарная запись данных (write-to-temp + rename).
 * 5. Раздельные статусы: 'success', 'fallback', 'failed'.
 * 6. Защита от подмены дат: при недоступности API lastSuccessSync НЕ обновляется.
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

function fetchJson(url) {
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
 * Парсинг даты экспирации купона.
 * Возвращает timestamp конца дня или null, если дата отсутствует/некорректна.
 */
export function parseDateTs(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Формат DD.MM.YYYY
  const ruMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ruMatch) {
    const day = parseInt(ruMatch[1], 10);
    const month = parseInt(ruMatch[2], 10);
    const year = parseInt(ruMatch[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2040) {
      return null;
    }
    const ts = new Date(`${year}-${ruMatch[2]}-${ruMatch[1]}T23:59:59.999Z`).getTime();
    return isNaN(ts) ? null : ts;
  }

  // ISO / стандартный формат YYYY-MM-DD
  const isoTs = new Date(trimmed.includes("T") ? trimmed : `${trimmed}T23:59:59.999Z`).getTime();
  return isNaN(isoTs) ? null : isoTs;
}

/**
 * Очистка фида: фильтрует купоны с некорректной или истёкшей датой.
 */
export function filterExpiredOffers(data, referenceTime = Date.now()) {
  if (!data || !Array.isArray(data.data)) {
    return { cleanData: null, totalPromos: 0, activePromos: 0, expiredPromos: 0 };
  }

  let totalPromos = 0;
  let activePromos = 0;
  let expiredPromos = 0;

  const cleanProjects = [];

  for (const projectItem of data.data) {
    const cleanGroups = [];
    if (Array.isArray(projectItem.groups)) {
      for (const group of projectItem.groups) {
        if (Array.isArray(group.promocodes)) {
          const validPromos = [];
          for (const promo of group.promocodes) {
            totalPromos++;
            const expTs = parseDateTs(promo.date || promo.expires);
            // Если дата отсутствует, повреждена или в прошлом — считаем истёкшей
            if (expTs === null || expTs < referenceTime) {
              expiredPromos++;
            } else {
              activePromos++;
              validPromos.push(promo);
            }
          }
          if (validPromos.length > 0) {
            cleanGroups.push({ ...group, promocodes: validPromos });
          }
        }
      }
    }

    if (cleanGroups.length > 0) {
      cleanProjects.push({ ...projectItem, groups: cleanGroups });
    }
  }

  return {
    cleanData: { ...data, data: cleanProjects },
    totalPromos,
    activePromos,
    expiredPromos,
  };
}

export async function runCatalogSync(options = {}) {
  const widgetUrl = options.url !== undefined ? options.url : process.env.PERFLUENCE_WIDGET_URL;
  console.log("=== Синхронизация партнерского каталога PromoFact ===");

  // Читаем текущие метаданные для сохранения исторического lastSuccessSync при сбоях
  let existingMeta = { lastSuccessSync: null, projectCount: 0, status: "initial" };
  if (fs.existsSync(META_PATH)) {
    try {
      existingMeta = JSON.parse(fs.readFileSync(META_PATH, "utf-8"));
    } catch {
      // Игнорируем повреждения метаданных
    }
  }

  let apiSuccess = false;
  let rawApiData = null;
  let syncError = null;

  if (widgetUrl) {
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

  // СЦЕНАРИЙ 1: Успешный ответ API
  if (apiSuccess && rawApiData) {
    const { cleanData, totalPromos, activePromos, expiredPromos } = filterExpiredOffers(rawApiData, now);

    if (activePromos === 0) {
      console.warn("⚠️ В ответе API все предложения истёкшие или невалидные!");
    }

    // Атомарно сохраняем свежий фид
    atomicWriteJson(FEED_PATH, cleanData);
    console.log(`✓ Актуальный фид сохранён в ${FEED_PATH} (активных акций: ${activePromos}, отфильтровано истёкших: ${expiredPromos})`);

    const meta = {
      lastSuccessSync: nowIso,
      lastAttemptAt: nowIso,
      status: "success",
      source: "perfluence-api",
      projectCount: cleanData.data.length,
      totalPromos,
      activePromos,
      expiredPromos,
      updatedAt: nowIso,
    };

    atomicWriteJson(META_PATH, meta);
    console.log(`✓ Статус 'success' записан в ${META_PATH}`);
    return { status: "success", meta };
  }

  // СЦЕНАРИЙ 2 / 3: API недоступен — проверяем наличие резервного локального фида
  console.log("Переход в резервный режим (проверка локального фида)...");
  if (fs.existsSync(FEED_PATH)) {
    try {
      const localFeed = JSON.parse(fs.readFileSync(FEED_PATH, "utf-8"));
      if (Array.isArray(localFeed.data) && localFeed.data.length > 0) {
        const { totalPromos, activePromos, expiredPromos } = filterExpiredOffers(localFeed, now);

        console.log(`ℹ️ Локальный фид доступен (${localFeed.data.length} проектов, активных акций: ${activePromos}).`);
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
          error: syncError?.message || "Unknown error",
          updatedAt: nowIso,
        };

        atomicWriteJson(META_PATH, meta);
        console.log(`✓ Статус 'fallback' записан в ${META_PATH}`);
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
    error: syncError?.message || "No feed source available",
    updatedAt: nowIso,
  };

  atomicWriteJson(META_PATH, meta);
  console.error(`❌ Критический сбой синхронизации: статус 'failed' записан в ${META_PATH}`);
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
