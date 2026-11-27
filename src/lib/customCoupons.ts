import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";
import { isCouponActive } from "@/lib/couponExpiry";
import { isPausedPublisherStore } from "@/lib/publisherPauses";
import { SBER_ANALIZY_OCT29_OFFERS } from "@/lib/perfluenceSberAnalizyOct29";
import pampaduOffersData from "@/data/pampadu-offers.json";

/**
 * Approved Adjust website placement for Samokat (project 305, 35% first order).
 * GQCWSD2 and NVGBDBJS8 come directly from perfluence-feed.json.
 */
export const SAMOKAT_LINK =
  "https://vml8.adj.st/main?showcaseType=MINIMARKET&adj_t=14mofhu6&adj_campaign=CPA&adj_adgroup=3074542&adj_fallback=https%3A%2F%2Fsamokat.ru%3Futm_source%3Dperfluence%26utm_medium%3Dcpa%26utm_campaign%3D3074542&adj_redirect_macos=https%3A%2F%2Fsamokat.ru%3Futm_source%3Dperfluence%26utm_medium%3Dcpa%26utm_campaign%3D3074542&erid=2RanymVswDd";

const PAMPADU_COUPONS: Coupon[] = pampaduOffersData.offers.map((offer) => {
  const baseStore = STABLE_STORES[offer.storeSlug];
  if (!baseStore) {
    throw new Error(`Unknown Pampadu storeSlug "${offer.storeSlug}" in src/data/pampadu-offers.json`);
  }
  return {
    id: offer.id,
    promocode: {
      id: offer.id,
      code: offer.code,
      bonusName: offer.bonusName,
      terms: offer.terms,
      expires: offer.expires,
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: offer.customerTypeLabel,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "pampadu",
      highlights: Array.isArray(offer.highlights) ? offer.highlights : undefined,
      productType:
        offer.productType === "credit" || offer.productType === "debit" || offer.productType === "installment"
          ? offer.productType
          : undefined,
    },
    store: {
      ...baseStore,
      activeBloggers: offer.activeBloggers ?? baseStore.activeBloggers ?? 0,
    },
    affiliate: {
      link: offer.link,
      landingLink: offer.landingLink,
      ordMarker: offer.ordMarker,
      ordText: offer.ordText,
    },
    extraLinks: [],
  };
});

/**
 * Custom catalog only holds:
 * 1. Structured Pampadu finance offers from src/data/pampadu-offers.json.
 * 2. Active website placements from Perfluence not present in the widget feed.
 * All stores available in perfluence-feed.json are served directly from the feed.
 */
