import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Blob } from "node:buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

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
const imagePath = "C:/Users/Kriri/AppData/Local/hermes/attachments/template (10).png";

const postText = `🎁 <b>Бокс с косметикой в подарок в магазинах «Подружка»!</b>

В честь Дня рождения «Подружка» дарит фирменные бьюти-боксы с косметикой при любой покупке от 1500 ₽!

💄 <b>Как забрать свой бокс:</b>
1. Откройте штрихкод по ссылке: <a href="https://podrygka.prfl.me/smart_zakupka/hopflr?erid=2RanykAX6Cs">получить штрихкод</a>
2. Приходите в любой розничный магазин «Подружка»
3. Покажите штрихкод на кассе перед оплатой покупки от 1500 ₽
4. Заберите подарочный бокс с косметикой!

⏳ <i>Акция действует только с 21 по 27 сентября во всех городах России. Количество боксов ограничено, наполнение может отличаться!</i>

────────────────────
<tg-spoiler><i>Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851 erid: 2RanykAX6Cs</i></tg-spoiler>`;

const markup = {
  inline_keyboard: [
    [
      {
        text: "🎁 Получить штрихкод на бокс →",
        url: "https://podrygka.prfl.me/smart_zakupka/hopflr?erid=2RanykAX6Cs",
      },
    ],
    [
      {
        text: "🌐 Все акции и промокоды на Promofact.ru",
        url: "https://promofact.ru",
      },
    ],
  ],
};

async function post() {
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN не найден!");
  }

  console.log(`🚀 Отправка поста с боксом «Подружка» в канал ${CHANNEL_ID}...`);

  let resData;

  if (fs.existsSync(imagePath)) {
    console.log(`📸 Загрузка баннера: ${imagePath}`);
    const fileBuffer = fs.readFileSync(imagePath);
    const formData = new FormData();
    formData.append("chat_id", CHANNEL_ID);
    formData.append("photo", new Blob([fileBuffer], { type: "image/png" }), "podrygka_box.png");
    formData.append("caption", postText);
    formData.append("parse_mode", "HTML");
    formData.append("reply_markup", JSON.stringify(markup));

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
    resData = await res.json();
  } else {
    console.warn("⚠️ Баннер не найден локально!");
    process.exit(1);
  }

  if (!resData.ok) {
    console.error("❌ Ошибка от Telegram API:", JSON.stringify(resData, null, 2));
    process.exit(1);
  }

  console.log("✅ Пост успешно опубликован!");
  console.log(`🔗 Ссылка на пост: https://t.me/${CHANNEL_ID.replace("@", "")}/${resData.result.message_id}`);

  // Сохраняем в историю публикаций data/posted_promos.json
  const postedFile = path.join(rootDir, "data", "posted_promos.json");
  try {
    let list = [];
    if (fs.existsSync(postedFile)) {
      list = JSON.parse(fs.readFileSync(postedFile, "utf8"));
    }
    list.push({
      store: "Подружка",
      storeSlug: "podryzhka",
      title: "Бокс с косметикой в подарок",
      link: "https://podrygka.prfl.me/smart_zakupka/hopflr?erid=2RanykAX6Cs",
      erid: "2RanykAX6Cs",
      postUrl: `https://t.me/${CHANNEL_ID.replace("@", "")}/${resData.result.message_id}`,
      date: new Date().toISOString(),
      messageId: resData.result.message_id,
    });
    fs.writeFileSync(postedFile, JSON.stringify(list, null, 2), "utf8");
    console.log("📁 История публикаций обновлена.");
  } catch (err) {
    console.warn("Не удалось обновить posted_promos.json:", err.message);
  }
}

post().catch((err) => {
  console.error("Критическая ошибка:", err);
  process.exit(1);
});
