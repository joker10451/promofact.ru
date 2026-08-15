import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// Загрузка переменных окружения
function loadEnv() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || "").trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const TOKEN = process.env.SALEADS_API_TOKEN || "MWGsbY61i1pGZQQgSku1HPe58RTdg1wZyUBCV4Mo58kY7PGextvwiXWIWpPO0FdW";
const STAND_UUID = "0f94a390-98cd-11f1-8ca9-2f558d76c573";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://promofact.ru";
const HISTORY_FILE = path.join(ROOT_DIR, "data", "autopilot_history.json");

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    }
  } catch {}
  return { postedUuids: [], history: [] };
}

function saveHistory(data) {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Ошибка сохранения истории:", e.message);
  }
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(25000),
      });
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

/**
 * Получение топ-офферов из Saleads
 */
async function fetchSaleadsOffers({ categoryId, search } = {}) {
  let url = "https://saleads.pro/api/v1/offer?limit=100";
  if (categoryId) url += `&offer_category_id=${categoryId}`;
  
  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Saleads API error: ${res.status}`);
  const json = await res.json();
  let list = json.data || [];
  if (search) {
    list = list.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));
  }
  return list;
}

/**
 * Подключение оффера и получение партнерской ссылки с ERID
 */
async function getAffiliateLink(offerUuid) {
  const res = await fetchWithRetry("https://saleads.pro/api/v1/connector/get-or-create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      offer_uuid: offerUuid,
      stand_uuid: STAND_UUID,
    }),
  });
  if (!res.ok) throw new Error(`Connector error: ${res.status}`);
  const json = await res.json();
  const urlObj = (json.urls || [])[0];
  if (!urlObj) return null;
  return {
    url: urlObj.short_url || urlObj.url,
    erid: urlObj.short_url?.split("erid=")[1] || null,
  };
}

/**
 * Отправка сообщения в Telegram
 */
async function sendToTelegram(text, replyMarkup) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
      disable_web_page_preview: false,
    }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram error: ${json.description}`);
  return json.result;
}

export async function runAutopilot({ dryRun = false, search, categoryId } = {}) {
  console.log("🤖 Запуск Автопилота Saleads ➔ Telegram...");
  console.log(`📌 Канал: ${CHANNEL_ID}`);
  console.log(`⚙️ Режим: ${dryRun ? "DRY-RUN (тест)" : "LIVE"}`);
  if (search) console.log(`🔍 Фильтр поиска: "${search}"`);

  const history = loadHistory();
  const offers = await fetchSaleadsOffers({ categoryId, search });
  console.log(`📦 Всего доступно офферов в Saleads API: ${offers.length}`);

  // Фильтруем активные B2C офферы с выплатой
  const candidates = offers.filter((o) => {
    if (history.postedUuids.includes(o.uuid)) return false;
    if (o.status !== 1) return false;
    const name = o.name.toLowerCase();
    if (name.includes("займ") || name.includes("ки") || name.includes("мфо")) return false;
    return true;
  });

  // Приоритет: сначала e-commerce, магазины и сервисы
  candidates.sort((a, b) => {
    const aAuto = a.features?.autoApprove ? 1 : 0;
    const bAuto = b.features?.autoApprove ? 1 : 0;
    return bAuto - aAuto;
  });

  console.log(`🎯 Кандидатов для публикации: ${candidates.length}`);
  if (candidates.length === 0) {
    console.log("✅ Все подходящие офферы уже опубликованы.");
    return;
  }

  let selectedOffer = null;
  let affiliate = null;

  for (const offer of candidates.slice(0, 15)) {
    try {
      console.log(`Пробуем подключить: [${offer.name}]...`);
      affiliate = await getAffiliateLink(offer.uuid);
      if (affiliate?.url) {
        selectedOffer = offer;
        break;
      }
    } catch (e) {
      console.log(`- Не удалось: ${e.message}`);
    }
  }

  if (!selectedOffer || !affiliate) {
    console.error("❌ Не удалось получить партнерскую ссылку для доступных офферов.");
    return;
  }

  const offer = selectedOffer;
  console.log(`\n🎉 Выбран и подключен оффер: [${offer.name}]`);
  console.log(`🔗 Получена ссылка: ${affiliate.url}`);

  // Формируем текст поста
  const cleanName = offer.name.replace(/\(.*?\)/g, "").trim();
  const goalPrice = offer.goals?.[0]?.price ? `Выгода до ${Math.round(offer.goals[0].price)} ₽` : "Скидки и спецпредложения";

  let text = `🔥 <b>ХИТ ДНЯ! Специальное предложение от ${cleanName}</b>\n\n`;
  text += `✨ <b>${cleanName}</b> — ${goalPrice}\n\n`;
  text += `🛒 Оформляйте заказ по спецпредложению онлайн по прямой ссылке ниже.\n`;
  text += `⚡️ Предложение проверено и доступно прямо сейчас.\n\n`;
  text += `────────────────────\n`;
  if (affiliate.erid) {
    text += `<tg-spoiler><i>Реклама. erid: ${affiliate.erid}</i></tg-spoiler>`;
  } else {
    text += `<tg-spoiler><i>Реклама.</i></tg-spoiler>`;
  }

  const buttons = {
    inline_keyboard: [
      [
        {
          text: `🛒 Перейти в ${cleanName}`,
          url: affiliate.url,
        },
      ],
      [
        {
          text: "🌐 Все промокоды на сайте",
          url: SITE_URL,
        },
      ],
    ],
  };

  console.log("\n--- Предпросмотр поста ---");
  console.log(text);
  console.log("--------------------------\n");

  if (dryRun) {
    console.log("🔍 [DRY-RUN] Отправка пропущена.");
    return;
  }

  const msg = await sendToTelegram(text, buttons);
  console.log(`✅ Успешно опубликовано! Message ID: ${msg.message_id}`);
  const postUrl = `https://t.me/smart_zakupka/${msg.message_id}`;
  console.log(`👉 Ссылка: ${postUrl}`);

  history.postedUuids.push(offer.uuid);
  history.history.push({
    uuid: offer.uuid,
    name: offer.name,
    postUrl,
    messageId: msg.message_id,
    date: new Date().toISOString(),
  });
  saveHistory(history);
  console.log("🎉 Автопилот завершил работу!");
}

const isDry = process.argv.includes("--dry-run");
const searchArg = process.argv.find((a) => a.startsWith("--search="))?.split("=")[1];
const catArg = process.argv.find((a) => a.startsWith("--category="))?.split("=")[1];

runAutopilot({ dryRun: isDry, search: searchArg, categoryId: catArg }).catch(console.error);


