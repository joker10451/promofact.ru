import { spawn as cpSpawn, execSync } from "node:child_process";
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

let server = null;
const isWin = process.platform === "win32";

const cleanup = () => {
  if (server) {
    if (isWin) {
      try {
        cpSpawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" });
      } catch {}
    } else {
      try {
        process.kill(-server.pid, "SIGKILL");
      } catch {
        try {
          server.kill("SIGKILL");
        } catch {}
      }
    }
  }
};

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(1); });
process.on("SIGTERM", () => { cleanup(); process.exit(1); });

async function run() {
  console.log("================================================================================");
  console.log("🚀 ЗАПУСК РАСШИРЕННЫХ E2E СЦЕНАРИЕВ ДЛЯ PROMOFACT (PLAYWRIGHT)");
  console.log("================================================================================");

  console.log(`[1/3] Запуск локального production-сервера на порту ${PORT}...`);
  if (isWin) {
    try {
      execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${PORT}') do taskkill /f /pid %a`, { stdio: "ignore", shell: "cmd.exe" });
    } catch {}
    server = cpSpawn("npx", ["next", "start", "-p", String(PORT)], {
      shell: true,
      stdio: "ignore",
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT) },
    });
  } else {
    server = cpSpawn("npx", ["next", "start", "-p", String(PORT)], {
      stdio: "ignore",
      cwd: process.cwd(),
      detached: true,
      env: { ...process.env, PORT: String(PORT) },
    });
  }

  try {
    await waitForServer(`${BASE_URL}/`);
    // Прогрев динамического API поиска для исключения задержек холодного старта в CI
    await fetch(`${BASE_URL}/api/search?q=sunlight`).catch(() => {});
    console.log("✓ Сервер готов и отвечает 200 OK");

    const browser = await chromium.launch({ headless: true });
    const afterScreenshotsDir = path.resolve("./audit-screenshots/after");
    fs.mkdirSync(afterScreenshotsDir, { recursive: true });

    let passedTests = 0;
    const totalTests = 9;

    // --- СЦЕНАРИЙ 1: Найти магазин через поиск (раскладка, транслит) ---
    console.log("\n[Тест 1] Сценарий: Найти магазин через поиск (опечатка раскладки, транслит, клавиатура)");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

      const searchTrigger = page.locator('button[aria-label="Поиск по магазинам и купонам"]').first();
      await searchTrigger.click();

      const searchModal = page.locator('div[role="dialog"][aria-label="Поиск по магазинам и купонам"]');
      await searchModal.waitFor({ state: "visible", timeout: 5000 });

      const searchInput = searchModal.locator('input[type="search"]');
      await searchInput.waitFor({ state: "visible", timeout: 3000 });
      // Вводим опечатку раскладки: "cfykfqn" (sunlight в русской раскладке)
      await searchInput.fill("cfykfqn");

      const sunlightItem = searchModal.locator('a[href="/store/sunlight-ru"]').first();
      await sunlightItem.waitFor({ state: "visible", timeout: 10000 });
      console.log("  ✓ Поиск находит 'SUNLIGHT' по опечатке клавиатуры 'cfykfqn'");

      // Проверяем клавиатурную навигацию: Enter открывает выбранный результат
      await page.keyboard.press("Enter");
      await page.waitForURL("**/store/sunlight-ru", { timeout: 5000 });
      console.log("  ✓ Переход к магазину работает по нажатию клавиши Enter");

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 2: Быстрый ввод нескольких запросов (AbortController & Race Conditions) ---
    console.log("\n[Тест 2] Сценарий: Защита от гонок запросов (AbortController) при быстром вводе");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: "load" });

      // Открываем модалку поиска по Cmd/Ctrl+K
      const searchModal = page.locator('div[role="dialog"][aria-label="Поиск по магазинам и купонам"]');
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Control+K");
        try {
          await searchModal.waitFor({ state: "visible", timeout: 800 });
          break;
        } catch {}
      }
      await searchModal.waitFor({ state: "visible", timeout: 2000 });

      const searchInput = searchModal.locator('input[type="search"]');
      
      // Имитируем частую смену запросов
      await searchInput.fill("sam");
      await page.waitForTimeout(40);
      await searchInput.fill("samokat");
      await page.waitForTimeout(40);
      await searchInput.fill("");
      await page.waitForTimeout(40);
      await searchInput.fill("sunlight");

      // Ждём результатов и убеждаемся, что устаревший ответ samokat не перезаписал sunlight
      await page.waitForTimeout(400);
      const sunlightResult = searchModal.locator('a[href="/store/sunlight-ru"]').first();
      await sunlightResult.waitFor({ state: "visible", timeout: 4000 });
      
      const samokatResult = searchModal.locator('a[href="/store/samokat"]').first();
      const hasSamokat = await samokatResult.isVisible();
      if (hasSamokat) {
        throw new Error("Устаревший запрос перезаписал актуальные результаты поиска!");
      }
      console.log("  ✓ AbortController предотвратил гонку запросов: отображаются только актуальные результаты");

      // Проверяем закрытие по Escape и возврат фокуса
      await page.keyboard.press("Escape");
      await searchModal.waitFor({ state: "hidden", timeout: 2000 });
      console.log("  ✓ Закрытие модального окна поиска по клавише Escape работает корректно");

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 3: Безопасная аналитика (отсутствие raw query в Яндекс.Метрике) ---
    console.log("\n[Тест 3] Сценарий: Безопасность аналитики (отсутствие передачи поисковых строк и промокодов)");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();

      // Мокируем window.ym для перехвата всех вызовов Метрики
      await page.addInitScript(() => {
        window.__ym_calls = [];
        window.ym = (id, method, goal, params) => {
          window.__ym_calls.push({ id, method, goal, params });
        };
      });

      await page.goto(`${BASE_URL}/`, { waitUntil: "load" });

      // Открываем поиск и вводим запрос с чувствительными словами
      const searchTrigger = page.locator('button[aria-label="Поиск по магазинам и купонам"]').first();
      await searchTrigger.waitFor({ state: "visible" });

      const searchModal = page.locator('div[role="dialog"][aria-label="Поиск по магазинам и купонам"]');
      for (let i = 0; i < 5; i++) {
        await searchTrigger.click();
        try {
          await searchModal.waitFor({ state: "visible", timeout: 800 });
          break;
        } catch {}
      }

      const searchInput = searchModal.locator('input[type="search"]');
      await searchInput.waitFor({ state: "visible", timeout: 2000 });
      const testSecretQuery = "секретный_запрос_12345";
      await searchInput.fill(testSecretQuery);
      // Ждём debounce 200ms и выполнения запроса
      await page.waitForFunction(
        () => (window.__ym_calls || []).some((c) => c.goal === "search_used"),
        { timeout: 4000 }
      );

      // Проверяем перехваченные вызовы Метрики
      const ymCalls = await page.evaluate(() => window.__ym_calls || []);
      const leakedCalls = ymCalls.filter((c) => {
        const json = JSON.stringify(c.params || {});
        return json.includes("секретный_запрос") || json.includes(testSecretQuery);
      });

      if (leakedCalls.length > 0) {
        throw new Error(`Обнаружена утечка сырой поисковой строки в Метрику: ${JSON.stringify(leakedCalls)}`);
      }

      const searchUsedEvents = ymCalls.filter((c) => c.goal === "search_used");
      if (searchUsedEvents.length === 0) {
        throw new Error("Событие search_used не было отправлено!");
      }
      console.log(`  ✓ Событие search_used отправлено безопасно (без raw query): ${JSON.stringify(searchUsedEvents[0].params)}`);

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 4: Достоверное копирование промокода (проверка буфера) ---
    console.log("\n[Тест 4] Сценарий: Достоверное копирование промокода в системный буфер обмена");
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "load" });

      // Находим первую карточку купона
      const firstCard = page.locator("article").first();
      const codeElement = firstCard.locator('div[role="button"] span.truncate');
      const expectedCode = (await codeElement.innerText()).trim();

      const copyBtn = firstCard.locator("button:has-text('Скопировать промокод')");
      await copyBtn.waitFor({ state: "visible" });
      await copyBtn.click();

      // Проверяем статус в карточке
      const copiedBadge = firstCard.locator("text=скопировано!");
      await copiedBadge.waitFor({ state: "visible", timeout: 2000 });

      // Считываем реальное содержимое буфера обмена через Clipboard API
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      if (clipboardContent !== expectedCode) {
        throw new Error(`Буфер обмена не совпадает: ожидался "${expectedCode}", получен "${clipboardContent}"`);
      }
      console.log(`  ✓ Фактический буфер обмена подтверждён: "${clipboardContent}"`);

      // Проверяем, что Toast НЕ утверждает «Магазин открыт»
      const toastStatus = page.locator('div[role="status"]');
      const toastText = await toastStatus.innerText();
      if (toastText.includes("Магазин открыт")) {
        throw new Error(`Тост ошибочно утверждает, что магазин открыт, хотя перехода не было: ${toastText}`);
      }
      console.log("  ✓ Уведомление честно сообщает о копировании без ложного утверждения об открытии магазина");

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 5: Отказ доступа к Clipboard API (ручное выделение) ---
    console.log("\n[Тест 5] Сценарий: Обработка отказа доступа к Clipboard API (Fallback ручного копирования)");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();

      // Имитируем отказ Clipboard API (браузер заблокировал доступ или ошибка прав)
      await page.addInitScript(() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText = () => Promise.reject(new Error("Permission denied by user"));
        }
      });

      await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "load" });

      const firstCard = page.locator("article").first();
      const copyBtn = firstCard.locator("button:has-text('Скопировать промокод')");
      await copyBtn.click();

      // Убеждаемся, что фиктивный статус "скопировано!" НЕ отобразился
      const fakeSuccess = await firstCard.locator("text=скопировано!").isVisible();
      if (fakeSuccess) {
        throw new Error("Отобразился статус успешного копирования при ошибке Clipboard API!");
      }

      // Проверяем появление плашки с ручным выделением кода
      const fallbackAlert = firstCard.locator('div[role="alert"]');
      await fallbackAlert.waitFor({ state: "visible", timeout: 2000 });
      
      const manualInput = fallbackAlert.locator('input[aria-label="Промокод для ручного копирования"]');
      await manualInput.waitFor({ state: "visible" });
      const val = await manualInput.inputValue();
      if (!val) {
        throw new Error("Поле ручного выделения промокода пустое!");
      }
      console.log(`  ✓ При отказе буфера успешно показан блок ручного копирования с кодом: "${val}"`);

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 6: Расположение помощника и основных CTA без перекрытия ---
    console.log("\n[Тест 6] Сценарий: Проверка расположения помощника (ChatHelper) на 360 и 390 px");
    {
      const mobileResolutions = [
        { width: 360, height: 740, name: "360px" },
        { width: 390, height: 844, name: "390px" },
      ];

      for (const res of mobileResolutions) {
        const context = await browser.newContext({ viewport: { width: res.width, height: res.height } });
        const page = await context.newPage();
        await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "load" });

        const helperBtn = page.locator('button[aria-label="Открыть помощника"]');
        await helperBtn.waitFor({ state: "visible" });
        const helperBox = await helperBtn.boundingBox();

        const firstCopyBtn = page.locator("button:has-text('Скопировать промокод')").first();
        const copyBox = await firstCopyBtn.boundingBox();

        // Проверяем, что кнопка помощника прижата к правому краю (right-0)
        if (helperBox.x + helperBox.width < res.width - 2) {
          throw new Error(`На ${res.name} кнопка помощника не прижата к правому краю экрана: x=${helperBox.x}, w=${helperBox.width}`);
        }

        // Проверяем, что горизонтально помощник не перекрывает центр CTA кнопки
        const copyBtnCenter = copyBox.x + copyBox.width / 2;
        if (helperBox.x <= copyBtnCenter) {
          throw new Error(`На ${res.name} помощник перекрывает центр интерактивной кнопки CTA: helper.x=${helperBox.x}, btnCenter=${copyBtnCenter}`);
        }

        // Проверяем поведение при открытой виртуальной клавиатуре / фокусе на поиске
        await page.evaluate(() => {
          // Имитируем фокус в поле ввода
          const input = document.createElement("input");
          document.body.appendChild(input);
          input.focus();
        });
        await page.waitForTimeout(150);

        const isHiddenOnKeyboard = await helperBtn.isHidden();
        if (!isHiddenOnKeyboard) {
          throw new Error(`На ${res.name} помощник не скрылся при активном поле ввода / виртуальной клавиатуре!`);
        }
        console.log(`  ✓ ${res.name}: Помощник прижат к краю (не перекрывает CTA) и корректно скрывается при открытии клавиатуры`);

        await context.close();
      }

      passedTests++;
    }

    // --- СЦЕНАРИЙ 7: Проверка партнёрских ссылок и условий без покупок ---
    console.log("\n[Тест 7] Сценарий: Проверка партнёрских ссылок, erid и предложений без промокодов");
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "load" });

      const affiliateLink = page.locator("a:has-text('Перейти на сайт SUNLIGHT')").first();
      await affiliateLink.waitFor({ state: "visible" });

      const href = await affiliateLink.getAttribute("href");
      const target = await affiliateLink.getAttribute("target");
      const rel = await affiliateLink.getAttribute("rel");

      if (!href || !href.includes("sunlight.prfl.me")) {
        throw new Error(`Некорректная партнёрская ссылка: ${href}`);
      }
      if (target !== "_blank") {
        throw new Error(`target="_blank" обязателен: ${target}`);
      }
      if (!rel || !rel.includes("noopener") || !rel.includes("nofollow")) {
        throw new Error(`rel="noopener nofollow" обязателен: ${rel}`);
      }
      console.log(`  ✓ Партнёрская ссылка проверена без совершения заказа: ${href.slice(0, 45)}...`);

      // Проверяем страницу с предложением без промокода
      await page.goto(`${BASE_URL}/store/sberprime`, { waitUntil: "load" });
      const noCodeBadge = page.locator("text=Промокод не требуется — скидка применится по ссылке").first();
      await noCodeBadge.waitFor({ state: "visible", timeout: 3000 });
      console.log("  ✓ Предложения без промокодов корректно маркированы бейджем без имитации кода");

      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 8: Совмещённое действие «Скопировать и перейти» (новая вкладка и буфер) ---
    console.log("\n[Тест 8] Сценарий: Совмещённое действие (копирование промокода и открытие в новой вкладке)");
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ["clipboard-read", "clipboard-write"],
      });
      // Изолируем внешние партнерские сети от реальных покупок и задержек DNS/SSL
      await context.route("**/*prfl.me/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Partner Offer Landing</body></html>" })
      );
      await context.route("**/*sunlight*/**", (route) => {
        if (route.request().url().includes("localhost")) {
          return route.continue();
        }
        return route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Sunlight Partner Landing</body></html>" });
      });

      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__ym_calls = [];
        window.ym = (id, method, goal, params) => {
          window.__ym_calls.push({ id, method, goal, params });
        };
      });
      await page.goto(`${BASE_URL}/store/sunlight-ru`, { waitUntil: "load" });

      const firstCard = page.locator("article").first();
      await firstCard.waitFor({ state: "visible" });

      // Открываем модальное окно деталей/условий купона
      const detailsBtn = firstCard.locator("button:has-text('Условия акции')");
      await detailsBtn.click();

      // Ожидаем появление модального окна деталей в DOM (через createPortal)
      const modal = page.locator("div[role='dialog']").last();
      await modal.waitFor({ state: "visible", timeout: 4000 });
      const copyAndOpenBtn = modal.locator("button:has-text('Скопировать'), a:has-text('Скопировать')").first();
      await copyAndOpenBtn.waitFor({ state: "visible", timeout: 3000 });

      // Ожидаем открытие новой вкладки непосредственно при клике (без блокировки браузером)
      const [newPage] = await Promise.all([
        context.waitForEvent("page", { timeout: 5000 }),
        copyAndOpenBtn.click(),
      ]);

      // Проверяем, что в новой вкладке открылся партнёрский URL
      const openedUrl = newPage.url();
      if (!openedUrl.includes("prfl.me") && !openedUrl.includes("sunlight")) {
        throw new Error(`В новой вкладке открылся некорректный URL: ${openedUrl}`);
      }
      console.log(`  ✓ Партнёрская ссылка успешно открыта в новой вкладке: ${openedUrl.slice(0, 45)}...`);

      // Проверяем факт копирования промокода в системный буфер обмена
      await page.waitForTimeout(300);
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      if (!clipboardText || clipboardText.length < 3) {
        throw new Error(`Промокод не был скопирован в буфер при совмещённом действии: "${clipboardText}"`);
      }
      console.log(`  ✓ Промокод успешно скопирован в буфер при совмещённом действии: "${clipboardText}"`);

      // Проверяем тост со статусом «Магазин открывается»
      const toastStatus = page.locator('div[role="status"]');
      await toastStatus.waitFor({ state: "visible", timeout: 3000 });
      const toastText = await toastStatus.innerText();
      if (!toastText.toLowerCase().includes("магазин открывается")) {
        throw new Error(`Ожидался статус 'Магазин открывается', получено: "${toastText}"`);
      }
      console.log(`  ✓ Тост честно подтвердил открытие магазина: "${toastText.split("\n")[0]}"`);

      // Проверяем фиксацию цели Яндекс.Метрики для совмещённого действия
      const ymCalls = await page.evaluate(() => window.__ym_calls || []);
      const copyAndOpenEvents = ymCalls.filter((c) => c.goal === "copy_and_open");
      if (copyAndOpenEvents.length === 0) {
        throw new Error("Цель copy_and_open не была отправлена в Яндекс.Метрику!");
      }
      console.log(`  ✓ Метрика зафиксировала цель 'copy_and_open': ${JSON.stringify(copyAndOpenEvents[0].params)}`);

      await newPage.close();
      await context.close();
      passedTests++;
    }

    // --- СЦЕНАРИЙ 9: Проверка отсутствия горизонтального скролла на всех разрешениях ---
    console.log("\n[Тест 9] Сценарий: Полный контроль отсутствия горизонтального скролла (360, 390, 768, 1440 px)");
    {
      const resolutions = [
        { width: 360, height: 740, name: "360px" },
        { width: 390, height: 844, name: "390px" },
        { width: 768, height: 1024, name: "768px" },
        { width: 1440, height: 900, name: "1440px" },
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
          await page.waitForTimeout(50);
          const scrollInfo = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            innerWidth: window.innerWidth,
          }));

          if (scrollInfo.scrollWidth > scrollInfo.innerWidth + 1) {
            throw new Error(`[ОШИБКА] На ${res.name} страница ${pathUrl} имеет горизонтальный скролл: scrollWidth=${scrollInfo.scrollWidth} > innerWidth=${scrollInfo.innerWidth}`);
          }
        }

        console.log(`  ✓ ${res.name}: Горизонтальный скролл отсутствует на всех страницах (scrollWidth === clientWidth)`);
        await context.close();
      }

      passedTests++;
    }

    await browser.close();

    console.log("\n================================================================================");
    console.log(`🎉 ВСЕ ${passedTests}/${totalTests} РАСШИРЕННЫХ E2E СЦЕНАРИЕВ УСПЕШНО ВЫПОЛНЕНЫ!`);
    console.log("================================================================================");
  } finally {
    cleanup();
  }
}

run()
  .then(() => {
    cleanup();
    process.exit(0);
  })
  .catch((err) => {
    cleanup();
    console.error("❌ Тест E2E завершился с ошибкой:", err);
    process.exit(1);
  });