import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function createOgImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px;
        height: 630px;
        background: radial-gradient(circle at 15% 15%, #1f2756 0%, #0b102b 100%);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 60px 70px;
        position: relative;
        overflow: hidden;
      }
      .circle1 {
        position: absolute;
        width: 500px;
        height: 500px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 230, 0, 0.12) 0%, rgba(255, 230, 0, 0) 70%);
        top: -100px;
        right: -100px;
      }
      .circle2 {
        position: absolute;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 77, 77, 0.1) 0%, rgba(255, 77, 77, 0) 70%);
        bottom: -50px;
        left: 200px;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 2;
      }
      .logo-badge {
        background: #FFE600;
        color: #0B102B;
        font-weight: 900;
        font-size: 28px;
        padding: 10px 22px;
        border-radius: 14px;
        letter-spacing: -0.5px;
        box-shadow: 0 4px 20px rgba(255, 230, 0, 0.3);
      }
      .logo-text {
        font-size: 20px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 600;
      }
      .content {
        z-index: 2;
        margin-top: 10px;
      }
      .title {
        font-size: 54px;
        font-weight: 900;
        line-height: 1.18;
        letter-spacing: -1px;
        margin-bottom: 20px;
      }
      .title span {
        color: #FFE600;
      }
      .desc {
        font-size: 24px;
        color: rgba(255, 255, 255, 0.75);
        font-weight: 500;
        max-width: 850px;
        line-height: 1.4;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 2;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        padding-top: 30px;
      }
      .tags {
        display: flex;
        gap: 12px;
      }
      .tag {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        padding: 10px 18px;
        border-radius: 30px;
        font-size: 17px;
        font-weight: 600;
        backdrop-filter: blur(8px);
      }
      .domain {
        font-size: 24px;
        font-weight: 800;
        color: #FFE600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    </style>
  </head>
  <body>
    <div class="circle1"></div>
    <div class="circle2"></div>
    <div class="header">
      <div class="logo-badge">ПРОМОФАКТ</div>
      <div class="logo-text">• Официальный агрегатор скидок</div>
    </div>
    <div class="content">
      <h1 class="title">Экономьте до <span>50%</span> каждый день по проверенным промокодам</h1>
      <p class="desc">Бесплатные промокоды и купоны в доставку еды, супермаркеты, аптеки, одежду и онлайн-кинотеатры.</p>
    </div>
    <div class="footer">
      <div class="tags">
        <div class="tag">🔥 Ежедневные акции</div>
        <div class="tag">🎁 Подарки к заказам</div>
        <div class="tag">🛡 100% рабочие купоны</div>
      </div>
      <div class="domain">promofact.ru ↗</div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html);
  const outPath = path.join(process.cwd(), "public", "og-image.png");
  await page.screenshot({ path: outPath, type: "png" });
  await browser.close();
  console.log(`✓ OG-баннер сгенерирован: public/og-image.png (${fs.statSync(outPath).size} bytes)`);
}

createOgImage().catch(console.error);
