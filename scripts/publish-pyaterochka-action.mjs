import fs from "node:fs";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@smart_zakupka";
const ADMIN_CHAT_ID = "6141363106";
const imagePath = "public/banners/pyaterochka_oct2026.jpg";

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN environment variable");
  process.exit(1);
}

const caption = [
  "🛒 <b>СУММИРУЕТСЯ СО СКИДКАМИ: промокоды в Пятёрочка Доставка!</b>",
  "",
  "Только до конца октября действует редкая акция — промокоды <b>суммируются со всеми скидками каталога</b>! Двойная экономия на свежих продуктах и угощениях к чаю 🥐☕️",
  "",
  "🔥 <b>Горячие промокоды:</b>",
  "",
  "⚡️ <code>4pmhdjrhsp7</code> — скидка <b>750 ₽</b> на первый заказ от 1 500 ₽",
  "⚡️ <code>6wrhnueusp6</code> — скидка <b>55%</b> на первый заказ от 700 ₽ <i>(макс. скидка 600 ₽)</i>",
  "",
  "<i>(нажмите на промокод — он скопируется в буфер)</i>",
  "",
  "👥 <b>Действуют и на старых аккаунтах</b>, если вы не совершали заказ более года!",
  "",
  "📌 Зона и время доставки ограничены. Имеются ограничения по условиям бесплатной доставки. Подробности в приложении «Пятёрочка Доставка» 18+.",
  "",
  "────────────────────",
  "<tg-spoiler><i>Реклама. ООО «Агроторг». ИНН 7825706086 erid: 2Ranyng8Q3m</i></tg-spoiler>",
].join("\n");

const buttons = [
  [{ text: "🛍 Заказать в Пятёрочке →", url: "https://pyaterochka.prfl.me/smart_zakupka/tatilo?erid=2Ranyng8Q3m" }],
  [{ text: "🌐 Все скидки Пятёрочки на сайте", url: "https://promofact.ru/store/pyaterochka" }]
];

async function run() {
  const formData = new FormData();
  formData.append("chat_id", CHANNEL_ID);
  formData.append("caption", caption);
  formData.append("parse_mode", "HTML");
  formData.append("reply_markup", JSON.stringify({ inline_keyboard: buttons }));
  
  const imgBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([imgBuffer], { type: "image/jpeg" });
  formData.append("photo", blob, "pyaterochka.jpg");

  console.log("Sending photo to " + CHANNEL_ID + "...");
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("Telegram API error:", data);
    process.exit(1);
  }

  const messageId = data.result.message_id;
  const postUrl = `https://t.me/smart_zakupka/${messageId}`;
  console.log("SUCCESS! Message ID:", messageId);
  console.log("POST_URL=" + postUrl);

  // Send admin notification
  try {
    const adminText = [
      "📢 <b>Опубликован пост для отчета Perfluence!</b>",
      "",
      "🏬 Магазин: <b>Пятёрочка Доставка</b>",
      "🎟 Промокоды: <code>4pmhdjrhsp7, 6wrhnueusp6</code>",
      "",
      "🔗 <b>Ссылка на пост (нажмите, чтобы скопировать):</b>",
      `<code>${postUrl}</code>`,
    ].join("\n");

    const adminMarkup = {
      inline_keyboard: [
        [{ text: "⚡ Сдать отчет в Perfluence (проект 4264) →", url: "https://dash.perfluence.net/my-projects/4264" }],
        [{ text: "👁 Открыть пост в канале", url: postUrl }],
      ],
    };

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: adminText,
        parse_mode: "HTML",
        reply_markup: adminMarkup,
        disable_web_page_preview: true,
      }),
    });
    console.log("Admin notification sent.");
  } catch (e) {
    console.warn("Failed to notify admin:", e.message);
  }
}

run().catch((e) => {
  console.error("Execution error:", e);
  process.exit(1);
});
