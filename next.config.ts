import type { NextConfig } from "next";
import { LOGO_PROXIES } from "./src/lib/logoProxy";

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

const SHORT_LINKS: Record<string, string> = {
  dodo: "/store/dodo-pizza",
  sber: "/store/sberprime",
  city: "/store/citydrive",
  beth: "/store/bethowen",
};

const nextConfig: NextConfig = {
  // Логотипы партнёрских сетей через свой домен — см. src/lib/logoProxy.ts.
  async rewrites() {
    return LOGO_PROXIES.map(({ prefix, origin }) => ({
      source: `${prefix}:path*`,
      destination: `${origin}:path*`,
    }));
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: WWW_HOST }],
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true,
      },
      // Короткие адреса для роликов (Дзен, YouTube Shorts): ссылки в описаниях
      // там часто не кликаются, адрес набирают вручную с экрана. Временный
      // редирект — страницу назначения можно поменять под новую акцию.
      ...Object.entries(SHORT_LINKS).map(([from, to]) => ({
        source: `/${from}`,
        destination: to,
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
