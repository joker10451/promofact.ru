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


/**
 * Perfluence restrictions 16 October 2026:
 * FMART by flowwow may not be advertised in a curated selection with Flor2u.
 * ЛЭТУАЛЬ may not be advertised with Золотое Яблоко.
 * This controls curated homepage and article-like collection blocks, NOT
 * standalone stores or neutral searchable directories.
 */
export function withoutForbiddenFloristBeautyCoPromotion(coupons: Coupon[]): Coupon[] {
  const hasFlor2u = coupons.some(c => c.store.slug === "flor2u" ||
    /(?:^|\W)flor2u(?:$|\W)/iu.test(c.store.name));
  const hasGoldApple = coupons.some(c => c.store.slug === "zolotoe-yabloko" ||
    /золотое\s+яблоко/iu.test(c.store.name));
  return coupons.filter(c =>
    !(hasFlor2u && c.store.slug === "fmart") &&
    !(hasGoldApple && c.store.slug === "letual"));
}

/** Perfluence: VkusVill Delivery must not share a curated promo collection with Pyaterochka. */
export function withoutForbiddenGroceryCoPromotion(coupons: Coupon[]): Coupon[] {
  const hasPyaterochka = coupons.some(c =>
    c.store.slug === "pyaterochka" || c.store.slug === "pyaterochka-dostavka" ||
    /пят[её]рочк/iu.test(c.store.name));
  if (!hasPyaterochka) return coupons;
  // Keep the original Pyaterochka placement; publish VkusVill separately.
  return coupons.filter(c => c.store.slug !== "vkusvill-dostavka");
}
