import type { NextConfig } from "next";

/**
 * Основное зеркало — апекс без www: именно он указан в canonical и в sitemap.
 * До этого www.promofact.ru отвечал 200 и отдавал тот же контент, то есть для
 * поисковиков существовали два самостоятельных сайта с полностью совпадающими
 * страницами. Это делит накопленный вес между зеркалами и создаёт дубли.
 *
 * Редирект постоянный (308): временный 307 не передал бы вес апексу.
 */
const WWW_HOST = "www.promofact.ru";
const CANONICAL_ORIGIN = "https://promofact.ru";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: WWW_HOST }],
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
