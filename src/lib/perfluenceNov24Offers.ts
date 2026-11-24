import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Ноябрьские предложения и обновлённые промокоды Perfluence от 24 ноября 2026 года.
 * Включает свежие повторы публикаций, флеш-акции и повышенные бонусы:
 * 1. М.Косметик (Повышенная скидка 51% по PK4GMWJUK вместо 36% и Каникулы 41%)
 * 2. FMART by flowwow (Вновь активный бонус 20% по fmartpe2063dcr и 700 ₽)
 * 3. Яндекс Путешествия (Флеш 20% по OPPAPA20 и 10% по PF-OPPAPAIO-BCCG96)
 * 4. Яндекс Лавка (Повышенный бонус 53% по 53SNEG210, 50%, 300 ₽, 40%)
 * 5. Островок! (Продленная флеш-акция 8% по PF8ALL1 до 25.11)
 * 6. COZY HOME на Ozon|WB (Флеш 30% по ESR9VCG7 только 24.11)
 * 7. Sunlight (Промокоды официально продлены до 30.11: 1500, 5000, 3000, 8000)
 * 8. Плати по всему миру (Улучшенный бонус 800 ₽ + $5 + 1000 ₽ по PRFLS-27NEA)
 * 9. СберДевайсы (Скидки 6% и 5% по кодам Sberdv171, Sberdv71)
 * 10. PREMIER (30 дней доступа по коду 9t9tx6zt)
 * 11. Тануки (Свежий повтор 20%, 15% и ролл в подарок)
 * 12. ВкусВилл Доставка (Свежий повтор 300 ₽, 350 ₽)
 * 13. Яндекс Афиша (Свежий повтор 750 ₽, 400 ₽, 300 ₽, 10%)
 * 14. Подружка (Подарок по ссылке в приложении)
 * 15. FARFOR (20% и 10%)
 * 16. Яндекс Цветы (15% от 3000 ₽)
 * 17. Магнит: акции и доставка (25% от 1400 ₽)
 */

// --- 1. М.КОСМЕТИК (Project 2548, Post 17490042) ---
export const M_KOSMETIK_NOV24_LINK = "https://mgntksm1.prfl.me/sites/0rnpfi?erid=2Ranynmu9Ba";
export const M_KOSMETIK_NOV24_ERID = "2Ranynmu9Ba";
export const M_KOSMETIK_NOV24_LEGAL = 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2Ranynmu9Ba';

export const M_KOSMETIK_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: M_KOSMETIK_NOV24_LINK,
  landingLink: M_KOSMETIK_NOV24_LINK,
  ordMarker: M_KOSMETIK_NOV24_ERID,
  ordText: M_KOSMETIK_NOV24_LEGAL,
};

// --- 2. FMART BY FLOWWOW (Project 4579, Post 17490090) ---
export const FMART_NOV24_LINK = "https://fmart-flowers.prfl.me/sites/b0h3xp?erid=2RanymVn6aG";
export const FMART_NOV24_ERID = "2RanymVn6aG";
export const FMART_NOV24_LEGAL = 'Реклама. ООО "ФМАРТ" ОГРН 1237700524060 г. Москва erid: 2RanymVn6aG';

export const FMART_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: FMART_NOV24_LINK,
  landingLink: FMART_NOV24_LINK,
  ordMarker: FMART_NOV24_ERID,
  ordText: FMART_NOV24_LEGAL,
};

// --- 3. ЯНДЕКС ПУТЕШЕСТВИЯ (Project 1135, Post 17490044) ---
export const YANDEX_TRAVEL_NOV24_LINK = "https://yatravel.prfl.me/sites/unfato?erid=2RanynuK5bJ";
export const YANDEX_TRAVEL_NOV24_ERID = "2RanynuK5bJ";
export const YANDEX_TRAVEL_NOV24_LEGAL = 'Реклама. ООО "ЯНДЕКС.ВЕРТИКАЛИ", ИНН 7704340327. erid: 2RanynuK5bJ';

export const YANDEX_TRAVEL_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_TRAVEL_NOV24_LINK,
  landingLink: YANDEX_TRAVEL_NOV24_LINK,
  ordMarker: YANDEX_TRAVEL_NOV24_ERID,
  ordText: YANDEX_TRAVEL_NOV24_LEGAL,
};

