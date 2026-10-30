import { getAllStores } from "@/lib/perfluence";
import { getArticles } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

export const revalidate = false;

function xmlEscape(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [stores, articles] = await Promise.all([
    getAllStores(),
    Promise.resolve(getArticles()),
  ]);

  const storeEntries = stores
    .filter((s) => s.logo && s.logo.startsWith("http"))
    .map((s) => {
      const pageLoc = xmlEscape(`${SITE_URL}/store/${s.slug}`);
      const imgLoc = xmlEscape(s.logo);
      const imgTitle = xmlEscape(s.name);
      return `  <url>
    <loc>${pageLoc}</loc>
    <image:image>
      <image:loc>${imgLoc}</image:loc>
      <image:title>${imgTitle}</image:title>
    </image:image>
  </url>`;
    });

  const articleEntries = articles
    .filter((a) => a.image && a.image.length > 0)
    .map((a) => {
      const pageLoc = xmlEscape(`${SITE_URL}/sovety/${a.slug}`);
      const imgLoc = xmlEscape(
        a.image!.startsWith("http") ? a.image! : `${SITE_URL}${a.image!}`
      );
      const imgTitle = xmlEscape(a.title);
      return `  <url>
    <loc>${pageLoc}</loc>
    <image:image>
      <image:loc>${imgLoc}</image:loc>
      <image:title>${imgTitle}</image:title>
    </image:image>
  </url>`;
    });

  const allEntries = [...storeEntries, ...articleEntries].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
