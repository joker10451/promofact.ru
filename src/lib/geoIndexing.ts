import type { Coupon } from "@/lib/types";
import { canonicalCategorySlug } from "@/lib/categoryTaxonomy";

function regionMatchesCity(region: string, city: string): boolean {
  const escaped = city.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "u").test(region);
}

export function selectGeoOffers(coupons: Coupon[], city: string, category?: string) {
  const local: Coupon[] = [];
  const offers = coupons.filter((coupon) => {
    if (category && canonicalCategorySlug(coupon.store.categorySlug) !== canonicalCategorySlug(category)) return false;
    const region = (coupon.promocode.region || "").trim().toLowerCase();
    const nationwide = !region || /^(ru|россия|вся россия|рф|вся рф)$/.test(region);
    const citySpecific = !nationwide && regionMatchesCity(region, city);
    if (citySpecific) local.push(coupon);
    return nationwide || citySpecific;
  });
  // Nationwide offers alone do not distinguish one city's page from another.
  return { offers, local, indexable: offers.length >= 3 && local.length > 0 };
}
