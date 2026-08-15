import { ARTICLES } from "@/lib/articles";
import { getCoupons } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 1800; // 30 минут

function escapeXml(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const coupons = await getCoupons();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Формируем посты из свежих промокодов
  const couponItems = coupons.slice(0, 20).map((c, i) => {
    const url = `${SITE_URL}/store/${c.store.slug}/${encodeURIComponent(c.promocode.code)}`;
    const pubDate = new Date(now - i * 3600 * 1000).toUTCString();
    
    const bodyHtml = `
      <p>🔥 Свежий промокод и скидка в <strong>${escapeXml(c.store.name)}</strong>!</p>
      <p><strong>Условия:</strong> ${escapeXml(c.promocode.bonusName || "Скидка по промокоду")}</p>
      ${c.promocode.terms ? `<p>${escapeXml(c.promocode.terms)}</p>` : ""}
      <p>🎟 Промокод: <code><strong>${escapeXml(c.promocode.code)}</strong></code></p>
      <p>👉 <a href="${escapeXml(url)}">Скопировать промокод и перейти к покупкам на ПромоФакт</a></p>
      ${c.affiliate.ordText ? `<p style="font-size: 11px; color: #888;">${escapeXml(c.affiliate.ordText)}</p>` : ""}
    `;

    const enclosureTag = c.store.logo
      ? `\n      <enclosure url="${escapeXml(c.store.logo)}" type="image/png" />`
      : "";

    return `    <item>
      <title>${escapeXml(c.store.name)}: промокод ${escapeXml(c.promocode.code)} — ${escapeXml(c.promocode.bonusName || "Скидка")}</title>
      <link>${escapeXml(url)}</link>
      <pdalink>${escapeXml(url)}</pdalink>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(c.store.category)}</category>${enclosureTag}
      <description><![CDATA[${bodyHtml}]]></description>
      <content:encoded><![CDATA[${bodyHtml}]]></content:encoded>
    </item>`;
  });

  // 2. Формируем полнотекстовые полезные статьи из раздела /sovety
  const articleItems = ARTICLES.slice(0, 10).map((a, i) => {
    const url = `${SITE_URL}/sovety/${a.slug}`;
    const pubDate = new Date(now - (i + 1) * dayMs).toUTCString();
    
    const fullArticleHtml = `
      <h2>${escapeXml(a.title)}</h2>
      <p><em>${escapeXml(a.description)}</em></p>
      ${a.body.map((p) => `<p>${escapeXml(p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"))}</p>`).join("\n")}
      <p>Больше проверенных промокодов и актуальных скидок читайте на сайте <a href="${SITE_URL}">ПромоФакт</a>.</p>
    `;

    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <pdalink>${escapeXml(url)}</pdalink>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>Полезные советы и экономия</category>
      <description><![CDATA[${escapeXml(a.description)}]]></description>
      <content:encoded><![CDATA[${fullArticleHtml}]]></content:encoded>
    </item>`;
  });

  const allItems = [...couponItems, ...articleItems].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/" 
  xmlns:dc="http://purl.org/dc/elements/1.1/" 
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Промокоды, скидки и статьи</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_TAGLINE)}</description>
    <language>ru</language>
    <atom:link href="${SITE_URL}/dzen.xml" rel="self" type="application/rss+xml" />
${allItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