export const CUSTOM_COUPONS: Coupon[] = [
  ...PAMPADU_COUPONS,
  // Verified medical placements for SberZdorovie with mandatory contraindications marking
  ...SBER_ANALIZY_OCT29_OFFERS.filter(
    (c) => c.promocode.code === "SHD56E28" || c.promocode.code === "PERE7A4E5",
  ),
  {
    id: 1734561501,
    promocode: {
      id: 1734561501,
      code: "GZP8FU6",
      bonusName: "Скидка 35% от 1 000 ₽ на первый заказ",
      terms:
        "Промокод GZP8FU6: скидка 35% от 1 000 ₽ на первый заказ в Самокате (максимальная скидка 500 ₽). Промокод суммируется со скидками на товары внутри сервиса. При скидке более 35% на товары применяется наиболее выгодная цена. Действует до 30 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-30T23:59:59+03:00",
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
    store: {
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
    },
    affiliate: {
      link: SAMOKAT_LINK,
      landingLink: SAMOKAT_LINK,
      ordMarker: "2RanymVswDd",
      ordText:
        "Реклама. Предложение действует с 15.10.2026 по 31.12.2026. Организатор: ООО «Умный ритейл», ИНН 7811657720. erid: 2RanymVswDd",
    },
    extraLinks: [],
  },
  {
    id: 82430035,
    promocode: {
      id: 82430035,
      code: "begrnta7swiz",
      bonusName: "35 дней подписки Иви бесплатно по промокоду",
      terms:
        "Промокод begrnta7swiz активируется до 31 декабря 2026 года включительно только для новых пользователей на территории РФ по специальной ссылке. 35 дней бесплатного пробного доступа. Требуется привязка банковской карты; при проверке карты возможно временное удержание с последующим возвратом. После окончания пробного периода подписка автоматически продлевается на 30 дней с оплатой согласно условиям Иви. Сервис 18+. Условия: www.ivi.ru/info/agreement.",
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
  {
    id: 50029,
    promocode: {
      id: 50029,
      code: "",
      bonusName: "СберПрайм на 60 дней за 2 ₽ + 185 бонусов Спасибо в подарок",
      terms:
        "Подписка СберПрайм на 60 дней всего за 2 рубля и 185 бонусов Спасибо в приветствие! Повышенный кешбэк до 37% бонусами Спасибо за покупки в «Ашан», «Gloria Jeans», «Вкусно и точка». Действует для новых пользователей или клиентов без активной подписки более 150 дней при оплате картой Сбербанка.",
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
      about:
        "СберПрайм — единая подписка на сервисы: фильмы в Okko, музыка в Звуке, бесплатная доставка продуктов и повышенный кэшбэк бонусами Спасибо на покупки.",
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
    id: 82643831,
    promocode: {
      id: 82643831,
      code: "СПАСИБО",
      bonusName: "Розыгрыш 18,5 млн бонусов Спасибо за вклад в Сбере",
      terms:
        "Откройте любой вклад в Сбере по ссылке и станьте участником розыгрыша 18,5 млн бонусов Спасибо. Всего 1000 победителей! Ставка до 13,5% годовых на срок 3–7 месяцев.",
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
      ordText:
        "Реклама. Рекламодатель: ПАО Сбербанк. ИНН: 7707083893, Ген. лицензия ЦБ РФ № 1481 от 11.08.2015 г. erid: 2RanykueVCo",
    },
    extraLinks: [],
  },
  {
    id: 81483071,
    promocode: {
      id: 81483071,
      code: "PERFCITY107",
      bonusName: "Первая поездка в Ситидрайв: скидка 500 ₽ + сертификат 700 ₽ в OZON",
      terms:
        "Скидка 500 ₽ на первую поездку и сертификат на 700 ₽ в OZON по промокоду PERFCITY107 при заказе каршеринга Ситидрайв. Действует до 30 ноября 2026 года.",
      expires: "2026-11-30",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первая поездка",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: { ...STABLE_STORES.citydrive, activeBloggers: STABLE_STORES.citydrive.activeBloggers ?? 0 },
    affiliate: {
      link: "https://citydrive.prfl.me/sites/uf2lsb?erid=2RanymUeEjv",
      landingLink: "https://citydrive.prfl.me/sites/uf2lsb?erid=2RanymUeEjv",
      ordMarker: "2RanymUeEjv",
      ordText:
        "Реклама. Рекламодатель: ООО «НТС», Москва, вн. тер. г. м. о. Филевский парк, пр-д Береговой, д. 5А, к. 1, помещ. 1/13. ИНН 7704314221, ОГРН 1157746368999, citydrive.ru — «Ситидрайв» сервис аренды автомобилей. 0+ erid: 2RanymUeEjv",
    },
    extraLinks: [],
  },
  // Verified promofact.ru site placements for PREMIER (project 812) — keeps /sites/ ERID separate from @smart_zakupka widget
  {
    id: 81202611271,
    promocode: {
      id: 81202611271,
      code: "yrgm69y3",
      bonusName: "65 дней доступа к PREMIER + RUTUBE или 15 дней за 1 ₽",
      terms:
        "Оформить бесплатный период на 65 дней доступа к сервисам PREMIER + RUTUBE или оформить подписку на 15 дней за 1 ₽ по промокоду yrgm69y3. Действует до 29 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-29T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Новым или без активной подписки",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["premier"],
      activeBloggers: STABLE_STORES["premier"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://premier.prfl.me/sites/9zztzk?erid=2RanymRJo7A",
      landingLink: "https://premier.prfl.me/sites/9zztzk?erid=2RanymRJo7A",
      ordMarker: "2RanymRJo7A",
      ordText: 'Реклама. Рекламодатель: ООО "ПРЕМЬЕР" 16+ ИНН 9702011190 erid: 2RanymRJo7A',
    },
    extraLinks: [],
  },
  {
    id: 81202611272,
    promocode: {
      id: 81202611272,
      code: "",
      bonusName: "70 дней доступа к PREMIER + RUTUBE или 15 дней за 1 ₽",
      terms:
        "Флеш-акция: оформите бесплатный период на 70 дней доступа к сервисам PREMIER + RUTUBE или подписку на 15 дней за 1 ₽ по ссылке. С 27 по 29 ноября 2026 года.",
      expires: "2026-11-29T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Флеш-акция до 29 ноября",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["premier"],
      activeBloggers: STABLE_STORES["premier"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://premier.prfl.me/sites/ga7ey8?erid=2RanynPoPjz",
      landingLink: "https://premier.prfl.me/sites/ga7ey8?erid=2RanynPoPjz",
      ordMarker: "2RanynPoPjz",
      ordText: 'Реклама. Рекламодатель: ООО "ПРЕМЬЕР" 16+ ИНН 9702011190 erid: 2RanynPoPjz',
    },
    extraLinks: [],
  },
];

const PUBLISH_FROM: Record<number, string> = {};

export function getCustomCoupons(now = Date.now()): Coupon[] {
  return CUSTOM_COUPONS.filter((c) => {
    if (isPausedPublisherStore(c.store.slug)) return false;
    const from = PUBLISH_FROM[c.id];
    if (from && now < new Date(from).getTime()) return false;
    return isCouponActive(c.promocode.expires, now);
  });
}
