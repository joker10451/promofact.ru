import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Ноябрьские предложения Perfluence от 3 ноября 2026 года.
 * 1. FARFOR (Project 2333, Post 17394247, promofact.ru)
 * 2. Start.ru (Project 1623, Post 17394251 на сайте, Post 17394252 в Telegram)
 * 3. Перекрёсток Доставка (Project 4328, Post 17395325 на сайте, Post 17395324 в Telegram)
 * 4. Librederm Ozon (Project 3807, Post 17395326, promofact.ru)
 * 5. Важная Рыба (Project 1977, Post 17395323 на сайте, Post 17395322 в Telegram)
 * 6. RUTUBE (Project 3758, Post 17395328 на сайте, Post 17395327 в Telegram)
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

// --- 3. ПЕРЕКРЁСТОК ДОСТАВКА ---
export const PEREKRESTOK_NOV03_LINK = "https://perekrestok.prfl.me/sites/fciupl?erid=2RanynvigKW";
export const PEREKRESTOK_NOV03_ERID = "2RanynvigKW";
export const PEREKRESTOK_NOV03_LEGAL = 'Реклама. ООО "ИКС 5 ДИДЖИТАЛ", ИНН 9722010808 erid: 2RanynvigKW';

export const PEREKRESTOK_NOV03_TG_LINK = "https://perekrestok.prfl.me/smart_zakupka/hd4r4n?erid=2RanynuEh3A";
export const PEREKRESTOK_NOV03_TG_ERID = "2RanynuEh3A";
export const PEREKRESTOK_NOV03_TG_LEGAL = 'Реклама. ООО "ИКС 5 ДИДЖИТАЛ", ИНН 9722010808 erid: 2RanynuEh3A';

const PEREKRESTOK_NOV03_AFFILIATE: Coupon["affiliate"] = {
  link: PEREKRESTOK_NOV03_LINK,
  landingLink: PEREKRESTOK_NOV03_LINK,
  ordMarker: PEREKRESTOK_NOV03_ERID,
  ordText: PEREKRESTOK_NOV03_LEGAL,
};

// --- 4. LIBREDERM OZON ---
export const LIBREDERM_NOV03_LINK = "https://librederm2.prfl.me/sites/hkhgrh?erid=2RanykUPCJY";
export const LIBREDERM_NOV03_ERID = "2RanykUPCJY";
export const LIBREDERM_NOV03_LEGAL = 'Реклама. ООО "БИОФАРМРУС" ИНН 5036098060 erid: 2RanykUPCJY';

const LIBREDERM_NOV03_AFFILIATE: Coupon["affiliate"] = {
  link: LIBREDERM_NOV03_LINK,
  landingLink: LIBREDERM_NOV03_LINK,
  ordMarker: LIBREDERM_NOV03_ERID,
  ordText: LIBREDERM_NOV03_LEGAL,
};

// --- 5. ВАЖНАЯ РЫБА ---
export const VAZHNAYA_RYBA_NOV03_LINK = "https://vipfish1.prfl.me/sites/w3rn74?erid=2Ranynskhkp";
export const VAZHNAYA_RYBA_NOV03_ERID = "2Ranynskhkp";
export const VAZHNAYA_RYBA_NOV03_LEGAL = 'Реклама. ООО «КЕЙТЕРИНГ-РЕНТ», ИНН 7804597213. erid: 2Ranynskhkp';

export const VAZHNAYA_RYBA_NOV03_TG_LINK = "https://vipfish1.prfl.me/smart_zakupka/z0gpp2?erid=2RanynrGiUU";
export const VAZHNAYA_RYBA_NOV03_TG_ERID = "2RanynrGiUU";
export const VAZHNAYA_RYBA_NOV03_TG_LEGAL = 'Реклама. ООО «КЕЙТЕРИНГ-РЕНТ», ИНН 7804597213. erid: 2RanynrGiUU';

const VAZHNAYA_RYBA_NOV03_AFFILIATE: Coupon["affiliate"] = {
  link: VAZHNAYA_RYBA_NOV03_LINK,
  landingLink: VAZHNAYA_RYBA_NOV03_LINK,
  ordMarker: VAZHNAYA_RYBA_NOV03_ERID,
  ordText: VAZHNAYA_RYBA_NOV03_LEGAL,
};

