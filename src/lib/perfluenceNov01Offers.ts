import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Новые и продлённые ноябрьские размещения Perfluence (актуализировано 1 ноября 2026 года).
 * Робот автоматически подтвердил новые публикации для кабинета promofact.ru (Account ID 3074542).
 * Все предложения содержат свежие зарегистрированные токены ОРД и действуют в ноябре 2026 года.
 */

// 1. Магнит Доставка (Project 2582)
const MAGNIT_NOV_LINK = "https://mgntgm.prfl.me/sites/76bbj5?erid=2RanynM1J8j";
const MAGNIT_NOV_ERID = "2RanynM1J8j";
const MAGNIT_NOV_AFFILIATE: Coupon["affiliate"] = {
  link: MAGNIT_NOV_LINK,
  landingLink: MAGNIT_NOV_LINK,
  ordMarker: MAGNIT_NOV_ERID,
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanynM1J8j',
};

// 2. М.Косметик (Project 2548)
const M_KOSMETIK_NOV_LINK = "https://mgntksm1.prfl.me/sites/qk83ya?erid=2RanynNVHR5";
const M_KOSMETIK_NOV_ERID = "2RanynNVHR5";
const M_KOSMETIK_NOV_AFFILIATE: Coupon["affiliate"] = {
  link: M_KOSMETIK_NOV_LINK,
  landingLink: M_KOSMETIK_NOV_LINK,
  ordMarker: M_KOSMETIK_NOV_ERID,
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanynNVHR5',
};

// 3. ФЛАУВАУ (Project 3690)
const FLOWWOW_NOV_LINK = "https://fwow.prfl.me/sites/d69zbt?erid=2RanynRTFym";
const FLOWWOW_NOV_ERID = "2RanynRTFym";
const FLOWWOW_NOV_AFFILIATE: Coupon["affiliate"] = {
  link: FLOWWOW_NOV_LINK,
  landingLink: FLOWWOW_NOV_LINK,
  ordMarker: FLOWWOW_NOV_ERID,
  ordText: 'Реклама. ООО "ФЛАУВАУ", ИНН 9702000880. erid: 2RanynRTFym',
};

// 4. FARFOR (Project 2333)
const FARFOR_NOV_LINK = "https://farfor1.prfl.me/sites/qe18xs?erid=2RanynSwFG7";
const FARFOR_NOV_ERID = "2RanynSwFG7";
const FARFOR_NOV_AFFILIATE: Coupon["affiliate"] = {
  link: FARFOR_NOV_LINK,
  landingLink: FARFOR_NOV_LINK,
  ordMarker: FARFOR_NOV_ERID,
  ordText: 'Реклама. Франчайзинговая сеть FARFOR. erid: 2RanynSwFG7',
};

// 5. SUNLIGHT (Project 1100)
const SUNLIGHT_NOV_LINK = "https://sunlight.prfl.me/sites/4ueo1n?erid=2RanynGZLHh";
const SUNLIGHT_NOV_ERID = "2RanynGZLHh";
const SUNLIGHT_NOV_AFFILIATE: Coupon["affiliate"] = {
  link: SUNLIGHT_NOV_LINK,
  landingLink: SUNLIGHT_NOV_LINK,
  ordMarker: SUNLIGHT_NOV_ERID,
  ordText: 'Реклама. ООО «Солнечный Свет», ИНН 7724261252. erid: 2RanynGZLHh',
};

// 6. Geltek (Project 4338)
const GELTEK_NOV_LINK = "https://geltek.prfl.me/sites/kznn26?erid=2RanynUREYT";
const GELTEK_NOV_ERID = "2RanynUREYT";
const GELTEK_NOV_AFFILIATE: Coupon["affiliate"] = {
  link: GELTEK_NOV_LINK,
  landingLink: GELTEK_NOV_LINK,
  ordMarker: GELTEK_NOV_ERID,
  ordText: 'Реклама. ООО «Гельтек-Медика», ИНН 7724181822. erid: 2RanynUREYT',
};

// 7. Плати по всему миру (Project 4362)
const PLATIPOMIRU_NOV_LINK = "https://platipomiru.prfl.me/sites/84v6et?erid=2RanynVuDpo";
const PLATIPOMIRU_NOV_ERID = "2RanynVuDpo";
const PLATIPOMIRU_NOV_AFFILIATE: Coupon["affiliate"] = {
  link: PLATIPOMIRU_NOV_LINK,
  landingLink: PLATIPOMIRU_NOV_LINK,
  ordMarker: PLATIPOMIRU_NOV_ERID,
  ordText: 'Реклама. Сервис «Плати по всему миру». erid: 2RanynVuDpo',
};

