import type { Coupon } from "@/lib/types";

/** Approved Perfluence website placements supplied 26 Oct 2026, not old widget URLs. */
export const PERFLUENCE_OCT26_WEBSITE_OFFERS: Coupon[] = [
  {
    id: 826110201,
    promocode: {
      id: 826110201,
      code: "leam99",
      bonusName: "Скидка 40% на первый заказ или 12% на повторный от 3 000 ₽",
      terms: "По ранее сохранённому фиду Perfluence: скидка 40% на первый заказ от 3 000 ₽ или 12% на повторные от 3 000 ₽. Код leam99 и срок до 31 декабря 2026 года подтверждены для размещения promofact.ru 26 октября. Условия и доступность доставки проверьте в корзине.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Первый и повторный заказ · условия разные",
      region: null,
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 1102,
      name: "Elementaree",
      slug: "elementaree",
      logo: "/brands/elementaree.png",
      category: "Доставка продуктов",
      categorySlug: "dostavka-produktov",
      about: "Elementaree доставляет наборы ингредиентов для самостоятельного приготовления блюд.",
      conditions: "Размер скидки зависит от истории заказов. Проверьте доступность доставки и итоговую цену.",
      site: "https://elementaree.ru",
      activeBloggers: 0,
    },
    affiliate: {
      link: "https://elementareenw.prfl.me/sites/0jjvbb?erid=2RanykAqc3u",
      landingLink: "https://elementareenw.prfl.me/sites/0jjvbb?erid=2RanykAqc3u",
      ordMarker: "2RanykAqc3u",
      ordText: 'Реклама. ООО "ОЛИМП", ИНН 7724417578. erid: 2RanykAqc3u',
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
      link: "https://carteblanche.prfl.me/sites/2phyrv?erid=2RanykJFYTd",
      landingLink: "https://carteblanche.prfl.me/sites/2phyrv?erid=2RanykJFYTd",
      ordMarker: "2RanykJFYTd",
      ordText: 'Реклама. Рекламодатель ООО "ТК КОУЗИ ХОУМ", ИНН 7743238687. erid: 2RanykJFYTd',
    },
    extraLinks: [],
  },
];

/** Old widget URL/ERID must never override renewed site-specific placements. */
export function isApprovedOct26WebsitePlacement(c: Coupon): boolean {
  if (c.store.slug !== "elementaree" && c.store.slug !== "carte-blanche") return true;
  const approved = PERFLUENCE_OCT26_WEBSITE_OFFERS.find((o) => o.store.slug === c.store.slug);
  return Boolean(approved &&
    c.promocode.code.trim().toUpperCase() === approved.promocode.code.toUpperCase() &&
    c.affiliate.link === approved.affiliate.link &&
    c.affiliate.landingLink === approved.affiliate.landingLink &&
    c.affiliate.ordMarker === approved.affiliate.ordMarker &&
    c.affiliate.ordText.includes(c.store.slug === "elementaree" ? "ИНН 7724417578" : "ИНН 7743238687") &&
    c.affiliate.ordText.includes("erid: " + approved.affiliate.ordMarker));
}