// --- 6. RUTUBE ---
export const RUTUBE_NOV03_LINK = "https://rutube1years.prfl.me/sites/b7bi7g?erid=2RanykXMAsE";
export const RUTUBE_NOV03_ERID = "2RanykXMAsE";
export const RUTUBE_NOV03_LEGAL = 'Реклама. Рекламодатель: ООО "Руформ" 16+ ИНН 7714886605 erid: 2RanykXMAsE';

export const RUTUBE_NOV03_TG_LINK = "https://rutube1years.prfl.me/smart_zakupka/7pr7p8?erid=2RanykVsBat";
export const RUTUBE_NOV03_TG_ERID = "2RanykVsBat";
export const RUTUBE_NOV03_TG_LEGAL = 'Реклама. Рекламодатель: ООО "Руформ" 16+ ИНН 7714886605 erid: 2RanykVsBat';

const RUTUBE_NOV03_AFFILIATE: Coupon["affiliate"] = {
  link: RUTUBE_NOV03_LINK,
  landingLink: RUTUBE_NOV03_LINK,
  ordMarker: RUTUBE_NOV03_ERID,
  ordText: RUTUBE_NOV03_LEGAL,
};

export const PERFLUENCE_NOV03_OFFERS: Coupon[] = [
  // ================= FARFOR =================
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

  // ================= START.RU =================
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

  // ================= ПЕРЕКРЁСТОК ДОСТАВКА =================
  {
    id: 432801,
    promocode: {
      id: 432801,
      code: "1975VWVT7",
      bonusName: "Скидка 99% на категорию «Готовая еда» от 1 000 ₽",
      terms: "Промокод 1975VWVT7 даёт скидку 99% на готовую кулинарию при первом заказе от 1 000 ₽ в приложении «Перекрёсток Доставка». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 1000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["perekrestok-dostavka"],
      activeBloggers: STABLE_STORES["perekrestok-dostavka"]?.activeBloggers ?? 2840,
    },
    affiliate: PEREKRESTOK_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 432802,
    promocode: {
      id: 432802,
      code: "198N7PARH",
      bonusName: "Скидка 750 ₽ от 1 500 ₽ на первый заказ",
      terms: "Промокод 198N7PARH: скидка 750 ₽ на первый заказ от 1 500 ₽ в сервисе «Перекрёсток Доставка». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 1500, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["perekrestok-dostavka"],
      activeBloggers: STABLE_STORES["perekrestok-dostavka"]?.activeBloggers ?? 2840,
    },
    affiliate: PEREKRESTOK_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 432803,
    promocode: {
      id: 432803,
      code: "195GYDL34",
      bonusName: "Скидка 40% от 1 500 ₽ на первый заказ",
      terms: "Промокод 195GYDL34: скидка 40% на первый заказ от 1 500 ₽ в приложении «Перекрёсток Доставка». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 1500, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["perekrestok-dostavka"],
      activeBloggers: STABLE_STORES["perekrestok-dostavka"]?.activeBloggers ?? 2840,
    },
    affiliate: PEREKRESTOK_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 432804,
    promocode: {
      id: 432804,
      code: "196DULY6U",
      bonusName: "Скидка 300 ₽ от 1 200 ₽ на первый заказ",
      terms: "Промокод 196DULY6U: скидка 300 ₽ на первый заказ продуктов от 1 200 ₽ в приложении «Перекрёсток Доставка». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
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
      ...STABLE_STORES["perekrestok-dostavka"],
      activeBloggers: STABLE_STORES["perekrestok-dostavka"]?.activeBloggers ?? 2840,
    },
    affiliate: PEREKRESTOK_NOV03_AFFILIATE,
    extraLinks: [],
  },

  // ================= LIBREDERM OZON =================
  {
    id: 380701,
    promocode: {
      id: 380701,
      code: "FD3FE2AA13BA",
      bonusName: "Скидка 20% на первый и повторные заказы косметики Librederm на Ozon",
      terms: "Промокод FD3FE2AA13BA даёт скидку 20% на весь выделенный ассортимент косметических средств Librederm в официальном магазине на Ozon. Действует как на первый, так и на все повторные заказы до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["librederm"],
      activeBloggers: STABLE_STORES["librederm"]?.activeBloggers ?? 1150,
    },
    affiliate: LIBREDERM_NOV03_AFFILIATE,
    extraLinks: [],
  },

  // ================= ВАЖНАЯ РЫБА =================
  {
    id: 197701,
    promocode: {
      id: 197701,
      code: "SPTB1068",
      bonusName: "Скидка 15% на каждый заказ от 4 299 ₽ в «Важная Рыба»",
      terms: "Промокод SPTB1068: скидка 15% на каждый заказ от 4 299 ₽ в ресторане доставки суши и роллов «Важная Рыба». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех заказов",
      minimumOrder: { value: 4299, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vazhnaya-ryba"],
      activeBloggers: STABLE_STORES["vazhnaya-ryba"]?.activeBloggers ?? 3660,
    },
    affiliate: VAZHNAYA_RYBA_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 197702,
    promocode: {
      id: 197702,
      code: "FRESH2340",
      bonusName: "🎁 Фреш ролл с креветкой и авокадо в подарок от 4 299 ₽",
      terms: "Промокод FRESH2340: нежнейший фреш ролл с креветкой и авокадо в подарок при каждом заказе от 4 299 ₽ в «Важная Рыба». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Подарок к заказу",
      minimumOrder: { value: 4299, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vazhnaya-ryba"],
      activeBloggers: STABLE_STORES["vazhnaya-ryba"]?.activeBloggers ?? 3660,
    },
    affiliate: VAZHNAYA_RYBA_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 197703,
    promocode: {
      id: 197703,
      code: "ЛАЙМ291",
      bonusName: "🎁 Фреш ролл с креветкой и лаймом в подарок от 4 299 ₽",
      terms: "Промокод ЛАЙМ291: фирменный фреш ролл с креветкой и лаймом в подарок при каждом заказе от 4 299 ₽ в «Важная Рыба». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Подарок к заказу",
      minimumOrder: { value: 4299, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vazhnaya-ryba"],
      activeBloggers: STABLE_STORES["vazhnaya-ryba"]?.activeBloggers ?? 3660,
    },
    affiliate: VAZHNAYA_RYBA_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 197704,
    promocode: {
      id: 197704,
      code: "УГОРЬ549",
      bonusName: "🎁 Запеченный ролл «Угорь» в подарок от 3 999 ₽",
      terms: "Промокод УГОРЬ549: аппетитный запеченный ролл «Угорь» в подарок при заказе от 3 999 ₽ в «Важная Рыба». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Подарок к заказу",
      minimumOrder: { value: 3999, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vazhnaya-ryba"],
      activeBloggers: STABLE_STORES["vazhnaya-ryba"]?.activeBloggers ?? 3660,
    },
    affiliate: VAZHNAYA_RYBA_NOV03_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 197705,
    promocode: {
      id: 197705,
      code: "ТЕМПУРА291",
      bonusName: "🎁 Ролл с креветкой темпура и соусом манго в подарок от 2 999 ₽",
      terms: "Промокод ТЕМПУРА291: хрустящий ролл с креветкой темпура и манго в подарок при первом заказе от 2 999 ₽ в «Важная Рыба». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 2999, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vazhnaya-ryba"],
      activeBloggers: STABLE_STORES["vazhnaya-ryba"]?.activeBloggers ?? 3660,
    },
    affiliate: VAZHNAYA_RYBA_NOV03_AFFILIATE,
    extraLinks: [],
  },

  // ================= RUTUBE =================
  {
    id: 375801,
    promocode: {
      id: 375801,
      code: "RUTUBE1YEAR",
      bonusName: "До 365 дней доступа к RUTUBE + PREMIER всего за 1 ₽",
      terms: "Специальная акция: до 365 дней (1 год) доступа к объединенной подписке RUTUBE + PREMIER всего за 1 ₽ для всех пользователей, у которых не было активной подписки более 90 дней. Тысячи фильмов, сериалов и шоу в высоком качестве без рекламы. Далее подписка продлевается по стандартному тарифу 399 ₽/мес.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех без подписки 90+ дней",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["rutube"],
      activeBloggers: STABLE_STORES["rutube"]?.activeBloggers ?? 4200,
    },
    affiliate: RUTUBE_NOV03_AFFILIATE,
    extraLinks: [],
  },
];
