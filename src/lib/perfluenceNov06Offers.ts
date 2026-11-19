import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Ноябрьские предложения и обновлённые промокоды Perfluence от 6 ноября 2026 года.
 * Включает:
 * 1. Яндекс Цветы (Флеш 40% по промокоду mdk403 до 08.11.2026)
 * 2. Librederm OZON (Флеш 30% по промокоду LAAA77B64992 до 09.11.2026)
 * 3. ЛЭТУАЛЬ (Флеш ШАНС 3000 ₽ только 06.11 и НАБЕРИ до 20000 ₽ до 30.11)
 * 4. ВкусВилл Доставка (Свежие ноябрьские промокоды 600 ₽, 350 ₽, 300 ₽)
 * 5. Перекрёсток Доставка (Флеш 650 ₽ по коду 199EMTVUS до 07.11)
 * 6. Яндекс Афиша (Обновлённые промокоды 750 ₽, 400 ₽, 300 ₽, 10% до весны 2027)
 * 7. Туту (Скидки на отели до 2000 ₽ до 30.11)
 * 8. Островок! (Скидка 4% на отели по коду PF4ALL80 до 30.11)
 * 9. Чистая Линия на Ozon (Скидка 15% по коду 15PL до 30.11)
 * 10. Мегамаркет СРА (Скидка по коду 15PRFL до 30.11)
 */

// --- 1. ЯНДЕКС ЦВЕТЫ ---
export const YANDEX_FLOWERS_NOV06_SITE_LINK = "https://yaflowers.prfl.me/sites/koqnjw?erid=2RanykhkmUY";
export const YANDEX_FLOWERS_NOV06_SITE_ERID = "2RanykhkmUY";
export const YANDEX_FLOWERS_NOV06_SITE_LEGAL = 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanykhkmUY';

export const YANDEX_FLOWERS_NOV06_TG_LINK = "https://yaflowers.prfl.me/smart_zakupka/ycfr2h?erid=2RanykgGnCC";
export const YANDEX_FLOWERS_NOV06_TG_ERID = "2RanykgGnCC";
export const YANDEX_FLOWERS_NOV06_TG_LEGAL = 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanykgGnCC';

const YANDEX_FLOWERS_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_FLOWERS_NOV06_SITE_LINK,
  landingLink: YANDEX_FLOWERS_NOV06_SITE_LINK,
  ordMarker: YANDEX_FLOWERS_NOV06_SITE_ERID,
  ordText: YANDEX_FLOWERS_NOV06_SITE_LEGAL,
};

// --- 2. LIBREDERM OZON ---
export const LIBREDERM_OZON_NOV06_SITE_LINK = "https://librederm30.prfl.me/sites/f1lndu?erid=2Ranym5zahi";
export const LIBREDERM_OZON_NOV06_SITE_ERID = "2Ranym5zahi";
export const LIBREDERM_OZON_NOV06_SITE_LEGAL = 'Реклама. ООО "БИОФАРМРУС" ИНН 5036098060 erid: 2Ranym5zahi';

const LIBREDERM_OZON_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: LIBREDERM_OZON_NOV06_SITE_LINK,
  landingLink: LIBREDERM_OZON_NOV06_SITE_LINK,
  ordMarker: LIBREDERM_OZON_NOV06_SITE_ERID,
  ordText: LIBREDERM_OZON_NOV06_SITE_LEGAL,
};

// --- 3. ЗОЛОТОЕ ЯБЛОКО (ДЛЯ TELEGRAM) ---
export const GOLD_APPLE_NOV06_TG_LINK = "https://gldppl.prfl.me/smart_zakupka/ymin1p?erid=2Ranykennur";
export const GOLD_APPLE_NOV06_TG_ERID = "2Ranykennur";
export const GOLD_APPLE_NOV06_TG_LEGAL = 'Реклама. ООО "ЕКАТЕРИНБУРГ ЯБЛОКО", адрес: г. Екатеринбург, ул. Сакко и Ванцетти, 62, ОГРН 1126670019585 erid: 2Ranykennur';

