import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const SESSION_DIR = path.join(ROOT_DIR, "data");
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
    channel: "chrome",
    args: ["--disable-blink-features=AutomationControlled"]
  }).catch(() => chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"]
  }));

  const harPath = path.join(SESSION_DIR, "perfluence_live.har");
  const context = await browser.newContext({
    recordHar: { path: harPath, mode: "full" },
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log("Открываю страницу авторизации Perfluence...");
  await page.goto("https://dash.perfluence.net/site/login", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("\n✅ Страница открыта!");
  console.log("👉 Введите логин и пароль в окне браузера и нажмите «Войти».");
  console.log("Ожидание успешного входа (до 10 минут)...\n");

  // Ждем, пока URL перестанет быть страницей логина (максимум 10 минут)
  await page.waitForURL(url => !url.pathname.includes("/login") && !url.pathname.includes("/auth") && !url.pathname.endsWith("/site"), {
    timeout: 600_000
  });

  // Ждем еще 3 секунды чтобы все куки и токены осели
  await page.waitForTimeout(3000);

  console.log("Вход подтверждён! Загружаю проекты и уведомления для снятия полного дампа...");
  try {
    await page.goto("https://dash.perfluence.net/my-projects", { waitUntil: "networkidle", timeout: 15000 });
  } catch {}

  await context.storageState({ path: SESSION_FILE });
  await context.close();
  await browser.close();

  console.log("\n🎉 СЕССИЯ И СЕТЕВОЙ ДАМП УСПЕШНО СОХРАНЕНЫ!");
  console.log(`Сессия: ${SESSION_FILE}`);
  console.log(`HAR-дамп: ${harPath}`);
  console.log("Теперь робот сможет входить в Perfluence автоматически без ввода логина и пароля.\n");
}

main().catch(err => {
  console.error("Ошибка авторизации:", err);
  process.exit(1);
});
