import type { Coupon, Promocode, Store, Affiliate } from "@/lib/types";

/**
 * Облегчённый купон для каталога на главной.
 *
 * CouponGrid — клиентский компонент, поэтому весь массив купонов уезжает к
 * посетителю внутри HTML, в RSC-потоке. Замер на проде: этот поток весит
 * 195 КБ из 574 КБ страницы, и это не разметка, а именно данные — двести
 * объектов со всеми вложенными полями.
 *
 * Причём объект магазина повторяется внутри каждого купона: у магазина с
 * десятью купонами описание и условия дублируются десять раз.
 *
 * Здесь отброшены поля, которые каталог не выводит ни разу. Проверено по
 * всем клиентским потребителям купонов, вес измерен на живой выдаче:
 *
 *   store.about            17,1 КБ
 *   store.conditions       10,0 КБ
 *   extraLinks              6,4 КБ
 *   store.activeBloggers    4,3 КБ
 *   promocode.group         4,2 КБ
 *   promocode.barcodeImage  4,1 КБ
 *   promocode.isBarcode     3,7 КБ
 *   affiliate.ordMarker     3,7 КБ
 *
 * Тип — структурное подмножество Coupon, поэтому страницы, которые передают
 * в карточку полный объект, продолжают работать без изменений.
 */
export type CatalogCoupon = Omit<Coupon, "promocode" | "store" | "affiliate" | "extraLinks"> & {
  promocode: Omit<
    Promocode,
    "group" | "barcodeImage" | "isBarcode" | "minimumOrder" | "isUniversal"
  >;
  store: Omit<Store, "about" | "conditions" | "activeBloggers">;
  affiliate: Omit<Affiliate, "ordMarker">;
};

export function toCatalogCoupon(c: Coupon): CatalogCoupon {
  const { promocode: p, store: s, affiliate: a } = c;
  return {
    id: c.id,
    promocode: {
      id: p.id,
      code: p.code,
      bonusName: p.bonusName,
      terms: p.terms,
      expires: p.expires,
      isHit: p.isHit,
      isFirstOrderOnly: p.isFirstOrderOnly,
      customerTypeLabel: p.customerTypeLabel,
      region: p.region,
    },
    store: {
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo: s.logo,
      category: s.category,
      categorySlug: s.categorySlug,
      site: s.site,
    },
    affiliate: {
      link: a.link,
      landingLink: a.landingLink,
      ordText: a.ordText,
    },
  };
}
