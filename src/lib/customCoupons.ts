import { MAGNIT_ROTATED_OFFERS, M_KOSMETIK_ROTATED_OFFERS, CITYDRIVE_APPROVED_OFFERS, YANDEX_TRAVEL_ROTATED_OFFERS, TANUKI_OCT16_OFFERS, PEREKRESTOK_OCT16_OFFERS, GOLDAPPLE_ROTATED_OFFERS } from "@/lib/perfluenceRotatedOffers";
import type { Coupon } from "@/lib/types";
import { PERFLUENCE_OCT28_OFFERS } from "@/lib/perfluenceOct28Website";
import { STABLE_STORES } from "@/lib/stableStores";
import { PERFLUENCE_OCT16_APPROVED_OFFERS } from "@/lib/perfluenceOct16Offers";
import { VKUSVILL_OCT18_SITE_OFFERS } from "@/lib/perfluenceOct18Scheduled";
import { PERFLUENCE_OCT18_BATCH_OFFERS } from "@/lib/perfluenceOct18Batch";
import { FOODBAND_OFFERS } from "@/lib/foodbandOffers";
import { isCouponActive } from "@/lib/couponExpiry";
import { PERFLUENCE_REPEAT_OCT24_OFFERS } from "@/lib/perfluenceRepeatsOct24";
import { SBER_ANALIZY_OCT29_OFFERS } from "@/lib/perfluenceSberAnalizyOct29";
import { PERFLUENCE_OCT26_WEBSITE_OFFERS } from "@/lib/perfluenceOct26Website";
import { isPausedPublisherStore } from "@/lib/publisherPauses";

/**
 * Ручные купоны от рекламодателей и партнёрских сетей.
 * Каждый — с партнёрской ссылкой и маркировкой (erid).
 *
 * Здесь остались только те, которых нет в выдаче Perfluence. Купоны Додо
 * Пиццы, Бетховена, Ситидрайва, Кинопоиска и СберПрайма убраны: теперь эти
 * акции приходят из виджета, где у них ссылка и erid публикации самого сайта.
 * Ручные копии перебивали их при дедупе и уводили заказы на публикацию
 * Telegram-канала — результаты засчитывались не тому аккаунту.
 */

// PERFLUENCE / SberDevices: temporary approved PromoFact site placement.
// Both codes were supplied from the approved project; do not invent restrictions.
// The official site is informational; all outward CTA links MUST use the updated
// project-specific Perfluence tracking URL with the same approved ERID.
const SBERDEVICES_LINK = "https://sberdevaysy1.prfl.me/sites/fq4aly?erid=2RanymNsVkw";
const SBERDEVICES_ERID = "2RanymNsVkw";
const SBERDEVICES_STORE: Coupon["store"] = {
  id: 5067,
  name: "СберДевайсы",
  slug: "sberdevaysy",
  logo: null,
  category: "Электроника и техника",
  categorySlug: "elektronika-i-tehnika",
  about: "SberDevices — официальный интернет-магазин телевизоров, умных колонок, медиаприставок и устройств для умного дома.",
  conditions: "Проверяйте ограничения конкретного промокода и итоговую цену в корзине магазина.",
  site: "https://sberdevices.ru/",
  activeBloggers: 0,
};
const SBERDEVICES_AFFILIATE: Coupon["affiliate"] = {
  link: SBERDEVICES_LINK,
  landingLink: SBERDEVICES_LINK,
  ordMarker: SBERDEVICES_ERID,
  ordText: "Реклама. Рекламодатель — ООО «САЛЮТДЕВАЙСЫ», ИНН: 7730253720. erid: 2RanymNsVkw",
};

const PODRUZHKA_STORE: Coupon["store"] = {
      id: 5040,
      name: "Подружка",
      slug: "podruzhka",
      logo: "/brands/podruzhka-mark.svg",
      category: "Косметика и парфюмерия",
      categorySlug: "kosmetika-i-parfyumeriya",
      about: "«Подружка» — сеть магазинов косметики, парфюмерии, средств по уходу за собой и аксессуаров. В каталоге представлены популярные бренды декоративной и уходовой косметики по выгодным ценам.",
      conditions: "Онлайн-подарок по промокоду до 15 октября 2026 года. Отдельная акция с подарком при предъявлении штрихкода в розничном магазине действует до 18 октября.",
      site: "https://www.podrygka.ru",
      activeBloggers: 3120,
    };

// PERFLUENCE / Rosgosstrakh Online: approved PromoFact site placement.
const ROSGOSSTRAKH_LINK = "https://rosgostravel.prfl.me/sites/4cawc2?erid=2RanyknSz51";
const ROSGOSSTRAKH_ERID = "2RanyknSz51";
const ROSGOSSTRAKH_STORE: Coupon["store"] = {
  id: 4463,
  name: "Росгосстрах",
  slug: "rosgosstrakh",
  logo: "/brands/rosgosstrakh.png",
  category: "Сервисы и подписки",
  categorySlug: "servisy-i-podpiski",
  about: "«Росгосстрах» — одна из старейших и крупнейших страховых компаний России. Онлайн-оформление туристических, имущественных и спортивных страховых полисов за несколько минут с круглосуточной поддержкой 24/7.",
  conditions: "Скидка по промокоду применяется при покупке страхового полиса онлайн на официальном сайте. Суммируется с действующими акциями.",
  site: "https://rgs.online/",
  activeBloggers: 1200,
};
const ROSGOSSTRAKH_AFFILIATE: Coupon["affiliate"] = {
  link: ROSGOSSTRAKH_LINK,
  landingLink: ROSGOSSTRAKH_LINK,
  ordMarker: ROSGOSSTRAKH_ERID,
  ordText: 'Реклама. ПАО СК "Росгосстрах", ИНН 7707067683 erid: 2RanyknSz51',
};

