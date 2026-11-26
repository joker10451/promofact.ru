import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BANNERS_DIR = path.join(process.cwd(), "data", "banners");

function escapeBannerHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Генерирует HTML-разметку баннера.
 * Для обычных промокодов (`mode: "promo"`) рисует тикет с кодом;
 * для дайджестов и карточек без промокода (`mode: "editorial"`) — редакционную карточку без фейкового блока «Ваш промокод».
 */
export function buildBannerHtml({
  storeName,
  code,
  bonus,
  bgImageUrl = "",
  badgeText = "🔥 ТОП СКИДКА",
  mode,
  ctaLabel = "Подборка на ПромоФакте",
  ctaHint = "Актуальные условия и сроки в 1 списке",
  ctaPill = "promofact.ru →",
}) {
  const effectiveMode = mode || (code ? "promo" : "editorial");
  const isEditorial = effectiveMode === "editorial";
  const safeStore = escapeBannerHtml(storeName || "ПромоФакт");
  const safeBadge = escapeBannerHtml(badgeText);
  const safeBonus = escapeBannerHtml(bonus);
  const safeCode = escapeBannerHtml(code);
  const safeCtaLabel = escapeBannerHtml(ctaLabel);
  const safeCtaHint = escapeBannerHtml(ctaHint);
  const safeCtaPill = escapeBannerHtml(isEditorial ? (ctaPill || code || "promofact.ru →") : code);

  const bgCss = bgImageUrl
    ? `background-image: url("${escapeBannerHtml(bgImageUrl)}"); background-size: cover; background-position: center;`
    : `background: radial-gradient(circle at 82% 18%, rgba(255, 230, 0, 0.24) 0%, rgba(255, 230, 0, 0) 42%),
                   radial-gradient(circle at 18% 28%, rgba(239, 68, 68, 0.22) 0%, rgba(239, 68, 68, 0) 48%),
                   linear-gradient(145deg, #0b1120 0%, #162033 52%, #0f172a 100%);`;

  const topPill = isEditorial ? safeStore : `🛍 ${safeStore}`;
  const bottomCardHtml = isEditorial
    ? `
    <div class="ticket-card editorial-card">
      <div class="ticket-info">
        <span class="ticket-label">${safeCtaLabel}</span>
        <span class="ticket-hint">${safeCtaHint}</span>
      </div>
      <div class="editorial-pill">${safeCtaPill}</div>
    </div>`
    : `
    <div class="ticket-card">
      <div class="ticket-info">
        <span class="ticket-label">Ваш промокод:</span>
        <span class="ticket-hint">Нажми на код в посте для копирования</span>
      </div>
      <div class="ticket-code">${safeCode}</div>
    </div>`;

  return `
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
      justify-content: ${isEditorial ? "space-between" : "flex-end"};
    }
    .bg {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      ${bgCss}
    }
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
      background-size: 56px 56px;
      pointer-events: none;
    }
    .overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 85% 25%, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.45) 45%, rgba(15, 23, 42, 0.92) 85%),
                  linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0.78) 55%, #0f172a 100%);
    }
    .editorial-hero {
      position: relative;
      z-index: 10;
      padding: 64px 56px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: center;
      gap: 28px;
    }
    .editorial-kicker {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #FFE600;
      margin-top: 24px;
    }
    .editorial-big {
      font-size: 62px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.18;
      max-width: 960px;
      text-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
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
      gap: 16px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.32);
      color: #ffffff;
      padding: 12px 26px;
      border-radius: 50px;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.3px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    }
    .badge-deal {
      background: #ef4444;
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 50px;
      font-size: 21px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
      white-space: nowrap;
    }
    .bonus-title {
      font-size: ${isEditorial ? "36px" : "48px"};
      font-weight: ${isEditorial ? "700" : "900"};
      color: ${isEditorial ? "rgba(255, 255, 255, 0.9)" : "#ffffff"};
      line-height: 1.28;
      text-shadow: 0 4px 16px rgba(0,0,0,0.6);
      max-width: 960px;
    }
    .ticket-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 24px 34px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      border: 3px solid rgba(255, 255, 255, 0.8);
    }
    .ticket-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ticket-label {
      font-size: 19px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.4px;
    }
    .ticket-hint {
      font-size: 25px;
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
    .editorial-pill {
      background: #FFE600;
      color: #0f172a;
      font-size: 30px;
      font-weight: 900;
      padding: 18px 30px;
      border-radius: 16px;
      white-space: nowrap;
      box-shadow: 0 10px 24px rgba(255, 230, 0, 0.25);
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: rgba(255, 255, 255, 0.72);
      font-size: 22px;
      font-weight: 600;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  ${!bgImageUrl ? '<div class="grid-pattern"></div>' : ""}
  <div class="overlay"></div>
  ${
    isEditorial
      ? `<div class="editorial-hero">
    <div class="top-row">
      <div class="brand-pill">${topPill}</div>
      <div class="badge-deal">${safeBadge}</div>
    </div>
    <div class="editorial-kicker">ПРОМОФАКТ • ПОДБОРКА</div>
    <div class="editorial-big">${safeBonus}</div>
  </div>`
      : ""
  }
  <div class="content">
    ${
      isEditorial
        ? ""
        : `<div class="top-row">
      <div class="brand-pill">${topPill}</div>
      <div class="badge-deal">${safeBadge}</div>
    </div>
    <div class="bonus-title">${safeBonus}</div>`
    }
    ${bottomCardHtml}
    <div class="footer">
      <span>📢 @smart_zakupka</span>
      <span>🌐 promofact.ru</span>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Создает сочный брендовый баннер с впечатанным персональным промокодом или редакционный баннер подборки.
 */
export async function generatePromoBanner({
  storeName,
  code,
  bonus,
  bgImageUrl,
  outputPath,
  badgeText = "🔥 ТОП СКИДКА",
  mode,
  ctaLabel,
  ctaHint,
  ctaPill,
}) {
  if (!fs.existsSync(BANNERS_DIR)) {
    fs.mkdirSync(BANNERS_DIR, { recursive: true });
  }

  const safeFileBase = String(storeName || "promofact").replace(/[^a-zA-Z0-9а-яА-Я_-]/g, "_");
  const safeCodePart = String(code || ctaPill || mode || "banner").replace(/[^a-zA-Z0-9а-яА-Я_-]/g, "_");
  const finalPath = outputPath || path.join(BANNERS_DIR, `${safeFileBase}-${safeCodePart}.png`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
    const html = buildBannerHtml({
      storeName,
      code,
      bonus,
      bgImageUrl,
      badgeText,
      mode,
      ctaLabel,
      ctaHint,
      ctaPill,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: finalPath, type: "png" });
    return finalPath;
  } finally {
    await browser.close();
  }
}
