import type { Coupon } from "@/lib/types";

/**
 * Perfluence restriction: Yandex Travel must not appear in an editorial
 * promotional selection that also advertises "МТС Музыка".
 *
 * This applies to curated homepage blocks, not the searchable directory.
 * If MTS Music is included, prefer its existing placement and only advertise
 * Yandex Travel on the standalone store/category pages.
 */
export function withoutForbiddenTravelCoPromotion(coupons: Coupon[]): Coupon[] {
  const hasMtsMusic = coupons.some((c) =>
    /^\s*мтс\s+музыка\s*$/iu.test(c.store.name));
  if (!hasMtsMusic) return coupons;
  return coupons.filter((c) => c.store.slug !== "yandeks-puteshestviya");
}


/**
 * Perfluence: Tanuki must NOT be co-promoted in an editorial selection
 * with FARFOR or Ёёёёёёё (formerly Ёбидоёби).
 * Preserve standalone Tanuki store pages and the searchable directory;
 * when an editorial selection includes the prohibited partner, omit Tanuki.
 */
export function withoutForbiddenTanukiCoPromotion(coupons: Coupon[]): Coupon[] {
  const incompatible = coupons.some((c) =>
    c.store.slug === "farfor" ||
    /(?:фарфор|farfor|ёбидоёби|ёёёё|yobidoyobi|ebidoebi|yebidoebi)/iu.test(c.store.name + " " + c.store.slug));
  if (!incompatible) return coupons;
  return coupons.filter((c) => c.store.slug !== "tanukifamily");
}
