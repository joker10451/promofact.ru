/**
 * Централизованная база логотипов и фирменных стилей брендов.
 * Обеспечивает 100% отображение иконок даже при отсутствии картинок в фидах.
 */

export interface BrandMeta {
  logoUrl?: string;
  emoji: string;
  bgGradient: string;
  textColor: string;
  domain?: string;
}

export const BRAND_REGISTRY: Record<string, BrandMeta> = {
  "pyaterochka": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://5dostavka.ru?size=64",
    emoji: "🛒",
    bgGradient: "from-red-600 to-red-700",
    textColor: "text-white",
    domain: "5dostavka.ru",
  },
  "otello": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://otello.ru?size=64",
    emoji: "🏨",
    bgGradient: "from-blue-600 to-indigo-700",
    textColor: "text-white",
    domain: "otello.ru",
  },
  "kinopoisk": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://kinopoisk.ru?size=64",
    emoji: "🎬",
    bgGradient: "from-amber-500 to-orange-600",
    textColor: "text-white",
    domain: "kinopoisk.ru",
  },
  "yandeks-tsvety": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://market.yandex.ru?size=64",
    emoji: "🌷",
    bgGradient: "from-pink-500 to-rose-600",
    textColor: "text-white",
    domain: "market.yandex.ru",
  },
  "yandeks-puteshestviya": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://travel.yandex.ru?size=64",
    emoji: "✈️",
    bgGradient: "from-sky-500 to-blue-600",
    textColor: "text-white",
    domain: "travel.yandex.ru",
  },
  "yandeks-prokat-ru": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://travel.yandex.ru?size=64",
    emoji: "🚗",
    bgGradient: "from-yellow-400 to-amber-500",
    textColor: "text-ink",
    domain: "travel.yandex.ru",
  },
  "iv-roshe": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://yves-rocher.ru?size=64",
    emoji: "🌿",
    bgGradient: "from-emerald-700 to-green-800",
    textColor: "text-white",
    domain: "yves-rocher.ru",
  },
  "vazhnaya-ryba": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://vipfish.ru?size=64",
    emoji: "🍣",
    bgGradient: "from-rose-500 to-red-600",
    textColor: "text-white",
    domain: "vipfish.ru",
  },
  "fix-price": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://fix-price.com?size=64",
    emoji: "🏠",
    bgGradient: "from-green-500 to-emerald-600",
    textColor: "text-white",
    domain: "fix-price.com",
  },
  "netprint": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://netprint.ru?size=64",
    emoji: "📸",
    bgGradient: "from-rose-400 to-pink-500",
    textColor: "text-white",
    domain: "netprint.ru",
  },
  "pro32-com": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://pro32.com?size=64",
    emoji: "🛡",
    bgGradient: "from-cyan-600 to-blue-700",
    textColor: "text-white",
    domain: "pro32.com",
  },
  "itab-ru": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://itab.pro?size=64",
    emoji: "💊",
    bgGradient: "from-teal-500 to-emerald-600",
    textColor: "text-white",
    domain: "itab.pro",
  },
  "polzaru": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://polza.ru?size=64",
    emoji: "➕",
    bgGradient: "from-blue-500 to-indigo-600",
    textColor: "text-white",
    domain: "polza.ru",
  },
  "sinergiya-angliyskiy": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://synergy.ru?size=64",
    emoji: "🎓",
    bgGradient: "from-red-600 to-rose-700",
    textColor: "text-white",
    domain: "synergy.ru",
  },
  "patch-and-go": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://patchandgo.ru?size=64",
    emoji: "✨",
    bgGradient: "from-amber-400 to-pink-500",
    textColor: "text-white",
    domain: "patchandgo.ru",
  },
  "plati-po-miru": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://platipomiru.com?size=64",
    emoji: "💳",
    bgGradient: "from-violet-600 to-purple-800",
    textColor: "text-white",
    domain: "platipomiru.com",
  },
  "irnby": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://ironbymironova.com?size=64",
    emoji: "👕",
    bgGradient: "from-neutral-800 to-black",
    textColor: "text-white",
    domain: "ironbymironova.com",
  },
  "fmart-by-flowwow": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://flowwow.com?size=64",
    emoji: "🌸",
    bgGradient: "from-pink-400 to-rose-500",
    textColor: "text-white",
    domain: "flowwow.com",
  },
  "davines": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://davines.ru?size=64",
    emoji: "🧴",
    bgGradient: "from-stone-700 to-stone-900",
    textColor: "text-white",
    domain: "davines.ru",
  },
  "yamdiet": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://yamdiet.com?size=64",
    emoji: "🥗",
    bgGradient: "from-lime-500 to-green-600",
    textColor: "text-white",
    domain: "yamdiet.com",
  },
  "sberprime": {
    logoUrl: "https://favicon.yandex.net/favicon/v2/https://sberbank.ru?size=64",
    emoji: "💚",
    bgGradient: "from-emerald-500 to-green-600",
    textColor: "text-white",
    domain: "sberbank.ru",
  },
};

/**
 * Получить мета-данные и логотип магазина с надёжными фоллбэками
 */
export function getBrandMeta(storeSlug: string, storeName: string, domain?: string): BrandMeta {
  const slug = (storeSlug || "").toLowerCase().trim();
  if (BRAND_REGISTRY[slug]) {
    return BRAND_REGISTRY[slug];
  }

  // Если бренд не в реестре, извлекаем домен
  let cleanDomain = domain ? domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "";
  if (!cleanDomain && storeName) {
    cleanDomain = `${storeSlug}.ru`;
  }

  const logoUrl = cleanDomain
    ? `https://favicon.yandex.net/favicon/v2/https://${cleanDomain}?size=64`
    : undefined;

  // Динамический градиент на основе хэша имени
  const gradients = [
    "from-indigo-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-teal-500 to-emerald-600",
    "from-blue-600 to-cyan-600",
    "from-violet-600 to-fuchsia-600",
  ];
  const charCode = (storeName || "M").charCodeAt(0);
  const bgGradient = gradients[charCode % gradients.length];

  return {
    logoUrl,
    emoji: "🏷",
    bgGradient,
    textColor: "text-white",
    domain: cleanDomain,
  };
}
