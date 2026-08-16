// Direct post of Perfluence offer 1977 (Важная Рыба) to Telegram
const BOT_TOKEN = "8895522204:AAEMdP_FMLbDBzHwEjnpDY8rrtIRs-OEn8s";
const CHANNEL_ID = "@smart_zakupka";

const text = [
  "\u{1F41F} <b>\u0412\u0430\u0436\u043D\u0430\u044F \u0420\u044B\u0431\u0430 \u2014 \u0441\u043A\u0438\u0434\u043A\u0430 15%!</b>",
  "",
  "\u{1F381} \u0421\u043A\u0438\u0434\u043A\u0430 15% \u043D\u0430 \u0437\u0430\u043A\u0430\u0437 \u043E\u0442 3 999 \u20BD",
  "\u{1F4CD} \u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430 \u0441\u0432\u0435\u0436\u0438\u0445 \u043C\u043E\u0440\u0435\u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432 \u043F\u043E \u0421\u041F\u0431 \u0438 \u041B\u041E",
  "",
  "\u{1F39F} \u041F\u0440\u043E\u043C\u043E\u043A\u043E\u0434: <code>SPTB1068</code>",
  "",
  '\u{1F449} <a href="https://promofact.ru/store/vazhnaya-ryba/SPTB1068">\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C</a>',
  "",
  "#\u0441\u043A\u0438\u0434\u043A\u0438 #\u043C\u043E\u0440\u0435\u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B #\u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434 #\u043F\u0440\u043E\u043C\u043E\u0444\u0430\u043A\u0442",
].join("\n");

async function sendToTelegram() {
  console.log(">>> Sending to Telegram channel", CHANNEL_ID);
  const res = await fetch(
    "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    }
  );
  const data = await res.json();
  console.log("Telegram result:", JSON.stringify(data, null, 2));
  return data;
}

sendToTelegram().catch(console.error);
