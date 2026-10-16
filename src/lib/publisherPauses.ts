import type { Coupon } from "@/lib/types";

/**
 * Publisher halt — Perfluence Delimobil announcement, 2026-10-16 14:11 MSK.
 * The network expressly asked to REMOVE ALL PLACEMENTS after commissions
 * for promo-code rides became non-payable from October 16.
 * Treat this as a hard campaign-level stop, NOT as code expiry or a pause
 * that can be overridden by stale Perfluence, Admitad or cached snapshots.
 */
export const DELIMOBIL_PAUSED_FROM = "2026-10-16T14:11:00+03:00";

const PAUSED_STORE_SLUGS: ReadonlySet<string> = new Set(["delimobil"]);

export function isPausedPublisherStore(slug: string): boolean {
  return PAUSED_STORE_SLUGS.has(slug.trim().toLowerCase());
}

export function withoutPausedPublisherOffers<T extends Pick<Coupon, "store">>(coupons: T[]): T[] {
  return coupons.filter((coupon) => !isPausedPublisherStore(coupon.store.slug));
}