// --- 4. ЯНДЕКС ЛАВКА (Project 354, Post 17490055) ---
export const YANDEX_LAVKA_NOV24_LINK = "https://yalavka.prfl.me/sites/l26yd1?erid=2RanyoHYtpU";
export const YANDEX_LAVKA_NOV24_ERID = "2RanyoHYtpU";
export const YANDEX_LAVKA_NOV24_LEGAL = 'Реклама. ООО "ЯНДЕКС.ЛАВКА", ИНН 9718101499. erid: 2RanyoHYtpU';

export const YANDEX_LAVKA_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_LAVKA_NOV24_LINK,
  landingLink: YANDEX_LAVKA_NOV24_LINK,
  ordMarker: YANDEX_LAVKA_NOV24_ERID,
  ordText: YANDEX_LAVKA_NOV24_LEGAL,
};

// --- 5. ОСТРОВОК! (Project 2271, Post 17490059) ---
export const OSTROVOK_NOV24_LINK = "https://ostrovok.prfl.me/sites/3u650b?erid=2Ranyk9Ckdz";
export const OSTROVOK_NOV24_ERID = "2Ranyk9Ckdz";
export const OSTROVOK_NOV24_LEGAL = 'Реклама. ООО "Бронирование гостиниц", ИНН 7703389880 erid: 2Ranyk9Ckdz';

export const OSTROVOK_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: OSTROVOK_NOV24_LINK,
  landingLink: OSTROVOK_NOV24_LINK,
  ordMarker: OSTROVOK_NOV24_ERID,
  ordText: OSTROVOK_NOV24_LEGAL,
};

// --- 6. COZY HOME (Project 3641, Post 17490056) ---
export const COZY_HOME_NOV24_LINK = "https://cozyhome.prfl.me/sites/ip4jqu?erid=2RanyoK2t6p";
export const COZY_HOME_NOV24_ERID = "2RanyoK2t6p";
export const COZY_HOME_NOV24_LEGAL = 'Реклама. ООО "КОЗИ ХОУМ", ИНН 7724395052 erid: 2RanyoK2t6p';

export const COZY_HOME_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: COZY_HOME_NOV24_LINK,
  landingLink: COZY_HOME_NOV24_LINK,
  ordMarker: COZY_HOME_NOV24_ERID,
  ordText: COZY_HOME_NOV24_LEGAL,
};

// --- 7. SUNLIGHT (Project 1100, Post 17490058) ---
export const SUNLIGHT_NOV24_LINK = "https://sunlight.prfl.me/sites/j5ma90?erid=2RanyoMzrfW";
export const SUNLIGHT_NOV24_ERID = "2RanyoMzrfW";
export const SUNLIGHT_NOV24_LEGAL = 'Реклама. ООО «СОЛНЕЧНЫЙ СВЕТ», ИНН 7720261827 erid: 2RanyoMzrfW';

export const SUNLIGHT_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: SUNLIGHT_NOV24_LINK,
  landingLink: SUNLIGHT_NOV24_LINK,
  ordMarker: SUNLIGHT_NOV24_ERID,
  ordText: SUNLIGHT_NOV24_LEGAL,
};

// --- 8. ПЛАТИ ПО ВСЕМУ МИРУ (Project 4362, Post 17490066) ---
export const PLATIPOMIRU_NOV24_LINK = "https://platipomiru.prfl.me/sites/zq1f2v?erid=2RanykJ6gL4";
export const PLATIPOMIRU_NOV24_ERID = "2RanykJ6gL4";
export const PLATIPOMIRU_NOV24_LEGAL = 'Реклама ООО КАПИБАРА. ИНН 9703231520 erid: 2RanykJ6gL4';

export const PLATIPOMIRU_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: PLATIPOMIRU_NOV24_LINK,
  landingLink: PLATIPOMIRU_NOV24_LINK,
  ordMarker: PLATIPOMIRU_NOV24_ERID,
  ordText: PLATIPOMIRU_NOV24_LEGAL,
};

