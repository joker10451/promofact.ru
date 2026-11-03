import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Ноябрьские предложения Perfluence от 3 ноября 2026 года.
 * 1. FARFOR (Project 2333, Post 17394247, promofact.ru)
 *    - Обязательная формулировка рекламодателя: «Сет „Запеченный“ за 599 ₽ для новых клиентов»
 *    - Токен ОРД: 2RanynrCMDN
 * 2. Start.ru (Project 1623, Post 17394251 на сайте, Post 17394252 в Telegram)
 *    - Флеш-акция 3–4 ноября: 14 дней бесплатного доступа для ВСЕХ пользователей
 *    - Токен ОРД (сайт): 2RanynveK4Q
 */

// --- 1. FARFOR ---
export const FARFOR_NOV03_LINK = "https://farfor1.prfl.me/sites/yhqjxe?erid=2RanynrCMDN";
export const FARFOR_NOV03_ERID = "2RanynrCMDN";
export const FARFOR_NOV03_LEGAL = 'Реклама. ООО "Фарфор Франчайзинг", ИНН 0276147339. erid: 2RanynrCMDN';

const FARFOR_NOV03_AFFILIATE: Coupon["affiliate"] = {
  link: FARFOR_NOV03_LINK,
  landingLink: FARFOR_NOV03_LINK,
  ordMarker: FARFOR_NOV03_ERID,
  ordText: FARFOR_NOV03_LEGAL,
};

// --- 2. START.RU ---
export const START_NOV03_LINK = "https://start.prfl.me/sites/u122ze?erid=2RanynveK4Q";
export const START_NOV03_ERID = "2RanynveK4Q";
export const START_NOV03_LEGAL = 'Реклама. ООО "СТАРТ.РУ", ИНН 7728374780. erid: 2RanynveK4Q';

export const START_NOV03_TG_LINK = "https://start.prfl.me/smart_zakupka/za77af?erid=2Ranynx8JLk";
export const START_NOV03_TG_ERID = "2Ranynx8JLk";
export const START_NOV03_TG_LEGAL = 'Реклама. ООО "СТАРТ.РУ", ИНН 7728374780. erid: 2Ranynx8JLk';

const START_NOV03_AFFILIATE: Coupon["affiliate"] = {
  link: START_NOV03_LINK,
  landingLink: START_NOV03_LINK,
  ordMarker: START_NOV03_ERID,
  ordText: START_NOV03_LEGAL,
};

export const PERFLUENCE_NOV03_OFFERS: Coupon[] = [
  // --- FARFOR: 5 актуальных предложений ---
  {
    id: 233311,
    promocode: {
      id: 233311,
      code: "ZDZ99554",
      bonusName: "Сет «Запеченный» за 599 ₽ для новых клиентов",
      terms: "Промокод ZDZ99554: Сет «Запеченный» за 599 ₽ для новых клиентов в доставке FARFOR. Действует при первом заказе. Срок действия до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Новые клиенты",
      minimumOrder: { value: 599, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["farfor"],
      activeBloggers: STABLE_STORES["farfor"]?.activeBloggers ?? 1420,
    },
    affiliate: FARFOR_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 233312,
    promocode: {
      id: 233312,
      code: "YMM14572",
      bonusName: "Скидка 500 ₽ от 1 890 ₽ на любой заказ в FARFOR",
      terms: "Промокод YMM14572: скидка 500 ₽ на один любой заказ от 1 890 ₽ на сайте или в мобильном приложении FARFOR. Действует до 30 ноября 2026 года 23:59.",
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
      activeBloggers: STABLE_STORES["farfor"]?.activeBloggers ?? 1420,
    },
    affiliate: FARFOR_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 233313,
    promocode: {
      id: 233313,
      code: "DLD84449",
      bonusName: "Скидка 15% от 2 290 ₽ на любой заказ в FARFOR",
      terms: "Промокод DLD84449: скидка 15% на один любой заказ от 2 290 ₽ в ресторане доставки FARFOR. Действует до 30 ноября 2026 года 23:59.",
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
      activeBloggers: STABLE_STORES["farfor"]?.activeBloggers ?? 1420,
    },
    affiliate: FARFOR_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 233314,
    promocode: {
      id: 233314,
      code: "RHK52523",
      bonusName: "🎁 Ролл «Такуаб» в подарок при каждом заказе от 1 290 ₽",
      terms: "Промокод RHK52523: вкусный ролл «Такуаб» в подарок при каждом повторном заказе от 1 290 ₽ в FARFOR. Действует до 30 ноября 2026 года 23:59.",
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
      activeBloggers: STABLE_STORES["farfor"]?.activeBloggers ?? 1420,
    },
    affiliate: FARFOR_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 233315,
    promocode: {
      id: 233315,
      code: "XVF29646",
      bonusName: "🎁 Пицца «Ветчина и грибы» в подарок от 1 290 ₽",
      terms: "Промокод XVF29646: пицца «Ветчина и грибы» в подарок при каждом повторном заказе от 1 290 ₽ в FARFOR. Действует до 30 ноября 2026 года 23:59.",
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
      activeBloggers: STABLE_STORES["farfor"]?.activeBloggers ?? 1420,
    },
    affiliate: FARFOR_NOV03_AFFILIATE,
    extraLinks: [],
  },

  // --- START.RU: Флеш-акция на 14 дней бесплатно для всех ---
  {
    id: 162301,
    promocode: {
      id: 162301,
      code: "pf22sc65m8q6",
      bonusName: "🔥 14 дней бесплатного доступа для ВСЕХ пользователей в онлайн-кинотеатре START",
      terms: "Эксклюзивная флеш-акция 3 и 4 ноября: 14 дней бесплатного доступа к видеосервису START по промокоду pf22sc65m8q6. Доступно для ВСЕХ пользователей (как новых, так и ранее зарегистрированных). Далее подписка продлевается за 499 ₽/мес., отменить можно в любой момент. Акция действует строго до 4 ноября 2026 года 23:59 МСК.",
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
      ...STABLE_STORES["start-ru"],
      activeBloggers: STABLE_STORES["start-ru"]?.activeBloggers ?? 3580,
    },
    affiliate: START_NOV03_AFFILIATE,
    extraLinks: [],
  },
];
