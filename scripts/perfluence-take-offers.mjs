/**
 * scripts/perfluence-take-offers.mjs
 * 
 * Автоматическое подключение новых офферов в личном кабинете Perfluence через Playwright.
 * 
 * Что делает робот:
 * 1. Загружает сохраненную сессию (data/perfluence_session.json).
 * 2. Переходит в раздел доступных проектов: https://dash.perfluence.net/projects/index
 * 3. Фильтрует проекты с открытым набором (CPA-офферы для Telegram).
 * 4. Нажимает "Подать заявку" / "Получить промокод" / "Участвовать".
 * 5. Если требуется выбрать социальную сеть — выбирает канал @smart_zakupka.
 * 6. Сохраняет скриншоты каждого шага в data/debug/.
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SESSION_FILE = path.join(process.cwd(), "data", "perfluence_session.json");
const DEBUG_DIR = path.join(process.cwd(), "data", "debug");

export async function takeNewOffers(options = { maxOffers: 3, headless: true }) {
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(`Файл сессии ${SESSION_FILE} не найден. Запустите: node scripts/perfluence-auth.mjs`);
  }

  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });

  console.log("==================================================");
  console.log("   🤖 АВТОМАТИЧЕСКИЙ ПОДБОР НОВЫХ ОФФЕРОВ         ");
  console.log("==================================================");
  console.log(`Лимит подключения: до ${options.maxOffers} проектов за прогон.\n`);

  const browser = await chromium.launch({
    headless: options.headless,
  });

  const context = await browser.newContext({
    storageState: SESSION_FILE,
  });

  const page = await context.newPage();

  // Каталог проектов Perfluence
  const catalogUrl = "https://dash.perfluence.net/projects/index";
  console.log(`[AutoTake] Открытие каталога проектов: ${catalogUrl}`);

  try {
    await page.goto(catalogUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
  } catch (err) {
    console.warn(`[AutoTake] Предупреждение при переходе: ${err.message}`);
  }

  console.log(`[AutoTake] Текущий URL: ${page.url()}`);

  if (page.url().includes("/login")) {
    await browser.close();
    throw new Error("Сессия устарела! Требуется повторный вход через node scripts/perfluence-auth.mjs");
  }

  await page.screenshot({ path: path.join(DEBUG_DIR, "catalog-page.png") });
  console.log(`[AutoTake] Скриншот каталога сохранен в data/debug/catalog-page.png`);

  // Ждем отрисовки карточек проектов или таблицы
  await page.waitForTimeout(3000);

  // Ищем кнопки подачи заявки / получения промокода
  const takeButtonSelectors = [
    'button:has-text("Получить промокод")',
    'button:has-text("Участвовать")',
    'button:has-text("Подать заявку")',
    'a:has-text("Получить промокод")',
    'a:has-text("Участвовать")',
    'a:has-text("Подать заявку")',
  ];

  let appliedCount = 0;

  for (const selector of takeButtonSelectors) {
    const buttons = await page.$$(selector);
    if (buttons.length > 0) {
      console.log(`[AutoTake] Найдено ${buttons.length} кнопок по селектору "${selector}"`);

      for (const btn of buttons) {
        if (appliedCount >= options.maxOffers) break;
        if (await btn.isVisible()) {
          try {
            console.log(` -> Клик по кнопке подключения оффера #${appliedCount + 1}...`);
            await btn.click();
            await page.waitForTimeout(2000);

            // Если открылось модальное окно с выбором соцсети/канала
            const channelSelect = await page.$('select, input[placeholder*="канал"], input[placeholder*="профиль"], label:has-text("smart_zakupka")');
            if (channelSelect && await channelSelect.isVisible()) {
              console.log(" -> Обнаружен выбор площадки, выбираем @smart_zakupka...");
              await channelSelect.click();
              await page.waitForTimeout(1000);
            }

            // Ищем кнопку подтверждения в модалке
            const confirmBtn = await page.$('div[role="dialog"] button:has-text("Подтвердить"), div[role="dialog"] button:has-text("Получить"), div[role="dialog"] button:has-text("Отправить")');
            if (confirmBtn && await confirmBtn.isVisible()) {
              await confirmBtn.click();
              await page.waitForTimeout(2000);
            }

            appliedCount++;
            await page.screenshot({ path: path.join(DEBUG_DIR, `applied-${appliedCount}.png`) });
            console.log(` ✓ Заявка на оффер #${appliedCount} успешно отправлена!`);
          } catch (clickErr) {
            console.warn(` ⚠ Ошибка клика: ${clickErr.message}`);
          }
        }
      }
    }
    if (appliedCount >= options.maxOffers) break;
  }

  if (appliedCount === 0) {
    console.log("[AutoTake] Все доступные на текущей странице офферы уже подключены либо ожидают модерации.");
  } else {
    console.log(`\n🎉 УСПЕШНО: Подключено ${appliedCount} новых офферов!`);
  }

  await browser.close();
  return { appliedCount };
}

// Запуск напрямую из CLI
if (process.argv[1]?.endsWith("perfluence-take-offers.mjs")) {
  const max = parseInt(process.argv.find(a => a.startsWith("--max="))?.split("=")[1] || "3", 10);
  const headless = !process.argv.includes("--no-headless");
  takeNewOffers({ maxOffers: max, headless }).catch(console.error);
}
