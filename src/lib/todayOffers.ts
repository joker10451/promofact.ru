import type { Coupon } from "@/lib/types";
import { expiryTimestamp, isCouponActive } from "@/lib/couponExpiry";
import { withoutForbiddenCoPromotions } from "@/lib/publisherPlacementRules";

const MSK = "Europe/Moscow";

/** A page needs at least this many offers to be worth indexing (same idea as collections). */
export const MIN_TODAY_OFFERS = 3;
const ENDING_TODAY_LIMIT = 6;
const DEFAULT_LIMIT = 24;

/** Server-side clock for pages rebuilt by ISR; kept out of component bodies (React purity lint). */
export function currentTime(): number {
  return Date.now();
}

/** Calendar day in Moscow for a timestamp: "2026-11-10", "10 ноября 2026", "10 ноября". */
export function moscowDay(now: number): { iso: string; label: string; short: string } {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: MSK, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const label = new Intl.DateTimeFormat("ru-RU", {
    timeZone: MSK, day: "numeric", month: "long", year: "numeric",
  }).format(now).replace(/\s*г\.?$/, "");
  const short = new Intl.DateTimeFormat("ru-RU", {
    timeZone: MSK, day: "numeric", month: "long",
  }).format(now);
  return { iso, label, short };
}

/** True when the partner's last day of the offer is today in Moscow. */
export function endsToday(coupon: Pick<Coupon, "promocode">, now: number): boolean {
  const end = expiryTimestamp(coupon.promocode.expires);
  if (!Number.isFinite(end)) return false;
  return moscowDay(end).iso === moscowDay(now).iso;
}

export interface TodayOffers {
  /** Offers whose last day is today, one per store: urgency that is true. */
  endingToday: Coupon[];
  /** Best remaining offer of each store; offers with a code come before code-free deals. */
  best: Coupon[];
  /** Offers still valid at `now`, before picking one per store. */
  activeCount: number;
  storeCount: number;
}

/**
 * Picks what the "promo codes for today" page shows. `coupons` must already be the
 * public catalogue (approved, marked, regulated rules applied) in ranking order:
 * this only decides which of them go on this page.
 */
export function selectTodayOffers(coupons: Coupon[], now: number, limit = DEFAULT_LIMIT): TodayOffers {
  const active = coupons.filter((c) => isCouponActive(c.promocode.expires, now));
  const stores = new Set(active.map((c) => c.store.slug));

  const usedStores = new Set<string>();
  const endingToday: Coupon[] = [];
  for (const c of active) {
    if (endingToday.length >= ENDING_TODAY_LIMIT) break;
    if (!endsToday(c, now) || usedStores.has(c.store.slug)) continue;
    usedStores.add(c.store.slug);
    endingToday.push(c);
  }

  const firstByStore = new Map<string, Coupon>();
  for (const c of active) {
    if (usedStores.has(c.store.slug)) continue;
    const current = firstByStore.get(c.store.slug);
    // Keep ranking order, but a code beats a code-free deal for the same store.
    if (!current || (!current.promocode.code && c.promocode.code)) firstByStore.set(c.store.slug, c);
  }
  const picked = [...firstByStore.values()];
  const bestCut = [
    ...picked.filter((c) => c.promocode.code),
    ...picked.filter((c) => !c.promocode.code),
  ].slice(0, Math.max(0, limit - endingToday.length));

  // This page is a curated selection of several stores, so the publishers' co-promotion bans
  // apply to what is actually shown (e.g. Pyaterochka vs Samokat/Kuper/Globus), as on the homepage.
  const allowed = new Set(withoutForbiddenCoPromotions([...endingToday, ...bestCut]));
  return {
    endingToday: endingToday.filter((c) => allowed.has(c)),
    best: bestCut.filter((c) => allowed.has(c)),
    activeCount: active.length,
    storeCount: stores.size,
  };
}

export function todayOfferCount(t: TodayOffers): number {
  return t.endingToday.length + t.best.length;
}