export const PERFLUENCE_NOV01_OFFERS: Coupon[] = [
  // --- МАГНИТ ДОСТАВКА ---
  {
    id: 258201,
    promocode: {
      id: 258201,
      code: "25GFC1TL4",
      bonusName: "Скидка 31% на первый заказ от 2 000 ₽ в разделе «Гипермаркет»",
      terms: "Промокод 25GFC1TL4: скидка 31% на первый заказ от 2 000 ₽ в разделе «Гипермаркет» в приложении «Магнит Доставка» для новых клиентов. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 2000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["magnit-dostavka"],
      activeBloggers: STABLE_STORES["magnit-dostavka"].activeBloggers ?? 0,
    },
    affiliate: MAGNIT_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 258202,
    promocode: {
      id: 258202,
      code: "Дождь",
      bonusName: "Скидка 31% на каждый заказ от 1 700 / 2 500 ₽ в Магнит Доставка",
      terms: "Промокод Дождь: скидка 31% на каждый заказ от 1 700 ₽ в разделе «Экспресс» или от 2 500 ₽ в разделе «Гипермаркет» из специальной подборки «Магнит». Действует до 3 ноября 2026 года 23:59.",
      expires: "2026-11-03T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "На каждый заказ",
      minimumOrder: { value: 1700, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["magnit-dostavka"],
      activeBloggers: STABLE_STORES["magnit-dostavka"].activeBloggers ?? 0,
    },
    affiliate: MAGNIT_NOV_AFFILIATE,
    extraLinks: [],
  },

  // --- М.КОСМЕТИК ---
  {
    id: 254801,
    promocode: {
      id: 254801,
      code: "Дождь",
      bonusName: "Скидка 41% от 1 500 ₽ на каждый заказ в М.Косметик",
      terms: "Промокод Дождь: скидка 41% на каждый заказ от 1 500 ₽ из подборки «Магнит» в разделе М.Косметик приложения «Магнит Доставка». Действует до 3 ноября 2026 года 23:59.",
      expires: "2026-11-03T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "На каждый заказ",
      minimumOrder: { value: 1500, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["m-kosmetik"],
      activeBloggers: STABLE_STORES["m-kosmetik"].activeBloggers ?? 0,
    },
    affiliate: M_KOSMETIK_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 254802,
    promocode: {
      id: 254802,
      code: "PK4GMWJUK",
      bonusName: "Скидка 36% на первый заказ от 1 200 ₽ в М.Косметик",
      terms: "Промокод PK4GMWJUK: скидка 36% на первый заказ от 1 200 ₽ в приложении «Магнит Доставка» в разделе М.Косметик. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 1200, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["m-kosmetik"],
      activeBloggers: STABLE_STORES["m-kosmetik"].activeBloggers ?? 0,
    },
    affiliate: M_KOSMETIK_NOV_AFFILIATE,
    extraLinks: [],
  },

  // --- ФЛАУВАУ ---
  {
    id: 369001,
    promocode: {
      id: 369001,
      code: "FP3xmsy",
      bonusName: "Скидка 20% на первый заказ на все категории от 3 000 ₽",
      terms: "Промокод FP3xmsy: скидка 20% на первую покупку от 3 000 ₽ на все категории товаров в мобильном приложении Flowwow (цветы, подарки, авторские десерты, декор). Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["flowwow"],
      activeBloggers: STABLE_STORES["flowwow"].activeBloggers ?? 0,
    },
    affiliate: FLOWWOW_NOV_AFFILIATE,
    extraLinks: [],
  },

  // --- FARFOR ---
  {
    id: 233301,
    promocode: {
      id: 233301,
      code: "YMM14572",
      bonusName: "Скидка 500 ₽ на любой заказ от 1 890 ₽ в FARFOR",
      terms: "Промокод YMM14572: скидка 500 ₽ на один любой заказ от 1 890 ₽ при заказе на сайте или в мобильном приложении FARFOR. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      minimumOrder: { value: 1890, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["farfor"],
      activeBloggers: STABLE_STORES["farfor"].activeBloggers ?? 0,
    },
    affiliate: FARFOR_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 233302,
    promocode: {
      id: 233302,
      code: "DLD84449",
      bonusName: "Скидка 15% на любой заказ от 2 290 ₽ в FARFOR",
      terms: "Промокод DLD84449: скидка 15% на один любой заказ от 2 290 ₽ в FARFOR. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      minimumOrder: { value: 2290, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["farfor"],
      activeBloggers: STABLE_STORES["farfor"].activeBloggers ?? 0,
    },
    affiliate: FARFOR_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 233303,
    promocode: {
      id: 233303,
      code: "XVF29646",
      bonusName: "🎁 Пицца «Ветчина и грибы» в подарок от 1 290 ₽",
      terms: "Промокод XVF29646: аппетитная пицца «Ветчина и грибы» в подарок при каждом повторном заказе от 1 290 ₽ в FARFOR. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Повторный заказ",
      minimumOrder: { value: 1290, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["farfor"],
      activeBloggers: STABLE_STORES["farfor"].activeBloggers ?? 0,
    },
    affiliate: FARFOR_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 233304,
    promocode: {
      id: 233304,
      code: "ZDZ99554",
      bonusName: "🎁 Сет «Запеченный» в подарок от 599 ₽ на первый заказ",
      terms: "Промокод ZDZ99554: фирменный сет «Запеченный» в подарок при первом заказе от 599 ₽ в FARFOR. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 599, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["farfor"],
      activeBloggers: STABLE_STORES["farfor"].activeBloggers ?? 0,
    },
    affiliate: FARFOR_NOV_AFFILIATE,
    extraLinks: [],
  },

  // --- SUNLIGHT ---
  {
    id: 110001,
    promocode: {
      id: 110001,
      code: "pfnn153513",
      bonusName: "Скидка 1 500 ₽ от 5 000 ₽ на весь ассортимент SUNLIGHT",
      terms: "Промокод pfnn153513: скидка 1 500 ₽ при заказе от 5 000 ₽ на весь ассортимент ювелирных изделий для новых пользователей. Действует до 10 ноября 2026 года 23:59.",
      expires: "2026-11-10T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Новый клиент",
      minimumOrder: { value: 5000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"].activeBloggers ?? 0,
    },
    affiliate: SUNLIGHT_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 110002,
    promocode: {
      id: 110002,
      code: "pfn324613",
      bonusName: "Скидка 3 000 ₽ от 30 000 ₽ для всех покупателей SUNLIGHT",
      terms: "Промокод pfn324613: скидка 3 000 ₽ при заказе от 30 000 ₽ на все украшения для всех клиентов. Действует до 10 ноября 2026 года 23:59.",
      expires: "2026-11-10T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      minimumOrder: { value: 30000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"].activeBloggers ?? 0,
    },
    affiliate: SUNLIGHT_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 110003,
    promocode: {
      id: 110003,
      code: "pfnn556373",
      bonusName: "Скидка 5 000 ₽ от 30 000 ₽ для новых клиентов SUNLIGHT",
      terms: "Промокод pfnn556373: скидка 5 000 ₽ при заказе от 30 000 ₽ на весь ассортимент для новых пользователей. Действует до 10 ноября 2026 года 23:59.",
      expires: "2026-11-10T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Новый клиент",
      minimumOrder: { value: 30000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"].activeBloggers ?? 0,
    },
    affiliate: SUNLIGHT_NOV_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 110004,
    promocode: {
      id: 110004,
      code: "pfn843468",
      bonusName: "Скидка 8 000 ₽ от 80 000 ₽ для всех покупателей SUNLIGHT",
      terms: "Промокод pfn843468: скидка 8 000 ₽ при покупке от 80 000 ₽ на весь ассортимент ювелирных изделий для всех клиентов. Действует до 10 ноября 2026 года 23:59.",
      expires: "2026-11-10T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      minimumOrder: { value: 80000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"].activeBloggers ?? 0,
    },
    affiliate: SUNLIGHT_NOV_AFFILIATE,
    extraLinks: [],
  },

  // --- GELTEK ---
  {
    id: 433801,
    promocode: {
      id: 433801,
      code: "WOW-L6DH",
      bonusName: "Скидка 20% на первый и все повторные заказы онлайн в Geltek",
      terms: "Промокод WOW-L6DH: скидка 20% на весь ассортимент косметики и средств диагностики кожи при заказе онлайн на официальном сайте Geltek. Действует на первый и повторные заказы до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["geltek"],
      activeBloggers: STABLE_STORES["geltek"].activeBloggers ?? 0,
    },
    affiliate: GELTEK_NOV_AFFILIATE,
    extraLinks: [],
  },

  // --- ПЛАТИ ПО ВСЕМУ МИРУ ---
  {
    id: 436201,
    promocode: {
      id: 436201,
      code: "",
      bonusName: "Оформление международных карт для зарубежных оплат",
      terms: "Оформление виртуальных и пластиковых зарубежных карт для оплаты иностранных сервисов, подписок, бронирования отелей и покупок за рубежом. Официальный партнерский переход с гарантией безопасности.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["platipomiru"],
      activeBloggers: STABLE_STORES["platipomiru"].activeBloggers ?? 0,
    },
    affiliate: PLATIPOMIRU_NOV_AFFILIATE,
    extraLinks: [],
  },
];
