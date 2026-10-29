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
  return coupons.filter((c) => c.store.slug !== "yandeks-puteshestviya" && c.store.slug !== "kinopoisk");
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
 * Perfluence restrictions:
 * FMART by flowwow may not be advertised in a curated selection with Flor2u.
 * ЛЭТУАЛЬ may not be advertised with Золотое Яблоко.
 * Яндекс Цветы may not be advertised with Flowwow / FMART.
 * This controls curated homepage and article-like collection blocks, NOT
 * standalone stores or neutral searchable directories.
 */
export function withoutForbiddenFloristBeautyCoPromotion(coupons: Coupon[]): Coupon[] {
  // Yandex Flowers must not share a curated promo selection with Flowwow or FMART.
  const hasIncompatibleFlowers = coupons.some(c =>
    ["flowwow", "fmart", "flauwau", "flau-vau"].includes(c.store.slug) ||
    /(?:flowwow|флау(?:вау|вау)|fmart)/iu.test(c.store.name));
  const hasFlor2u = coupons.some(c => c.store.slug === "flor2u" ||
    /(?:^|\W)flor2u(?:$|\W)/iu.test(c.store.name));
  const hasGoldApple = coupons.some(c => c.store.slug === "zolotoe-yabloko" ||
    /золотое\s+яблоко/iu.test(c.store.name));
  const hasFlowwow = coupons.some(c => c.store.slug === "fmart" || c.store.slug === "flowwow" ||
    /(?:flowwow|флаувау)/iu.test(c.store.name));
  // Perfluence prohibits Carte Blanche || Gala + COZY HOME on Ozon in one promotional selection.
  const hasCozyHome = coupons.some(c => c.store.slug === "cozy-home");
  return coupons.filter(c =>
    !(hasIncompatibleFlowers && c.store.slug === "yandeks-tsvety") &&
    !(hasFlor2u && c.store.slug === "fmart") &&
    !(hasGoldApple && c.store.slug === "letual") &&
    !(hasFlowwow && c.store.slug === "yandeks-tsvety") &&
    !(hasCozyHome && c.store.slug === "carte-blanche"));
}

/** Perfluence: VkusVill Delivery and Samokat must not share a curated promo collection with Pyaterochka. */
export function withoutForbiddenGroceryCoPromotion(coupons: Coupon[]): Coupon[] {
  const hasPyaterochka = coupons.some(c =>
    c.store.slug === "pyaterochka" || c.store.slug === "pyaterochka-dostavka" ||
    /пят[её]рочк/iu.test(c.store.name));
  if (!hasPyaterochka) return coupons;
  // Keep the original Pyaterochka placement; publish VkusVill and Samokat separately.
  return coupons.filter(c => c.store.slug !== "vkusvill-dostavka" && c.store.slug !== "samokat");
}

/**
 * Perfluence: SberZdorovie (Analizy) cannot be included in the same curated
 * advertising selection as the Credit SberCard.
 * Standalone store pages and the neutral searchable directory remain intact.
 */
export function withoutForbiddenSberAnalizyCreditCardCoPromotion(coupons: Coupon[]): Coupon[] {
  const hasCreditSberCard = coupons.some(c =>
    ["kreditnaya-sberkarta", "sberkarta"].includes(c.store.slug) ||
    /кредитн[а-яё]*\s+сберкарт/iu.test(c.store.name));
  if (!hasCreditSberCard) return coupons;
  const analysisCodes = new Set(["PERPREGA309361", "SHD56E28"]);
  return coupons.filter(c =>
    !(c.store.slug === "sberzdorovie" &&
      analysisCodes.has(c.promocode.code.trim().toUpperCase())));
}
