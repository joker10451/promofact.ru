import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Ноябрьские предложения Perfluence от 4 ноября 2026 года.
 * 1. COZY HOME на Ozon / WB (Project 3641, Post 17399885 на сайте, Post 17399892 в Telegram)
 * 2. FMART by flowwow (Project 4579, Post 17399893 на сайте, Post 17399894 в Telegram)
 * 3. Подружка (Project 2657, Post 17399896 на сайте)
 * 4. Авито Путешествия (Project 3161, Post 17399897 на сайте, Post 17399898 в Telegram)
 */

// --- 1. COZY HOME ---
export const COZY_HOME_NOV04_LINK = "https://cozyhome.prfl.me/sites/zgaia6?erid=2RanymUAhUp";
export const COZY_HOME_NOV04_ERID = "2RanymUAhUp";
export const COZY_HOME_NOV04_LEGAL = 'Реклама. Рекламодатель ООО "ТК КОУЗИ ХОУМ", ИНН 7743238687 erid: 2RanymUAhUp';

export const COZY_HOME_NOV04_TG_LINK = "https://cozyhome.prfl.me/smart_zakupka/6xdmrw?erid=2RanymhWb1v";
export const COZY_HOME_NOV04_TG_ERID = "2RanymhWb1v";
export const COZY_HOME_NOV04_TG_LEGAL = 'Реклама. Рекламодатель ООО "ТК КОУЗИ ХОУМ", ИНН 7743238687 erid: 2RanymhWb1v';

const COZY_HOME_NOV04_AFFILIATE: Coupon["affiliate"] = {
  link: COZY_HOME_NOV04_LINK,
  landingLink: COZY_HOME_NOV04_LINK,
  ordMarker: COZY_HOME_NOV04_ERID,
  ordText: COZY_HOME_NOV04_LEGAL,
};

// --- 2. FMART BY FLOWWOW ---
export const FMART_NOV04_LINK = "https://fmart-flowers.prfl.me/sites/ajp7rz?erid=2RanyoC2SVJ";
export const FMART_NOV04_ERID = "2RanyoC2SVJ";
export const FMART_NOV04_LEGAL = 'Реклама. ООО "ФМАРТ" ОГРН 1237700524060 г. Москва erid: 2RanyoC2SVJ';

export const FMART_NOV04_TG_LINK = "https://fmart-flowers.prfl.me/smart_zakupka/6xnxce?erid=2RanymkUZac";
export const FMART_NOV04_TG_ERID = "2RanymkUZac";
export const FMART_NOV04_TG_LEGAL = 'Реклама. ООО "ФМАРТ" ОГРН 1237700524060 г. Москва erid: 2RanymkUZac';

const FMART_NOV04_AFFILIATE: Coupon["affiliate"] = {
  link: FMART_NOV04_LINK,
  landingLink: FMART_NOV04_LINK,
  ordMarker: FMART_NOV04_ERID,
  ordText: FMART_NOV04_LEGAL,
};

// --- 3. ПОДРУЖКА ---
export const PODRUZHKA_NOV04_LINK = "https://podrygka.prfl.me/sites/hqh59i?erid=2RanymmxYrx";
export const PODRUZHKA_NOV04_ERID = "2RanymmxYrx";
export const PODRUZHKA_NOV04_LEGAL = 'Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2RanymmxYrx';

const PODRUZHKA_NOV04_AFFILIATE: Coupon["affiliate"] = {
  link: PODRUZHKA_NOV04_LINK,
  landingLink: PODRUZHKA_NOV04_LINK,
  ordMarker: PODRUZHKA_NOV04_ERID,
  ordText: PODRUZHKA_NOV04_LEGAL,
};

// --- 4. АВИТО ПУТЕШЕСТВИЯ ---
export const AVITO_NOV04_LINK = "https://avito.prfl.me/sites/uhihic?erid=2RanymoSY9J";
export const AVITO_NOV04_ERID = "2RanymoSY9J";
export const AVITO_NOV04_LEGAL = 'Реклама. ООО "КЕХ еКоммерц", ИНН 7710668349, ОГРН 5077746422859 erid: 2RanymoSY9J';

export const AVITO_NOV04_TG_LINK = "https://avito.prfl.me/smart_zakupka/trc0ju?erid=2RanympvXRe";
export const AVITO_NOV04_TG_ERID = "2RanympvXRe";
export const AVITO_NOV04_TG_LEGAL = 'Реклама. ООО "КЕХ еКоммерц", ИНН 7710668349, ОГРН 5077746422859 erid: 2RanympvXRe';

const AVITO_NOV04_AFFILIATE: Coupon["affiliate"] = {
  link: AVITO_NOV04_LINK,
  landingLink: AVITO_NOV04_LINK,
  ordMarker: AVITO_NOV04_ERID,
  ordText: AVITO_NOV04_LEGAL,
};