// PERFLUENCE / Samokat Birthday: approved PromoFact site placement (post 17345615, project 305).
const SAMOKAT_LINK = "https://vml8.adj.st/main?showcaseType=MINIMARKET&adj_t=14mofhu6&adj_campaign=CPA&adj_adgroup=3074542&adj_fallback=https%3A%2F%2Fsamokat.ru%3Futm_source%3Dperfluence%26utm_medium%3Dcpa%26utm_campaign%3D3074542&adj_redirect_macos=https%3A%2F%2Fsamokat.ru%3Futm_source%3Dperfluence%26utm_medium%3Dcpa%26utm_campaign%3D3074542&erid=2RanymVswDd";
const SAMOKAT_ERID = "2RanymVswDd";
const SAMOKAT_STORE: Coupon["store"] = {
  id: 305,
  name: "Самокат",
  slug: "samokat",
  logo: "/brands/samokat.png",
  category: "Доставка продуктов",
  categorySlug: "dostavka-produktov",
  about: "«Самокат» — сервис мгновенной доставки продуктов, готовой еды и полезных мелочей для дома от 15 минут.",
  conditions: "Промокод действует на первый заказ в приложении и на сайте Самоката. Суммируется со скидками на товары внутри каталога.",
  site: "https://samokat.ru",
  activeBloggers: 2500,
};
const SAMOKAT_AFFILIATE: Coupon["affiliate"] = {
  link: SAMOKAT_LINK,
  landingLink: SAMOKAT_LINK,
  ordMarker: SAMOKAT_ERID,
  ordText: 'Реклама. Предложение действует с 15.10.2026 по 31.12.2026. Организатор: ООО «Умный ритейл», ИНН 7811657720. erid: 2RanymVswDd',
};


/** Perfluence website placements renewed 23 Oct 2026, explicitly approved for promofact.ru.
 * Do not infer minimum order, user segment, or max discount from the dashboard.
 */
const YANDEX_FLOWERS_OCT23_LINK = "https://yaflowers.prfl.me/sites/oluvpa?erid=2RanymRX1bZ";
const YANDEX_EDA_OCT23_LINK = "https://edayandex.prfl.me/sites/tndr3w?erid=2RanymUUzAF";
const YANDEX_FLOWERS_OCT23_STORE: Coupon["store"] = { ...STABLE_STORES["yandeks-tsvety"], activeBloggers: STABLE_STORES["yandeks-tsvety"].activeBloggers ?? 0 };
const YANDEX_EDA_OCT23_STORE: Coupon["store"] = { ...STABLE_STORES["yandex-eda"], activeBloggers: STABLE_STORES["yandex-eda"].activeBloggers ?? 0 };
const YANDEX_FLOWERS_OCT23_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_FLOWERS_OCT23_LINK, landingLink: YANDEX_FLOWERS_OCT23_LINK,
  ordMarker: "2RanymRX1bZ",
  ordText: 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanymRX1bZ',
};
const YANDEX_EDA_OCT23_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_EDA_OCT23_LINK, landingLink: YANDEX_EDA_OCT23_LINK,
  ordMarker: "2RanymUUzAF",
  ordText: 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanymUUzAF',
};
function approvedYandexOct23Coupon(
  id: number, store: Coupon["store"], affiliate: Coupon["affiliate"],
  code: string, bonusName: string, expires: string,
): Coupon {
  return {
    id,
    promocode: {
      id, code, bonusName,
      terms: `Предложение действует до ${new Date(expires).toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow" })}, 23:59 МСК. Применимость, ограничения и итоговую скидку проверяйте при оформлении заказа.`,
      expires, isHit: false, isUniversal: false, isFirstOrderOnly: false,
      customerTypeLabel: "По условиям предложения", region: "RU",
      isBarcode: false, barcodeImage: null, group: "perfluence",
    },
    store, affiliate, extraLinks: [],
  };
}
const YANDEX_OCT23_APPROVED_OFFERS: Coupon[] = [
  approvedYandexOct23Coupon(826375001, YANDEX_FLOWERS_OCT23_STORE, YANDEX_FLOWERS_OCT23_AFFILIATE,
    "QX7GZZ", "Скидка 1 100 ₽ в Яндекс Цветах", "2026-12-31T23:59:59+03:00"),
  approvedYandexOct23Coupon(826138401, YANDEX_EDA_OCT23_STORE, YANDEX_EDA_OCT23_AFFILIATE,
    "paf250", "Скидка 520 ₽ в Яндекс Еде Рестораны", "2026-11-15T23:59:59+03:00"),
  approvedYandexOct23Coupon(826138402, YANDEX_EDA_OCT23_STORE, YANDEX_EDA_OCT23_AFFILIATE,
    "lmj210", "Скидка 520 ₽ в Яндекс Еде Рестораны", "2026-11-01T23:59:59+03:00"),
];

