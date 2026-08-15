import { getCoupons } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 3600;

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
  
  // Берем топ 20 новых/горячих купонов для Дзена
  const feedItems = coupons.slice(0, 20);
  const pubDate = new Date().toUTCString();
  
  const items = feedItems.map((c) => {
    const url = `${SITE_URL}/store/${c.store.slug}/${encodeURIComponent(c.promocode.code)}`;
    
    // Формируем контент поста для Дзена
    const content = `
      <p>Новый промокод для магазина <strong>${escapeXml(c.store.name)}</strong>!</p>
      <p>${escapeXml(c.promocode.bonusName || `Скидка по промокоду ${c.promocode.code}`)}</p>
      ${c.promocode.terms ? `<p>${escapeXml(c.promocode.terms)}</p>` : ""}
      <p>Промокод: <strong>${escapeXml(c.promocode.code)}</strong></p>
      <p><a href="${escapeXml(url)}">Скопировать и применить</a></p>
    `;

    return `    <item>
      <title>${escapeXml(c.store.name)}: ${escapeXml(c.promocode.bonusName || "Скидка")}</title>
      <link>${escapeXml(url)}</link>
      <description><![CDATA[${content}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <content:encoded><![CDATA[${content}]]></content:encoded>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Промокоды и скидки</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_TAGLINE)}</description>
    <language>ru</language>
    <atom:link href="${SITE_URL}/dzen.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
