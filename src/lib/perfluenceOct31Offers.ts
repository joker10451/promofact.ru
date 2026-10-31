import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Свежие подтверждённые размещения Perfluence от 31 октября 2026 года
 * Получены и активированы роботом напрямую через личный кабинет promofact.ru (Account ID 3074542).
 * Все ссылки содержат подтверждённые ERID-токены из ОРД.
 */

const mKosmetikStore: Coupon["store"] = {
  ...STABLE_STORES["m-kosmetik"],
  activeBloggers: STABLE_STORES["m-kosmetik"].activeBloggers ?? 0,
};

const magnitStore: Coupon["store"] = {
  ...STABLE_STORES["magnit-dostavka"],
  activeBloggers: STABLE_STORES["magnit-dostavka"].activeBloggers ?? 0,
};

const yandexFlowersStore: Coupon["store"] = {
  ...STABLE_STORES["yandeks-tsvety"],
  activeBloggers: STABLE_STORES["yandeks-tsvety"].activeBloggers ?? 0,
};

const premierStore: Coupon["store"] = {
  ...STABLE_STORES["premier"],
  activeBloggers: STABLE_STORES["premier"].activeBloggers ?? 0,
};

// 1. М.Косметик (Project 2548, Post 17379837)
const M_KOSMETIK_OCT31_LINK = "https://mgntksm1.prfl.me/sites/rec988?erid=2RanymVhCZy";
const M_KOSMETIK_OCT31_ERID = "2RanymVhCZy";
const M_KOSMETIK_OCT31_AFFILIATE: Coupon["affiliate"] = {
  link: M_KOSMETIK_OCT31_LINK,
  landingLink: M_KOSMETIK_OCT31_LINK,
  ordMarker: M_KOSMETIK_OCT31_ERID,
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanymVhCZy',
};

// 2. Магнит Доставка (Project 2582, Post 17379841)
const MAGNIT_OCT31_LINK = "https://mgntgm.prfl.me/sites/833avo?erid=2RanyoHULJ7";
const MAGNIT_OCT31_ERID = "2RanyoHULJ7";
const MAGNIT_OCT31_AFFILIATE: Coupon["affiliate"] = {
  link: MAGNIT_OCT31_LINK,
  landingLink: MAGNIT_OCT31_LINK,
  ordMarker: MAGNIT_OCT31_ERID,
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanyoHULJ7',
};

// 3. Яндекс Цветы (Project 3750, Landing 9488)
const YANDEX_FLOWERS_OCT31_LINK = "https://yaflowers.prfl.me/sites/x09eol?erid=2RanyoMvJ99";
const YANDEX_FLOWERS_OCT31_ERID = "2RanyoMvJ99";
const YANDEX_FLOWERS_OCT31_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_FLOWERS_OCT31_LINK,
  landingLink: YANDEX_FLOWERS_OCT31_LINK,
  ordMarker: YANDEX_FLOWERS_OCT31_ERID,
  ordText: 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanyoMvJ99',
};

// 4. PREMIER (Project 812, Post 17379843)
const PREMIER_OCT31_LINK = "https://premier.prfl.me/sites/pq53cm?erid=2RanyoLSJro";
const PREMIER_OCT31_ERID = "2RanyoLSJro";
const PREMIER_OCT31_AFFILIATE: Coupon["affiliate"] = {
  link: PREMIER_OCT31_LINK,
  landingLink: PREMIER_OCT31_LINK,
  ordMarker: PREMIER_OCT31_ERID,
  ordText: 'Реклама. Рекламодатель: ООО "ПРЕМЬЕР" 16+ ИНН 9702011190 erid: 2RanyoLSJro',
};

export const PERFLUENCE_OCT31_OFFERS: Coupon[] = [
  // М.Косметик: Флеш 36% на любой заказ от 2100 ₽
  {
    id: 826311001,
    promocode: {
      id: 826311001,
      code: "31OFGB3JRC",
      bonusName: "Скидка 36% на любой заказ от 2 100 ₽ в М.Косметик",
      terms: "Промокод 31OFGB3JRC: скидка 36% (не более 2 000 ₽) на один любой заказ от 2 100 ₽ в разделе М.Косметик в приложении «Магнит Доставка». Флеш-акция только 31 октября 2026 года до 23:59 МСК. Суммируется с акциями сервиса.",
      expires: "2026-10-31T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Один любой заказ",
      minimumOrder: { value: 2100, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: mKosmetikStore,
    affiliate: M_KOSMETIK_OCT31_AFFILIATE,
    extraLinks: [],
  },
  // М.Косметик: Дождь 41% от 1500 ₽
  {
    id: 826311002,
    promocode: {
      id: 826311002,
      code: "Дождь",
      bonusName: "Скидка 41% от 1 500 ₽ на каждый заказ в М.Косметик",
      terms: "Промокод «Дождь»: скидка 41% от 1 500 ₽ по промокоду на каждый заказ из подборки «Магнит» в разделе М.Косметик в приложении «Магнит Доставка». Действует до 3 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-03T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Каждый заказ из подборки",
      minimumOrder: { value: 1500, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: mKosmetikStore,
    affiliate: M_KOSMETIK_OCT31_AFFILIATE,
    extraLinks: [],
  },
  // Магнит: Флеш 40% на первый заказ от 1500 ₽ в Экспрессе
  {
    id: 826311003,
    promocode: {
      id: 826311003,
      code: "PFAD7EACMD",
      bonusName: "Скидка 40% на первый заказ от 1 500 ₽ в Экспрессе",
      terms: "Промокод PFAD7EACMD: скидка 40% на первый заказ от 1 500 ₽ в приложении «Магнит Доставка» в разделе «Экспресс». Флеш-акция только 31 октября 2026 года до 23:59 МСК.",
      expires: "2026-10-31T23:59:59+03:00",
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
    store: magnitStore,
    affiliate: MAGNIT_OCT31_AFFILIATE,
    extraLinks: [],
  },
  // Яндекс Цветы: Повышенный бонус 40% на первый заказ
  {
    id: 826311004,
    promocode: {
      id: 826311004,
      code: "oxh702",
      bonusName: "Скидка 40% на первый заказ цветов от 3 000 ₽",
      terms: "Промокод oxh702: скидка 40% (не более 1 200 ₽) на первый заказ от 3 000 ₽ в приложении «Яндекс Цветы». Суммируется со скидками и спецпредложениями. Действует до 1 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-01T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ от 3 000 ₽",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: yandexFlowersStore,
    affiliate: YANDEX_FLOWERS_OCT31_AFFILIATE,
    extraLinks: [],
  },
  // PREMIER: 66 дней доступа к RUTUBE + PREMIER за 1 ₽
  {
    id: 826311005,
    promocode: {
      id: 826311005,
      code: "",
      bonusName: "66 дней доступа к PREMIER + RUTUBE за 1 ₽",
      terms: "Флеш-акция: оформите бесплатный период на 66 дней доступа к сервисам PREMIER + RUTUBE за 1 ₽ (или подписку на 13 дней за 1 ₽ для зрителей с активной подпиской). Перейдите по ссылке для активации. Действует до 1 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-01T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: premierStore,
    affiliate: PREMIER_OCT31_AFFILIATE,
    extraLinks: [],
  },
];