export const CUSTOM_COUPONS: Coupon[] = [
  ...PERFLUENCE_OCT28_OFFERS,
  ...PERFLUENCE_OCT26_WEBSITE_OFFERS,
  ...PERFLUENCE_REPEAT_OCT24_OFFERS,
  ...SBER_ANALIZY_OCT29_OFFERS,
  ...YANDEX_OCT23_APPROVED_OFFERS,
  {
    id: 1734561501,
    promocode: {
      id: 1734561501,
      code: "GZP8FU6",
      bonusName: "Скидка 35% от 1 000 ₽ на первый заказ",
      terms: "Промокод GZP8FU6: скидка 35% от 1 000 ₽ на первый заказ в Самокате (максимальная скидка 500 ₽). Промокод суммируется со скидками на товары внутри сервиса. При скидке более 35% на товары применяется наиболее выгодная цена. Действует до 31 октября 2026 года 23:59.",
      expires: "2026-10-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 1000, currency: "RUB" },
      region: "Россия",
      isBarcode: false,
      barcodeImage: null,
      group: "Доставка продуктов",
    },
    store: SAMOKAT_STORE,
    affiliate: SAMOKAT_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 1734561502,
    promocode: {
      id: 1734561502,
      code: "GQCWSD2",
      bonusName: "Скидка 500 ₽ от 2 000 ₽ на первый заказ",
      terms: "Промокод GQCWSD2: скидка 500 ₽ от 2 000 ₽ на первый заказ в сервисе Самокат. Промокод суммируется со скидками на товары внутри каталога. Действует до 31 октября 2026 года 23:59.",
      expires: "2026-10-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 2000, currency: "RUB" },
      region: "Россия",
      isBarcode: false,
      barcodeImage: null,
      group: "Доставка продуктов",
    },
    store: SAMOKAT_STORE,
    affiliate: SAMOKAT_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 435414513,
    promocode: {
      id: 435414513,
      code: "PF1V34P",
      bonusName: "Скидка 10% на страховой полис для путешествий",
      terms: "Скидка 10% на каждую покупку страхового полиса для путешествий (любой период действия). Полис оформляется онлайн за 2 минуты, действует по России и всему миру с русскоязычной поддержкой 24/7. Включает медицинскую помощь и компенсацию расходов на лекарства. Суммируется с акциями на сайте.",
      expires: "2026-10-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все клиенты",
      region: "Россия",
      isBarcode: false,
      barcodeImage: null,
      group: "Страхование путешествий",
    },
    store: ROSGOSSTRAKH_STORE,
    affiliate: ROSGOSSTRAKH_AFFILIATE,
    extraLinks: [],
  },
  // Updated Ivi Perfluence placement for promofact.ru, 15 October 2026.
  // Do not reuse the old FILM35 coupon or old tracking link.
  {
    id: 82430035,
    promocode: {
      id: 82430035,
      code: "begrnta7swiz",
      bonusName: "35 дней подписки Иви бесплатно по промокоду",
      terms: "Промокод begrnta7swiz активируется до 31 декабря 2026 года включительно только для новых пользователей на территории РФ по специальной ссылке. 35 дней бесплатного пробного доступа. Требуется привязка банковской карты; при проверке карты возможно временное удержание с последующим возвратом. После окончания пробного периода подписка автоматически продлевается на 30 дней с оплатой согласно условиям Иви. Сервис 18+. Условия: www.ivi.ru/info/agreement.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только новые пользователи в РФ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: { ...STABLE_STORES["ivi"], activeBloggers: STABLE_STORES["ivi"].activeBloggers ?? 0 },
    affiliate: {
      link: "https://ivi1.prfl.me/sites/xpmis8?erid=2RanynVXhiB",
      landingLink: "https://ivi1.prfl.me/sites/xpmis8?erid=2RanynVXhiB",
      ordMarker: "2RanynVXhiB",
      ordText: "Реклама. ivi.ru. erid: 2RanynVXhiB. Сервис 18+.",
    },
    extraLinks: [],
  },
  ...MAGNIT_ROTATED_OFFERS,
  ...M_KOSMETIK_ROTATED_OFFERS,
  ...CITYDRIVE_APPROVED_OFFERS,
  ...YANDEX_TRAVEL_ROTATED_OFFERS,
  ...TANUKI_OCT16_OFFERS,
  ...PEREKRESTOK_OCT16_OFFERS,
  ...GOLDAPPLE_ROTATED_OFFERS,
  ...PERFLUENCE_OCT16_APPROVED_OFFERS,
  ...VKUSVILL_OCT18_SITE_OFFERS,
  ...PERFLUENCE_OCT18_BATCH_OFFERS,
  ...FOODBAND_OFFERS,
  {
    id: 50671,
    promocode: {
      id: 50671,
      code: "Sberdv171",
      bonusName: "Скидка 6% по промокоду Sberdv171",
      terms: "Промокод Sberdv171: скидка 6% по условиям проекта «СберДевайсы». Сверьте применимость к выбранным товарам, возможные исключения и сочетание с другими акциями в корзине официального магазина. До 31 октября 2026 года, 23:59 по Москве.",
      expires: "2026-10-31",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Условия уточняйте в магазине",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: SBERDEVICES_STORE,
    affiliate: SBERDEVICES_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 50672,
    promocode: {
      id: 50672,
      code: "Sberdv71",
      bonusName: "Скидка 5% по промокоду Sberdv71",
      terms: "Промокод Sberdv71: скидка 5% по условиям проекта «СберДевайсы». Сверьте применимость к выбранным товарам, возможные исключения и сочетание с другими акциями в корзине официального магазина. До 31 октября 2026 года, 23:59 по Москве.",
      expires: "2026-10-31",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Условия уточняйте в магазине",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: SBERDEVICES_STORE,
    affiliate: SBERDEVICES_AFFILIATE,
    extraLinks: [],
  },

  {
    id: 50029,
    promocode: {
      id: 50029,
      code: "", // Скидка по ссылке
      bonusName: "СберПрайм на 60 дней за 2 ₽ + 185 бонусов Спасибо в подарок",
      terms: "Подписка СберПрайм на 60 дней всего за 2 рубля и 185 бонусов Спасибо в приветствие! Повышенный кешбэк до 37% бонусами Спасибо за покупки в «Ашан», «Gloria Jeans», «Вкусно и точка». Действует для новых пользователей или клиентов без активной подписки более 150 дней при оплате картой Сбербанка.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Новые пользователи или >150 дней без подписки",
      region: "RU",
      isBarcode: false,
      barcodeImage: "/images/sberprime.png",
      group: "perfluence",
    },
    store: {
      id: 5030,
      name: "СберПрайм",
      slug: "sberprime",
      logo: "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "СберПрайм — единая подписка на сервисы: фильмы в Okko, музыка в Звуке, бесплатная доставка продуктов и повышенный кэшбэк бонусами Спасибо на покупки.",
      conditions: "Промокод не требуется. Перейдите по официальной ссылке и подключите подписку на 60 дней за 2 ₽.",
      site: "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF",
      activeBloggers: 15400,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF",
      landingLink: "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF",
      ordMarker: "2RanynswGSF",
      ordText: "Реклама. Рекламодатель — АО «ЦПЛ» (ОГРН: 1117746689840, г. Москва). erid: 2RanynswGSF",
    },
    extraLinks: [],
  },
  {
    id: 50030,
    promocode: {
      id: 50030,
      code: "", // Скидка по ссылке
      bonusName: "СберПрайм 60 дней за 1 ₽ + 5% кэшбэк на игры в GamersHub",
      terms: "Получайте 5% бонусами Спасибо с каждой покупки игр, ключей и пополнения кошелька на GamersHub без комиссий. Для новичков действует пробный период СберПрайм 60 дней за 1 ₽ или годовая подписка за 333 ₽/мес.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: "/images/sberprime.png",
      group: "perfluence",
    },
    store: {
      id: 5030,
      name: "СберПрайм",
      slug: "sberprime",
      logo: "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "СберПрайм — единая подписка на сервисы: фильмы в Okko, музыка в Звуке, бесплатная доставка и повышенный кэшбэк бонусами Спасибо на покупки и игры на GamersHub.",
      conditions: "Промокод не требуется. Перейдите по ссылке и оформите подписку. Открывать через российские браузеры.",
      site: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      activeBloggers: 15400,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      landingLink: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      ordMarker: "2RanymUAmpP",
      ordText: "Реклама. Рекламодатель — АО «ЦПЛ» (ОГРН: 1117746689840, г. Москва). erid: 2RanymUAmpP",
    },
    extraLinks: [],
  },
  {
    id: 50031,
    promocode: {
      id: 50031,
      code: "", // Оформление по ссылке
      bonusName: "Бесплатное обслуживание навсегда и кешбэк бонусами Спасибо",
      terms: "Оформите дебетовую СберКарту онлайн: бесплатный выпуск и обслуживание навсегда без условий, переводы до 100 000 ₽ в месяц без комиссии клиентам любых банков через СБП, кешбэк бонусами СберСпасибо до 30% у партнеров банка. Действует для новых клиентов или пользователей без активных карт Сбера более 60 дней.",
      expires: "2027-01-31T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Новые клиенты или без карт >60 дней",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 3752,
      name: "СберБанк",
      slug: "sberbank",
      logo: "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "СберБанк — крупнейший банк в России. Дебетовые и кредитные карты, вклады с повышенной доходностью и бонусы СберСпасибо.",
      conditions: "Промокод не требуется. Перейдите по ссылке и оформите СберКарту онлайн.",
      site: "https://sberbank1.prfl.me/sites/7nue8j?erid=2RanykaY4Us",
      activeBloggers: 10000,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/7nue8j?erid=2RanykaY4Us",
      landingLink: "https://sberbank1.prfl.me/sites/7nue8j?erid=2RanykaY4Us",
      ordMarker: "2RanykaY4Us",
      ordText: "Реклама. Рекламодатель: ПАО Сбербанк. ИНН: 7707083893 Ген. лицензия Банка России на осуществление банковских операций № 1481 от 11.08.2015 г. erid: 2RanykaY4Us",
    },
    extraLinks: [],
  },
  {
    id: 50032,
    promocode: {
      id: 50032,
      code: "dcjutya4",
      bonusName: "50 дней доступа к PREMIER + RUTUBE за 1 ₽",
      terms: "Подписка на 50 дней доступа к онлайн-кинотеатру PREMIER и библиотеке RUTUBE всего за 1 ₽ по эксклюзивному промокоду dcjutya4. Действует для новых пользователей или зрителей без активной подписки более 90 дней (или подписка на 1 месяц за 99 ₽ для неактивных менее 90 дней, далее 399 ₽/мес).",
      expires: "2027-01-19T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Новые зрители или >90 дней без подписки",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 812,
      name: "PREMIER",
      slug: "premier",
      logo: "https://favicon.yandex.net/favicon/v2/premier.one?size=120",
      category: "Онлайн-кинотеатры",
      categorySlug: "onlayn-kinoteatry",
      about: "PREMIER — онлайн-кинотеатр с эксклюзивными российскими сериалами, фильмами и шоу собственного производства.",
      conditions: "Введите промокод dcjutya4 при активации подписки на сайте premier.one.",
      site: "https://premier.prfl.me/sites/gsj9qt?erid=2Ranymq94ZR",
      activeBloggers: 1500,
    },
    affiliate: {
      link: "https://premier.prfl.me/sites/gsj9qt?erid=2Ranymq94ZR",
      landingLink: "https://premier.prfl.me/sites/gsj9qt?erid=2Ranymq94ZR",
      ordMarker: "2Ranymq94ZR",
      ordText: "Реклама. Рекламодатель: ООО \"ПРЕМЬЕР\" 16+ ИНН 9702011190 erid: 2Ranymq94ZR",
    },
    extraLinks: [],
  },
  {
    id: 50041,
    promocode: {
      id: 50041,
      code: "2921098554627",
      bonusName: "Набор косметики в подарок при покупке от 1 500 ₽ онлайн",
      terms: "Подарочный набор косметики при онлайн-заказе от 1 500 ₽. Промокод 2921098554627 действует только онлайн до 15 октября 2026 года, 23:59 по Москве. Наличие подарка и ограничения уточняйте при оформлении.",
      expires: "2026-10-15",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Только онлайн",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: PODRUZHKA_STORE,
    affiliate: {
      link: "https://podrygka.prfl.me/sites/q8ufig?erid=2RanymdB9PR",
      landingLink: "https://podrygka.prfl.me/sites/q8ufig?erid=2RanymdB9PR",
      ordMarker: "2RanymdB9PR",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2RanymdB9PR",
    },
    extraLinks: [],
  },
  {
    id: 50042,
    promocode: {
      id: 50042,
      code: "2921098553491",
      bonusName: "Подарок по штрихкоду на кассе при покупке от 1 500 ₽",
      terms: "До 18 октября 2026 года, 23:59 по Москве. Подарочный набор косметики при покупке от 1 500 ₽ в розничном магазине «Подружка» по штрихкоду 2921098553491. Покажите штрихкод кассиру до оплаты. Онлайн-промокод 2921098554627 действует отдельно и не заменяет штрихкод для кассы. Наличие подарка и другие ограничения уточняйте в магазине.",
      expires: "2026-10-18",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Только в магазинах",
      region: "RU",
      isBarcode: true,
      barcodeImage: null,
      group: "perfluence",
    },
    store: PODRUZHKA_STORE,
    affiliate: {
      link: "https://podrygka.prfl.me/sites/xza4uw?erid=2Ranymef8fm",
      landingLink: "https://podrygka.prfl.me/sites/xza4uw?erid=2Ranymef8fm",
      ordMarker: "2Ranymef8fm",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2Ranymef8fm",
    },
    extraLinks: [],
  },
  {
    id: 50045,
    promocode: {
      id: 50045,
      code: "2921060875255",
      bonusName: "Скидка 30% на первый и повторный заказ без минимума (Чёрная Пятница)",
      terms: "Скидка 30% на первый и все повторные заказы онлайн и в розничных магазинах «Подружка» по промокоду и штрихкоду 2921060875255. Действует до 30 ноября 2026 года.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: true,
      barcodeImage: "https://barcode.tec-it.com/barcode.ashx?data=2921060875255&code=EAN13",
      group: "perfluence",
    },
    store: PODRUZHKA_STORE,
    affiliate: {
      link: "https://podrygka.prfl.me/sites/xigpgx?erid=2RanynYwD2T",
      landingLink: "https://podrygka.prfl.me/sites/xigpgx?erid=2RanynYwD2T",
      ordMarker: "2RanynYwD2T",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2RanynYwD2T",
    },
    extraLinks: [],
  },
  {
    id: 50050,
    promocode: {
      id: 50050,
      code: "KW9JUP1C",
      bonusName: "Скидка 25% на заказ",
      terms: "Скидка 25% по промокоду KW9JUP1C на постельное бельё, текстиль, декор и товары для дома Cozy Home при заказе онлайн до 18 октября 2026 года 23:59.",
      expires: "2026-10-18",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 3641,
      name: "Cozy Home",
      slug: "cozy-home",
      logo: "https://favicon.yandex.net/favicon/v2/cozyhome.ru?size=120",
      category: "Всё для дома",
      categorySlug: "vse-dlya-doma",
      about: "Cozy Home — сеть магазинов стильного домашнего уюта: комплекты постельного белья, мягкие пледы, махровые полотенца, домашняя одежда и изысканные ароматы для дома.",
      conditions: "Введите промокод KW9JUP1C при оформлении заказа онлайн для получения скидки 25%. Действует до 18 октября 2026 года 23:59.",
      site: "https://cozyhome.ru",
      activeBloggers: 4200,
    },
    affiliate: {
      link: "https://cozyhome.prfl.me/sites/jy58f4?erid=2RanynxDUwD",
      landingLink: "https://cozyhome.prfl.me/sites/jy58f4?erid=2RanynxDUwD",
      ordMarker: "2RanynxDUwD",
      ordText: "Реклама. Cozy Home erid: 2RanynxDUwD",
    },
    extraLinks: [],
  },
  {
    id: 82641761,
    promocode: {
      id: 82641761,
      code: "PERF79WJXX5E",
      bonusName: "Скидка 12% на первый заказ в Poizon (Чёрная Пятница)",
      terms: "Скидка 12% (не более 4 000 ₽) на первый заказ на сайте и в мобильном приложении Poizon по промокоду PERF79WJXX5E. Суммируется со скидками распродажи 11.11 и Чёрная Пятница 2026. Действует до 30 ноября 2026 года.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только на первый заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["poizon"],
      activeBloggers: STABLE_STORES["poizon"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://poizon.prfl.me/sites/08vmlg?erid=2Ranyo4fyN3",
      landingLink: "https://poizon.prfl.me/sites/08vmlg?erid=2Ranyo4fyN3",
      ordMarker: "2Ranyo4fyN3",
      ordText: "Реклама. Poizon erid: 2Ranyo4fyN3",
    },
    extraLinks: [],
  },
  {
    id: 82643831,
    promocode: {
      id: 82643831,
      code: "СПАСИБО",
      bonusName: "Розыгрыш 18,5 млн бонусов Спасибо за вклад в Сбере",
      terms: "Откройте любой вклад в Сбере по ссылке и станьте участником розыгрыша 18,5 млн бонусов Спасибо. Всего 1000 победителей! Ставка до 13,5% годовых на срок 3–7 месяцев.",
      expires: "2026-11-30",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех клиентов",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vklad-v-sbere"],
      activeBloggers: STABLE_STORES["vklad-v-sbere"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/iqsdgq?erid=2RanykueVCo",
      landingLink: "https://sberbank1.prfl.me/sites/iqsdgq?erid=2RanykueVCo",
      ordMarker: "2RanykueVCo",
      ordText: "Реклама. Рекламодатель: ПАО Сбербанк. ИНН: 7707083893, Ген. лицензия ЦБ РФ № 1481 от 11.08.2015 г. erid: 2RanykueVCo",
    },
    extraLinks: [],
  },
  // Historic WinLab data retained for audit only; publication is blocked centrally.
  {
    id: 81409001,
    promocode: {
      id: 81409001,
      code: "10PFNS5229",
      bonusName: "Скидка 10% на первый заказ в ВинЛаб",
      terms: "Скидка 10% на первый заказ на сайте и в мобильном приложении ВинЛаб. Максимальная скидка — 3 000 ₽. Суммируется со скидками, кроме раздела «Ваша цена». Срок действия по 31 октября 2026 года.",
      expires: "2026-10-31",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Новые покупатели",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["winlab"],
      activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://winelab.prfl.me/sites/gittf8",
      landingLink: "https://winelab.prfl.me/sites/gittf8",
      ordMarker: "",
      ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+.",
    },
    extraLinks: [],
  },
  {
    id: 81409002,
    promocode: {
      id: 81409002,
      code: "WCPFOKT9920",
      bonusName: "Дополнительная скидка 10% на WinClub в ВинЛаб",
      terms: "Дополнительная скидка 10% на каждый заказ товаров со значком WinClub на сайте и в мобильном приложении ВинЛаб. Максимальная скидка — 3 000 ₽. Срок действия по 28 октября 2026 года.",
      expires: "2026-10-28",
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
      ...STABLE_STORES["winlab"],
      activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://winelab.prfl.me/sites/gittf8",
      landingLink: "https://winelab.prfl.me/sites/gittf8",
      ordMarker: "",
      ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+.",
    },
    extraLinks: [],
  },
  {
    id: 81409003,
    promocode: {
      id: 81409003,
      code: "5OKTPF9920",
      bonusName: "Скидка 5% на повторные заказы в ВинЛаб",
      terms: "Скидка 5% на каждый повторный заказ на сайте и в мобильном приложении ВинЛаб. Максимальная скидка — 3 000 ₽. Суммируется со скидками, кроме раздела «Ваша цена». Срок действия по 28 октября 2026 года.",
      expires: "2026-10-28",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Повторные заказы",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["winlab"],
      activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://winelab.prfl.me/sites/gittf8",
      landingLink: "https://winelab.prfl.me/sites/gittf8",
      ordMarker: "",
      ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+.",
    },
    extraLinks: [],
  },
  {
    id: 1734704501,
    promocode: {
      id: 1734704501,
      code: "paf250",
      bonusName: "Скидка 520 ₽ от 800 ₽ + Шефбургер Де Люкс за 1 ₽ в ROSTIC’S",
      terms: "Скидка 520 ₽ на первый заказ от 800 ₽, суммируется со всеми акциями + Шефбургер Де Люкс за 1 ₽ из ROSTIC’S в Яндекс Еде. Действует до 15 ноября 2026 года 23:59.",
      expires: "2026-11-15T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 800, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandex-eda"],
      activeBloggers: STABLE_STORES["yandex-eda"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://edayandex.prfl.me/sites/tndr3w?erid=2RanymUUzAF",
      landingLink: "https://edayandex.prfl.me/sites/tndr3w?erid=2RanymUUzAF",
      ordMarker: "2RanymUUzAF",
      ordText: 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanymUUzAF',
    },
    extraLinks: [],
  },
  {
    id: 1734704502,
    promocode: {
      id: 1734704502,
      code: "lmj210",
      bonusName: "Скидка 520 ₽ от 800 ₽ + Наггетсы со скидкой до 45% во «Вкусно — и точка»",
      terms: "Скидка 520 ₽ на первый заказ от 800 ₽, суммируется со всеми акциями + Наггетсы со скидкой до 45% из «Вкусно — и точка» в Яндекс Еде. Действует до 1 ноября 2026 года 23:59.",
      expires: "2026-11-01T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 800, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandex-eda"],
      activeBloggers: STABLE_STORES["yandex-eda"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://edayandex.prfl.me/sites/tndr3w?erid=2RanymUUzAF",
      landingLink: "https://edayandex.prfl.me/sites/tndr3w?erid=2RanymUUzAF",
      ordMarker: "2RanymUUzAF",
      ordText: 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanymUUzAF',
    },
    extraLinks: [],
  },
  {
    id: 1734704301,
    promocode: {
      id: 1734704301,
      code: "QX7GZZ",
      bonusName: "Скидка 1 100 ₽ от 3 000 ₽ на первый заказ цветов",
      terms: "Скидка 1 100 ₽ на первый заказ цветов от 3 000 ₽ в приложении Яндекс Цветы. Действует до 31 декабря 2026 года 23:59.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-tsvety"],
      activeBloggers: STABLE_STORES["yandeks-tsvety"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://yaflowers.prfl.me/sites/oluvpa?erid=2RanymRX1bZ",
      landingLink: "https://yaflowers.prfl.me/sites/oluvpa?erid=2RanymRX1bZ",
      ordMarker: "2RanymRX1bZ",
      ordText: 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanymRX1bZ',
    },
    extraLinks: [],
  },
  // 24 Октября: Нетология (скидки до 65% + 5 курсов по ИИ в подарок)
  {
    id: 11555601,
    promocode: {
      id: 11555601,
      code: "NETOOCT65",
      bonusName: "Скидки до 65% на все курсы + 5 курсов по ИИ в подарок",
      terms: "Скидки до 65% на все онлайн-курсы Нетологии по промокоду NETOOCT65. Дополнительно 5 курсов по нейросетям в подарок (планирование, творчество, маркетинг, программирование, дизайн). Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["netology"],
      activeBloggers: STABLE_STORES["netology"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://netology.ru/?utm_source=perfluence&utm_medium=cpa&utm_campaign=netology",
      landingLink: "https://netology.ru/?utm_source=perfluence&utm_medium=cpa&utm_campaign=netology",
      ordMarker: "",
      ordText: 'Реклама. ООО "Нетология", ИНН 7726464125',
    },
    extraLinks: [],
  },
  // 24–25 Октября: Start.ru (флеш-акция 14 дней бесплатно для всех)
  {
    id: 11554601,
    promocode: {
      id: 11554601,
      code: "",
      bonusName: "14 дней бесплатного доступа для всех пользователей Start.ru",
      terms: "Горящая флеш-акция 24–25 октября: 14 дней бесплатного доступа к эксклюзивным сериалам и премьерам онлайн-кинотеатра Start.ru (далее 499 ₽/мес). Действует для всех пользователей без исключений! Действует до 25 октября 2026 года 23:59.",
      expires: "2026-10-25T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["start-ru"],
      activeBloggers: STABLE_STORES["start-ru"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://start1.prfl.me/sites/h3mgyy?erid=2RanynH1h7f",
      landingLink: "https://start1.prfl.me/sites/h3mgyy?erid=2RanynH1h7f",
      ordMarker: "2RanynH1h7f",
      ordText: "Реклама. ООО «Старт.Ру», ИНН: 7728374780. erid: 2RanynH1h7f",
    },
    extraLinks: [],
  },
  // 24 Октября: Cozy Home на WB (флеш-акция 25%)
  {
    id: 11544501,
    promocode: {
      id: 11544501,
      code: "9ELP3D1G",
      bonusName: "Скидка 25% на товары Cozy Home на Wildberries",
      terms: "Флеш-акция только 24 октября 2026 года: скидка 25% на товары для дома, уютный текстиль и декор бренда Cozy Home на WB по промокоду 9ELP3D1G. Действует до 24 октября 23:59.",
      expires: "2026-10-24T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["cozy-home"],
      activeBloggers: STABLE_STORES["cozy-home"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://cozyhome.prfl.me/sites/ohk319?erid=2RanynvjVes",
      landingLink: "https://cozyhome.prfl.me/sites/ohk319?erid=2RanynvjVes",
      ordMarker: "2RanynvjVes",
      ordText: "Реклама. Cozy Home erid: 2RanynvjVes",
    },
    extraLinks: [],
  },
  // 24–25 Октября: СберЗдоровье (флеш-акция до 40% на анализы + расшифровка)
  {
    id: 11554701,
    promocode: {
      id: 11554701,
      code: "",
      bonusName: "Скидка до 40% на анализы + расшифровка с врачом в СберЗдоровье",
      terms: "Флеш-акция 24–25 октября: скидка 40% на любые медицинские анализы в лабораториях Гемотест, KDL, Хеликс, Ситилаб (и 10% в Инвитро) + бесплатная онлайн-консультация дежурного врача по расшифровке результатов в СберЗдоровье. Действует до 25 октября 2026 года 23:59.",
      expires: "2026-10-25T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["sberzdorovie"],
      activeBloggers: STABLE_STORES["sberzdorovie"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://sberanalizy.prfl.me/sites/jhtq64?erid=2Ranym5xMV5",
      landingLink: "https://sberanalizy.prfl.me/sites/jhtq64?erid=2Ranym5xMV5",
      ordMarker: "2Ranym5xMV5",
      ordText: "Реклама. ООО «Инновационная медицина», ИНН 9706000111 erid: 2Ranym5xMV5. ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ, НЕОБХОДИМА КОНСУЛЬТАЦИЯ СПЕЦИАЛИСТА",
    },
    extraLinks: [],
  },
  // 24 Октября: Яндекс Путешествия (флеш-акция 20% на отели)
  {
    id: 11550701,
    promocode: {
      id: 11550701,
      code: "",
      bonusName: "Флеш-акция: скидка 20% на отели и проживание (до 100 000 ₽)",
      terms: "Горящая флеш-акция только до 24 октября 23:59 по МСК: скидка 20% на одно бронирование отеля или жилья в Яндекс Путешествиях (максимальная скидка 100 000 ₽). Действует для всех пользователей на период проживания с 29.12.2026. Действует до 24 октября 23:59.",
      expires: "2026-10-24T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-puteshestviya"],
      activeBloggers: STABLE_STORES["yandeks-puteshestviya"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://travelyandex.prfl.me/sites/m36t95?erid=2RanynrxY67",
      landingLink: "https://travelyandex.prfl.me/sites/m36t95?erid=2RanynrxY67",
      ordMarker: "2RanynrxY67",
      ordText: "Реклама. ООО «Яндекс Вертикали», ИНН 7704340327. erid: 2RanynrxY67",
    },
    extraLinks: [],
  },
  // 26–28 Октября: Randewoo (72 часа скидки до -55% на миниатюры + промокод)
  {
    id: 11578201,
    promocode: {
      id: 11578201,
      code: "",
      bonusName: "Скидки до 55% на миниатюры и аромабоксы в Randewoo",
      terms: "Флеш-акция Randewoo только 26–28 октября (72 часа): скидки до 55% на миниатюры парфюмерии и аромабоксы. Действует для всех пользователей до 28 октября 2026 года 23:59.",
      expires: "2026-10-28T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: {
      ...STABLE_STORES["randewoo"],
      activeBloggers: STABLE_STORES["randewoo"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://randewoo.ru/",
      landingLink: "https://randewoo.ru/",
      ordMarker: "",
      ordText: "Реклама. ООО «Мегаперфюме», ИНН 7715489209",
    },
    extraLinks: [],
  },
  // Подтверждённый партнёрский оффер Randewoo (Admitad ID 22484)
  {
    id: 2248401,
    promocode: {
      id: 2248401,
      code: "RND7",
      bonusName: "Скидка 7% на заказы от 3 000 ₽ в Randewoo",
      terms: "Скидка 7% на парфюмерию и косметику по промокоду RND7 при заказе от 3 000 ₽ в интернет-магазине Randewoo. Действует до 11 февраля 2027 года 23:59.",
      expires: "2027-02-11T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: {
      ...STABLE_STORES["randewoo"],
      activeBloggers: STABLE_STORES["randewoo"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://bywiola.com/g/zo4r4l1htlc7dde8999c0dd11956d5/?i=3&erid=2bL9aMPo2e49hMef4rqyKXgYCe",
      landingLink: "https://bywiola.com/g/zo4r4l1htlc7dde8999c0dd11956d5/?i=3&erid=2bL9aMPo2e49hMef4rqyKXgYCe",
      ordMarker: "2bL9aMPo2e49hMef4rqyKXgYCe",
      ordText: "Реклама. ООО «Рандеву». erid: 2bL9aMPo2e49hMef4rqyKXgYCe",
    },
    extraLinks: [],
  },
  // PERFLUENCE / Т-Путешествия. Отели: подтверждённое размещение сайта (ID 3285)
  {
    id: 328501,
    promocode: {
      id: 328501,
      code: "",
      bonusName: "Скидка 15% на первое бронирование отелей в Т-Путешествиях",
      terms: "Скидка 15% на первое бронирование отеля для новых пользователей сервиса на сайте или в приложении Т-Банка в разделе «Т-Путешествия» (максимальная скидка 3 000 ₽). Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["t-puteshestviya-oteli"],
      activeBloggers: STABLE_STORES["t-puteshestviya-oteli"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://tinkoff.prfl.me/sites/x3cow9?erid=2RanyoF7adh",
      landingLink: "https://tinkoff.prfl.me/sites/x3cow9?erid=2RanyoF7adh",
      ordMarker: "2RanyoF7adh",
      ordText: "Реклама. АО «ТБанк», ИНН 7710140679. erid: 2RanyoF7adh",
    },
    extraLinks: [],
  },
];

/**
 * Время публикации для купонов с согласованной датой выхода (по Москве).
 * До этого момента купон не попадает на сайт.
 */
const PUBLISH_FROM: Record<number, string> = {};

export function getCustomCoupons(now = Date.now()): Coupon[] {
  return CUSTOM_COUPONS.filter((c) => {
    // One publication stop for all consumer paths, not just the merged catalogue.
    if (isPausedPublisherStore(c.store.slug)) return false;
    const from = PUBLISH_FROM[c.id];
    if (from && now < new Date(from).getTime()) return false;
    return isCouponActive(c.promocode.expires, now);
  });
}
