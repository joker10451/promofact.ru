import { getArticles, type Article } from "@/lib/articles";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

// Раз в час, а не в 12: рекламные статьи выходят по времени (publishAt),
// и с 12-часовым кэшем статья попадала в ленту Дзена с опозданием на полдня.
export const revalidate = 3600;

/**
 * Лента для импорта в Дзен (Студия → Импорт RSS).
 * Требования: https://dzen.ru/help/ru/website/rss-modify.html
 *
 * В ленте только статьи. Карточки промокодов сюда больше не попадают: это
 * были короткие рекламные заметки с иконкой 120 px вместо обложки (Дзен
 * требует от 700 px) и без полного текста — такие материалы площадка режет.
 */

function escapeXml(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Жирный из разметки статьи → <b>; остальной текст экранируется. */
function inline(text: string): string {
  return text
    .split(/(\*\*.*?\*\*)/g)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") ? `<b>${escapeXml(part.slice(2, -2))}</b>` : escapeXml(part),
    )
    .join("");
}

/** У старых статей нет даты публикации — даём стабильную, чтобы она не «молодела» при каждой пересборке. */
const FALLBACK_DATE = Date.parse("2026-08-01T10:00:00+03:00");
const DAY = 24 * 60 * 60 * 1000;

function pubDate(a: Article, index: number): string {
  const ts = a.published ? Date.parse(`${a.published}T10:00:00+03:00`) : FALLBACK_DATE - index * DAY;
  return new Date(ts).toUTCString();
}

function cover(a: Article): { url: string; type: string } {
  // Обложка от 700 px. Своя картинка статьи — если есть, иначе общая OG-картинка сайта (1200×630).
  if (a.image) {
    const url = `${SITE_URL}${a.image}`;
    return { url, type: a.image.endsWith(".png") ? "image/png" : "image/jpeg" };
  }
  return { url: `${SITE_URL}/opengraph-image`, type: "image/png" };
}

function contentHtml(a: Article, url: string): string {
  const img = cover(a);
  const parts: string[] = [
    `<figure><img src="${escapeXml(img.url)}" alt="${escapeXml(a.title)}"/></figure>`,
    `<p>${inline(a.description)}</p>`,
  ];
  for (const p of a.body) {
    parts.push(p.startsWith("## ") ? `<h2>${escapeXml(p.slice(3))}</h2>` : `<p>${inline(p)}</p>`);
  }
  if (a.faq?.length) {
    parts.push("<h2>Частые вопросы</h2>");
    for (const item of a.faq) parts.push(`<p><b>${escapeXml(item.q)}</b></p><p>${escapeXml(item.a)}</p>`);
  }
  if (a.ctaButton) {
    parts.push(`<p><a href="${escapeXml(a.ctaButton.href)}">${escapeXml(a.ctaButton.text)}</a></p>`);
    if (a.ctaButton.disclaimer) parts.push(`<p>${escapeXml(a.ctaButton.disclaimer)}</p>`);
  }
  parts.push(
    `<p>Все действующие промокоды и подробные условия — <a href="${escapeXml(url)}">на сайте ${escapeXml(SITE_NAME)}</a>.</p>`,
  );
  return parts.join("\n");
}

export async function GET() {
  const items = getArticles().map((a, i) => {
    const url = `${SITE_URL}/sovety/${a.slug}`;
    const img = cover(a);
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <pdalink>${escapeXml(url)}</pdalink>
      <guid isPermaLink="false">${escapeXml(a.slug)}</guid>
      <pubDate>${pubDate(a, i)}</pubDate>
      <media:rating scheme="urn:simple">nonadult</media:rating>
      <category>format-article</category>
      <category>index</category>
      <category>comment-all</category>
      <enclosure url="${escapeXml(img.url)}" type="${img.type}"/>
      <description><![CDATA[${a.description}]]></description>
      <content:encoded><![CDATA[${contentHtml(a, url)}]]></content:encoded>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:georss="http://www.georss.org/georss">
  <channel>
    <title>${escapeXml(SITE_NAME)} — промокоды и советы по экономии</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_TAGLINE)}</description>
    <language>ru</language>
    <atom:link href="${SITE_URL}/dzen.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
