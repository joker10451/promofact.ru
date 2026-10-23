/**
 * Централизованная база логотипов и фирменных стилей брендов.
 * Обеспечивает 100% отображение иконок даже при отсутствии картинок в фидах.
 */

export interface BrandMeta {
  logoUrl: string;
  emoji: string;
  bgGradient: string;
  textColor: string;
  domain: string;
}

export const LOCAL_BRAND_ICONS: Record<string, string> = {
  "aravia": "/brands/aravia.png",
  "askona": "/brands/askona.png",
  "avito-puteshestviya": "/brands/avito-puteshestviya.png",
  "befree-ru": "/brands/befree-ru.png",
  "carely": "/brands/carely.png",
  "carte-blanche": "/brands/carte-blanche.png",
  "citydrive": "/brands/citydrive.png",
  "cozy-home": "/brands/cozy-home.png",
  "detskie-platezhnye-aksessuary-ot-sbera": "/brands/detskie-platezhnye-aksessuary-ot-sbera.png",
  "dodo-pizza": "/brands/dodo-pizza.png",
  "elementaree": "/brands/elementaree.png",
  "farfor": "/brands/farfor.png",
  "flowwow": "/brands/flowwow.png",
  "fmart": "/brands/fmart.png",
  "foodband": "/brands/foodband.png",
  "foxford": "/brands/foxford.png",
  "geltek": "/brands/geltek.png",
  "internet-magazin-bilayn": "/brands/internet-magazin-bilayn.png",
  "iv-roshe": "/brands/iv-roshe.png",
  "ivi": "/brands/ivi.png",
  "kinopoisk": "/brands/kinopoisk.png",
  "letual": "/brands/letual.png",
  "librederm": "/brands/librederm.png",
  "litres": "/brands/litres.png",
  "love-republic": "/brands/love-republic.png",
  "m-kosmetik": "/brands/m-kosmetik.png",
  "magnit-dostavka": "/brands/magnit-dostavka.png",
  "mark-formelle": "/brands/mark-formelle.png",
  "megamarket": "/brands/megamarket.png",
  "netprint": "/brands/netprint.png",
  "ostrovok": "/brands/ostrovok.png",
  "otello": "/brands/otello.png",
  "otp-bank": "/brands/otp-bank.png",
  "perekrestok-dostavka": "/brands/perekrestok-dostavka.png",
  "pizzasushiwok": "/brands/pizzasushiwok.png",
  "plati-po-miru": "/brands/plati-po-miru.png",
  "podruzhka": "/brands/podruzhka-mark.svg",
  "poizon": "/brands/poizon.png",
  "polzaru": "/brands/polzaru.png",
  "premier": "/brands/premier.png",
  "pyaterochka": "/brands/pyaterochka.png",
  "randewoo": "/brands/randewoo.png",
  "riv-gosh": "/brands/riv-gosh.png",
  "rosgosstrakh": "/brands/rosgosstrakh.png",
  "rgs": "/brands/rosgosstrakh.png",
  "rutube": "/brands/rutube.png",
  "samokat": "/brands/samokat.png",
  "sberbank": "/brands/sberbank.png",
  "sberdevaysy": "/brands/sberdevaysy.png",
  "sberprime": "/brands/sberprime.png",
  "sberzdorovie": "/brands/sberzdorovie.png",
  "skysmart-ru": "/brands/skysmart-ru.png",
  "sokolov-offline": "/brands/sokolov-offline.png",
  "sportmaster": "/brands/sportmaster.png",
  "start-ru": "/brands/start-ru.png",
  "sunlight-ru": "/brands/sunlight-ru.png",
  "t-bank-junior": "/brands/t-bank-junior.png",
  "t-puteshestviya-oteli": "/brands/t-puteshestviya-oteli.png",
  "tanukifamily": "/brands/tanukifamily.png",
  "tasty-coffee": "/brands/tasty-coffee.png",
  "tehnopark": "/brands/tehnopark.png",
  "tutu": "/brands/tutu.png",
  "vazhnaya-ryba": "/brands/vazhnaya-ryba.png",
  "vklad-v-sbere": "/brands/vklad-v-sbere.png",
  "vkusvill-dostavka": "/brands/vkusvill-dostavka.png",
  "winlab": "/brands/winlab.png",
  "yandeks-afisha": "/brands/yandeks-afisha.png",
  "yandeks-lavka": "/brands/yandeks-lavka.png",
  "yandeks-puteshestviya": "/brands/yandeks-puteshestviya.png",
  "yandeks-tsvety": "/brands/yandeks-tsvety.png",
  "yandex-eda-gipermarkety": "/brands/yandex-eda-gipermarkety.png",
  "yandex-eda": "/brands/yandex-eda.png",
  "yandex-knigi": "/brands/yandex-knigi.png",
  "yandex-market": "/brands/yandex-market.png",
  "yandex-plus": "/brands/yandex-plus.png",
  "zolotoe-yabloko": "/brands/zolotoe-yabloko.png",
  "sber": "/brands/sberbank.png",
  "tanuki": "/brands/tanukifamily.png",
  "perekrestok": "/brands/perekrestok-dostavka.png",
  "vkusvill": "/brands/vkusvill-dostavka.png",
  "sunlight": "/brands/sunlight-ru.png",
  "befree": "/brands/befree-ru.png",
  "t-bank": "/brands/t-bank-junior.png",
  "fmart-by-flowwow": "/brands/fmart.png",
  "yandex-travel": "/brands/yandeks-puteshestviya.png"
};