// --- 4. ЛЭТУАЛЬ ---
export const LETUAL_NOV06_SITE_LINK = "https://letu.prfl.me/sites/ga9rax?erid=2RanykjF6Ep";
export const LETUAL_NOV06_SITE_ERID = "2RanykjF6Ep";
export const LETUAL_NOV06_SITE_LEGAL = 'Реклама. ООО "Алькор и Ко", ИНН 7702053280 erid: 2RanykjF6Ep';

const LETUAL_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: LETUAL_NOV06_SITE_LINK,
  landingLink: LETUAL_NOV06_SITE_LINK,
  ordMarker: LETUAL_NOV06_SITE_ERID,
  ordText: LETUAL_NOV06_SITE_LEGAL,
};

// --- 5. ВКУСВИЛЛ ДОСТАВКА ---
export const VKUSVILL_NOV06_SITE_LINK = "https://vksvl.prfl.me/sites/etfzjw?erid=2RanynbTrL4";
export const VKUSVILL_NOV06_SITE_ERID = "2RanynbTrL4";
export const VKUSVILL_NOV06_SITE_LEGAL = 'Реклама. АО "Вкусвилл", ОГРН 1217700253671. erid: 2RanynbTrL4';

const VKUSVILL_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: VKUSVILL_NOV06_SITE_LINK,
  landingLink: VKUSVILL_NOV06_SITE_LINK,
  ordMarker: VKUSVILL_NOV06_SITE_ERID,
  ordText: VKUSVILL_NOV06_SITE_LEGAL,
};

// --- 6. ПЕРЕКРЁСТОК ДОСТАВКА ---
export const PEREKRESTOK_NOV06_SITE_LINK = "https://perekrestok.prfl.me/sites/2gduvk?erid=2RanynLdyWc";
export const PEREKRESTOK_NOV06_SITE_ERID = "2RanynLdyWc";
export const PEREKRESTOK_NOV06_SITE_LEGAL = 'Реклама. ООО "ИКС 5 ДИДЖИТАЛ", ИНН 9722010808 erid: 2RanynLdyWc';

const PEREKRESTOK_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: PEREKRESTOK_NOV06_SITE_LINK,
  landingLink: PEREKRESTOK_NOV06_SITE_LINK,
  ordMarker: PEREKRESTOK_NOV06_SITE_ERID,
  ordText: PEREKRESTOK_NOV06_SITE_LEGAL,
};

// --- 7. ЯНДЕКС АФИША ---
export const YANDEX_AFISHA_NOV06_SITE_LINK = "https://yaafisha.prfl.me/sites/urcykp?erid=2RanynSbxDJ";
export const YANDEX_AFISHA_NOV06_SITE_ERID = "2RanynSbxDJ";
export const YANDEX_AFISHA_NOV06_SITE_LEGAL = 'Реклама. ООО «ЯНДЕКС», ИНН 7736207543 erid: 2RanynSbxDJ';

const YANDEX_AFISHA_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_AFISHA_NOV06_SITE_LINK,
  landingLink: YANDEX_AFISHA_NOV06_SITE_LINK,
  ordMarker: YANDEX_AFISHA_NOV06_SITE_ERID,
  ordText: YANDEX_AFISHA_NOV06_SITE_LEGAL,
};

// --- 8. ТУТУ ---
export const TUTU_NOV06_SITE_LINK = "https://tutuu.prfl.me/smart_zakupka/wqsszn?erid=2RanynX1tV2";
export const TUTU_NOV06_SITE_ERID = "2RanynX1tV2";
export const TUTU_NOV06_SITE_LEGAL = 'Реклама. ООО "Новые Туристские Технологии", ИНН 7724929270 erid: 2RanynX1tV2';

const TUTU_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: TUTU_NOV06_SITE_LINK,
  landingLink: TUTU_NOV06_SITE_LINK,
  ordMarker: TUTU_NOV06_SITE_ERID,
  ordText: TUTU_NOV06_SITE_LEGAL,
};

