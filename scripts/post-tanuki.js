const https = require("https");

const botToken = "8895522204:AAEMdP_FMLbDBzHwEjnpDY8rrtIRs-OEn8s";
const channelId = "@smart_zakupka";
const adminId = "6141363106";

const postText = `🍣 <b>Как заказывать в ТАНУКИ с максимальной выгодой:</b>

Собрали свежие проверенные промокоды на август 2026:

🎁 <b>Скидка 20% на первый заказ от 1090 ₽:</b>
🎟 Код: <code>20AV1474</code> <i>(нажмите, чтобы скопировать 👆)</i>

🎁 <b>Скидка 15% на ВСЕ повторные заказы от 1490 ₽:</b>
🎟 Код: <code>15AV1474</code> <i>(нажмите, чтобы скопировать 👆)</i>

🎁 <b>Ролл «Хрустящий микс» В ПОДАРОК к заказу от 1490 ₽:</b>
🎟 Код: <code>TB1388</code> <i>(нажмите, чтобы скопировать 👆)</i>

📍 <i>Города: Москва, Казань, Краснодар, Самара, Екатеринбург, Уфа, Воронеж, Нижний Новгород</i>
⏳ <i>Действует до 30 августа</i>

────────────────────
<i>Реклама. ООО "Корсика", ИНН 7730290633. erid: 2RanykjB8eP</i>`;

const markup = {
  inline_keyboard: [
    [
      {
        text: "🛒 Перейти в Тануки и применить скидку →",
        url: "https://tanuki.prfl.me/smart_zakupka/p46uyz?source=js-widget&source_id=8842",
      },
    ],
    [
      {
        text: "🌐 Все промокоды на Promofact.ru",
        url: "https://promofact.ru/store/tanukifamily",
      },
    ],
  ],
};

const payload = JSON.stringify({
  chat_id: channelId,
  text: postText,
  parse_mode: "HTML",
  reply_markup: markup,
  disable_notification: true,
  disable_web_page_preview: true,
});

const req = https.request(
  {
    hostname: "api.telegram.org",
    path: `/bot${botToken}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  },
  (res) => {
    let body = "";
    res.on("data", (d) => (body += d));
    res.on("end", () => {
      console.log("TG Response:", body);
      try {
        const resJson = JSON.parse(body);
        if (resJson.ok) {
          const msgId = resJson.result.message_id;
          console.log("SUCCESS! Post ID:", msgId);

          // Notify admin
          const adminPayload = JSON.stringify({
            chat_id: adminId,
            text: `📢 <b>Опубликован свежий пост Тануки!</b>\n\n🔗 <b>Ссылка для отчета в Perfluence (нажмите, чтобы скопировать):</b>\n<code>https://t.me/smart_zakupka/${msgId}</code>`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "⚡ Сдать отчет в Perfluence (проект 602) →",
                    url: "https://dash.perfluence.net/my-projects/602",
                  },
                ],
              ],
            },
          });
          const adminReq = https.request(
            {
              hostname: "api.telegram.org",
              path: `/bot${botToken}/sendMessage`,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(adminPayload),
              },
            },
            () => {}
          );
          adminReq.write(adminPayload);
          adminReq.end();
        }
      } catch (e) {
        console.error("Parse err", e);
      }
    });
  }
);

req.on("error", (e) => console.error("Req error", e));
req.write(payload);
req.end();
