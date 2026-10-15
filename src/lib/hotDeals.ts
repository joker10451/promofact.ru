import type { Coupon } from "@/lib/types";
import { isRealPromoCode } from "@/lib/dedupe";
import { hasBenefitHeadline } from "@/lib/admitadOfferHeadline";
import { expiryTimestamp, isCouponActive } from "@/lib/couponExpiry";

/**
 * Выбор «Спецпредложений дня»: N лучших горящих промокодов от N РАЗНЫХ
 * магазинов. Вынесено в общий модуль, чтобы главная могла исключить эти же
 * купоны из ленты «Купоны на сегодня» — иначе топ-3 дублировались первыми
 * тремя карточками каталога.
 */
/** Ключ оффера «магазин + код» — устойчив к дублям с тем же кодом, но разным id. */
export function offerKey(c: Coupon): string {
  return `${c.store.slug}::${(c.promocode.code || "").trim().toUpperCase()}`;
}

/**
 * Verify the limited claims required for a prominent home-page PROMOCODE.
 * If attribution is contradictory, do not advertise it in the hero block.
 * This is a safety gate, not proof that the code redeems successfully.
 */
export function isPromoHighlightEligible(c: Coupon, now = Date.now()): boolean {
  if (!isRealPromoCode(c.promocode.code) || c.promocode.isBarcode) return false;
  if (!isCouponActive(c.promocode.expires, now)) return false;
  if (!c.affiliate.ordText?.trim()) return false;

  const declared = c.affiliate.ordMarker?.trim() || "";
  const textErid = c.affiliate.ordText.match(/\berid\s*[:=]\s*([a-zA-Z0-9]{8,40})\b/i)?.[1] || "";
  if (!declared && !textErid) return false;
  if (declared && textErid && declared !== textErid) return false;
  try {
    const link = new URL(c.affiliate.link);
    if (link.protocol !== "http:" && link.protocol !== "https:") return false;
    const linkErid = link.searchParams.get("erid");
    if (linkErid && declared && linkErid !== declared) return false;
    if (linkErid && textErid && linkErid !== textErid) return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * «Скоро заканчиваются»: промокоды с ближайшим реальным сроком действия,
 * по одному от магазина. Срок берётся из самого кода, а не из выдуманного
 * таймера «до полуночи»: коды действуют до конца месяца и дольше, и отсчёт
 * до сброса в 00:00 обманывал посетителя.
 */
export function pickExpiringDeals(coupons: Coupon[], count = 4): Coupon[] {
  const expiresTs = (c: Coupon) => expiryTimestamp(c.promocode.expires);
  const now = Date.now();
  const sorted = [...coupons]
    .filter((c) => c.promocode.expires && isPromoHighlightEligible(c, now) && hasBenefitHeadline(c.promocode.bonusName))
    .sort((a, b) => expiresTs(a) - expiresTs(b) || (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));

  const seenStores = new Set<string>();
  const res: Coupon[] = [];
  for (const c of sorted) {
    if (seenStores.has(c.store.slug)) continue;
    seenStores.add(c.store.slug);
    res.push(c);
    if (res.length === count) break;
  }
  return res;
}

export function pickHotDeals(coupons: Coupon[], count = 3): Coupon[] {
  const seenStores = new Set<string>();
  const res: Coupon[] = [];
  const now = Date.now();
  const sorted = [...coupons]
    .filter((c) => isPromoHighlightEligible(c, now) && hasBenefitHeadline(c.promocode.bonusName))
    .sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));

  for (const c of sorted) {
    if (!seenStores.has(c.store.slug)) {
      seenStores.add(c.store.slug);
      res.push(c);
      if (res.length === count) break;
    }
  }
  return res;
}
