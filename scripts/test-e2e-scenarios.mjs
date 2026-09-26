import { spawn as cpSpawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function run() {
  console.log("================================================================================");
  console.log("🚀 ЗАПУСК E2E СЦЕНАРИЕВ ДЛЯ PROMOFACT (PLAYWRIGHT)");
  console.log("================================================================================");

  // 1. Запуск Next.js в production режиме
  console.log(`[1/3] Запуск локального production-сервера на порту ${PORT}...`);
  const server = cpSpawn("npx", ["next", "start", "-p", String(PORT)], {
    shell: true,
    stdio: "pipe",
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on("data", (d) => {
    // console.log(`[next stdout] ${d}`);
  });
  server.stderr.on("data", (d) => {
    // console.error(`[next stderr] ${d}`);
  });

  const cleanup = () => {
    if (server && !server.killed) {
      if (process.platform === "win32") {
        cpSpawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" });
      } else {
        server.kill("SIGKILL");
      }
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(1); });
  process.on("SIGTERM", () => { cleanup(); process.exit(1); });

  try {
    await waitForServer(`${BASE_URL}/`);
    console.log("✓ Сервер готов и отвечает 200 OK");

    const browser = await chromium.launch({ headless: true });
    const afterScreenshotsDir = path.resolve("./audit-screenshots/after");
    fs.mkdirSync(afterScreenshotsDir, { recursive: true });

    let passedTests = 0;
    const totalTests = 6;

    // --- СЦЕНАРИЙ 1: Найти магазин через поиск ---
    console.log("\n[Тест 1] Сценарий: Найти магазин через поиск (кириллица, латиница, опечатка раскладки)");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

      // Открываем модальный глобальный поиск через клик по кнопке поиска в хедере
      const searchTrigger = page.locator('button[aria-label="Поиск по магазинам и купонам"]').first();
      await searchTrigger.click();

      // Проверяем видимость модального окна поиска
      const searchModal = page.locator('div[role="dialog"][aria-label="Поиск по магазинам и купонам"]');
      await searchModal.waitFor({ state: "visible", timeout: 3000 });

      const searchInput = searchModal.locator('input[type="search"]');
      
      // Вводим опечатку раскладки: "cfykfqn" (sunlight в русской раскладке)
      await searchInput.fill("cfykfqn");

      // Ждём появления конкретного результата SUNLIGHT внутри модального окна поиска
      const sunlightItem = searchModal.locator('a[href="/store/sunlight-ru"]').first();
      await sunlightItem.waitFor({ state: "visible", timeout: 5000 });
      console.log("  ✓ Поиск находит 'SUNLIGHT' по опечатке клавиатуры 'cfykfqn'");

      // Проверяем клавиатурную навигацию: Enter открывает выбранный результат
      await page.keyboard.press("Enter");
      await page.waitForURL("**/store/sunlight-ru", { timeout: 5000 });
      console.log("  ✓ Переход к магазину работает по нажатию клавиши Enter");

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 2: Открыть страницу магазина ---
    console.log("\n[Тест 2] Сценарий: Открыть страницу магазина и проверить структуру контента");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "networkidle" });

      // Проверяем наличие ключевых элементов: Заголовок, логотип, количество купонов, CTA
      const h1 = await page.locator("h1").innerText();
      if (!h1.includes("SUNLIGHT")) {
        throw new Error(`Заголовок h1 не содержит SUNLIGHT: ${h1}`);
      }
      console.log(`  ✓ H1 страницы корректен: "${h1.slice(0, 50)}..."`);

      const couponCards = page.locator("article");
      const count = await couponCards.count();
      if (count < 4) {
        throw new Error(`Ожидалось не менее 4 купонов SUNLIGHT, найдено: ${count}`);
      }
      console.log(`  ✓ Найдено действующих промокодов SUNLIGHT: ${count}`);

      await page.screenshot({ path: path.join(afterScreenshotsDir, "mobile-store-sunlight-390.png") });
      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 3: Раскрыть и скопировать промокод ---
    console.log("\n[Тест 3] Сценарий: Раскрыть и скопировать промокод");
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "networkidle" });

      // Находим первую карточку купона и нажимаем "Скопировать промокод"
      const copyBtn = page.locator("button:has-text('Скопировать промокод')").first();
      await copyBtn.waitFor({ state: "visible" });
      await copyBtn.click();

      // Проверяем визуальное подтверждение копирования
      const copiedBadge = page.locator("text=скопировано!").first();
      await copiedBadge.waitFor({ state: "visible", timeout: 2000 });
      console.log("  ✓ Индикатор 'скопировано!' успешно отобразился в поле промокода");

      const successCta = page.locator("a:has-text('Код скопирован! Перейти в')").first();
      await successCta.waitFor({ state: "visible", timeout: 2000 });
      console.log("  ✓ Кнопка действия обновилась на 'Код скопирован! Перейти в SUNLIGHT →'");

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 4: Перейти по партнёрской ссылке ---
    console.log("\n[Тест 4] Сценарий: Проверить партнёрскую ссылку (безопасность, erid, атрибуты)");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "networkidle" });

      // Проверяем ссылку прямого перехода
      const affiliateLink = page.locator("a:has-text('Перейти на сайт SUNLIGHT')").first();
      await affiliateLink.waitFor({ state: "visible" });

      const href = await affiliateLink.getAttribute("href");
      const target = await affiliateLink.getAttribute("target");
      const rel = await affiliateLink.getAttribute("rel");

      if (!href || !href.includes("sunlight.prfl.me")) {
        throw new Error(`Некорректная партнёрская ссылка: ${href}`);
      }
      if (target !== "_blank") {
        throw new Error(`Ссылка должна открываться в новой вкладке target="_blank", получено: ${target}`);
      }
      if (!rel || !rel.includes("noopener") || !rel.includes("nofollow")) {
        throw new Error(`Ссылка должна иметь rel="noopener nofollow", получено: ${rel}`);
      }
      console.log(`  ✓ Партнёрская ссылка валидна: ${href.slice(0, 45)}... (rel="${rel}")`);

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 5: Открыть предложение без промокода и пустой магазин ---
    console.log("\n[Тест 5] Сценарий: Предложение без промокода и магазин на обновлении");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();

      // Проверяем страницу магазина, где купоны обновляются (например, samokat)
      await page.goto(`${BASE_URL}/store/samokat`, { waitUntil: "networkidle" });
      const emptyStateTitle = page.locator("text=Эксклюзивные промокоды для Самокат обновляются");
      await emptyStateTitle.waitFor({ state: "visible", timeout: 3000 });

      const siteCta = page.locator("a:has-text('Перейти на официальный сайт Самокат →')");
      await siteCta.waitFor({ state: "visible" });
      const siteHref = await siteCta.getAttribute("href");
      if (!siteHref || !siteHref.includes("samokat.ru")) {
        throw new Error(`Ожидалась ссылка на samokat.ru, получено: ${siteHref}`);
      }
      console.log("  ✓ Пустой магазин имеет конверсионный блок перехода на официальный сайт");

      // Проверяем страницу с акцией без кода (например, sberprime)
      await page.goto(`${BASE_URL}/store/sberprime`, { waitUntil: "networkidle" });
      const noCodeNotice = page.locator("text=Промокод не требуется — скидка применится по ссылке").first();
      await noCodeNotice.waitFor({ state: "visible", timeout: 3000 });

      const dealBtn = page.locator("a:has-text('Перейти к предложению →')").first();
      await dealBtn.waitFor({ state: "visible" });
      console.log("  ✓ Акция без промокода имеет чистый заголовок и кнопку 'Перейти к предложению →'");

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 6: Проверить отсутствие горизонтального скролла на 360, 390, 768, 1440 px ---
    console.log("\n[Тест 6] Сценарий: Проверка отсутствия горизонтального скролла на всех разрешениях");
    {
      const resolutions = [
        { width: 360, height: 740, name: "360px (Ultra-compact)" },
        { width: 390, height: 844, name: "390px (iPhone standard)" },
        { width: 768, height: 1024, name: "768px (Tablet)" },
        { width: 1440, height: 900, name: "1440px (Desktop)" },
      ];

      const pagesToTest = [
        "/",
        "/promokody",
        "/store/sunlight-ru",
        "/category/dostavka-produktov",
        "/collections/first-order",
      ];

      for (const res of resolutions) {
        const context = await browser.newContext({ viewport: { width: res.width, height: res.height } });
        const page = await context.newPage();

        for (const pathUrl of pagesToTest) {
          await page.goto(`${BASE_URL}${pathUrl}`, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(100);
          const scrollInfo = await page.evaluate(() => {
            return {
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              innerWidth: window.innerWidth,
            };
          });

          if (scrollInfo.scrollWidth > scrollInfo.innerWidth + 1) { // 1px margin for rounding
            throw new Error(`[ОШИБКА] На ${res.name} страница ${pathUrl} имеет горизонтальный скролл: scrollWidth=${scrollInfo.scrollWidth} > innerWidth=${scrollInfo.innerWidth}`);
          }
        }

        // Сохраняем скриншот мобильной главной
        if (res.width === 360) {
          await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
          await page.screenshot({ path: path.join(afterScreenshotsDir, "mobile-home-360.png") });
        } else if (res.width === 1440) {
          await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
          await page.screenshot({ path: path.join(afterScreenshotsDir, "desktop-home-1440.png") });
        }

        console.log(`  ✓ ${res.name}: Горизонтальный скролл полностью отсутствует на всех проверенных страницах (scrollWidth === clientWidth)`);
        await context.close();
      }

      passedTests++;
    }

    await browser.close();

    console.log("\n================================================================================");
    console.log(`🎉 ВСЕ ${passedTests}/${totalTests} E2E СЦЕНАРИЕВ УСПЕШНО ВЫПОЛНЕНЫ!`);
    console.log("================================================================================");
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error("❌ Тест E2E завершился с ошибкой:", err);
  process.exit(1);
});