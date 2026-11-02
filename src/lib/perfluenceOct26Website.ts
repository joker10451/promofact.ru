import type { Coupon } from "@/lib/types";

/**
 * Publisher placements for promofact.ru renewed on 26 October 2026.
 * Elementaree (ID 1102) and Carte Blanche || Gala on Ozon (ID 4447).
 * Updated November 2, 2026 with new tracking link and 20% flash promo code.
 */
export const PERFLUENCE_OCT26_WEBSITE_OFFERS: Coupon[] = [
  {
    id: 826110201,
    promocode: {
      id: 826110201,
      code: "m40n2088",
      bonusName: "Скидка 40% на первый заказ и 20% на второй в Elementaree",
      terms: "Скидка 40% на первый заказ и 20% на второй заказ по промокоду m40n2088 в Elementaree для жителей Москвы и Санкт-Петербурга. Срок действия до 31 декабря 2026 года. Не суммируется с другими акциями.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый и второй заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 1102,
      name: "Elementaree",
      slug: "elementaree",
      logo: "/brands/elementaree.png",
      category: "Доставка еды",
      categorySlug: "dostavka-edy",
      about: "Конструктор правильного питания с доставкой на дом в Москве и Санкт-Петербурге.",
      conditions: "Акция действует для новых клиентов в Москве и МО, Санкт-Петербурге и ЛО.",
      site: "https://elementaree.ru",
      activeBloggers: 0,
    },
    affiliate: {
      link: "https://elementaree.prfl.me/sites/v0p04a?erid=2RanykyPZ8L",
      landingLink: "https://elementaree.prfl.me/sites/v0p04a?erid=2RanykyPZ8L",
      ordMarker: "2RanykyPZ8L",
      ordText: "Реклама. ООО «Ориджинал Фудс», ИНН 7724417578. erid: 2RanykyPZ8L",
    },
    extraLinks: [],
  },
  {
    id: 826444702,
    promocode: {
      id: 826444702,
      code: "SZHM976A2F20",
      bonusName: "Флеш-скидка 20% на Carte Blanche, GALA и Киндерсон на Ozon",
      terms: "Скидка 20% на товары брендов Carte Blanche, GALA и Киндерсон на каждый заказ на Ozon по промокоду SZHM976A2F20. Проверяйте применимость в корзине. Запрещено совместное рекламное размещение с COZY HOME на Ozon.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Флеш-акция на бренды",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 4447,
      name: "Carte Blanche || Gala",
      slug: "carte-blanche",
      logo: "/brands/carte-blanche.png",
      category: "Маркетплейсы",
      categorySlug: "marketpleysy",
      about: "Товары брендов Carte Blanche, GALA, Etress и Киндерсон на Ozon.",
      conditions: "Предложение нельзя включать в рекламную подборку вместе с COZY HOME на Ozon.",
      site: "https://www.ozon.ru",
      activeBloggers: 0,
    },
    affiliate: {
      link: "https://carteblanche.prfl.me/sites/qv9lgb?erid=2RanynhkHTA",
      landingLink: "https://carteblanche.prfl.me/sites/qv9lgb?erid=2RanynhkHTA",
      ordMarker: "2RanynhkHTA",
      ordText: 'Реклама. Рекламодатель ООО "ТК КОУЗИ ХОУМ", ИНН 7743238687 erid: 2RanynhkHTA',
    },
    extraLinks: [],
  },
  {
    id: 826444701,
    promocode: {
      id: 826444701,
      code: "SZHM93427848",
      bonusName: "Скидка 10% на Carte Blanche, GALA, Etress и Киндерсон на Ozon",
      terms: "Скидка 10% на товары указанных брендов на Ozon по промокоду SZHM93427848 до 31 декабря 2026 года, по одобренной публикации Perfluence для promofact.ru. Проверяйте применимость в корзине. Запрещено совместное рекламное размещение с COZY HOME на Ozon.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "На товары указанных брендов",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 4447,
      name: "Carte Blanche || Gala",
      slug: "carte-blanche",
      logo: "/brands/carte-blanche.png",
      category: "Маркетплейсы",
      categorySlug: "marketpleysy",
      about: "Товары брендов Carte Blanche, GALA, Etress и Киндерсон на Ozon.",
      conditions: "Предложение нельзя включать в рекламную подборку вместе с COZY HOME на Ozon.",
      site: "https://www.ozon.ru",
      activeBloggers: 0,
    },
    affiliate: {
      link: "https://carteblanche.prfl.me/sites/qv9lgb?erid=2RanynhkHTA",
      landingLink: "https://carteblanche.prfl.me/sites/qv9lgb?erid=2RanynhkHTA",
      ordMarker: "2RanynhkHTA",
      ordText: 'Реклама. Рекламодатель ООО "ТК КОУЗИ ХОУМ", ИНН 7743238687 erid: 2RanynhkHTA',
    },
    extraLinks: [],
  },
];

/** Old widget URL/ERID must never override renewed site-specific placements. */
export function isApprovedOct26WebsitePlacement(c: Coupon): boolean {
  if (c.store.slug !== "elementaree" && c.store.slug !== "carte-blanche") return true;
  const approved = PERFLUENCE_OCT26_WEBSITE_OFFERS.find(
    (o) => o.store.slug === c.store.slug && o.promocode.code.toUpperCase() === c.promocode.code.trim().toUpperCase()
  );
  return Boolean(
    approved &&
    c.affiliate.link === approved.affiliate.link &&
    c.affiliate.landingLink === approved.affiliate.landingLink &&
    c.affiliate.ordMarker === approved.affiliate.ordMarker &&
    c.affiliate.ordText.includes(c.store.slug === "elementaree" ? "ИНН 7724417578" : "ИНН 7743238687") &&
    c.affiliate.ordText.includes("erid: " + approved.affiliate.ordMarker)
  );
}
