import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SESSION_DIR = path.join(process.cwd(), "data");
const SESSION_FILE = path.join(SESSION_DIR, "perfluence_session.json");

async function main() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  console.log("=================================================");
  console.log("  АВТОРИЗАЦИЯ PERFLUENCE (ОДНОКРАТНОЕ СОХРАНЕНИЕ)");
  console.log("=================================================");
  console.log("1. Сейчас откроется окно браузера Chromium.");
  console.log("2. Войдите в свой личный кабинет Perfluence блогера.");
  console.log("3. После успешного входа скрипт автоматически перехватит сессию");
  console.log("   и сохранит её в data/perfluence_session.json.");
  console.log("=================================================\n");

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome" // пробует системный Chrome если есть, иначе fallback на playwright chromium
  }).catch(() => chromium.launch({ headless: false }));

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://dash.perfluence.net/site/login");

  console.log("Ожидание успешного входа (переход в дашборд /my-projects или аналогичный)...");

  // Ждем, пока URL перестанет быть страницей логина (максимум 5 минут)
  await page.waitForURL(url => !url.pathname.includes("/login") && !url.pathname.includes("/auth") && !url.pathname.endsWith("/site"), {
    timeout: 300_000
  });

  // Ждем еще 3 секунды чтобы все куки и токены осели
  await page.waitForTimeout(3000);

  await context.storageState({ path: SESSION_FILE });

  console.log("\n🎉 СЕССИЯ УСПЕШНО СОХРАНЕНА!");
  console.log(`Файл сохранен: ${SESSION_FILE}`);
  console.log("Теперь робот сможет входить в Perfluence автоматически без ввода логина и пароля.\n");

  await browser.close();
}

main().catch(err => {
  console.error("Ошибка авторизации:", err);
  process.exit(1);
});
