import { ARTICLES } from "@/lib/articles";
import { SITE_NAME, SITE_URL, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 600;

function escapeXml(s: string): string {
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
    const desc = a.description ?? a.title;
    const pub = new Date(now - (ARTICLES.length - i) * dayMs).toUTCString();
    const body = a.body?.join("\n\n") ?? desc;
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(desc)}</description>
      <pubDate>${pub}</pubDate>
      <content:encoded><![CDATA[${body}]]></content:encoded>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_NAME)} — ${escapeXml(SITE_TAGLINE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_TAGLINE)}</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