export const PERFLUENCE_NOV04_OFFERS: Coupon[] = [
  // ================= COZY HOME =================
  {
    id: 364101,
    promocode: {
      id: 364101,
      code: "SZHM11B8A321",
      bonusName: "Скидка 20% на каждый заказ Cozy Home на Ozon",
      terms: "Флеш-акция только 4 ноября 2026 года: скидка 20% на текстиль, одежду и декор для дома Cozy Home на каждый заказ на Ozon по промокоду SZHM11B8A321. Действует до 4 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-04T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех пользователей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["cozy-home"],
      activeBloggers: STABLE_STORES["cozy-home"]?.activeBloggers ?? 520,
    },
    affiliate: COZY_HOME_NOV04_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 364102,
    promocode: {
      id: 364102,
      code: "VUM8KSR3",
      bonusName: "Скидка 20% на каждый заказ Cozy Home на Wildberries",
      terms: "Флеш-акция только 4 ноября 2026 года: скидка 20% на товары бренда Cozy Home на каждый заказ на Wildberries по промокоду VUM8KSR3. Действует до 4 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-04T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех пользователей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["cozy-home"],
      activeBloggers: STABLE_STORES["cozy-home"]?.activeBloggers ?? 520,
    },
    affiliate: COZY_HOME_NOV04_AFFILIATE,
    extraLinks: [],
  },

  // ================= FMART BY FLOWWOW =================
  {
    id: 457901,
    promocode: {
      id: 457901,
      code: "FMARTPE70082e34",
      bonusName: "Скидка 700 ₽ на заказ от 3 000 ₽ в FMART",
      terms: "Промокод FMARTPE70082e34: скидка 700 ₽ на первый или один повторный заказ от 3 000 ₽ в сервисе доставки цветов и подарков FMART by flowwow. Действует до 30 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Первый или повторный заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["fmart"],
      activeBloggers: STABLE_STORES["fmart"]?.activeBloggers ?? 380,
    },
    affiliate: FMART_NOV04_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 457902,
    promocode: {
      id: 457902,
      code: "FMARTPE18x4eaz",
      bonusName: "Скидка 18% на заказ цветов и подарков в FMART",
      terms: "Промокод FMARTPE18x4eaz: скидка 18% на первый или один повторный заказ цветов и подарков в FMART by flowwow. Действует до 30 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Первый или повторный заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["fmart"],
      activeBloggers: STABLE_STORES["fmart"]?.activeBloggers ?? 380,
    },
    affiliate: FMART_NOV04_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 457903,
    promocode: {
      id: 457903,
      code: "fmpez28xd",
      bonusName: "Флеш-акция: Бесплатная доставка на заказ в FMART",
      terms: "Флеш-акция с 10 по 13 ноября 2026 года! Промокод fmpez28xd даёт бесплатную доставку на первый или один повторный заказ цветов и подарков в FMART by flowwow в пределах стандартной зоны доставки. Действует до 13 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-13T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Первый или повторный заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["fmart"],
      activeBloggers: STABLE_STORES["fmart"]?.activeBloggers ?? 380,
    },
    affiliate: FMART_NOV04_AFFILIATE,
    extraLinks: [],
  },

  // ================= ПОДРУЖКА =================
  {
    id: 265701,
    promocode: {
      id: 265701,
      code: "2921060875255",
      bonusName: "Скидка 30% на всё + кэшбэк 40% от Т-Банка",
      terms: "Штрихкод / промокод 2921060875255: скидка 30% на первый и все повторные заказы онлайн и в розничных магазинах «Подружка» без минимальной суммы заказа до 30 ноября 2026 года. Только 4 ноября суммируется с кэшбэком 40% от Т-Банка при покупке от 1 200 ₽!",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех пользователей",
      region: "RU",
      isBarcode: true,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["podruzhka"],
      activeBloggers: STABLE_STORES["podruzhka"]?.activeBloggers ?? 2140,
    },
    affiliate: PODRUZHKA_NOV04_AFFILIATE,
    extraLinks: [],
  },

  // ================= АВИТО ПУТЕШЕСТВИЯ =================
  {
    id: 316101,
    promocode: {
      id: 316101,
      code: "AVITO10",
      bonusName: "Скидка 10% на бронирование жилья (до 3 000 ₽)",
      terms: "Флеш-акция в Авито Путешествия с 4 по 8 ноября 2026 года: скидка 10% на одно бронирование посуточного жилья (отели, квартиры, дома). Максимальная скидка — 3 000 ₽. Скидка применяется автоматически при бронировании по специальной партнерской ссылке.",
      expires: "2026-11-08T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех пользователей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["avito-puteshestviya"],
      activeBloggers: STABLE_STORES["avito-puteshestviya"]?.activeBloggers ?? 1890,
    },
    affiliate: AVITO_NOV04_AFFILIATE,
    extraLinks: [],
  },
];