// --- 9. ОСТРОВОК! ---
export const OSTROVOK_NOV06_SITE_LINK = "https://ostrovok.prfl.me/sites/2yafx1?erid=2RanykdK97S";
export const OSTROVOK_NOV06_SITE_ERID = "2RanykdK97S";
export const OSTROVOK_NOV06_SITE_LEGAL = 'Реклама. ООО "Бронирование гостиниц", ИНН 7703389880 erid: 2RanykdK97S';

const OSTROVOK_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: OSTROVOK_NOV06_SITE_LINK,
  landingLink: OSTROVOK_NOV06_SITE_LINK,
  ordMarker: OSTROVOK_NOV06_SITE_ERID,
  ordText: OSTROVOK_NOV06_SITE_LEGAL,
};

// --- 10. ЧИСТАЯ ЛИНИЯ НА OZON ---
export const PURELINE_NOV06_SITE_LINK = "https://pureline.prfl.me/sites/efkxh3?erid=2Ranykoh45r";
export const PURELINE_NOV06_SITE_ERID = "2Ranykoh45r";
export const PURELINE_NOV06_SITE_LEGAL = 'Реклама. ООО "Арнест ЮниРусь", ИНН 7705353706 erid: 2Ranykoh45r';

const PURELINE_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: PURELINE_NOV06_SITE_LINK,
  landingLink: PURELINE_NOV06_SITE_LINK,
  ordMarker: PURELINE_NOV06_SITE_ERID,
  ordText: PURELINE_NOV06_SITE_LEGAL,
};

// --- 11. МЕГАМАРКЕТ СРА ---
export const MEGAMARKET_NOV06_SITE_LINK = "https://megamarket1.prfl.me/sites/442z68?erid=2Ranym1YxLc";
export const MEGAMARKET_NOV06_SITE_ERID = "2Ranym1YxLc";
export const MEGAMARKET_NOV06_SITE_LEGAL = 'Реклама. ООО "МАРКЕТПЛЕЙС", ИНН 9701048328 erid: 2Ranym1YxLc';

const MEGAMARKET_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: MEGAMARKET_NOV06_SITE_LINK,
  landingLink: MEGAMARKET_NOV06_SITE_LINK,
  ordMarker: MEGAMARKET_NOV06_SITE_ERID,
  ordText: MEGAMARKET_NOV06_SITE_LEGAL,
};

// 11.1 Матрасы Askona 140х200 (Post 17468328)
export const MEGAMARKET_ASKONA_AFFILIATE: Coupon["affiliate"] = {
  link: "https://megamarket1.prfl.me/sites/ks985f?erid=2Ranym5yb24",
  landingLink: "https://megamarket1.prfl.me/sites/ks985f?erid=2Ranym5yb24",
  ordMarker: "2Ranym5yb24",
  ordText: 'Реклама. ООО «МАРКЕТПЛЕЙС», г. Москва, ОГРН: 1167746803180 erid: 2Ranym5yb24',
};

// 11.2 BeFit с кешбэком до 30% (Post 17468329)
export const MEGAMARKET_BEFIT_AFFILIATE: Coupon["affiliate"] = {
  link: "https://megamarket1.prfl.me/sites/inqtfb?erid=2Ranym8wZak",
  landingLink: "https://megamarket1.prfl.me/sites/inqtfb?erid=2Ranym8wZak",
  ordMarker: "2Ranym8wZak",
  ordText: 'Реклама. ООО «МАРКЕТПЛЕЙС», г. Москва, ОГРН: 1167746803180 erid: 2Ranym8wZak',
};

// 11.3 Товары со скидкой 30% - pfnv1134218 (Post 17468330)
export const MEGAMARKET_DISCOUNT30_AFFILIATE: Coupon["affiliate"] = {
  link: "https://megamarket1.prfl.me/sites/4zbr2a?erid=2RanymARYs6",
  landingLink: "https://megamarket1.prfl.me/sites/4zbr2a?erid=2RanymARYs6",
  ordMarker: "2RanymARYs6",
  ordText: 'Реклама. ООО «МАРКЕТПЛЕЙС», г. Москва, ОГРН: 1167746803180 erid: 2RanymARYs6',
};

