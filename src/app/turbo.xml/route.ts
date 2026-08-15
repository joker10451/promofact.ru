import { ARTICLES } from "@/lib/articles";
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
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const items = ARTICLES.map((a, i) => {
    const url = `${SITE_URL}/sovety/${a.slug}`;
    const pub = new Date(now - (ARTICLES.length - i) * dayMs).toUTCString();
    
    // Формируем контент для Турбо-страницы
    const header = `<header>
      <h1>${escapeXml(a.title)}</h1>
    </header>`;
    
    const bodyText = a.body?.map(p => `<p>${escapeXml(p)}</p>`).join("") || "";
    const content = `${header}${bodyText}`;

    return `    <item turbo="true">
      <link>${url}</link>
      <title>${escapeXml(a.title)}</title>
      <pubDate>${pub}</pubDate>
      <turbo:content>
        <![CDATA[
          ${content}
        ]]>
      </turbo:content>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:yandex="http://news.yandex.ru" xmlns:media="http://search.yahoo.com/mrss/" xmlns:turbo="http://turbo.yandex.ru" version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Статьи и советы</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_TAGLINE)}</description>
    <language>ru</language>
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
