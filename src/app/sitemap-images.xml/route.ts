import { getStores } from "@/lib/perfluence";
import { SITE_URL } from "@/lib/site";

export const revalidate = 600;

export async function GET() {
  const stores = await getStores();
  const images = stores
    .filter((s) => s.logo)
    .map(
      (s) => `    <image:image>
      <image:loc>${s.logo}</image:loc>
      <image:title>${s.name}</image:title>
      <image:license>${SITE_URL}/</image:license>
    </image:image>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/store</loc>
${images}
  </url>
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