// 11.4 Randewoo 20% - RNDW20 (Post 17468331)
export const MEGAMARKET_RANDEWOO_AFFILIATE: Coupon["affiliate"] = {
  link: "https://megamarket1.prfl.me/sites/nh657b?erid=2RanymBuY9S",
  landingLink: "https://megamarket1.prfl.me/sites/nh657b?erid=2RanymBuY9S",
  ordMarker: "2RanymBuY9S",
  ordText: 'Реклама. ООО «МАРКЕТПЛЕЙС», г. Москва, ОГРН: 1167746803180 erid: 2RanymBuY9S',
};

// 11.5 Автомобильные шины 20% (Post 17468333)
export const MEGAMARKET_TIRES_AFFILIATE: Coupon["affiliate"] = {
  link: "https://megamarket1.prfl.me/sites/7f31mr?erid=2RanymEsWi8",
  landingLink: "https://megamarket1.prfl.me/sites/7f31mr?erid=2RanymEsWi8",
  ordMarker: "2RanymEsWi8",
  ordText: 'Реклама. ООО «МАРКЕТПЛЕЙС», г. Москва, ОГРН: 1167746803180 erid: 2RanymEsWi8',
};

// 11.6 Зоотовары 20% - ZOO20 (Post 17468334)
export const MEGAMARKET_ZOO_AFFILIATE: Coupon["affiliate"] = {
  link: "https://megamarket1.prfl.me/sites/r8ovx5?erid=2RanymGMVzU",
  landingLink: "https://megamarket1.prfl.me/sites/r8ovx5?erid=2RanymGMVzU",
  ordMarker: "2RanymGMVzU",
  ordText: 'Реклама. ООО «МАРКЕТПЛЕЙС», г. Москва, ОГРН: 1167746803180 erid: 2RanymGMVzU',
};