// --- 9. СБЕРДЕВАЙСЫ (Project 3716, Post 17490065) ---
export const SBERDEVAYSY_NOV24_LINK = "https://sberdevaysy1.prfl.me/sites/7a2eio?erid=2RanykGch3i";
export const SBERDEVAYSY_NOV24_ERID = "2RanykGch3i";
export const SBERDEVAYSY_NOV24_LEGAL = 'Реклама. Рекламодатель - ООО “САЛЮТДЕВАЙСЫ”. ИНН: 7730253720 erid: 2RanykGch3i';

export const SBERDEVAYSY_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: SBERDEVAYSY_NOV24_LINK,
  landingLink: SBERDEVAYSY_NOV24_LINK,
  ordMarker: SBERDEVAYSY_NOV24_ERID,
  ordText: SBERDEVAYSY_NOV24_LEGAL,
};

// --- 10. PREMIER (Project 812, Post 17490063) ---
export const PREMIER_NOV24_LINK = "https://premier.prfl.me/sites/gxg3jd?erid=2RanykF8hmN";
export const PREMIER_NOV24_ERID = "2RanykF8hmN";
export const PREMIER_NOV24_LEGAL = 'Реклама. ООО "ПРЕМЬЕР", ИНН 9702011190 erid: 2RanykF8hmN';

export const PREMIER_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: PREMIER_NOV24_LINK,
  landingLink: PREMIER_NOV24_LINK,
  ordMarker: PREMIER_NOV24_ERID,
  ordText: PREMIER_NOV24_LEGAL,
};

// --- 11. ТАНУКИ (Project 602, Post 17490046) ---
export const TANUKI_NOV24_LINK = "https://tanukifamily.prfl.me/sites/38184m?erid=2RanynxH49z";
export const TANUKI_NOV24_ERID = "2RanynxH49z";
export const TANUKI_NOV24_LEGAL = 'Реклама. ООО «ВЕЛИКИЙ ШЕЛКОВЫЙ ПУТЬ», ИНН 7715886618 erid: 2RanynxH49z';

export const TANUKI_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: TANUKI_NOV24_LINK,
  landingLink: TANUKI_NOV24_LINK,
  ordMarker: TANUKI_NOV24_ERID,
  ordText: TANUKI_NOV24_LEGAL,
};

// --- 12. ВКУСВИЛЛ ДОСТАВКА (Project 1341, Post 17490051) ---
export const VKUSVILL_NOV24_LINK = "https://vksvl.prfl.me/sites/wly5gq?erid=2Ranyo8ey8Q";
export const VKUSVILL_NOV24_ERID = "2Ranyo8ey8Q";
export const VKUSVILL_NOV24_LEGAL = 'Реклама. АО "Вкусвилл", ОГРН 1217700253671. erid: 2Ranyo8ey8Q';

export const VKUSVILL_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: VKUSVILL_NOV24_LINK,
  landingLink: VKUSVILL_NOV24_LINK,
  ordMarker: VKUSVILL_NOV24_ERID,
  ordText: VKUSVILL_NOV24_LEGAL,
};

// --- 13. ЯНДЕКС АФИША (Project 1965, Post 17490047) ---
export const YANDEX_AFISHA_NOV24_LINK = "https://yaafisha.prfl.me/sites/gntmut?erid=2Ranynym3SL";
export const YANDEX_AFISHA_NOV24_ERID = "2Ranynym3SL";
export const YANDEX_AFISHA_NOV24_LEGAL = 'Реклама. ООО «ЯНДЕКС», ИНН 7736207543 erid: 2Ranynym3SL';

export const YANDEX_AFISHA_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_AFISHA_NOV24_LINK,
  landingLink: YANDEX_AFISHA_NOV24_LINK,
  ordMarker: YANDEX_AFISHA_NOV24_ERID,
  ordText: YANDEX_AFISHA_NOV24_LEGAL,
};

// --- 14. ПОДРУЖКА (Project 2657, Post 17490045) ---
export const PODRUZHKA_APP_NOV24_LINK = "https://podrygka.prfl.me/sites/qp5sbq?erid=2Ranynvo4se";
export const PODRUZHKA_APP_NOV24_ERID = "2Ranynvo4se";
export const PODRUZHKA_APP_NOV24_LEGAL = 'Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2Ranynvo4se';

