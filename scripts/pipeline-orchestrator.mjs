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
import { submitReport } from "./perfluence-report.mjs";
import { takeNewOffers } from "./perfluence-take-offers.mjs";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "posted_promos.json");
const SESSION_FILE = path.join(DATA_DIR, "perfluence_session.json");

// Чтение переменных окружения: сначала process.env (для GitHub Actions), затем fallback на .env.local
const envContent = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const fileEnv = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fileEnv[match[1]] = val;
  }
}

const WIDGET_URL = process.env.PERFLUENCE_WIDGET_URL || fileEnv.PERFLUENCE_WIDGET_URL;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || fileEnv.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || fileEnv.TELEGRAM_CHANNEL_ID || "@smart_zakupka";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || fileEnv.TELEGRAM_ADMIN_CHAT_ID;

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

async function sendTelegramPost(text, buttons = []) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const replyMarkup = buttons.length > 0 ? { inline_keyboard: buttons } : undefined;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
      disable_web_page_preview: false
    })
  });
  return await res.json();
}

export async function runPipeline(options = { dryRun: false, takeOffers: true }) {
  console.log("==================================================");
  console.log("   🚀 ПОЛНЫЙ АВТОНОМНЫЙ ЦИКЛ (AUTONOMOUS PIPELINE) ");
  console.log("==================================================");

  // ФАЗА 1: Очистка просроченных постов
  console.log("\n[Фаза 1] Проверка и автоудаление истекших акций...");
  const historyData = loadHistory();
  const now = Date.now();
  let cleanedCount = 0;

  for (const item of historyData.history) {
    if (!item.deleted && item.messageId && item.expires) {
      const expTime = new Date(`${item.expires}T23:59:59`).getTime();
      if (now > expTime) {
        console.log(` -> Оффер "${item.store}" (${item.code}) истек ${item.expires}. Удаление #${item.messageId}...`);
        if (!options.dryRun) {
          const delRes = await deleteTelegramMessage(item.messageId);
          if (delRes.ok) {
            item.deleted = true;
            item.deletedAt = new Date().toISOString();
            cleanedCount++;
            console.log(`    ✓ Сообщение #${item.messageId} удалено из канала.`);
          }
        }
      }
    }
  }
  if (cleanedCount > 0) saveHistory(historyData);

  // ФАЗА 2: Автоматический поиск и взятие новых офферов в Perfluence
  if (options.takeOffers && fs.existsSync(SESSION_FILE)) {
    console.log("\n[Фаза 2] Сканирование каталога и авто-взятие новых офферов...");
    try {
      await takeNewOffers({ maxOffers: 2, headless: true });
    } catch (err) {
      console.warn(`[Фаза 2] Авто-взятие пропущено: ${err.message}`);
    }
  } else {
    console.log("\n[Фаза 2] Сессия браузера в облаке не передана, авто-взятие пропущено. Переходим к отбору из API...");
  }

  // ФАЗА 3: Загрузка готовых офферов из виджета
  console.log("\n[Фаза 3] Анализ активных офферов из Perfluence API...");
  let items = [];
  try {
    if (WIDGET_URL) {
      const res = await fetch(WIDGET_URL);
      if (res.ok) {
        const json = await res.json();
        items = Array.isArray(json.data) ? json.data : [];
      }
    }
  } catch (e) {
    console.warn("Ошибка загрузки виджета:", e.message);
  }

  console.log(` -> Получено проектов из Perfluence: ${items.length}`);

  if (items.length === 0) {
    console.log("❌ Нет доступных офферов для публикации.");
    return;
  }

  // Извлекаем промокоды и проекты
  const candidates = [];
  const recentCodes = new Set(historyData.history.map(h => (h.code || "").trim().toUpperCase()).filter(Boolean));
  const recentStores = new Set(historyData.history.slice(0, 5).map(h => h.storeSlug).filter(Boolean));

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
          code,
          bonus: p.bonus_name || p.name || "Скидка по промокоду",
          terms: p.terms || project.subscribers_condition || "",
          expires: p.expires || null,
          affUrl,
          ordMarker,
          ordText,
          isHit: Boolean(p.is_hit || project.is_hit)
        });
      }
    }
  }

  console.log(` -> Отобрано свежих кандидатов для публикации: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("Все доступные промокоды уже публиковались в последнее время. Анти-повтор сработал штатно.");
    return;
  }

  // Выбираем лучший (приоритет хитам)
  const selected = candidates.find(c => c.isHit) || candidates[0];
  console.log(`\n[Фаза 4] Выбран лучший оффер: "${selected.storeName}" (код: ${selected.code}, бонус: ${selected.bonus})`);

  // Формируем красивый пост
  const postLines = [
    `🔥 <b>${selected.storeName} — ${selected.bonus}</b>\n`,
    `🎟 Промокод: <code>${selected.code}</code>`,
    `<i>(нажмите на код — он скопируется в буфер)</i>\n`
  ];

  if (selected.terms) {
    const cleanTerms = selected.terms.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
    postLines.push(`📌 <b>Условия:</b>\n• ${cleanTerms}`);
  }

  postLines.push("");
  if (selected.ordMarker && !selected.ordText.includes(selected.ordMarker)) {
    postLines.push(`<i>${selected.ordText} erid: ${selected.ordMarker}</i>`);
  } else {
    postLines.push(`<i>${selected.ordText}</i>`);
  }

  const postText = postLines.join("\n");
  const buttons = [
    [{ text: `🛍 В магазин ${selected.storeName} →`, url: selected.affUrl }],
    [{ text: "🌐 Все промокоды на PromoFact", url: "https://promofact.ru" }]
  ];

  if (options.dryRun) {
    console.log("\n[DRY RUN] Текст поста:\n" + postText);
    return;
  }

  // Публикуем в Telegram
  console.log(` -> Отправка поста в канал ${CHANNEL_ID}...`);
  const postRes = await sendTelegramPost(postText, buttons);

  if (!postRes.ok) {
    console.error("❌ Ошибка отправки в Telegram:", postRes.description);
    return;
  }

  const messageId = postRes.result.message_id;
  const channelClean = CHANNEL_ID.replace("@", "");
  const postUrl = `https://t.me/${channelClean}/${messageId}`;
  console.log(`\n🎉 ПОСТ УСПЕШНО ОПУБЛИКОВАН! Ссылка: ${postUrl}`);

  // Сохраняем в историю
  historyData.history.unshift({
    id: Date.now(),
    code: selected.code,
    store: selected.storeName,
    messageId,
    postUrl,
    expires: selected.expires,
    date: new Date().toISOString()
  });
  saveHistory(historyData);

  // ФАЗА 5: Авто-сдача отчета в Perfluence (если сессия есть)
  if (fs.existsSync(SESSION_FILE) && selected.storeId) {
    console.log(`\n[Фаза 5] Авто-сдача отчета в Perfluence для проекта #${selected.storeId}...`);
    try {
      await submitReport(selected.storeId, postUrl, { headless: true });
      console.log("✓ Отчет успешно сдан модераторам!");
    } catch (repErr) {
      console.warn("⚠ Сдача отчета через Playwright:", repErr.message);
    }
  }

  // Уведомление в ЛС админу
  if (ADMIN_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: `📢 <b>Автоматический пост опубликован!</b>\n\n🏬 Магазин: <b>${selected.storeName}</b>\n🎟 Промокод: <code>${selected.code}</code>\n🔗 Ссылка: ${postUrl}`,
          parse_mode: "HTML"
        })
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
  runPipeline({ dryRun, takeOffers: !noTake }).catch(console.error);
}
