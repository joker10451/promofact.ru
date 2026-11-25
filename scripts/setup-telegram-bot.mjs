/**
 * CLI-утилита проверки и настройки публичного Telegram-бота и канала @smart_zakupka.
 *
 * Использование:
 *   node scripts/setup-telegram-bot.mjs           — диагностика (getMe, getWebhookInfo, getChat)
 *   node scripts/setup-telegram-bot.mjs --apply   — setWebhook + setMyCommands + setChatMenuButton (Mini App)
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvFiles() {
  const out = {};
  for (const name of [".env.local", ".env.production.local"]) {
    const envPath = path.join(process.cwd(), name);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const idx = line.indexOf("=");
      if (idx <= 0 || line.trim().startsWith("#")) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (val && !val.includes("SENSITIVE")) out[key] = val;
    }
  }
  return out;
}

function pickSecret(...candidates) {
  for (const raw of candidates) {
    const val = String(raw || "").trim();
    if (val && !val.includes("SENSITIVE")) return val;
  }
  return "";
}

const fileEnv = loadEnvFiles();
const BOT_TOKEN = pickSecret(
  process.env.TELEGRAM_PUBLIC_BOT_TOKEN,
  fileEnv.TELEGRAM_PUBLIC_BOT_TOKEN,
  process.env.TELEGRAM_BOT_TOKEN_DEPLOYED,
  fileEnv.TELEGRAM_BOT_TOKEN_DEPLOYED,
  process.env.TELEGRAM_BOT_TOKEN,
  fileEnv.TELEGRAM_BOT_TOKEN,
);
const WEBHOOK_SECRET = pickSecret(
  process.env.TELEGRAM_BOT_WEBHOOK_SECRET,
  fileEnv.TELEGRAM_BOT_WEBHOOK_SECRET,
  process.env.TELEGRAM_POSTING_SECRET,
  process.env.TELEGRAM_POSTING_SECRET_DEPLOYED,
  fileEnv.TELEGRAM_POSTING_SECRET,
  fileEnv.TELEGRAM_POSTING_SECRET_DEPLOYED,
);
const CHANNEL_ID = (process.env.TELEGRAM_CHANNEL_ID || fileEnv.TELEGRAM_CHANNEL_ID || "@smart_zakupka").trim();
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://promofact.ru").replace(/\/+$/, "");
const APPLY = process.argv.includes("--apply");

async function tg(method, body) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } : undefined);
  return res.json();
}

async function main() {
  if (!BOT_TOKEN) {
    console.error("❌ Не задан TELEGRAM_PUBLIC_BOT_TOKEN / TELEGRAM_BOT_TOKEN");
    process.exit(1);
  }

  const me = await tg("getMe");
  console.log("🤖 Bot getMe:", me.ok ? `@${me.result.username} (id: ${me.result.id})` : me);
  if (APPLY && !me.ok) {
    console.error("❌ Bot token не прошёл getMe — проверьте TELEGRAM_PUBLIC_BOT_TOKEN / TELEGRAM_BOT_TOKEN_DEPLOYED");
    process.exit(1);
  }

  const wh = await tg("getWebhookInfo");
  console.log("🔗 WebhookInfo:", wh.ok ? {
    url: wh.result.url || "(не задан)",
    pending_update_count: wh.result.pending_update_count,
    last_error_message: wh.result.last_error_message || null,
  } : wh);

  const chat = await tg(`getChat?chat_id=${encodeURIComponent(CHANNEL_ID)}`);
  console.log("📢 Channel:", chat.ok ? {
    title: chat.result.title,
    username: chat.result.username,
    has_linked_chat: Boolean(chat.result.linked_chat_id),
    pinned_id: chat.result.pinned_message?.message_id || null,
    available_reactions: chat.result.available_reactions?.length ?? chat.result.available_reactions,
  } : chat);

  if (!APPLY) {
    console.log("\nℹ Режим диагностики. Для применения вебхука, команд и Mini App кнопки запустите с флагом --apply.");
    return;
  }

  if (!WEBHOOK_SECRET) {
    console.error("❌ Для --apply требуется TELEGRAM_BOT_WEBHOOK_SECRET или TELEGRAM_POSTING_SECRET (не [SENSITIVE])");
    process.exit(1);
  }

  const webhookUrl = `${SITE_URL}/api/telegram/bot`;
  const setWh = await tg("setWebhook", {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
  });
  console.log("setWebhook =>", setWh);

  const setName = await tg("setMyName", {
    name: "ПромоФакт — Поиск промокодов",
  });
  console.log("setMyName =>", setName);

  const setShortDesc = await tg("setMyShortDescription", {
    short_description: "Быстрый поиск рабочих промокодов Promofact.ru и алерты на повторные заказы из @smart_zakupka.",
  });
  console.log("setMyShortDescription =>", setShortDesc);

  const setDesc = await tg("setMyDescription", {
    description: "Напишите название любого магазина (Лавка, Самокат, Пятёрочка, Т-Банк) — сразу покажу рабочие скидки и открою каталог без лишней рекламы. Подписчикам @smart_zakupka доступны алерты на повторные заказы!",
  });
  console.log("setMyDescription =>", setDesc);

  const setCmd = await tg("setMyCommands", {
    commands: [
      { command: "start", description: "Главное меню и поиск скидок" },
      { command: "repeat", description: "Подборка кодов на повторный заказ" },
      { command: "top", description: "Топ магазинов дня" },
      { command: "subs", description: "Мои подписки на алерты" },
      { command: "help", description: "Как пользоваться ботом" },
    ],
  });
  console.log("setMyCommands =>", setCmd);

  const setMenu = await tg("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Каталог скидок",
      web_app: { url: `${SITE_URL}/catalog?utm_source=tg_bot&utm_medium=menu_btn` },
    },
  });
  console.log("setChatMenuButton =>", setMenu);

  const postCheck = await tg("getWebhookInfo");
  console.log("Verified live webhook =>", postCheck.ok ? {
    url: postCheck.result.url,
    pending_update_count: postCheck.result.pending_update_count,
    last_error_message: postCheck.result.last_error_message || null,
  } : postCheck);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