export const PERFLUENCE_NOV06_OFFERS: Coupon[] = [
  // ================= ЯНДЕКС ЦВЕТЫ =================
  {
    id: 375003,
    promocode: {
      id: 375003,
      code: "mdk403",
      bonusName: "Скидка 40% на первый заказ цветов от 3 000 ₽ (макс. 1 200 ₽)",
      terms: "Горячая флеш-акция в «Яндекс Цветах» с 6 по 8 ноября 2026 года! Промокод mdk403 даёт скидку 40% (максимально до 1 200 ₽) при первом заказе букетов и подарков от 3 000 ₽ через приложение. Скидка полностью суммируется с действующими акциями сервиса! Срок действия: до 8 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-08T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-tsvety"],
      activeBloggers: STABLE_STORES["yandeks-tsvety"]?.activeBloggers ?? 2196,
    },
    affiliate: YANDEX_FLOWERS_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= LIBREDERM OZON =================
  {
    id: 380702,
    promocode: {
      id: 380702,
      code: "LAAA77B64992",
      bonusName: "Скидка 30% на аптечную косметику Librederm на Ozon",
      terms: "Флеш-акция с 6 по 9 ноября 2026 года! Промокод LAAA77B64992 даёт скидку 30% при первом и всех повторных заказах дерматологической косметики Librederm на маркетплейсе Ozon. Срок действия: с 6 по 9 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-09T23:59:59+03:00",
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
    affiliate: LIBREDERM_OZON_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= ЛЭТУАЛЬ =================
  {
    id: 266002,
    promocode: {
      id: 266002,
      code: "ШАНС",
      bonusName: "Скидка 3 000 ₽ от 8 000 ₽ в ЛЭТУАЛЬ",
      terms: "Эксклюзивный однодневный промокод ШАНС в ЛЭТУАЛЬ! Скидка 3 000 ₽ при заказе парфюмерии и косметики от 8 000 ₽. Действует только сегодня до 23:59 МСК 6 ноября 2026 года.",
      expires: "2026-11-06T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      minimumOrder: { value: 8000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["letual"],
      activeBloggers: STABLE_STORES["letual"]?.activeBloggers ?? 8430,
    },
    affiliate: LETUAL_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 266003,
    promocode: {
      id: 266003,
      code: "НАБЕРИ",
      bonusName: "Скидка до 20 000 ₽ в интернет-магазине ЛЭТУАЛЬ",
      terms: "Масштабная ноябрьская акция в ЛЭТУАЛЬ: промокод НАБЕРИ даёт прогрессивную скидку до 20 000 ₽ на заказы косметики и парфюмерии. Действует до 30 ноября 2026 года 23:59.",
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
      ...STABLE_STORES["letual"],
      activeBloggers: STABLE_STORES["letual"]?.activeBloggers ?? 8430,
    },
    affiliate: LETUAL_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= ВКУСВИЛЛ ДОСТАВКА =================
  {
    id: 134102,
    promocode: {
      id: 134102,
      code: "VSTCLCZ",
      bonusName: "Скидка 600 ₽ на первый заказ от 2 000 ₽ во ВкусВилл",
      terms: "Свежий ноябрьский промокод VSTCLCZ: скидка 600 ₽ на первый онлайн-заказ натуральных продуктов и готовой еды от 2 000 ₽ с бесплатной доставкой ВкусВилл. Действует до 30 ноября 2026 года.",
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
      ...STABLE_STORES["vkusvill-dostavka"],
      activeBloggers: STABLE_STORES["vkusvill-dostavka"]?.activeBloggers ?? 6540,
    },
    affiliate: VKUSVILL_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 134103,
    promocode: {
      id: 134103,
      code: "35VEM5EY",
      bonusName: "Скидка 350 ₽ на первый заказ от 1 500 ₽ во ВкусВилл",
      terms: "Промокод 35VEM5EY даёт скидку 350 ₽ при первом заказе от 1 500 ₽ в доставке ВкусВилл. Действует до 30 ноября 2026 года.",
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
      ...STABLE_STORES["vkusvill-dostavka"],
      activeBloggers: STABLE_STORES["vkusvill-dostavka"]?.activeBloggers ?? 6540,
    },
    affiliate: VKUSVILL_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 134104,
    promocode: {
      id: 134104,
      code: "30V8RX3X",
      bonusName: "Скидка 300 ₽ на первый заказ от 1 500 ₽ во ВкусВилл",
      terms: "Промокод 30V8RX3X даёт скидку 300 ₽ на первый заказ от 1 500 ₽ в сервисе быстрой доставки ВкусВилл. Действует до 30 ноября 2026 года.",
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
      ...STABLE_STORES["vkusvill-dostavka"],
      activeBloggers: STABLE_STORES["vkusvill-dostavka"]?.activeBloggers ?? 6540,
    },
    affiliate: VKUSVILL_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= ПЕРЕКРЁСТОК ДОСТАВКА (ФЛЕШ 650 ₽) =================
  {
    id: 432805,
    promocode: {
      id: 432805,
      code: "199EMTVUS",
      bonusName: "Флеш-скидка 650 ₽ на первый заказ от 1 600 ₽ в Перекрёстке",
      terms: "Горячая флеш-акция в «Перекрёсток Доставка» с 5 по 7 ноября 2026 года! Промокод 199EMTVUS даёт скидку 650 ₽ на первый заказ продуктов от 1 600 ₽. Срок действия: до 7 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-07T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 1600, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["perekrestok-dostavka"],
      activeBloggers: STABLE_STORES["perekrestok-dostavka"]?.activeBloggers ?? 2840,
    },
    affiliate: PEREKRESTOK_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= ЯНДЕКС АФИША =================
  {
    id: 196501,
    promocode: {
      id: 196501,
      code: "KYWB8048",
      bonusName: "Скидка 750 ₽ на первую покупку билетов от 5 000 ₽ в Яндекс Афише",
      terms: "Промокод KYWB8048 даёт скидку 750 ₽ на первую покупку билетов на концерты, спектакли, выставки и шоу от 5 000 ₽ в приложении Яндекс Афиша. Действует до 31 декабря 2026 года 23:59.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 5000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 4180,
    },
    affiliate: YANDEX_AFISHA_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 196502,
    promocode: {
      id: 196502,
      code: "BWWE9549",
      bonusName: "Скидка 400 ₽ на первую покупку билетов от 3 000 ₽ в Яндекс Афише",
      terms: "Промокод BWWE9549 даёт скидку 400 ₽ при первой покупке билетов от 3 000 ₽ в мобильном приложении Яндекс Афиша. Действует до 31 декабря 2026 года 23:59.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: false,
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
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 4180,
    },
    affiliate: YANDEX_AFISHA_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 196504,
    promocode: {
      id: 196504,
      code: "GPSJ9957",
      bonusName: "Скидка 300 ₽ на первую покупку билетов от 2 000 ₽ в Яндекс Афише",
      terms: "Промокод GPSJ9957 даёт скидку 300 ₽ при первой покупке билетов от 2 000 ₽ в мобильном приложении Яндекс Афиша. Действует до 31 декабря 2026 года 23:59.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: false,
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
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 4180,
    },
    affiliate: YANDEX_AFISHA_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 196503,
    promocode: {
      id: 196503,
      code: "GSPC5034",
      bonusName: "Скидка 10% (не более 750 ₽) на покупку билетов от 3 000 ₽ в Яндекс Афише",
      terms: "Промокод GSPC5034 даёт скидку 10% (не более 750 ₽) на первую и все повторные покупки билетов от 3 000 ₽ в мобильном приложении Яндекс Афиша. Действует до 31 декабря 2026 года 23:59.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Первый и повторный заказ",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 4180,
    },
    affiliate: YANDEX_AFISHA_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= ТУТУ =================
  {
    id: 300001,
    promocode: {
      id: 300001,
      code: "f49132ae",
      bonusName: "Скидка 2 000 ₽ на бронирование отелей от 20 000 ₽ в Туту",
      terms: "Промокод f49132ae даёт скидку 2 000 ₽ при бронировании любых гостиниц и апартаментов по России и миру от 20 000 ₽ на сервисе Туту. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      minimumOrder: { value: 20000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["tutu"],
      activeBloggers: STABLE_STORES["tutu"]?.activeBloggers ?? 3890,
    },
    affiliate: TUTU_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 300002,
    promocode: {
      id: 300002,
      code: "TFFJ6Z",
      bonusName: "Скидка 1 500 ₽ на отели от 15 000 ₽ в Туту",
      terms: "Промокод TFFJ6Z даёт скидку 1 500 ₽ на бронирование отелей от 15 000 ₽ на портале Туту. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      minimumOrder: { value: 15000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["tutu"],
      activeBloggers: STABLE_STORES["tutu"]?.activeBloggers ?? 3890,
    },
    affiliate: TUTU_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 300003,
    promocode: {
      id: 300003,
      code: "CXDQB4",
      bonusName: "Скидка 10% на бронирование отелей в сервисе Туту",
      terms: "Промокод CXDQB4 даёт скидку 10% на бронирование отелей и гостиниц через Туту. Действует до 30 ноября 2026 года 23:59.",
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
      ...STABLE_STORES["tutu"],
      activeBloggers: STABLE_STORES["tutu"]?.activeBloggers ?? 3890,
    },
    affiliate: TUTU_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= ОСТРОВОК! =================
  {
    id: 227101,
    promocode: {
      id: 227101,
      code: "PF4ALL80",
      bonusName: "Скидка 4% на все бронирования отелей в Островок!",
      terms: "Промокод PF4ALL80 даёт скидку 4% на любое бронирование отелей, хостелов и апартаментов по всему миру на сервисе Ostrovok.ru. Действует до 30 ноября 2026 года 23:59.",
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
      ...STABLE_STORES["ostrovok"],
      activeBloggers: STABLE_STORES["ostrovok"]?.activeBloggers ?? 5210,
    },
    affiliate: OSTROVOK_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= ЧИСТАЯ ЛИНИЯ НА OZON =================
  {
    id: 452601,
    promocode: {
      id: 452601,
      code: "15PL",
      bonusName: "Скидка 15% на косметику «Чистая Линия» на Ozon",
      terms: "Промокод 15PL: дополнительная скидка 15% при заказе косметики и средств ухода бренда «Чистая Линия» (Арнест ЮниРусь) в официальном магазине на Ozon. Действует до 30 ноября 2026 года 23:59.",
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
      ...STABLE_STORES["chistaya-liniya"],
      activeBloggers: STABLE_STORES["chistaya-liniya"]?.activeBloggers ?? 650,
    },
    affiliate: PURELINE_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= МЕГАМАРКЕТ СРА =================
  {
    id: 361101,
    promocode: {
      id: 361101,
      code: "15PRFL",
      bonusName: "Скидка до 15% на покупки на Мегамаркете",
      terms: "Промокод 15PRFL даёт скидку до 15% на широкий ассортимент товаров на маркетплейсе «Мегамаркет». Действует до 30 ноября 2026 года 23:59.",
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
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: MEGAMARKET_NOV06_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 361102,
    promocode: {
      id: 361102,
      code: "pfnv1134218",
      bonusName: "Скидка 30% на один любой заказ на Мегамаркете",
      terms: "Промокод pfnv1134218: скидка 30%, но не более 10 000 ₽ на один любой заказ на маркетплейсе «Мегамаркет». Действует до 22 ноября 2026 года 23:59.",
      expires: "2026-11-22T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "На один любой заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: MEGAMARKET_DISCOUNT30_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 361103,
    promocode: {
      id: 361103,
      code: "RNDW20",
      bonusName: "Скидка 20% на товары магазина Randewoo на Мегамаркете",
      terms: "Промокод RNDW20: скидка 20% на товары магазина Randewoo, но не более 4 000 ₽ на один любой заказ на маркетплейсе «Мегамаркет». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "На товары Randewoo",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: MEGAMARKET_RANDEWOO_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 361104,
    promocode: {
      id: 361104,
      code: "ZOO20",
      bonusName: "Скидка 20% на зоотовары на Мегамаркете",
      terms: "Промокод ZOO20: скидка 20% на зоотовары на один любой заказ на маркетплейсе «Мегамаркет». Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "На зоотовары",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: MEGAMARKET_ZOO_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 361105,
    promocode: {
      id: 361105,
      code: "",
      bonusName: "Анатомические матрасы Askona 140х200 по специальной цене",
      terms: "Заказ анатомических матрасов Askona 140х200 по специальным выгодным ценам на маркетплейсе «Мегамаркет». Скидка применяется автоматически при переходе по ссылке. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: MEGAMARKET_ASKONA_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 361106,
    promocode: {
      id: 361106,
      code: "",
      bonusName: "Кешбэк бонусами до 30% на правильное питание BeFit",
      terms: "Заказ рационов здорового и сбалансированного питания BeFit с кешбэком бонусами Спасибо до 30% на «Мегамаркете». Акция действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: MEGAMARKET_BEFIT_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 361107,
    promocode: {
      id: 361107,
      code: "",
      bonusName: "Скидка 20% на автомобильные шины на Мегамаркете",
      terms: "Сезонная скидка 20% на автомобильные шины ведущих производителей на «Мегамаркете». Скидка действует по ссылке каталога до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: MEGAMARKET_TIRES_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 361108,
    promocode: {
      id: 361108,
      code: "PRF1",
      bonusName: "Скидка 15% на покупки на Мегамаркете",
      terms: "Промокод PRF1: скидка 15% на широкий ассортимент товаров на маркетплейсе «Мегамаркет». Действует до 30 ноября 2026 года 23:59.",
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
      ...STABLE_STORES["megamarket"],
      activeBloggers: STABLE_STORES["megamarket"]?.activeBloggers ?? 12500,
    },
    affiliate: {
      link: "https://megamarket1.prfl.me/sites/442z68?erid=2Ranym1YxLc",
      landingLink: "https://megamarket1.prfl.me/sites/442z68?erid=2Ranym1YxLc",
      ordMarker: "2Ranym1YxLc",
      ordText: MEGAMARKET_NOV06_SITE_LEGAL,
    },
    extraLinks: [],
  },
];
