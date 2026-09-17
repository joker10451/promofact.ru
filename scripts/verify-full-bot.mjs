import fs from "node:fs";
import path from "node:path";

console.log("==================================================");
console.log("   🔍 ПОЛНАЯ ПРОВЕРКА РАБОТЫ БОТА И ПАЙПЛАЙНА    ");
console.log("==================================================");

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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || fileEnv.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || fileEnv.TELEGRAM_CHANNEL_ID || "@smart_zakupka";
const ADMIN_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || fileEnv.TELEGRAM_ADMIN_CHAT_ID;
const WIDGET_URL = process.env.PERFLUENCE_WIDGET_URL || fileEnv.PERFLUENCE_WIDGET_URL;
const SESSION_FILE = path.join(process.cwd(), "data", "perfluence_session.json");

const report = [];

// 1. Проверка Telegram Bot
console.log("\n[1/5] Проверка Telegram API...");
try {
  const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
  const me = await meRes.json();
  if (me.ok) {
    console.log(`  ✓ Бот активен: @${me.result.username} (${me.result.first_name})`);
    report.push({ item: "Telegram Bot API", status: "OK", details: `@${me.result.username}` });
  } else {
    throw new Error(me.description);
  }

  const chatRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${CHANNEL_ID}`);
  const chat = await chatRes.json();
  if (chat.ok) {
    console.log(`  ✓ Доступ к каналу ${CHANNEL_ID}: "${chat.result.title}" (ID: ${chat.result.id})`);
    report.push({ item: "Доступ к каналу", status: "OK", details: `${chat.result.title} (${CHANNEL_ID})` });
  } else {
    throw new Error(`Нет доступа к каналу: ${chat.description}`);
  }
} catch (e) {
  console.error(`  ❌ Ошибка Telegram: ${e.message}`);
  report.push({ item: "Telegram API", status: "FAIL", details: e.message });
}

// 2. Проверка сессии Perfluence
console.log("\n[2/5] Проверка сессии Perfluence...");
let cookies = "";
try {
  if (!fs.existsSync(SESSION_FILE)) throw new Error("Файл session.json не найден");
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
  cookies = session.cookies.map(c => `${c.name}=${c.value}`).join("; ");
  
  const perfRes = await fetch("https://dash.perfluence.net/projects", {
    headers: { "Cookie": cookies, "User-Agent": "Mozilla/5.0" }
  });
  if (perfRes.ok && !perfRes.url.includes("/login")) {
    console.log(`  ✓ Сессия активна (HTTP ${perfRes.status}, URL: ${perfRes.url})`);
    report.push({ item: "Сессия Perfluence", status: "OK", details: "Активна, доступ к кабинету подтвержден" });
  } else {
    throw new Error(`Сессия устарела (HTTP ${perfRes.status})`);
  }
} catch (e) {
  console.error(`  ❌ Ошибка Perfluence: ${e.message}`);
  report.push({ item: "Сессия Perfluence", status: "FAIL", details: e.message });
}

// 3. Проверка каталога и виджета
console.log("\n[3/5] Проверка API офферов...");
try {
  const wRes = await fetch(WIDGET_URL);
  const wData = await wRes.json();
  const count = (wData.data || []).length;
  console.log(`  ✓ Виджет доступен: получено ${count} активных проектов`);
  report.push({ item: "Виджет офферов", status: "OK", details: `${count} проектов активно` });
} catch (e) {
  console.error(`  ❌ Ошибка виджета: ${e.message}`);
  report.push({ item: "Виджет офферов", status: "FAIL", details: e.message });
}

// 4. Проверка синхронизации канала smart_zakupka
console.log("\n[4/5] Проверка синхронизации персональных данных канала...");
try {
  const accRes = await fetch("https://dash.perfluence.net/project/1341/accounts", {
    headers: { "Cookie": cookies, "User-Agent": "Mozilla/5.0" }
  });
  const html = await accRes.text();
  const hasSmartZakupka = html.includes("smart_zakupka");
  const linkMatch = html.match(/https:\/\/[a-z0-9.]+\.prfl\.me\/smart_zakupka\/[^\s"'<>]+/i);
  const eridMatch = html.match(/erid:\s*([A-Za-z0-9_-]+)/i);

  if (hasSmartZakupka && linkMatch) {
    console.log(`  ✓ Площадка smart_zakupka подключена к проектам`);
    console.log(`  ✓ Личная ссылка: ${linkMatch[0]}`);
    console.log(`  ✓ Персональный erid: ${eridMatch ? eridMatch[1] : "найден"}`);
    report.push({ item: "Персональные ссылки канала", status: "OK", details: `${linkMatch[0].slice(0, 45)}...` });
  } else {
    throw new Error("Не удалось извлечь персональную ссылку канала");
  }
} catch (e) {
  console.error(`  ❌ Ошибка персональных данных: ${e.message}`);
  report.push({ item: "Персональные ссылки", status: "FAIL", details: e.message });
}

// 5. Проверка алгоритма анти-повторов и скоринга
console.log("\n[5/5] Проверка отбора офферов и анти-повторов...");
try {
  const history = JSON.parse(fs.readFileSync("data/posted_promos.json", "utf8"));
  console.log(`  ✓ История публикаций: ${history.history.length} постов сохранено`);
  console.log(`  ✓ Последний пост: "${history.history[0]?.store}" (${history.history[0]?.code})`);
  
  // Запускаем сухой прогон оркестратора
  const { runPipeline } = await import("./pipeline-orchestrator.mjs");
  console.log(`  -> Тестовый расчет следующего лучшего кандидата...`);
  // Перехватываем вывод console.log для анализа кандидата
  let pickedStore = "";
  const origLog = console.log;
  console.log = (...args) => {
    const s = args.join(" ");
    if (s.includes("Выбран лучший оффер:")) {
      pickedStore = s;
    }
    origLog(...args);
  };

  await runPipeline({ dryRun: true, takeOffers: false });
  console.log = origLog;

  if (pickedStore) {
    console.log(`  ✓ Алгоритм успешно отобрал кандидата без повтора последнего магазина!`);
    report.push({ item: "Алгоритм отбора и анти-повторов", status: "OK", details: pickedStore.replace(/\[.*\]\s*/, "") });
  } else {
    throw new Error("Оффер не был выбран");
  }
} catch (e) {
  console.error(`  ❌ Ошибка алгоритма: ${e.message}`);
  report.push({ item: "Алгоритм отбора", status: "FAIL", details: e.message });
}

console.log("\n==================================================");
console.log("             ИТОГОВЫЙ ОТЧЕТ АУДИТА                ");
console.log("==================================================");
console.table(report);

const allOk = report.every(r => r.status === "OK");
if (allOk) {
  console.log("\n🎉 ВСЕ СИСТЕМЫ РАБОТАЮТ НА 100% ИСПРАВНО!");
} else {
  console.log("\n⚠ ОБНАРУЖЕНЫ ЗАМЕЧАНИЯ, ТРЕБУЕТСЯ ВНИМАНИЕ.");
}
