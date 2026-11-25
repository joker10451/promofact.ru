/**
 * scripts/pipeline-orchestrator.mjs
 * 
 * Полный замкнутый автономный цикл (Full Autonomous Loop):
 * 1. Очистка: удаляет истекшие акции из Telegram по таймеру
 * 2. Авто-подключение: сканирует каталог Perfluence и подключает свежие офферы (если есть сессия)
 * 3. Отбор: выбирает лучший оффер из активных (хит, анти-повтор 7 дней)
 * 4. Публикация: генерирует пост, проверяет erid и промокод, шлет в @smart_zakupka
 * 5. Сдача отчета: отправляет ссылку модераторам в Perfluence
 */

import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { submitReport } from "./perfluence-report.mjs";
import { generatePromoBanner } from "./banner-generator.mjs";
import { getFlashDeals } from "./perfluence-flash-deals.mjs";
import { postToVk } from "./vk-crossposter.mjs";
import { checkNewEarnings } from "./perfluence-earnings-monitor.mjs";
import { pingIndexNow } from "./indexnow-ping.mjs";
import { getProxyUrl, requestJson } from "./http-client.mjs";

let _autopilotPromise = null;
async function getPerfluenceAutopilot() {
  if (!_autopilotPromise) {
    _autopilotPromise = (async () => {
      try {
        register("./scripts/ts-loader.mjs", pathToFileURL("./"));
      } catch {}
      return await import("../src/lib/perfluenceAutopilot.ts");
    })();
  }
  return _autopilotPromise;
}
import {
  buildArticleCandidates,
  buildDigestCandidates,
  buildPampaduCandidates,
  canAutoPostNow,
  escapeHtml,
  fitCaption,
  getTgBotLink,
  loadStableStoreSlugs,
  loadTgHistory,
  parseExpiryMs,
  recordTgHistory,
  selectHybridTrack,
  withUtm,
} from "./hybrid-post-sources.mjs";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "posted_promos.json");
const SESSION_FILE = path.join(DATA_DIR, "perfluence_session.json");

// Чтение переменных окружения: сначала process.env (для GitHub Actions), затем fallback на .env.local
const envContent = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const fileEnv = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).trim();
    }
    fileEnv[match[1]] = val;
  }
}

