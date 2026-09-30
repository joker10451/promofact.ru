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
  // Адреса для новой серии роликов. Их набирают вручную с экрана, поэтому
  // держим их короткими и без дефисов.
  lavka: "/store/yandeks-lavka",
  perekrestok: "/store/perekrestok-dostavka",
  vkusvill: "/store/vkusvill-dostavka",
  tutu: "/store/tutu",
  travel: "/store/yandeks-puteshestviya",
  afisha: "/store/yandeks-afisha",
  flowers: "/store/yandeks-tsvety",
  ivroshe: "/store/iv-roshe",
  letual: "/store/letual",
  randewoo: "/store/randewoo",
  mkosmetik: "/store/m-kosmetik",
  librederm: "/store/librederm",
  netprint: "/store/netprint",
  farfor: "/store/farfor",
  ryba: "/store/vazhnaya-ryba",
  kinopoisk: "/store/kinopoisk",
  start: "/store/start-ru",
  cozy: "/store/cozy-home",
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
      {
        source: "/actions/:slug",
        destination: "/akcii/:slug",
        permanent: true,
      },
      // Статья держалась на одном промокоде, который Пятёрочка сняла, а
      // аккаунт сайта в этом проекте не одобрен — рекламировать нечего.
      // Постоянный редирект сохраняет вес адреса в поиске.
      // Страница магазина исчезает, когда у него не остаётся купонов, и Google
      // видит 404. Эти две приносили клики из поиска — ведём на ближайшую живую.
      {
        source: "/store/m-kosmetik-novoe-prilozhenie/:path*",
        destination: "/store/m-kosmetik",
        permanent: true,
      },
      {
        source: "/store/sunlight/:path*",
        destination: "/store/sunlight-ru",
        permanent: true,
      },
      {
        source: "/store/sunlight",
        destination: "/store/sunlight-ru",
        permanent: true,
      },
      {
        source: "/store/yandeks-plyus/:path*",
        destination: "/store/yandex-plus",
        permanent: true,
      },
      {
        source: "/store/yandeks-plyus",
        destination: "/store/yandex-plus",
        permanent: true,
      },
      {
        source: "/store/geltek-ai/:path*",
        destination: "/store/geltek",
        permanent: true,
      },
      {
        source: "/store/geltek-ai",
        destination: "/store/geltek",
        permanent: true,
      },
      {
        source: "/store/geltek-diagnostika-kozhi/:path*",
        destination: "/store/geltek",
        permanent: true,
      },
      {
        source: "/store/geltek-diagnostika-kozhi",
        destination: "/store/geltek",
        permanent: true,
      },
      {
        source: "/store/carely-na-ozon/:path*",
        destination: "/store/carely",
        permanent: true,
      },
      {
        source: "/store/carely-na-ozon",
        destination: "/store/carely",
        permanent: true,
      },
      {
        source: "/store/poizon-devu/:path*",
        destination: "/store/poizon",
        permanent: true,
      },
      {
        source: "/store/poizon-devu",
        destination: "/store/poizon",
        permanent: true,
      },
      {
        source: "/store/yandeks-eda-gipermarkety/:path*",
        destination: "/store/yandex-eda-gipermarkety",
        permanent: true,
      },
      {
        source: "/store/yandeks-eda-gipermarkety",
        destination: "/store/yandex-eda-gipermarkety",
        permanent: true,
      },
      {
        source: "/store/yandex-eda-magaziny/:path*",
        destination: "/store/yandex-eda-gipermarkety",
        permanent: true,
      },
      {
        source: "/store/yandex-eda-magaziny",
        destination: "/store/yandex-eda-gipermarkety",
        permanent: true,
      },
      {
        source: "/store/delimobil-karshering/:path*",
        destination: "/store/delimobil",
        permanent: true,
      },
      {
        source: "/store/delimobil-karshering",
        destination: "/store/delimobil",
        permanent: true,
      },
      {
        source: "/store/delimobil-ru/:path*",
        destination: "/store/delimobil",
        permanent: true,
      },
      {
        source: "/store/delimobil-ru",
        destination: "/store/delimobil",
        permanent: true,
      },
      {
        source: "/store/avito-travel/:path*",
        destination: "/store/avito-puteshestviya",
        permanent: true,
      },
      {
        source: "/store/avito-travel",
        destination: "/store/avito-puteshestviya",
        permanent: true,
      },
      {
        source: "/store/avito-puteshestviya-arenda/:path*",
        destination: "/store/avito-puteshestviya",
        permanent: true,
      },
      {
        source: "/store/avito-puteshestviya-arenda",
        destination: "/store/avito-puteshestviya",
        permanent: true,
      },
      {
        source: "/store/vinlab/:path*",
        destination: "/store/winlab",
        permanent: true,
      },
      {
        source: "/store/vinlab",
        destination: "/store/winlab",
        permanent: true,
      },
      {
        source: "/store/winelab/:path*",
        destination: "/store/winlab",
        permanent: true,
      },
      {
        source: "/store/winelab",
        destination: "/store/winlab",
        permanent: true,
      },
      {
        source: "/store/rutube-ru/:path*",
        destination: "/store/rutube",
        permanent: true,
      },
      {
        source: "/store/rutube-ru",
        destination: "/store/rutube",
        permanent: true,
      },
      {
        source: "/store/tinkoff-travel/:path*",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/tinkoff-travel",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/t-bank-travel/:path*",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/t-bank-travel",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/t-puteshestviya/:path*",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/t-puteshestviya",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/tinkoff-puteshestviya/:path*",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/tinkoff-puteshestviya",
        destination: "/store/t-puteshestviya-oteli",
        permanent: true,
      },
      {
        source: "/store/sberhealth/:path*",
        destination: "/store/sberzdorovie",
        permanent: true,
      },
      {
        source: "/store/sberhealth",
        destination: "/store/sberzdorovie",
        permanent: true,
      },
      {
        source: "/store/sber-zdorovie/:path*",
        destination: "/store/sberzdorovie",
        permanent: true,
      },
      {
        source: "/store/sber-zdorovie",
        destination: "/store/sberzdorovie",
        permanent: true,
      },
      {
        source: "/store/sberzdorovye/:path*",
        destination: "/store/sberzdorovie",
        permanent: true,
      },
      {
        source: "/store/sberzdorovye",
        destination: "/store/sberzdorovie",
        permanent: true,
      },
      {
        source: "/store/ostrovok-ru/:path*",
        destination: "/store/ostrovok",
        permanent: true,
      },
      {
        source: "/store/ostrovok-ru",
        destination: "/store/ostrovok",
        permanent: true,
      },
      {
        source: "/store/kassir-ru/:path*",
        destination: "/category/razvlecheniya",
        permanent: false,
      },
      {
        source: "/sovety/pyaterochka-dostavka-55",
        destination: "/store/pyaterochka",
        permanent: true,
      },
      // Исторические категории (P2.4 Wave 1A: Safe Index Hygiene)
      // Робот Яндекса помнит старые слаги категорий до внедрения таксономии.
      {
        source: "/category/krasota-i-kosmetika",
        destination: "/category/kosmetika-i-parfyumeriya",
        permanent: true,
      },
      {
        source: "/category/krasota-i-uhod",
        destination: "/category/kosmetika-i-parfyumeriya",
        permanent: true,
      },
      {
        source: "/category/kino-i-teatr",
        destination: "/category/onlayn-kinoteatry",
        permanent: true,
      },
      {
        source: "/category/yuvelirnye-izdeliya",
        destination: "/category/ukrasheniya",
        permanent: true,
      },
      {
        source: "/category/marketplejsy",
        destination: "/category/marketpleysy",
        permanent: true,
      },
      {
        source: "/category/knigi",
        destination: "/category/onlayn-obrazovanie",
        permanent: true,
      },
      {
        source: "/category/knigi-i-obuchenie",
        destination: "/category/onlayn-obrazovanie",
        permanent: true,
      },
      {
        source: "/category/produkty-i-dostavka",
        destination: "/category/dostavka-produktov",
        permanent: true,
      },
      {
        source: "/category/eda-i-dostavka",
        destination: "/category/dostavka-produktov",
        permanent: true,
      },
      {
        source: "/category/elektronika",
        destination: "/category/elektronika-i-tehnika",
        permanent: true,
      },
      {
        source: "/category/zdorove-i-krasota",
        destination: "/category/kosmetika-i-parfyumeriya",
        permanent: true,
      },
      {
        source: "/category/avtotovary",
        destination: "/category/raznoe",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