export function getLocalBrandLogo(slug: string): string | null {
  return LOCAL_BRAND_ICONS[slug] || null;
}



export const BRAND_REGISTRY: Record<string, BrandMeta> = {
  "rosgosstrakh": {
    logoUrl: "/brands/rosgosstrakh.png",
    emoji: "🛡️",
    bgGradient: "from-red-800 to-rose-950",
    textColor: "text-white",
    domain: "rgs.ru",
  },
  "podruzhka": {
    logoUrl: "/brands/podruzhka-mark.svg",
    emoji: "💜",
    bgGradient: "from-violet-500 to-fuchsia-700",
    textColor: "text-white",
    domain: "podrygka.ru",
  },
  "pyaterochka": {
    logoUrl: "/brands/pyaterochka.png",
    emoji: "🛒",
    bgGradient: "from-red-600 to-red-700",
    textColor: "text-white",
    domain: "5ka.ru",
  },
  "samokat": {
    logoUrl: "/brands/samokat.png",
    emoji: "🛴",
    bgGradient: "from-rose-500 to-pink-600",
    textColor: "text-white",
    domain: "samokat.ru",
  },
  "magnit-dostavka": {
    logoUrl: "/brands/magnit-dostavka.png",
    emoji: "🛍️",
    bgGradient: "from-red-600 to-red-700",
    textColor: "text-white",
    domain: "dostavka.magnit.ru",
  },
  "m-kosmetik": {
    logoUrl: "/brands/m-kosmetik.png",
    emoji: "💄",
    bgGradient: "from-rose-500 to-pink-600",
    textColor: "text-white",
    domain: "promokod.magnit.ru",
  },
  "yandex-market": {
    logoUrl: "/brands/yandex-market.png",
    emoji: "📦",
    bgGradient: "from-yellow-400 to-amber-500",
    textColor: "text-ink",
    domain: "market.yandex.ru",
  },
  "megamarket": {
    logoUrl: "/brands/megamarket.png",
    emoji: "🛍️",
    bgGradient: "from-fuchsia-600 to-purple-700",
    textColor: "text-white",
    domain: "megamarket.ru",
  },
  "zolotoe-yabloko": {
    logoUrl: "/brands/zolotoe-yabloko.png",
    emoji: "🍏",
    bgGradient: "from-emerald-500 to-teal-600",
    textColor: "text-white",
    domain: "goldapple.ru",
  },
  "litres": {
    logoUrl: "/brands/litres.png",
    emoji: "📚",
    bgGradient: "from-orange-500 to-amber-600",
    textColor: "text-white",
    domain: "litres.ru",
  },
  "tehnopark": {
    logoUrl: "/brands/tehnopark.png",
    emoji: "⚡",
    bgGradient: "from-cyan-600 to-blue-800",
    textColor: "text-white",
    domain: "tehnopark.ru",
  },
  "librederm": {
    logoUrl: "/brands/librederm.png",
    emoji: "🧴",
    bgGradient: "from-sky-600 to-indigo-700",
    textColor: "text-white",
    domain: "librederm.ru",
  },
  "otello": {
    logoUrl: "/brands/otello.png",
    emoji: "🏨",
    bgGradient: "from-blue-600 to-indigo-700",
    textColor: "text-white",
    domain: "otello.ru",
  },
  "kinopoisk": {
    logoUrl: "/brands/kinopoisk.png",
    emoji: "🎬",
    bgGradient: "from-amber-500 to-orange-600",
    textColor: "text-white",
    domain: "kinopoisk.ru",
  },
  "ivi": {
    logoUrl: "/brands/ivi.png",
    emoji: "🍿",
    bgGradient: "from-rose-600 to-pink-700",
    textColor: "text-white",
    domain: "ivi.ru",
  },
  "start-ru": {
    logoUrl: "/brands/start-ru.png",
    emoji: "🎬",
    bgGradient: "from-red-600 to-neutral-900",
    textColor: "text-white",
    domain: "start.ru",
  },
  "yandeks-tsvety": {
    logoUrl: "/brands/yandeks-tsvety.png",
    emoji: "🌷",
    bgGradient: "from-pink-500 to-rose-600",
    textColor: "text-white",
    domain: "market.yandex.ru",
  },
  "yandeks-puteshestviya": {
    logoUrl: "/brands/yandeks-puteshestviya.png",
    emoji: "✈️",
    bgGradient: "from-sky-500 to-blue-600",
    textColor: "text-white",
    domain: "travel.yandex.ru",
  },
  "yandeks-prokat-ru": {
    logoUrl: "https://www.google.com/s2/favicons?domain=travel.yandex.ru&sz=128",
    emoji: "🚗",
    bgGradient: "from-yellow-400 to-amber-500",
    textColor: "text-ink",
    domain: "travel.yandex.ru",
  },
  "iv-roshe": {
    logoUrl: "/brands/iv-roshe.png",
    emoji: "🌿",
    bgGradient: "from-emerald-700 to-green-800",
    textColor: "text-white",
    domain: "yves-rocher.ru",
  },
  "vazhnaya-ryba": {
    logoUrl: "/brands/vazhnaya-ryba.png",
    emoji: "🍣",
    bgGradient: "from-rose-500 to-red-600",
    textColor: "text-white",
    domain: "vipfish.ru",
  },
  "fix-price": {
    logoUrl: "https://www.google.com/s2/favicons?domain=fix-price.com&sz=128",
    emoji: "🏠",
    bgGradient: "from-green-500 to-emerald-600",
    textColor: "text-white",
    domain: "fix-price.com",
  },
  "cozy-home": {
    logoUrl: "/brands/cozy-home.png",
    emoji: "🛏️",
    bgGradient: "from-amber-600 to-amber-800",
    textColor: "text-white",
    domain: "cozyhome.ru",
  },
  "netprint": {
    logoUrl: "/brands/netprint.png",
    emoji: "📸",
    bgGradient: "from-rose-400 to-pink-500",
    textColor: "text-white",
    domain: "netprint.ru",
  },
  "farfor": {
    logoUrl: "/brands/farfor.png",
    emoji: "🍱",
    bgGradient: "from-orange-500 to-red-600",
    textColor: "text-white",
    domain: "msk.farfor.ru",
  },
  "dodo-pizza": {
    logoUrl: "/brands/dodo-pizza.png",
    emoji: "🍕",
    bgGradient: "from-orange-500 to-amber-600",
    textColor: "text-white",
    domain: "dodopizza.ru",
  },
  "yandeks-afisha": {
    logoUrl: "/brands/yandeks-afisha.png",
    emoji: "🎭",
    bgGradient: "from-yellow-400 to-amber-500",
    textColor: "text-ink",
    domain: "afisha.yandex.ru",
  },
  "vkusvill-dostavka": {
    logoUrl: "/brands/vkusvill-dostavka.png",
    emoji: "🥑",
    bgGradient: "from-emerald-600 to-green-700",
    textColor: "text-white",
    domain: "vkusvill.ru",
  },
  "ostrovok": {
    logoUrl: "/brands/ostrovok.png",
    emoji: "🏨",
    bgGradient: "from-blue-600 to-indigo-700",
    textColor: "text-white",
    domain: "ostrovok.ru",
  },
  "tutu": {
    logoUrl: "/brands/tutu.png",
    emoji: "🚆",
    bgGradient: "from-amber-500 to-orange-600",
    textColor: "text-white",
    domain: "tutu.ru",
  },
  "pro32-com": {
    logoUrl: "https://www.google.com/s2/favicons?domain=pro32.com&sz=128",
    emoji: "🛡",
    bgGradient: "from-cyan-600 to-blue-700",
    textColor: "text-white",
    domain: "pro32.com",
  },
  "itab-ru": {
    logoUrl: "https://www.google.com/s2/favicons?domain=itab.pro&sz=128",
    emoji: "💊",
    bgGradient: "from-teal-500 to-emerald-600",
    textColor: "text-white",
    domain: "itab.pro",
  },
  "polzaru": {
    logoUrl: "/brands/polzaru.png",
    emoji: "➕",
    bgGradient: "from-blue-500 to-indigo-600",
    textColor: "text-white",
    domain: "polza.ru",
  },
  "sinergiya-angliyskiy": {
    logoUrl: "https://www.google.com/s2/favicons?domain=synergy.ru&sz=128",
    emoji: "🎓",
    bgGradient: "from-red-600 to-rose-700",
    textColor: "text-white",
    domain: "synergy.ru",
  },
  "patch-and-go": {
    logoUrl: "https://www.google.com/s2/favicons?domain=patchandgo.ru&sz=128",
    emoji: "✨",
    bgGradient: "from-amber-400 to-pink-500",
    textColor: "text-white",
    domain: "patchandgo.ru",
  },
  "plati-po-miru": {
    logoUrl: "/brands/plati-po-miru.png",
    emoji: "💳",
    bgGradient: "from-violet-600 to-purple-800",
    textColor: "text-white",
    domain: "platipomiru.com",
  },
  "otp-bank": {
    logoUrl: "/brands/otp-bank.png",
    emoji: "💳",
    bgGradient: "from-lime-500 to-green-700",
    textColor: "text-white",
    domain: "www.otpbank.ru",
  },
  "irnby": {
    logoUrl: "https://www.google.com/s2/favicons?domain=ironbymironova.com&sz=128",
    emoji: "👕",
    bgGradient: "from-neutral-800 to-black",
    textColor: "text-white",
    domain: "ironbymironova.com",
  },
  "fmart-by-flowwow": {
    logoUrl: "/brands/fmart.png",
    emoji: "🌸",
    bgGradient: "from-pink-400 to-rose-500",
    textColor: "text-white",
    domain: "flowwow.com",
  },
  "fmart": {
    logoUrl: "/brands/fmart.png",
    emoji: "🌸",
    bgGradient: "from-pink-400 to-rose-500",
    textColor: "text-white",
    domain: "flowwow.com",
  },
  "davines": {
    logoUrl: "https://www.google.com/s2/favicons?domain=davines.ru&sz=128",
    emoji: "🧴",
    bgGradient: "from-stone-700 to-stone-900",
    textColor: "text-white",
    domain: "davines.ru",
  },
  "yamdiet": {
    logoUrl: "https://www.google.com/s2/favicons?domain=yamdiet.com&sz=128",
    emoji: "🥗",
    bgGradient: "from-lime-500 to-green-600",
    textColor: "text-white",
    domain: "yamdiet.com",
  },
  "sberprime": {
    logoUrl: "/brands/sberprime.png",
    emoji: "💚",
    bgGradient: "from-emerald-500 to-green-600",
    textColor: "text-white",
    domain: "sberbank.ru",
  },
  "yandex-travel": {
    logoUrl: "/brands/yandeks-puteshestviya.png",
    emoji: "✈️",
    bgGradient: "from-sky-500 to-blue-600",
    textColor: "text-white",
    domain: "travel.yandex.ru",
  },
  "agni": {
    logoUrl: "https://www.google.com/s2/favicons?domain=agnistore.ru&sz=128",
    emoji: "🕯",
    bgGradient: "from-amber-600 to-orange-700",
    textColor: "text-white",
    domain: "agnistore.ru",
  },
};