const WIDGET_URL = (process.env.PERFLUENCE_WIDGET_URL || fileEnv.PERFLUENCE_WIDGET_URL || "").replace(/["']/g, "").trim();
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || fileEnv.TELEGRAM_BOT_TOKEN || "").replace(/["']/g, "").trim();
const CHANNEL_ID = (process.env.TELEGRAM_CHANNEL_ID || fileEnv.TELEGRAM_CHANNEL_ID || "@smart_zakupka").replace(/["']/g, "").trim();
const ADMIN_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || fileEnv.TELEGRAM_ADMIN_CHAT_ID || "6141363106").replace(/["']/g, "").trim();

/**
 * Адреса страниц магазинов на сайте. Те же, что в src/lib/perfluence.ts:
 * названия проектов в кабинете («Додо пицца Юг») в адрес не годятся.
 */
const STORE_SLUGS = {
  1653: "dodo-pizza",
  900: "bethowen",
  1483: "citydrive",
  2576: "sberprime",
  2548: "m-kosmetik",
  3641: "cozy-home",
  3807: "librederm",
  1977: "vazhnaya-ryba",
  2657: "podruzhka",
  2582: "magnit-dostavka",
  2333: "farfor",
  5067: "sberdevaysy",
  4463: "rosgosstrakh",
  1965: "yandex-afisha",
  3750: "yandeks-tsvety",
};

const STABLE_SLUGS = loadStableStoreSlugs();

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y",
  ь: "", э: "e", ю: "yu", я: "ya",
};

function storeSlugOf(storeId, storeName) {
  if (STABLE_SLUGS.byId[storeId]) return STABLE_SLUGS.byId[storeId];
  if (STORE_SLUGS[storeId]) return STORE_SLUGS[storeId];
  const byName = STABLE_SLUGS.byName[String(storeName || "").toLowerCase().trim()];
  if (byName) return byName;
  return String(storeName)
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "magazin";
}

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"];

function formatExpires(value) {
  const ru = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) return `${Number(ru[1])} ${MONTHS[Number(ru[2]) - 1] ?? ru[2]}`;
  const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${Number(iso[3])} ${MONTHS[Number(iso[2]) - 1] ?? iso[2]}`;
  return String(value);
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    }
  } catch {}
  return { postedIds: [], history: [] };
}

function saveHistory(history) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

async function deleteTelegramMessage(messageId) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL_ID, message_id: messageId })
  });
  return await res.json();
}

async function sendTelegramPost(text, buttons = [], imageUrl = null, extra = {}) {
  const replyMarkup = buttons.length > 0 ? { inline_keyboard: buttons } : undefined;
  const disableWebPagePreview = extra.disableWebPagePreview ?? false;

  // Если есть локальный файл или ссылка на баннер — шлем как фото с подписью (строго <= 980 симв., иначе переходим к sendMessage)
  if (imageUrl && text.length <= 1024) {
    const photoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let photoData;
        if (fs.existsSync(imageUrl) && !getProxyUrl()) {
          const fileBuffer = fs.readFileSync(imageUrl);
          const formData = new FormData();
          formData.append("chat_id", CHANNEL_ID);
          formData.append("photo", new Blob([fileBuffer], { type: "image/png" }), "banner.png");
          formData.append("caption", text);
          formData.append("parse_mode", "HTML");
          if (replyMarkup) formData.append("reply_markup", JSON.stringify(replyMarkup));

          const photoRes = await fetch(photoUrl, { method: "POST", body: formData });
          photoData = await photoRes.json();
        } else if (!fs.existsSync(imageUrl)) {
          const res = await requestJson(photoUrl, {
            method: "POST",
            body: {
              chat_id: CHANNEL_ID,
              photo: imageUrl,
              caption: text,
              parse_mode: "HTML",
              reply_markup: replyMarkup,
            },
          });
          photoData = res.json;
        }
        if (photoData?.ok) return photoData;
        if (photoData) console.warn(`⚠ sendPhoto попытка ${attempt} не удалась:`, photoData.description);
      } catch (photoErr) {
        console.warn(`⚠ sendPhoto попытка ${attempt} ошибка:`, photoErr.message);
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // Текстовая отправка (полный HTML до 4096 символов)
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await requestJson(url, {
    method: "POST",
    body: {
      chat_id: CHANNEL_ID,
      text: text.slice(0, 4096),
      parse_mode: "HTML",
      reply_markup: replyMarkup,
      disable_web_page_preview: disableWebPagePreview,
    },
  });
  return res.json || { ok: false, description: res.text };
}

async function fetchChannelSpecificOffer(projectId, targetAccount = "smart_zakupka") {
  if (!fs.existsSync(SESSION_FILE) || !projectId) return null;
  try {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    const cookies = session.cookies.map(c => `${c.name}=${c.value}`).join("; ");
    const url = `https://dash.perfluence.net/project/${projectId}/accounts`;
    const res = await fetch(url, {
      headers: { "Cookie": cookies, "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const idx = html.indexOf(targetAccount);
    if (idx === -1) return null;

    // Карточки аккаунтов идут подряд, поэтому «8000 символов после имени
    // канала» захватывало соседнюю карточку — чаще всего «Сайт». Из-за этого
    // бот брал ссылку и erid сайта и постил их в Telegram даже там, где заявка
    // канала отклонена (так вышло с Librederm). Режем строго по своей карточке.
    const STATUS = /Аккаунт одобрен|Заявка отклонена|Аккаунт на проверке|Аккаунт не подходит|Заявка на рассмотрении/g;
    const bounds = [];
    let m;
    while ((m = STATUS.exec(html)) !== null) bounds.push({ at: m.index, text: m[0] });

    const start = [...bounds].reverse().find((b) => b.at < idx);
    const end = bounds.find((b) => b.at > idx);
    if (!start) return null;
    if (start.text !== "Аккаунт одобрен") {
      console.log(` -> аккаунт «${targetAccount}»: ${start.text} — публиковать нельзя`);
      return null;
    }

    const sub = html.slice(start.at, end ? end.at : Math.min(html.length, idx + 8000));
    // Имя канала должно остаться внутри своей карточки — иначе разметка
    // изменилась и резать по статусам больше нельзя.
    if (!sub.includes(targetAccount)) return null;
    const linkMatch = sub.match(/https:\/\/[a-z0-9.]+\.prfl\.me\/[^\s"'<>]+/i);
    const eridMatch = sub.match(/erid:\s*([A-Za-z0-9_-]+)/i);
    const ordTextMatch = sub.match(/Маркер и токен[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i) || sub.match(/Реклама\.[\s\S]*?(?=<\/div>|<div)/i);

    const blocks = sub.split('<div class="modal-collapsing-block-details">');
    const promos = [];
    for (const b of blocks.slice(1)) {
      const codeMatch = b.match(/data-clipboard-text="([^"]+)"/i);
      const rubMatch = b.match(/на\s+RUB[^\d]*(\d+)/i) || b.match(/на\s+(\d+)\s*₽/i) || b.match(/на\s+(\d+%)/i);
      const dateMatch = b.match(/до\s*(\d{2}\.\d{2}\.\d{4})/i);
      const descMatch = b.match(/class="modal-collapsing-block-content">([\s\S]*?)<\/div>/i);
      if (codeMatch && !codeMatch[1].startsWith("http") && !codeMatch[1].startsWith("Реклама")) {
        promos.push({
          code: codeMatch[1].trim(),
          discountNum: rubMatch ? parseInt(rubMatch[1], 10) : 0,
          bonus: descMatch ? descMatch[1].trim() : (rubMatch ? `Скидка ${rubMatch[0]}` : "Скидка"),
          expires: dateMatch ? dateMatch[1] : null
        });
      }
    }

    let ordText = ordTextMatch ? ordTextMatch[0].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : null;
    if (ordText && ordText.startsWith("Маркер и токен")) {
      ordText = ordText.replace(/^Маркер и токен\s*/, "");
    }

    return {
      affUrl: linkMatch ? linkMatch[0] : null,
      ordMarker: eridMatch ? eridMatch[1] : null,
      ordText,
      promos
    };
  } catch {
    return null;
  }
}

async function fetchProjectTemplateImage(projectId) {
  if (!fs.existsSync(SESSION_FILE) || !projectId) return null;
  const url = `https://dash.perfluence.net/project/${projectId}/templates`;
  try {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    const cookies = session.cookies.map(c => `${c.name}=${c.value}`).join("; ");
    const res = await fetch(url, {
      headers: { "Cookie": cookies, "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const itemRegex = /<div[^>]+data-template-size-type="([^"]*)"[^>]*data-template-post-type="([^"]*)"[\s\S]*?<img[^>]+src="(https:\/\/s3sc\.perfluence\.net\/screens\/[^"]+)"/gi;
    let m;
    const templates = [];
    while ((m = itemRegex.exec(html)) !== null) {
      templates.push({
        sizeType: m[1],
        postType: m[2],
        url: m[3]
      });
    }

    if (templates.length === 0) {
      const fallbackMatch = html.match(/src="(https:\/\/s3sc\.perfluence\.net\/screens\/[^"]+)"/i);
      return fallbackMatch ? fallbackMatch[1] : null;
    }

    // Приоритет: square или landscape для постов (post)
    const postSquare = templates.find(t => t.postType === "post" && t.sizeType === "square");
    if (postSquare) return postSquare.url;

    const postLandscape = templates.find(t => t.postType === "post" && t.sizeType === "landscape");
    if (postLandscape) return postLandscape.url;

    const anyPost = templates.find(t => t.postType === "post");
    if (anyPost) return anyPost.url;

    return templates[0].url;
  } catch {
    return null;
  }
}

export async function runPipeline(options = { dryRun: false, takeOffers: true, mode: "auto" }) {
  const mode = options.mode || "auto";
  const tgHistory = loadTgHistory();
  console.log("==================================================");
  console.log(`   🚀 АВТОНОМНЫЙ КОНВЕЙЕР (режим: ${mode})   `);
  console.log("==================================================");

  // ФАЗА 0: Мониторинг новых заказов, конверсий и заработка
  console.log("\n[Фаза 0] Мониторинг новых заказов и начислений...");
  try {
    const earningsRes = await checkNewEarnings({ notify: !options.dryRun });
    if (earningsRes.newOrders.length > 0) {
      console.log(` -> 🎉 Зафиксировано ${earningsRes.newOrders.length} новых начислений! Уведомления отправлены админу.`);
    } else {
      console.log(` -> Все начисления актуальны (всего: ${earningsRes.totalRub?.toLocaleString("ru-RU")} ₽).`);
    }
  } catch (eErr) {
    console.warn(" -> ⚠ Ошибка проверки начислений:", eErr.message);
  }

  // ФАЗА 1: Очистка просроченных постов
  console.log("\n[Фаза 1] Проверка и автоудаление истекших акций...");
  const historyData = loadHistory();
  const now = Date.now();
  let cleanedCount = 0;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  for (const item of historyData.history) {
    if (!item.deleted && item.messageId) {
      const expTime = item.expires ? parseExpiryMs(item.expires) : null;
      const isExpired = expTime !== null && now > expTime;
      const postedAtMs = item.date ? Date.parse(item.date) : NaN;
      const isOver30Days = Number.isFinite(postedAtMs) && now - postedAtMs >= THIRTY_DAYS_MS;

      if (isExpired || isOver30Days) {
        const reason = isExpired ? `истек ${item.expires}` : "прошло 30 дней (ОРД лимит)";
        console.log(` -> Оффер "${item.store}" (${item.code || "—"}) ${reason}. Удаление #${item.messageId}...`);
        if (!options.dryRun) {
          const delRes = await deleteTelegramMessage(item.messageId);
          if (delRes.ok || /message to delete not found/i.test(delRes.description || "")) {
            item.deleted = true;
            item.deletedAt = new Date().toISOString();
            cleanedCount++;
            if (delRes.ok) console.log(`    ✓ Сообщение #${item.messageId} удалено из канала.`);
          }
        }
      }
    }
  }
  if (cleanedCount > 0) saveHistory(historyData);

  // ФАЗА 2: Полный автопилот Perfluence (Доступные, Получить промокод, Повторить публикацию, pending_removal, сайт-отчёты)
  let autopilotReport = null;
  const wantPerfluence = mode === "auto" || mode === "perfluence";
  if (wantPerfluence && fs.existsSync(SESSION_FILE)) {
    console.log(`\n[Фаза 2] Запуск автопилота Perfluence (takeOffers=${Boolean(options.takeOffers)})...`);
    try {
      const { runPerfluenceAutopilotCycle } = await getPerfluenceAutopilot();
      autopilotReport = await runPerfluenceAutopilotCycle({
        dryRun: Boolean(options.dryRun),
        enableTakeAvailable: Boolean(options.takeOffers),
        enableActivateNewLandings: Boolean(options.takeOffers),
        enableRepeatMissing: Boolean(options.takeOffers),
        enableAutoReportSite: !options.dryRun,
        enablePendingRemovalSync: true,
        enableTelegramCleanup: !options.dryRun,
        botToken: BOT_TOKEN,
        channelId: CHANNEL_ID,
      });
      console.log(
        ` -> Perfluence: заявок=${autopilotReport.appliedRequests.length}, активаций=${autopilotReport.activatedLandings.length}, авто-отчётов(сайт)=${autopilotReport.reportedSitePosts.length}, ждут скриншота=${autopilotReport.needsScreenshotPosts.length}, удалено_ТГ=${autopilotReport.deletedTelegramMessageIds.length}`,
      );
      if (autopilotReport.sessionExpired) {
        console.warn(" -> ⚠ Сессия Perfluence истекла! Требуется повторный вход (node scripts/perfluence-auth.mjs).");
      }
    } catch (err) {
      console.warn(`[Фаза 2] Ошибка автопилота Perfluence: ${err.message}`);
    }
  } else {
    console.log(`\n[Фаза 2] Автопилот Perfluence пропущен (mode=${mode}, hasSession=${fs.existsSync(SESSION_FILE)}).`);
  }

  // ФАЗА 2.1: Сразу досдаём отложенные сайт-отчёты со скриншотом через Playwright (даже если ТГ-постинг на кулдауне)
  if (!options.dryRun && fs.existsSync(SESSION_FILE) && autopilotReport?.needsScreenshotPosts?.length) {
    console.log(`\n[Фаза 2.1] Сдача ${autopilotReport.needsScreenshotPosts.length} сайт-отчётов со скриншотом...`);
    for (const pending of autopilotReport.needsScreenshotPosts.slice(0, 10)) {
      try {
        await submitReport(pending.postId, pending.postUrl, { headless: true });
        console.log(` ✓ Сайт-отчёт #${pending.postId} (${pending.postUrl}) сдан со скриншотом!`);
      } catch (shotErr) {
        console.warn(` ⚠ Не удалось сдать #${pending.postId}:`, shotErr.message);
      }
    }
    autopilotReport.needsScreenshotPosts = [];
  }

  // ФАЗА 3: Загрузка готовых офферов из виджета Perfluence (если выбран трек Perfluence/auto)
  let items = [];
  if (wantPerfluence) {
    console.log("\n[Фаза 3] Анализ активных офферов из Perfluence API...");
    try {
      if (WIDGET_URL) {
        const res = await requestJson(WIDGET_URL);
        if (res.ok && res.json) {
          items = Array.isArray(res.json.data) ? res.json.data : [];
        }
      }
    } catch (e) {
      console.warn("Ошибка загрузки виджета:", e.message);
    }
    console.log(` -> Получено проектов из Perfluence: ${items.length}`);
  }

  // Извлекаем промокоды и проекты
  const candidates = [];
  const recentCodes = new Set([
    ...historyData.history.map((h) => (h.code || "").trim().toUpperCase()).filter(Boolean),
    ...tgHistory
      .flatMap((h) => (Array.isArray(h.codes) ? h.codes : h.code ? [h.code] : []))
      .map((c) => String(c || "").trim().toUpperCase())
      .filter(Boolean),
  ]);
  const recentStores = new Set([
    ...historyData.history.slice(0, 5).map((h) => h.storeSlug).filter(Boolean),
    ...tgHistory.slice(-5).map((h) => h.store).filter(Boolean),
  ]);

  for (const item of items) {
    const project = item.project || item.shop || item;
    const storeName = project.name || project.store_name || "Магазин";
    const storeId = project.id || project.project_id;
    const groups = Array.isArray(item.groups) ? item.groups : [item];

    for (const group of groups) {
      const promos = Array.isArray(group.promocodes) ? group.promocodes : [];
      const links = Array.isArray(group.links_for_subscribers) ? group.links_for_subscribers : [];
      const landing = Array.isArray(group.landing) ? group.landing[0] : group.landing;

      const affUrl = links[0]?.link || landing?.link || project.site || "https://promofact.ru";
      const ordMarker = promos[0]?.ord_marker || landing?.ord_marker || "";
      const ordText = promos[0]?.ord_custom_text || landing?.ord_custom_text || `Реклама. ${storeName}`;

      for (const p of promos) {
        const code = (p.code || "").trim();
        if (!code) continue;
        if (recentCodes.has(code.toUpperCase())) continue;

        candidates.push({
          storeId,
          storeName,
          storeSlug: storeSlugOf(storeId, storeName),
          code,
          bonus: p.bonus_name || p.name || p.comment || "Скидка по промокоду",
          // p.terms у Perfluence почти всегда пустой, поэтому пост выходил
          // из одного заголовка. Берём описание бонуса и условия проекта.
          terms: p.promo_terms || p.terms || "",
          about: project.subscribers_condition || project.product_info || "",
          // Виджет отдаёт срок в поле date («30.09.2026»), не expires.
          expires: p.date || p.expires || null,
          region: Array.isArray(p.region_promo) ? p.region_promo.join(", ") : p.region_promo || "",
          repeatOrder: Boolean(p.repeat_order),
          codesInStore: promos.length,
          // Остальные коды этого же магазина: раньше в пост уходил один код,
          // хотя у проекта их бывает три-четыре, и подписчик не видел,
          // что есть вариант выгоднее под его сумму заказа.
          otherPromos: promos
            .filter((x) => (x.code || "").trim() && (x.code || "").trim() !== code)
            .map((x) => ({
              code: (x.code || "").trim(),
              bonus: x.bonus_name || x.name || x.comment || "",
              expires: x.date || x.expires || null,
            })),
          affUrl,
          ordMarker,
          ordText,
          isHit: Boolean(p.is_hit || project.is_hit)
        });
      }
    }
  }

  // Умный алгоритм скоринга и жестких анти-повторов:
  // 1. Никогда не повторять промокоды (уже отфильтровано в recentCodes)
  // 2. Жесткий запрет на выход магазина из последних 10 постов
  // 3. Ротация категорий и брендов
  const HIGH_PRIORITY_BRANDS = [
    "Start.ru",
    "Яндекс Лавка",
    "ВкусВилл Доставка",
    "Додо пицца Юг",
    "Перекрёсток Доставка",
    "Яндекс Цветы",
    "Отелло",
    "Ситидрайв",
    "FARFOR",
    "Ив Роше",
    "Librederm",
    "Netprint",
    "СберПрайм"
  ];

  // [Фаза 3.1] Мониторинг флеш-акций (активация уже выполнена на Фазе 2 при takeOffers)
  let flashDeals = [];
  const flashMap = new Map();
  if (wantPerfluence) {
    console.log("\n[Фаза 3.1] Мониторинг «Флеш-акций» и повышенных ставок рекламодателей...");
    try {

      flashDeals = await getFlashDeals();
      for (const d of flashDeals) {
        if (d.projectId) flashMap.set(String(d.projectId), d);
        if (d.projectName) flashMap.set(d.projectName.toLowerCase(), d);
      }
      if (flashDeals.length > 0) {
        console.log(` -> Обнаружено активных спецпредложений/флеш-акций: ${flashDeals.length}`);
        flashDeals.forEach(f => console.log(`    ⚡ [${f.badge}] #${f.projectId} "${f.projectName}": ${f.title}`));
      } else {
        console.log(" -> В новостях нет активных флеш-акций на сегодня.");
      }

      // 2. Добавляем активированные флеш-офферы в пул кандидатов, если их еще не было
      for (const deal of flashDeals) {
        if (!deal.projectId) continue;
        const exists = candidates.some(c => String(c.storeId) === String(deal.projectId) || c.storeName.toLowerCase() === deal.projectName.toLowerCase());
        if (!exists) {
          const channelData = await fetchChannelSpecificOffer(deal.projectId, "smart_zakupka");
          if (channelData && channelData.promos && channelData.promos.length > 0) {
            for (const p of channelData.promos) {
              if (!p.code || recentCodes.has(p.code.toUpperCase())) continue;
              candidates.push({
                storeId: deal.projectId,
                storeName: deal.projectName,
                code: p.code,
                bonus: p.bonus || deal.title,
                terms: deal.desc || "",
                expires: p.expires || null,
                affUrl: channelData.affUrl,
                ordMarker: channelData.ordMarker,
                ordText: channelData.ordText || `Реклама. ${deal.projectName}`,
                isHit: true,
                flashDeal: deal
              });
              console.log(` -> ⚡ Флеш-оффер "${deal.projectName}" (#${deal.projectId}) добавлен в пул кандидатов с промокодом [${p.code}]!`);
            }
          }
        }
      }
    } catch (err) {
      console.warn(" -> Ошибка мониторинга флеш-акций:", err.message);
    }
  }

  const recentStoresList = historyData.history.slice(0, 10).map(h => (h.store || "").toLowerCase());
  const lastStore = historyData.history[0]?.store?.toLowerCase();

  // Рассчитываем давность каждого магазина
  const storeLastPostTime = new Map();
  for (const h of historyData.history) {
    if (h.store && !storeLastPostTime.has(h.store.toLowerCase())) {
      storeLastPostTime.set(h.store.toLowerCase(), new Date(h.date || 0).getTime());
    }
  }

  // Сначала пытаемся отобрать кандидатов, которых гарантированно не было в последних 10 постах,
  // ЛИБО у которых прямо сейчас идет горячая флеш-акция (пропуск вне очереди!)
  const freshCandidates = candidates.filter(c => {
    const isFlash = flashMap.has(String(c.storeId)) || flashMap.has(c.storeName.toLowerCase());
    if (isFlash && (!lastStore || c.storeName.toLowerCase() !== lastStore)) {
      return true; // Пропускаем вне очереди горячие флеш-акции!
    }
    return !recentStoresList.includes(c.storeName.toLowerCase());
  });
  const candidatePool = freshCandidates.length > 0 ? freshCandidates : candidates;

  const scored = candidatePool.map(c => {
    let score = 100;
    const storeLower = c.storeName.toLowerCase();
    const flashDeal = flashMap.get(String(c.storeId)) || flashMap.get(storeLower);

    // ПРИОРИТЕТ ВНЕ ОЧЕРЕДИ: Флеш-акции и повышенные ставки от рекламодателей
    if (flashDeal) {
      score += flashDeal.priorityScore || 220;
      c.flashDeal = flashDeal;
    }

    // Штраф, если магазин уже публиковался когда-либо
    if (storeLastPostTime.has(storeLower)) {
      const daysSince = Math.floor((now - storeLastPostTime.get(storeLower)) / (24 * 60 * 60 * 1000));
      if (daysSince < 30) {
        score -= (30 - daysSince) * 10;
      } else {
        score += 20;
      }
    } else {
      score += 50; // Бонус новым магазинам, которых еще не было в канале!
    }

    // Жесткий запрет на повтор последнего магазина
    if (lastStore && storeLower === lastStore) {
      score -= 1000;
    }

    // Бонус проектам с повышенными ставками / высокой конверсией
    if (HIGH_PRIORITY_BRANDS.some(b => c.storeName.includes(b))) {
      score += 40;
    }

    // Бонус за скидку в рублях или высокий процент
    if (c.bonus.includes("%") || c.bonus.includes("₽") || c.isHit) {
      score += 15;
    }

    return { ...c, score };
  });

  // Сортируем по итоговому баллу
  scored.sort((a, b) => b.score - a.score);

  // Ссылка и erid должны принадлежать публикации канала @smart_zakupka.
  // В виджете лежит ссылка последней публикации — она может быть от аккаунта
  // «Сайт», и тогда заказы из канала засчитаются сайту, а пост в Telegram
  // окажется с чужим erid. Поэтому идём по кандидатам сверху вниз и берём
  // первого, у кого в кабинете есть публикация для канала.
  let selected = null;
  if (wantPerfluence && scored.length > 0 && fs.existsSync(SESSION_FILE)) {
    for (const candidate of scored.slice(0, 8)) {
      if (!candidate.storeId) continue;
      const channelData = await fetchChannelSpecificOffer(candidate.storeId, "smart_zakupka");
      if (!channelData || !channelData.affUrl || !channelData.ordMarker) {
        console.log(
          ` -> «${candidate.storeName}»: для канала нет публикации с ссылкой и erid, пропускаем`,
        );
        continue;
      }

      candidate.affUrl = channelData.affUrl;
      candidate.ordMarker = channelData.ordMarker;
      if (channelData.ordText) candidate.ordText = channelData.ordText;

      // Самый выгодный код канала, которого ещё не было в постах
      const validPromos = (channelData.promos || [])
        .filter((p) => p.code && !recentCodes.has(p.code.toUpperCase()))
        .sort((a, b) => b.discountNum - a.discountNum);

      if (validPromos.length > 0) {
        candidate.code = validPromos[0].code;
        candidate.bonus = validPromos[0].bonus;
        if (validPromos[0].expires) candidate.expires = validPromos[0].expires;
        candidate.otherPromos = validPromos.slice(1).map((p) => ({
          code: p.code,
          bonus: p.bonus,
          expires: p.expires,
        }));
      } else if (!channelData.promos?.some((p) => p.code === candidate.code)) {
        // Кода из виджета нет среди кодов канала — значит он не наш.
        console.log(` -> «${candidate.storeName}»: код ${candidate.code} не выдан каналу, пропускаем`);
        continue;
      }

      selected = candidate;
      break;
    }
  } else if (wantPerfluence && scored.length > 0 && !fs.existsSync(SESSION_FILE)) {
    console.log(" -> ℹ Локальная Perfluence-сессия отсутствует — проверяем гибридный fallback (Pampadu / /sovety).");
  }

  const pampaduCandidates = buildPampaduCandidates(tgHistory, now, { force: mode === "pampadu" });
  const articleCandidates = buildArticleCandidates(tgHistory, now);
  const digestCandidates = buildDigestCandidates(tgHistory, now, { force: mode === "digest" });
  const track = selectHybridTrack({
    mode,
    hasPerfluenceCandidate: Boolean(selected),
    hasUrgentFlashDeal: Boolean(selected?.flashDeal),
    hasPampaduCandidate: pampaduCandidates.length > 0,
    hasArticleCandidate: articleCandidates.length > 0,
    hasDigestCandidate: digestCandidates.length > 0,
    history: tgHistory,
    nowDate: new Date(now),
  });

  const cadence = canAutoPostNow(tgHistory, {
    nowMs: now,
    isUrgentFlashDeal: Boolean(selected?.flashDeal),
    force: Boolean(options.force),
  });

  console.log(
    ` -> [Гибридный выбор] perfluence=${Boolean(selected)}, pampadu=${pampaduCandidates.length}, articles=${articleCandidates.length}, digest=${digestCandidates.length} => трек "${track || "none"}" | антиспам: ${cadence.allowed ? "OK" : cadence.reason}`,
  );

  if (!cadence.allowed && !options.dryRun) {
    console.log(`\n⏸ Автопост в ${CHANNEL_ID} пропущен (${cadence.reason}). Используйте --force для внеочередного запуска.`);
    return;
  }

  let activePost = null;
  if (track === "perfluence" && selected) {
    console.log(`\n[Фаза 4] Выбран Perfluence-оффер: "${selected.storeName}" (балл: ${selected.score}, код: ${selected.code}, бонус: ${selected.bonus})${selected.flashDeal ? ` [${selected.flashDeal.badge}]` : ""}`);

    const bodyLines = [];
    if (selected.flashDeal && !selected.flashDeal.isInternalOnly && selected.flashDeal.audienceDesc) {
      bodyLines.push(`${escapeHtml(selected.flashDeal.badge)}`);
      bodyLines.push(`📢 <b>${escapeHtml(selected.flashDeal.title)}</b> — <i>${escapeHtml(selected.flashDeal.audienceDesc)}</i>\n`);
    }
    bodyLines.push(`${selected.isHit ? "🔥" : "🏷"} <b>${escapeHtml(selected.storeName)} — ${escapeHtml(selected.bonus)}</b>\n`);
    bodyLines.push(`🎟 Промокод: <code>${escapeHtml(selected.code)}</code>`);
    bodyLines.push(`<i>(нажмите на код — он скопируется в буфер)</i>\n`);

    const facts = [];
    facts.push(selected.repeatOrder ? "Первый и повторные заказы" : "Только первый заказ");
    if (selected.region && selected.region !== "RU") facts.push(`Города: ${selected.region}`);
    if (selected.expires) facts.push(`Действует до ${formatExpires(selected.expires)}`);

    bodyLines.push("📌 <b>Условия:</b>");
    facts.forEach((f) => bodyLines.push(`• ${escapeHtml(f)}`));

    const others = (selected.otherPromos || []).slice(0, 3);
    if (others.length) {
      bodyLines.push(`\n🎁 <b>Ещё коды ${escapeHtml(selected.storeName)}:</b>`);
      for (const o of others) {
        const until = o.expires ? ` (до ${formatExpires(o.expires)})` : "";
        const what = escapeHtml(cleanText(o.bonus).slice(0, 70));
        bodyLines.push(`• <code>${escapeHtml(o.code)}</code> — ${what}${until}`);
      }
    }

    const details = cleanText(selected.terms) || cleanText(selected.about);
    if (details) bodyLines.push(`\nℹ️ ${escapeHtml(details.slice(0, 160))}`);
    bodyLines.push(`\n💬 <i>Сработало у вас? Оставьте реакцию или напишите в комментариях 👇</i>`);

    const eridLine = selected.ordMarker && !selected.ordText.includes(selected.ordMarker)
      ? `${selected.ordText} erid: ${selected.ordMarker}`
      : selected.ordText;

    const storePageUrl = `https://promofact.ru/store/${selected.storeSlug}`;
    const tgStorePageUrl = withUtm(storePageUrl, "telegram", "social", selected.storeSlug);
    const footerLines = [
      `👉 <a href="${selected.affUrl}">Активировать в ${escapeHtml(selected.storeName)} →</a>`,
      `🌐 <a href="${tgStorePageUrl}">Все промокоды ${escapeHtml(selected.storeName)} на ПромоФакте</a>`,
      ``,
      `⚖️ <i>${escapeHtml(eridLine)}</i>`,
    ];

    const postText = fitCaption(bodyLines.join("\n"), footerLines.join("\n"), 980);
    const buttons = [
      [{ text: `🛍 В магазин ${selected.storeName} →`, url: selected.affUrl }],
      [{ text: `🌐 Все промокоды ${selected.storeName}`, url: tgStorePageUrl }],
      [{ text: `🔍 Найти код по другим магазинам`, url: getTgBotLink(`store_${selected.storeSlug}`) }],
    ];

    const bgTemplateUrl = await fetchProjectTemplateImage(selected.storeId);
    let bannerPath = bgTemplateUrl || "https://promofact.ru/og-image.png";
    try {
      bannerPath = await generatePromoBanner({
        storeName: selected.storeName,
        code: selected.code,
        bonus: selected.bonus,
        bgImageUrl: bgTemplateUrl,
        badgeText: selected.flashDeal?.badge || "🔥 ТОП СКИДКА",
      });
      console.log(` -> 🎨 Сгенерирован баннер с промокодом [${selected.code}]: ${bannerPath}`);
    } catch (genErr) {
      console.warn("⚠ Не удалось сгенерировать баннер, отправляем с исходным макетом:", genErr.message);
    }

    activePost = {
      kind: "perfluence",
      postMode: "photo",
      storeId: selected.storeId,
      storeSlug: selected.storeSlug,
      storeName: selected.storeName,
      code: selected.code,
      codes: [selected.code],
      bonus: selected.bonus,
      terms: selected.terms,
      affUrl: selected.affUrl,
      ordMarker: selected.ordMarker,
      ordText: selected.ordText,
      expires: selected.expires,
      flashDeal: selected.flashDeal,
      url: storePageUrl,
      vkUrl: storePageUrl,
      vkTitle: selected.bonus,
      text: postText,
      buttons,
      bannerPath,
      enableLinkPreview: false,
    };
  } else if (track === "pampadu" && pampaduCandidates.length > 0) {
    activePost = pampaduCandidates[0];
    console.log(`\n[Фаза 4] Гибридный трек PAMPADU: "${activePost.storeName}" (коды: ${activePost.codes.join(", ")})`);
  } else if (track === "digest" && digestCandidates.length > 0) {
    activePost = digestCandidates[0];
    console.log(`\n[Фаза 4] Гибридный трек DIGEST: "${activePost.storeName}" (${activePost.url})`);
  } else if (track === "article" && articleCandidates.length > 0) {
    activePost = articleCandidates[0];
    console.log(`\n[Фаза 4] Гибридный трек ARTICLE: "${activePost.storeName}" (${activePost.url})`);
  }

  if (activePost && !activePost.bannerPath && activePost.bannerSpec && !options.dryRun) {
    try {
      activePost.bannerPath = await generatePromoBanner({
        storeName: activePost.bannerSpec.storeName,
        code: activePost.bannerSpec.code,
        bonus: activePost.bannerSpec.bonus,
        badgeText: activePost.bannerSpec.badgeText,
      });
      console.log(` -> 🎨 Сгенерирован баннер для ${activePost.kind}: ${activePost.bannerPath}`);
    } catch (genErr) {
      console.warn(`⚠ Баннер ${activePost.kind} не сгенерирован, используем og-image:`, genErr.message);
      if (activePost.postMode === "photo") activePost.bannerPath = "https://promofact.ru/og-image.png";
    }
  } else if (activePost && !activePost.bannerPath && activePost.bannerSpec && options.dryRun) {
    activePost.bannerPath = `[dynamic-banner:${activePost.bannerSpec.storeName}/${activePost.bannerSpec.code}]`;
  }

  if (!activePost) {
    console.log("\n❌ Нет подходящего контента для публикации (Perfluence / Pampadu / Статьи исчерпаны или на кулдауне).");
    const announce = scored[0];
    if (announce && !options.dryRun) {
      try {
        const vkResult = await postToVk({
          storeName: announce.storeName,
          storeSlug: announce.storeSlug,
          code: announce.code,
          bonus: announce.bonus,
          terms: announce.terms,
          siteMode: true,
        });
        if (vkResult.ok) console.log(` -> 🌐 ВК: анонс опубликован (${vkResult.postUrl})`);
      } catch (e) {
        console.warn(" -> ⚠ ВК: анонс не опубликован:", e.message);
      }
    }
    return;
  }

  if (options.dryRun) {
    console.log(`\n[DRY RUN] Трек: ${activePost.kind} (${activePost.postMode}), длина текста: ${activePost.text.length}`);
    console.log("[DRY RUN] Баннер: " + (activePost.bannerPath || "нет (структурированный HTML-пост)"));
    console.log("[DRY RUN] Кнопки: " + JSON.stringify(activePost.buttons));
    console.log("[DRY RUN] Текст поста:\n" + activePost.text);
    return;
  }

  // Публикуем в Telegram
  console.log(` -> Отправка поста (${activePost.kind}) в канал ${CHANNEL_ID}...`);
  const postRes = await sendTelegramPost(
    activePost.text,
    activePost.buttons,
    activePost.bannerPath || null,
    { disableWebPagePreview: !activePost.enableLinkPreview },
  );

  if (!postRes.ok) {
    console.error("❌ Ошибка отправки в Telegram:", postRes.description);
    return;
  }

  const messageId = postRes.result.message_id;
  const channelClean = CHANNEL_ID.replace("@", "");
  const postUrl = `https://t.me/${channelClean}/${messageId}`;
  console.log(`\n🎉 ПОСТ УСПЕШНО ОПУБЛИКОВАН! Ссылка: ${postUrl}`);

  // Сохраняем в оба журнала (основной + единую TG-историю)
  const primaryCode = activePost.code || activePost.codes?.[0] || activePost.storeSlug;
  historyData.history.unshift({
    id: Date.now(),
    sourceType: activePost.kind,
    code: primaryCode,
    store: activePost.storeName,
    storeSlug: activePost.storeSlug,
    messageId,
    postUrl,
    expires: activePost.expires || null,
    date: new Date().toISOString(),
  });
  saveHistory(historyData);

  recordTgHistory({
    messageId,
    store: activePost.storeSlug,
    storeName: activePost.storeName,
    date: new Date().toISOString(),
    channel: CHANNEL_ID,
    sourceType: activePost.kind,
    codes: activePost.codes || [primaryCode],
    url: activePost.url,
  });

  // ФАЗА 4.1: Автоматический кросспостинг во ВКонтакте (сообщество vk.com/promofact, пропускает без VK_ACCESS_TOKEN)
  try {
    const vkResult = await postToVk({
      storeName: activePost.storeName,
      storeSlug: activePost.storeSlug,
      siteUrl: activePost.vkUrl,
      code: primaryCode,
      bonus: activePost.vkTitle || activePost.bonus,
      terms: activePost.terms || "",
      affUrl: activePost.affUrl,
      ordMarker: activePost.ordMarker,
      ordText: activePost.ordText,
      bannerPath: activePost.bannerPath || null,
      flashDeal: activePost.flashDeal,
      // Сообщество ВК ведёт на сайт со всей маркировкой и кнопками.
      siteMode: true,
    });
    if (vkResult.ok) {
      console.log(` -> 🌐 Кросспостинг в VK: успешно опубликован (${vkResult.postUrl})`);
    }
  } catch (vkErr) {
    console.warn(" -> ⚠ Ошибка кросспостинга во ВКонтакте:", vkErr.message);
  }

  // ФАЗА 4.2: Мгновенное SEO-оповещение поисковых систем (IndexNow: Яндекс, Bing)
  console.log("\n[Фаза 4.2] Мгновенное оповещение Яндекс и Bing (IndexNow)...");
  try {
    const pingUrls =
      activePost.kind === "article"
        ? [activePost.url, "https://promofact.ru/sovety", "https://promofact.ru"]
        : [
            `https://promofact.ru/store/${activePost.storeSlug}`,
            "https://promofact.ru",
            "https://promofact.ru/promokody",
          ];

    const idxRes = await pingIndexNow(pingUrls);
    if (idxRes.ok) {
      console.log(` -> ✓ IndexNow: отправлено (${idxRes.sentUrls.length} URL).`);
    }
  } catch (idxErr) {
    console.warn(" -> ⚠ Ошибка отправки IndexNow:", idxErr.message);
  }

  // ФАЗА 5: Авто-сдача отчета в Perfluence (включая отложенные посты со скриншотом через Playwright)
  if (activePost.kind === "perfluence" && fs.existsSync(SESSION_FILE) && activePost.storeId) {
    console.log(`\n[Фаза 5] Авто-сдача отчета в Perfluence для проекта #${activePost.storeId}...`);
    try {
      await submitReport(activePost.storeId, postUrl, { headless: true });
      console.log("✓ Отчет успешно сдан модераторам!");
    } catch (repErr) {
      console.warn("⚠ Сдача отчета через Playwright:", repErr.message);
    }
  }

  // Досдаём отложенные отчёты сайта (где нужен скриншот) и недавно вышедшие посты @smart_zakupka
  if (fs.existsSync(SESSION_FILE) && autopilotReport?.needsScreenshotPosts?.length) {
    console.log(`\n[Фаза 5.1] Сдача ${autopilotReport.needsScreenshotPosts.length} сайт-отчётов со скриншотом...`);
    for (const pending of autopilotReport.needsScreenshotPosts.slice(0, 10)) {
      try {
        await submitReport(pending.postId, pending.postUrl, { headless: true });
        console.log(` ✓ Сайт-отчёт #${pending.postId} (${pending.postUrl}) сдан со скриншотом!`);
      } catch (shotErr) {
        console.warn(` ⚠ Не удалось сдать #${pending.postId}:`, shotErr.message);
      }
    }
  }

  // Персональные алерты подписчикам бота на этот магазин (только при наличии Supabase + токена)
  const sbUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const sbKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const publicBotToken = (process.env.TELEGRAM_PUBLIC_BOT_TOKEN || fileEnv.TELEGRAM_PUBLIC_BOT_TOKEN || BOT_TOKEN || "").trim();
  if (sbUrl.startsWith("http") && sbKey && !sbKey.includes("SENSITIVE") && publicBotToken && activePost.storeSlug) {
    try {
      const subsUrl = `${sbUrl}/rest/v1/tg_store_subscriptions?select=id,telegram_user_id,last_notified_at&store_slug=eq.${encodeURIComponent(activePost.storeSlug)}&limit=50`;
      const subsRes = await fetch(subsUrl, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
      if (subsRes.ok) {
        const subs = await subsRes.json();
        const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
        let sentCount = 0;
        for (const sub of Array.isArray(subs) ? subs : []) {
          const lastMs = sub.last_notified_at ? Date.parse(sub.last_notified_at) : 0;
          if (Number.isFinite(lastMs) && lastMs > cutoffMs) continue;
          const storeWebUrl = withUtm(`https://promofact.ru/store/${activePost.storeSlug}`, "tg_alert", "bot", activePost.storeSlug);
          await fetch(`https://api.telegram.org/bot${publicBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: sub.telegram_user_id,
              text: `🔔 <b>Новые акции в ${escapeHtml(activePost.storeName)}!</b>\n\nМы обновили подборку предложений и опубликовали пост в @smart_zakupka.\n\nОткрой все актуальные коды в 1 клик:`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [{ text: `🛍 Открыть ${activePost.storeName}`, web_app: { url: storeWebUrl } }],
                  [{ text: "📢 Читать пост в канале", url: postUrl }],
                ],
              },
            }),
          }).catch(() => {});
          await fetch(`${sbUrl}/rest/v1/tg_store_subscriptions?id=eq.${sub.id}`, {
            method: "PATCH",
            headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ last_notified_at: new Date().toISOString() }),
          }).catch(() => {});
          sentCount += 1;
        }
        if (sentCount > 0) console.log(` -> 🔔 Отправлено персональных алертов подписчикам бота: ${sentCount}`);
      }
    } catch (alertErr) {
      console.warn(" -> ⚠ Рассылка алертов бота пропущена:", alertErr.message);
    }
  }

  // Уведомление в ЛС админу
  if (ADMIN_CHAT_ID) {
    try {
      await requestJson(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        body: {
          chat_id: ADMIN_CHAT_ID,
          text: `📢 <b>Автоматический пост опубликован (${activePost.kind})!</b>\n\n🏷 Тема: <b>${escapeHtml(activePost.storeName)}</b>\n🎟 Код/ключ: <code>${escapeHtml(primaryCode)}</code>\n🔗 Ссылка: ${postUrl}`,
          parse_mode: "HTML",
        },
      });
    } catch {}
  }

  console.log("\n==================================================");
  console.log("   ✓ ПОЛНЫЙ ЦИКЛ АВТОМАТИЗАЦИИ УСПЕШНО ЗАВЕРШЕН   ");
  console.log("==================================================\n");
}

if (process.argv[1]?.endsWith("pipeline-orchestrator.mjs")) {
  const dryRun = process.argv.includes("--dry-run");
  const noTake = process.argv.includes("--no-take");
  const force = process.argv.includes("--force");
  const modeArg = process.argv.find((a) => a.startsWith("--mode="));
  const mode = modeArg ? modeArg.slice("--mode=".length).trim() : "auto";
  // Тестовый прогон не должен ничего менять в кабинете: не берём офферы и не активируем флеш-акции.
  runPipeline({ dryRun, takeOffers: !noTake && !dryRun, mode, force }).catch(console.error);
}
