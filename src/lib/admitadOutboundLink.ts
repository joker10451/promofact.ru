import type { Coupon } from "@/lib/types";
import { decorateAdmitadUrl, generateClickId } from "@/lib/admitadAutopilot";

/** One stable server href, with a unique UUID added only for a real click.
 * Never decorate Perfluence links or untracked merchant-site fallbacks.
 * Preserve ERID, original link and native browser navigation.
 */
export function getAttributedCouponHref(coupon: Coupon, placement: string, pageType: string): string {
  const href = coupon.affiliate.link || coupon.store.site || "#";
  if (coupon.promocode.group !== "admitad" || !coupon.affiliate.link) return href;
  return decorateAdmitadUrl(href, { placement, pageType, couponId: coupon.id });
}
export function prepareAttributedCouponClick(
  anchor: HTMLAnchorElement, coupon: Coupon, placement: string, pageType: string,
): void {
  if (coupon.promocode.group !== "admitad" || !coupon.affiliate.link) return;
  try {
    anchor.href = decorateAdmitadUrl(coupon.affiliate.link, {
      placement, pageType, couponId: coupon.id, clickId: generateClickId(),
    });
  } catch {
    // Native server-rendered anchor with stable SubIDs remains navigable.
  }
}