/**
 * Получить мета-данные и логотип магазина с надёжными фоллбэками
 */
export function getBrandMeta(storeSlug: string, storeName: string, domain?: string): BrandMeta {
  const slug = (storeSlug || "").toLowerCase().trim();
  const local = LOCAL_BRAND_ICONS[slug];
  if (BRAND_REGISTRY[slug]) {
    return BRAND_REGISTRY[slug];
  }

  const lowerName = (storeName || "").toLowerCase();

  // Автоматическое определение крупных экосистем
  if (slug.includes("sber") || lowerName.includes("сбер")) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=sberbank.ru&sz=128",
      emoji: "💚",
      bgGradient: "from-emerald-500 to-green-600",
      textColor: "text-white",
      domain: "sberbank.ru",
    };
  }
  if (slug === "yandex-knigi" || lowerName.includes("яндекс книги")) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=books.yandex.ru&sz=128",
      emoji: "📚",
      bgGradient: "from-amber-500 to-orange-600",
      textColor: "text-white",
      domain: "books.yandex.ru",
    };
  }
  if (slug === "yandex-music" || lowerName.includes("яндекс музыка")) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=music.yandex.ru&sz=128",
      emoji: "🎵",
      bgGradient: "from-yellow-400 to-amber-500",
      textColor: "text-ink",
      domain: "music.yandex.ru",
    };
  }
  if (slug === "yandex-eda" || lowerName.includes("яндекс еда")) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=eda.yandex.ru&sz=128",
      emoji: "🍔",
      bgGradient: "from-amber-400 to-yellow-500",
      textColor: "text-ink",
      domain: "eda.yandex.ru",
    };
  }
  if (slug.includes("yandex") || lowerName.includes("яндекс")) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=yandex.ru&sz=128",
      emoji: "🟡",
      bgGradient: "from-yellow-400 to-amber-500",
      textColor: "text-ink",
      domain: "yandex.ru",
    };
  }
  if (
    slug.includes("tbank") ||
    slug.includes("tinkoff") ||
    slug.includes("t-puteshestviya") ||
    lowerName.includes("т-банк") ||
    lowerName.includes("тинькофф") ||
    lowerName.includes("т-путешествия")
  ) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=tbank.ru&sz=128",
      emoji: "🏨",
      bgGradient: "from-yellow-400 to-yellow-500",
      textColor: "text-ink",
      domain: "tbank.ru",
    };
  }
  if (slug === "ivi" || lowerName.includes("иви")) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=ivi.ru&sz=128",
      emoji: "🍿",
      bgGradient: "from-rose-600 to-pink-700",
      textColor: "text-white",
      domain: "ivi.ru",
    };
  }
  if (slug.includes("alfa") || lowerName.includes("альфа")) {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=alfabank.ru&sz=128",
      emoji: "🔴",
      bgGradient: "from-red-600 to-red-700",
      textColor: "text-white",
      domain: "alfabank.ru",
    };
  }

  // Если бренд не в реестре, извлекаем домен
  let cleanDomain = domain ? domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "";
  if (!cleanDomain && storeName) {
    cleanDomain = `${storeSlug}.ru`;
  }

  const logoUrl = cleanDomain
    ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
    : "/brands/yandex-market.png";

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
    logoUrl: local || logoUrl,
    emoji: "🏷",
    bgGradient,
    textColor: "text-white",
    domain: cleanDomain,
  };
}