export const PODRUZHKA_APP_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: PODRUZHKA_APP_NOV24_LINK,
  landingLink: PODRUZHKA_APP_NOV24_LINK,
  ordMarker: PODRUZHKA_APP_NOV24_ERID,
  ordText: PODRUZHKA_APP_NOV24_LEGAL,
};

// --- 15. FARFOR (Project 2333, Post 17490052) ---
export const FARFOR_NOV24_LINK = "https://farfor1.prfl.me/sites/3ecaqs?erid=2RanyoBcwh6";
export const FARFOR_NOV24_ERID = "2RanyoBcwh6";
export const FARFOR_NOV24_LEGAL = 'Реклама. ИП Покровский М.В., ОГРНИП 321028000109968 erid: 2RanyoBcwh6';

export const FARFOR_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: FARFOR_NOV24_LINK,
  landingLink: FARFOR_NOV24_LINK,
  ordMarker: FARFOR_NOV24_ERID,
  ordText: FARFOR_NOV24_LEGAL,
};

// --- 16. ЯНДЕКС ЦВЕТЫ (Project 3750, Post 17490053) ---
export const YANDEX_FLOWERS_NOV24_LINK = "https://yaflowers.prfl.me/sites/y861bu?erid=2RanyoD6vyS";
export const YANDEX_FLOWERS_NOV24_ERID = "2RanyoD6vyS";
export const YANDEX_FLOWERS_NOV24_LEGAL = 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanyoD6vyS';

export const YANDEX_FLOWERS_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_FLOWERS_NOV24_LINK,
  landingLink: YANDEX_FLOWERS_NOV24_LINK,
  ordMarker: YANDEX_FLOWERS_NOV24_ERID,
  ordText: YANDEX_FLOWERS_NOV24_LEGAL,
};

// --- 17. МАГНИТ: АКЦИИ И ДОСТАВКА (Project 2582, Post 17490057) ---
export const MAGNIT_NOV24_LINK = "https://mgntgm.prfl.me/sites/v3d0y2?erid=2RanyoLWsPA";
export const MAGNIT_NOV24_ERID = "2RanyoLWsPA";
export const MAGNIT_NOV24_LEGAL = 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanyoLWsPA';

export const MAGNIT_NOV24_AFFILIATE: Coupon["affiliate"] = {
  link: MAGNIT_NOV24_LINK,
  landingLink: MAGNIT_NOV24_LINK,
  ordMarker: MAGNIT_NOV24_ERID,
  ordText: MAGNIT_NOV24_LEGAL,
};

