/**
 * scripts/perfluence-report.mjs
 * Автоматическая сдача отчета в кабинет Perfluence через Playwright.
 * 
 * Использование:
 * node scripts/perfluence-report.mjs --projectId=8842 --postUrl="https://t.me/smart_zakupka/52"
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SESSION_FILE = path.join(process.cwd(), "data", "perfluence_session.json");

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val ? val.replace(/["']/g, "") : true;
    }
  }
  return args;
}

async function submitReport(projectId, postUrl, options = { headless: true }) {
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(`Файл сессии ${SESSION_FILE} не найден. Сначала запустите: node scripts/perfluence-auth.mjs`);
  }

  console.log(`[Report] Запуск браузера для сдачи отчета по проекту #${projectId}...`);
  console.log(`[Report] Ссылка на пост: ${postUrl}`);

  const browser = await chromium.launch({
    headless: options.headless,
  });

  const context = await browser.newContext({
    storageState: SESSION_FILE,
  });

  const page = await context.newPage();

  // Переходим на страницу конкретного проекта
  const projectUrl = `https://dash.perfluence.net/my-projects/${projectId}`;
  await page.goto(projectUrl, { waitUntil: "networkidle" });

  console.log(`[Report] Открыта страница проекта: ${page.url()}`);

  // Проверяем, не выбило ли авторизацию
  if (page.url().includes("/login")) {
    await browser.close();
    throw new Error("Сессия устарела! Требуется повторный запуск node scripts/perfluence-auth.mjs");
  }

  // Делаем скриншот для отладки
  const debugDir = path.join(process.cwd(), "data", "debug");
  if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
  await page.screenshot({ path: path.join(debugDir, `project-${projectId}-before.png`) });

  console.log("[Report] Поиск элементов сдачи отчета...");

  // Ищем поле ввода ссылки на публикацию (типичные селекторы Perfluence)
  const inputSelectors = [
    'input[placeholder*="t.me"]',
    'input[placeholder*="ссылк"]',
    'input[name*="url"]',
    'input[name*="link"]',
    'input[type="url"]'
  ];

  let inputFound = null;
  for (const sel of inputSelectors) {
    const el = await page.$(sel);
    if (el && await el.isVisible()) {
      inputFound = el;
      console.log(`[Report] Найдено поле ввода по селектору: ${sel}`);
      break;
    }
  }

  if (!inputFound) {
    console.warn("[Report] Прямое поле ввода не найдено на первом экране. Проверяем наличие кнопок 'Сдать отчет' / 'Отправить публикацию'...");
    
    // Ищем кнопку открытия формы отчета
    const buttonSelectors = [
      'button:has-text("Сдать отчет")',
      'button:has-text("Отправить отчет")',
      'button:has-text("Добавить публикацию")',
      'a:has-text("Сдать отчет")',
      'a:has-text("Отправить")',
    ];

    for (const bSel of buttonSelectors) {
      const btn = await page.$(bSel);
      if (btn && await btn.isVisible()) {
        console.log(`[Report] Нажатие на кнопку: ${bSel}`);
        await btn.click();
        await page.waitForTimeout(1500);
        break;
      }
    }

    // Повторный поиск инпута после нажатия
    for (const sel of inputSelectors) {
      const el = await page.$(sel);
      if (el && await el.isVisible()) {
        inputFound = el;
        break;
      }
    }
  }

  if (inputFound) {
    await inputFound.fill(postUrl);
    console.log(`[Report] Ссылка ${postUrl} успешно вставлена в форму.`);

    // Поиск кнопки подтверждения/отправки
    const submitBtn = await page.$('button[type="submit"], button:has-text("Отправить"), button:has-text("Сохранить")');
    if (submitBtn && await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log("[Report] Кнопка отправки отчета нажата!");
    }
  } else {
    console.log("[Report] Интерактивные элементы формы отчета требуют визуального осмотра. Скриншот сохранен в data/debug/.");
  }

  await page.screenshot({ path: path.join(debugDir, `project-${projectId}-after.png`) });
  await browser.close();

  return { success: true, debugScreenshot: path.join(debugDir, `project-${projectId}-after.png`) };
}

// Запуск напрямую из CLI
const args = parseArgs();
if (args.projectId && args.postUrl) {
  submitReport(args.projectId, args.postUrl, { headless: args.headless !== "false" })
    .then(res => {
      console.log("[Report] Завершено:", res);
    })
    .catch(err => {
      console.error("[Report] Ошибка:", err.message);
      process.exit(1);
    });
}

export { submitReport };
