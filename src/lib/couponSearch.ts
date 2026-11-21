import { matchStoreSearch, normalizeSearchTerm, convertKeyboardLayout } from "./searchUtils";

interface SearchableCoupon {
  store: { name: string; slug: string; category?: string };
  promocode: { code: string; bonusName: string | null };
}

/** The catalog and quick search must recognize the same brands and keyboard layouts. */
export function matchesCouponSearch(coupon: SearchableCoupon, query: string): boolean {
  if (!query.trim()) return true;
  if (!normalizeSearchTerm(query)) return false;
  if (matchStoreSearch(coupon.store, query)) return true;
  const text = normalizeSearchTerm(`${coupon.promocode.code} ${coupon.promocode.bonusName || ""}`);
  const terms = [normalizeSearchTerm(query), normalizeSearchTerm(convertKeyboardLayout(query))];
  return terms.some((term) => Boolean(term) && text.includes(term));
}