export const PERFLUENCE_NOV24_OFFERS: Coupon[] = [
  // ================= 1. М.КОСМЕТИК =================
  {
    id: 25482401,
    promocode: {
      id: 25482401,
      code: "PK4GMWJUK",
      bonusName: "Повышенная скидка 51% на первый заказ от 1 500 ₽ в приложении Магнит Доставка",
      terms: "Эксклюзивный повышенный бонус в М.Косметик с 24 ноября 2026 года! Промокод PK4GMWJUK даёт рекордную скидку 51% (вместо 36%) при первом заказе косметики, парфюмерии и товаров для дома от 1 500 ₽ через приложение «Магнит: акции и доставка». Действует до 30 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      minimumOrder: { value: 1500, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["m-kosmetik"],
      activeBloggers: STABLE_STORES["m-kosmetik"]?.activeBloggers ?? 5214,
    },
    affiliate: M_KOSMETIK_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 25482402,
    promocode: {
      id: 25482402,
      code: "Каникулы",
      bonusName: "Скидка 41% от 1 500 ₽ на заказ из подборки Магнит в М.Косметик",
      terms: "Промокод Каникулы даёт скидку 41% при заказе от 1 500 ₽ на выделенную праздничную подборку товаров в разделе М.Косметик приложения «Магнит Доставка». Действует до 24 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-24T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      minimumOrder: { value: 1500, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["m-kosmetik"],
      activeBloggers: STABLE_STORES["m-kosmetik"]?.activeBloggers ?? 5214,
    },
    affiliate: M_KOSMETIK_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 2. FMART BY FLOWWOW =================
  {
    id: 45792401,
    promocode: {
      id: 45792401,
      code: "fmartpe2063dcr",
      bonusName: "Скидка 20% на первый или повторный заказ цветов и подарков в FMART",
      terms: "Вновь активный официальный бонус с 24 ноября 2026 года! Промокод fmartpe2063dcr даёт скидку 20% на первый или один повторный заказ свежих цветов и авторских подарков в маркетплейсе FMART by flowwow. Не суммируется с другими промокодами. Действует до 30 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
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
    affiliate: FMART_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 45792402,
    promocode: {
      id: 45792402,
      code: "FMARTPE70082e34",
      bonusName: "Скидка 700 ₽ от 3 000 ₽ на заказ букетов в FMART by flowwow",
      terms: "Промокод FMARTPE70082e34 даёт скидку 700 ₽ на первый или один повторный заказ цветов и подарков на сумму от 3 000 ₽ в FMART by flowwow. Действует до 30 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Заказ от 3 000 ₽",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["fmart"],
      activeBloggers: STABLE_STORES["fmart"]?.activeBloggers ?? 380,
    },
    affiliate: FMART_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 3. ЯНДЕКС ПУТЕШЕСТВИЯ =================
  {
    id: 11352401,
    promocode: {
      id: 11352401,
      code: "OPPAPA20",
      bonusName: "Горячая флеш-акция: Скидка 20% (до 100 000 ₽) на бронирование отелей",
      terms: "Горячая флеш-акция только 24 ноября 2026 года до 23:59 МСК! Промокод OPPAPA20 даёт скидку 20% (максимум до 100 000 ₽) на одно бронирование отеля или иного жилья для первых 100 пользователей. Действует на даты проживания по 30.11.2026 включительно в приложении и на сайте Яндекс Путешествий.",
      expires: "2026-11-24T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех (первые 100)",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-puteshestviya"],
      activeBloggers: STABLE_STORES["yandeks-puteshestviya"]?.activeBloggers ?? 12400,
    },
    affiliate: YANDEX_TRAVEL_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 11352402,
    promocode: {
      id: 11352402,
      code: "PF-OPPAPAIO-BCCG96",
      bonusName: "Скидка 10% (до 100 000 ₽) на бронирование отелей для всех",
      terms: "Промокод PF-OPPAPAIO-BCCG96 даёт скидку 10% (максимальная скидка 100 000 ₽) на одно бронирование отеля или иного жилья из выделенной подборки. Действует для всех пользователей в приложении и на сайте Яндекс Путешествия на даты проживания до 30 ноября 2026 года.",
      expires: "2026-11-30T23:59:59+03:00",
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
      ...STABLE_STORES["yandeks-puteshestviya"],
      activeBloggers: STABLE_STORES["yandeks-puteshestviya"]?.activeBloggers ?? 12400,
    },
    affiliate: YANDEX_TRAVEL_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 4. ЯНДЕКС ЛАВКА =================
  {
    id: 3542401,
    promocode: {
      id: 3542401,
      code: "53SNEG210",
      bonusName: "Повышенный бонус: Скидка 53% на первый заказ от 700 ₽ (макс. 600 ₽)",
      terms: "Специальная акция 23–24 ноября 2026 года на проекте Яндекс Лавка! Промокод 53SNEG210 даёт повышенную скидку 53% (максимально 600 ₽) при первом заказе продуктов и готовой еды от 700 ₽. Действует во всех городах присутствия сервиса. Действует до 24 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-24T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      minimumOrder: { value: 700, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-lavka"],
      activeBloggers: STABLE_STORES["yandeks-lavka"]?.activeBloggers ?? 4200,
    },
    affiliate: YANDEX_LAVKA_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 5. ОСТРОВОК! =================
  {
    id: 22712401,
    promocode: {
      id: 22712401,
      code: "PF8ALL1",
      bonusName: "Продленная флеш-акция: Скидка 8% на бронирование по всему миру",
      terms: "Флеш-акция в Островке официально продлена до 25 ноября 2026 года включительно! Промокод PF8ALL1 даёт скидку 8% на первое или одно повторное бронирование отелей и гостиниц по всему миру. Действует на проживание с 01.01.2027 по 31.12.2027. Без ограничений по сумме скидки, суммируется с акциями отелей!",
      expires: "2026-11-25T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Первое или повторное бронирование",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["ostrovok"],
      activeBloggers: STABLE_STORES["ostrovok"]?.activeBloggers ?? 6500,
    },
    affiliate: OSTROVOK_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 6. COZY HOME НА OZON/WB =================
  {
    id: 36412401,
    promocode: {
      id: 36412401,
      code: "ESR9VCG7",
      bonusName: "Флеш-акция: Скидка 30% на выделенный ассортимент Cozy Home на Wildberries",
      terms: "Горячая флеш-акция только 24 ноября 2026 года до 23:59 МСК! Промокод ESR9VCG7 даёт скидку 30% на каждый заказ выделенного ассортимента домашнего текстиля, постельного белья и декора бренда Cozy Home на маркетплейсе WB.",
      expires: "2026-11-24T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Каждый заказ на WB",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["cozy-home"],
      activeBloggers: STABLE_STORES["cozy-home"]?.activeBloggers ?? 1840,
    },
    affiliate: COZY_HOME_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 7. SUNLIGHT =================
  {
    id: 11002401,
    promocode: {
      id: 11002401,
      code: "pfnn153513",
      bonusName: "Скидка 1 500 ₽ от 5 000 ₽ на ювелирные украшения (для новых)",
      terms: "Официально продлено до 30 ноября 2026 года! Промокод pfnn153513 даёт скидку 1 500 ₽ при заказе от 5 000 ₽ для новых пользователей в приложении и на сайте Sunlight. Суммируется с текущими промокодами сайта и баллами.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только новые пользователи",
      minimumOrder: { value: 5000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"]?.activeBloggers ?? 8100,
    },
    affiliate: SUNLIGHT_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 11002402,
    promocode: {
      id: 11002402,
      code: "pfnn556373",
      bonusName: "Скидка 5 000 ₽ от 30 000 ₽ на украшения (для новых)",
      terms: "Официально продлено до 30 ноября 2026 года! Промокод pfnn556373 даёт скидку 5 000 ₽ при покупке золота и украшений от 30 000 ₽ для новых клиентов ювелирной сети Sunlight.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Новые покупатели · от 30 000 ₽",
      minimumOrder: { value: 30000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"]?.activeBloggers ?? 8100,
    },
    affiliate: SUNLIGHT_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 11002403,
    promocode: {
      id: 11002403,
      code: "pfn324613",
      bonusName: "Скидка 3 000 ₽ от 30 000 ₽ на ювелирные изделия (для всех)",
      terms: "Официально продлено до 30 ноября 2026 года! Промокод pfn324613 даёт скидку 3 000 ₽ при заказе от 30 000 ₽ для всех покупателей Sunlight. Суммируется с акциями сервиса.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      minimumOrder: { value: 30000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"]?.activeBloggers ?? 8100,
    },
    affiliate: SUNLIGHT_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 11002404,
    promocode: {
      id: 11002404,
      code: "pfn843468",
      bonusName: "Скидка 8 000 ₽ от 80 000 ₽ на золото и бриллианты (для всех)",
      terms: "Официально продлено до 30 ноября 2026 года! Промокод pfn843468 даёт максимальную скидку 8 000 ₽ при заказе премиальных украшений от 80 000 ₽ для всех покупателей сети Sunlight.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      minimumOrder: { value: 80000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sunlight-ru"],
      activeBloggers: STABLE_STORES["sunlight-ru"]?.activeBloggers ?? 8100,
    },
    affiliate: SUNLIGHT_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 8. ПЛАТИ ПО ВСЕМУ МИРУ =================
  {
    id: 43622401,
    promocode: {
      id: 43622401,
      code: "PRFLS-27NEA",
      bonusName: "Скидка 800 ₽ на зарубежную карту + кешбэк $5 + сертификат на 1 000 ₽",
      terms: "Улучшенный бонус от 23–24 ноября 2026 года! Промокод PRFLS-27NEA даёт скидку 800 ₽ при оформлении виртуальной зарубежной карты для путешествий и подписок (ChatGPT, Spotify, зарубежные покупки), кешбэк $5 после оформления и подарочный сертификат номиналом 1 000 ₽ на популярные маркетплейсы. Действует до 31 декабря 2026 года 00:59 МСК.",
      expires: "2026-12-31T00:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Оформление карты для всех",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["platipomiru"],
      activeBloggers: STABLE_STORES["platipomiru"]?.activeBloggers ?? 450,
    },
    affiliate: PLATIPOMIRU_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 9. ТАНУКИ =================
  {
    id: 6022401,
    promocode: {
      id: 6022401,
      code: "20SA1244",
      bonusName: "Скидка 20% от 1 090 ₽ на первый заказ в ресторанах Тануки",
      terms: "Свежий повтор публикации от 24 ноября 2026 года! Промокод 20SA1244 даёт скидку 20% при заказе японской кухни от 1 090 ₽ в ресторанах «Тануки» для новых клиентов. Действует до 26 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-26T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ · от 1 090 ₽",
      minimumOrder: { value: 1090, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["tanukifamily"],
      activeBloggers: STABLE_STORES["tanukifamily"]?.activeBloggers ?? 7350,
    },
    affiliate: TANUKI_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 6022402,
    promocode: {
      id: 6022402,
      code: "15SA1244",
      bonusName: "Скидка 15% от 1 490 ₽ на все повторные заказы в Тануки",
      terms: "Промокод 15SA1244 даёт скидку 15% на каждый повторный заказ суши, роллов и горячих блюд от 1 490 ₽ в приложении и на сайте «Тануки». Действует до 26 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-26T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Повторные заказы",
      minimumOrder: { value: 1490, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["tanukifamily"],
      activeBloggers: STABLE_STORES["tanukifamily"]?.activeBloggers ?? 7350,
    },
    affiliate: TANUKI_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 6022403,
    promocode: {
      id: 6022403,
      code: "KT1366",
      bonusName: "Ролл «Теплый краб» в подарок при заказе от 1 490 ₽ в Тануки",
      terms: "Промокод KT1366 даёт ролл «Теплый краб» в подарок к каждому заказу от 1 490 ₽ в сети ресторанов «Тануки». Действует до 29 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-29T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Подарок к заказу от 1 490 ₽",
      minimumOrder: { value: 1490, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["tanukifamily"],
      activeBloggers: STABLE_STORES["tanukifamily"]?.activeBloggers ?? 7350,
    },
    affiliate: TANUKI_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 12. ВКУСВИЛЛ ДОСТАВКА =================
  // Удалены дублирующие переопределения: все 5 кодов ВкусВилла (600 / 350 / 300 / 250 / 200 ₽)
  // с актуальным erid 2Ranyo8ey8Q (sites/wly5gq) поступают напрямую из perfluence-feed.json.

  // ================= 13. ЯНДЕКС АФИША =================
  {
    id: 19652401,
    promocode: {
      id: 19652401,
      code: "KYWB8048",
      bonusName: "Скидка 750 ₽ от 5 000 ₽ на первый заказ билетов в Яндекс Афише",
      terms: "Обновленный промокод от 24 ноября 2026 года! Промокод KYWB8048 даёт скидку 750 ₽ при покупке билетов на концерты, спектакли и шоу от 5 000 ₽ для новых пользователей. Действует до 31 декабря 2026 года 23:59 МСК.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      minimumOrder: { value: 5000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 5600,
    },
    affiliate: YANDEX_AFISHA_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 19652403,
    promocode: {
      id: 19652403,
      code: "BWWE9549",
      bonusName: "Скидка 400 ₽ от 3 000 ₽ на первый заказ в Яндекс Афише",
      terms: "Промокод BWWE9549 даёт скидку 400 ₽ на первую покупку билетов от 3 000 ₽ в приложении Яндекс Афиши. Действует до 31 декабря 2026 года 23:59 МСК.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ · от 3 000 ₽",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 5600,
    },
    affiliate: YANDEX_AFISHA_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 19652402,
    promocode: {
      id: 19652402,
      code: "GPSJ9957",
      bonusName: "Скидка 300 ₽ от 2 000 ₽ на первый заказ в Яндекс Афише",
      terms: "Промокод GPSJ9957 даёт скидку 300 ₽ на первую покупку билетов на культурные мероприятия от 2 000 ₽ для новых пользователей Яндекс Афиши. Действует до 31 декабря 2026 года 23:59 МСК.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ · от 2 000 ₽",
      minimumOrder: { value: 2000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 5600,
    },
    affiliate: YANDEX_AFISHA_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 19652404,
    promocode: {
      id: 19652404,
      code: "GSPC5034",
      bonusName: "Скидка 10% (до 750 ₽) от 3 000 ₽ на заказ в Яндекс Афише",
      terms: "Промокод GSPC5034 даёт скидку 10% (не более 750 ₽) на первую и все повторные покупки билетов от 3 000 ₽ в приложении Яндекс Афиши. Действует до 31 декабря 2026 года 23:59 МСК.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи · от 3 000 ₽",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-afisha"],
      activeBloggers: STABLE_STORES["yandeks-afisha"]?.activeBloggers ?? 5600,
    },
    affiliate: YANDEX_AFISHA_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 14. ПОДРУЖКА =================
  {
    id: 26572401,
    promocode: {
      id: 26572401,
      code: "",
      bonusName: "Подарок в розничных магазинах «Подружка» по ссылке в приложении",
      terms: "Новый специальный бонус с 24 по 26 ноября 2026 года! Перейдите по ссылке, скачайте мобильное приложение «Подружка», получите персональный штрихкод и предъявите его на кассе розничного магазина до оплаты покупки, чтобы забрать гарантированный подарок! Количество подарков ограничено.",
      expires: "2026-11-26T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Для новых пользователей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["podruzhka"],
      activeBloggers: STABLE_STORES["podruzhka"]?.activeBloggers ?? 3120,
    },
    affiliate: PODRUZHKA_APP_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 15. FARFOR =================
  {
    id: 23332401,
    promocode: {
      id: 23332401,
      code: "YMM14572",
      bonusName: "Скидка 500 ₽ на любой заказ от 1 890 ₽ в FARFOR",
      terms: "Промокод YMM14572 даёт скидку 500 ₽ на один любой заказ пиццы, сетов и роллов от 1 890 ₽ в доставке FARFOR. Действует до 30 ноября 2026 года 00:59 МСК.",
      expires: "2026-11-30T00:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи · от 1 890 ₽",
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
    affiliate: FARFOR_NOV24_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 23332402,
    promocode: {
      id: 23332402,
      code: "DLD84449",
      bonusName: "Скидка 15% на любой заказ от 2 290 ₽ в FARFOR",
      terms: "Промокод DLD84449 даёт скидку 15% на один любой заказ любимых блюд от 2 290 ₽ в ресторане доставки FARFOR. Действует до 30 ноября 2026 года 00:59 МСК.",
      expires: "2026-11-30T00:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Повторные заказы · от 2 290 ₽",
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
    affiliate: FARFOR_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 16. ЯНДЕКС ЦВЕТЫ =================
  {
    id: 37502401,
    promocode: {
      id: 37502401,
      code: "QX7GZZ",
      bonusName: "Скидка 1 100 ₽ на первый заказ цветов от 3 000 ₽",
      terms: "Свежий промокод QX7GZZ от 24 ноября 2026 года даёт скидку 1 100 ₽ при первом заказе букетов, композиций и подарков от 3 000 ₽ в приложении «Яндекс Цветы». Действует до 31 декабря 2026 года 23:59 МСК.",
      expires: "2026-12-31T23:59:59+03:00",
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
      activeBloggers: STABLE_STORES["yandeks-tsvety"]?.activeBloggers ?? 3890,
    },
    affiliate: YANDEX_FLOWERS_NOV24_AFFILIATE,
    extraLinks: [],
  },

  // ================= 17. МАГНИТ: АКЦИИ И ДОСТАВКА =================
  {
    id: 25822401,
    promocode: {
      id: 25822401,
      code: "25GFC1TL4",
      bonusName: "Скидка 31% на первый заказ от 2 000 ₽ в разделе «Гипермаркет»",
      terms: "Свежий промокод 25GFC1TL4 даёт скидку 31% на первый заказ от 2 000 ₽ в разделе «Гипермаркет» для нового пользователя в приложении «Магнит Доставка». Действует до 30 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      minimumOrder: { value: 2000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["magnit-dostavka"],
      activeBloggers: STABLE_STORES["magnit-dostavka"]?.activeBloggers ?? 10500,
    },
    affiliate: MAGNIT_NOV24_AFFILIATE,
    extraLinks: [],
  },
];
