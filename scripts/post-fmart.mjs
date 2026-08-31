import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Blob } from "node:buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Загрузка переменных окружения
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka";
const ADMIN_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "6141363106";

const imagePath = "C:/Users/Kriri/.gemini/antigravity/brain/0ef4c0f0-0d44-40b4-9ff6-55121e10fad4/.user_uploaded/media_1788191961297.png";

const postText = `💐 <b>Букеты к 1 Сентября со скидкой 22% в FMART by Flowwow!</b>

Подготовка к школе — сплошные траты и суета 🙈 Чтобы не переплачивать в цветочных в последний момент и не переживать за доставку, закажите букет для учителя заранее с хорошей скидкой!

🎁 <b>Скидка 22% на первый или один повторный заказ</b>

📋 <b>Как применить выгоду:</b>
1. Перейдите по кнопке заказа ниже
2. Выберите понравившийся букет
3. Введите промокод при оформлении:

🎟 Промокод: <code>Fmartpe22pcbtp</code>
<i>(нажмите на промокод, чтобы скопировать 👆)</i>

✨ <i>Работает на первый заказ и на 1 повторный!</i>
⚡️ <i>Суммируется с акциями на сайте</i>
⏳ <i>Актуально только до 6 сентября</i>

────────────────────
<tg-spoiler><i>Реклама. ООО «ФМАРТ», ОГРН 1237700524060, г. Москва erid: 2RanykURyUw</i></tg-spoiler>`;

const markup = {
  inline_keyboard: [
    [
      {
        text: "💐 Выбрать букет в FMART со скидкой 22% →",
        url: "https://fmart-flowers.prfl.me/smart_zakupka/ekef65?erid=2RanykURyUw",
      },
    ],
    [
      {
        text: "🌐 Больше скидок на Promofact.ru",
        url: "https://promofact.ru",
      },
    ],
  ],
};

async function post() {
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN не найден в .env.local!");
  }

  console.log(`🚀 Отправка поста FMART в канал ${CHANNEL_ID}...`);

  let resData;

  if (fs.existsSync(imagePath)) {
    console.log(`📸 Загрузка баннера из: ${imagePath}`);
    const fileBuffer = fs.readFileSync(imagePath);
    const formData = new FormData();
    formData.append("chat_id", CHANNEL_ID);
    formData.append("photo", new Blob([fileBuffer], { type: "image/png" }), "fmart_flowers.png");
    formData.append("caption", postText);
    formData.append("parse_mode", "HTML");
    formData.append("reply_markup", JSON.stringify(markup));

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
    resData = await res.json();
  } else {
    console.warn("⚠️ Баннер не найден, отправка текстовым сообщением...");
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: postText,
        parse_mode: "HTML",
        reply_markup: markup,
      }),
    });
    resData = await res.json();
  }

  if (!resData.ok) {
    console.error("❌ Ошибка от Telegram API:", resData);
    process.exit(1);
  }

  const msgId = resData.result?.message_id;
  const channelName = CHANNEL_ID.replace(/^@/, "");
  const postUrl = `https://t.me/${channelName}/${msgId}`;

  console.log("\n🎉 Пост успешно опубликован!");
  console.log(`🆔 Message ID: ${msgId}`);
  console.log(`🔗 Ссылка на пост в канале: ${postUrl}`);

  // Сохранение в историю
  const historyFile = path.join(rootDir, "data", "posted_promos.json");
  let history = { postedIds: [], history: [] };
  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, "utf8"));
    } catch {}
  }
  history.history = history.history || [];
  history.history.push({
    code: "Fmartpe22pcbtp",
    store: "FMART by flowwow",
    storeSlug: "fmart",
    postUrl,
    date: new Date().toISOString(),
    messageId: msgId,
  });
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), "utf8");

  // Уведомление админа
  if (ADMIN_ID) {
    try {
      const adminText = [
        `📢 <b>Опубликован пост FMART by Flowwow!</b>`,
        ``,
        `🎟 Промокод: <code>Fmartpe22pcbtp</code> (-22%)`,
        ``,
        `🔗 <b>Ссылка для отчета Perfluence:</b>`,
        `<code>${postUrl}</code>`,
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text: adminText,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "👁 Открыть пост в канале", url: postUrl }],
            ],
          },
        }),
      });
      console.log(`📩 Уведомление администратору (${ADMIN_ID}) отправлено.`);
    } catch (e) {
      console.warn("⚠️ Не удалось отправить уведомление админу:", e.message);
    }
  }
}

post().catch((err) => {
  console.error("💥 Ошибка:", err);
  process.exit(1);
});
