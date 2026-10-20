import type { Coupon } from "@/lib/types";

/** Consistent, non-sensitive goal context for the two homepage coupon surfaces.
 * These are visitor actions, not evidence of a confirmed purchase.
 */
export type HomeCouponSurface = "expiring_deals" | "home_offers_preview";

export function homeCouponAnalyticsContext(coupon: Coupon, surface: HomeCouponSurface) {
  return {
    store: coupon.store.slug,
    coupon_id: coupon.id,
    placement: surface === "expiring_deals" ? "home_hot_deals" : "home_preview",
    page_path: "/",
    page_type: "home",
    offer_type: coupon.promocode.code ? "promo" : "deal",
    source_component: surface,
  };
}
