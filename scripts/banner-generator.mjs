import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BANNERS_DIR = path.join(process.cwd(), "data", "banners");

/**
 * Создает сочный брендовый баннер с впечатанным персональным промокодом блогера.
 */
export async function generatePromoBanner({
  storeName,
  code,
  bonus,
  bgImageUrl,
  outputPath
}) {
  if (!fs.existsSync(BANNERS_DIR)) {
    fs.mkdirSync(BANNERS_DIR, { recursive: true });
  }

  const finalPath = outputPath || path.join(BANNERS_DIR, `${storeName.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, "_")}-${code}.png`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body {
      width: 1080px;
      height: 1080px;
      position: relative;
      background: #0f172a;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .bg {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("${bgImageUrl || ''}");
      background-size: cover;
      background-position: center;
    }
    .overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 85% 25%, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.5) 45%, rgba(15, 23, 42, 0.95) 80%),
                  linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 50%, #0f172a 100%);
    }
    .content {
      position: relative;
      z-index: 10;
      padding: 44px 50px 48px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.98) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-top: 1.5px solid rgba(255, 255, 255, 0.2);
      border-radius: 36px 36px 0 0;
      box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.6);
    }
    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #ffffff;
      padding: 12px 28px;
      border-radius: 50px;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 0.5px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .badge-deal {
      background: #ef4444;
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 50px;
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
    .bonus-title {
      font-size: 48px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.25;
      text-shadow: 0 4px 16px rgba(0,0,0,0.8);
      max-width: 960px;
    }
    .ticket-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 24px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      border: 3px solid rgba(255, 255, 255, 0.8);
    }
    .ticket-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ticket-label {
      font-size: 20px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .ticket-hint {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
    }
    .ticket-code {
      background: #f8fafc;
      border: 3px dashed #3b82f6;
      color: #1d4ed8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 46px;
      font-weight: 900;
      padding: 14px 32px;
      border-radius: 18px;
      letter-spacing: 3px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: rgba(255, 255, 255, 0.7);
      font-size: 22px;
      font-weight: 600;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="overlay"></div>
  <div class="content">
    <div class="top-row">
      <div class="brand-pill">🛍 ${storeName}</div>
      <div class="badge-deal">🔥 ТОП СКИДКА</div>
    </div>
    <div class="bonus-title">${bonus}</div>
    <div class="ticket-card">
      <div class="ticket-info">
        <span class="ticket-label">Ваш промокод:</span>
        <span class="ticket-hint">Нажми на код в посте для копирования</span>
      </div>
      <div class="ticket-code">${code}</div>
    </div>
    <div class="footer">
      <span>📢 @smart_zakupka</span>
      <span>🌐 promofact.ru</span>
    </div>
  </div>
</body>
</html>
`;

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: finalPath, type: "png" });
  await browser.close();
  return finalPath;
}
