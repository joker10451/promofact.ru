import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3457;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runVisualCheck() {
  console.log("=== ВИЗУАЛЬНЫЙ ТЕСТ: SberZdorovie Pregnancy Creative ===");

  fs.mkdirSync("screenshots", { recursive: true });

  console.log(`[1/4] Запуск next start на порту ${PORT}...`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.on("data", (d) => {
    // console.log("[server]", d.toString().trim());
  });
  server.stderr.on("data", (d) => {
    // console.error("[server err]", d.toString().trim());
  });

  // Ждем готовности сервера
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE_URL}/store/sberzdorovie`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    server.kill();
    throw new Error("Сервер не ответил за 20 секунд.");
  }
  console.log("✓ Сервер готов");

  const browser = await chromium.launch({ headless: true });

  try {
    // ДЕСКТОП: 1280x800
    console.log("[2/4] Проверка Desktop (1280x800)...");
    const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await desktopPage.goto(`${BASE_URL}/store/sberzdorovie`, { waitUntil: "domcontentloaded" });

    // Проверяем наличие баннера и креатива
    const banner = desktopPage.locator('aside[aria-label="Реклама"]');
    await banner.waitFor({ state: "visible" });

    const creativeImg = banner.locator('img[src*="sberzdorovie-pregnancy-30.png"]');
    await creativeImg.waitFor({ state: "visible" });

    // Проверяем горизонтальный скролл
    const hasHScrollDesktop = await desktopPage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log("Desktop horizontal scroll:", hasHScrollDesktop ? "DETECTED!" : "NONE (PASS)");
    if (hasHScrollDesktop) throw new Error("Обнаружен горизонтальный скролл на десктопе!");

    // Проверяем кликабельность ссылки в тексте
    const affiliateLink = banner.locator('a[href*="sberanalizy.prfl.me/sites/jhtq64"]');
    const linkCount = await affiliateLink.count();
    console.log("Desktop affiliate links found:", linkCount);
    if (linkCount < 2) throw new Error("Ожидалось минимум 2 ссылки: изображение и текстовая ссылка");

    // Делаем скриншот баннера и всей видимой области
    const desktopScreenshotPath = path.resolve("screenshots/sberzdorovie-desktop.png");
    await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log("✓ Desktop screenshot saved:", desktopScreenshotPath);

    // МОБАЙЛ: 390x844
    console.log("[3/4] Проверка Mobile (390x844)...");
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(`${BASE_URL}/store/sberzdorovie`, { waitUntil: "domcontentloaded" });

    const mobileBanner = mobilePage.locator('aside[aria-label="Реклама"]');
    await mobileBanner.waitFor({ state: "visible" });

    const mobileCreativeImg = mobileBanner.locator('img[src*="sberzdorovie-pregnancy-30.png"]');
    await mobileCreativeImg.waitFor({ state: "visible" });

    // Проверяем горизонтальный скролл
    const hasHScrollMobile = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log("Mobile horizontal scroll:", hasHScrollMobile ? "DETECTED!" : "NONE (PASS)");
    if (hasHScrollMobile) throw new Error("Обнаружен горизонтальный скролл на мобильном!");

    const mobileScreenshotPath = path.resolve("screenshots/sberzdorovie-mobile.png");
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log("✓ Mobile screenshot saved:", mobileScreenshotPath);

    console.log("[4/4] Визуальный аудит успешно завершен!");
  } finally {
    await browser.close();
    server.kill();
  }
}

runVisualCheck().catch((err) => {
  console.error("Ошибка визуального теста:", err);
  process.exit(1);
});
