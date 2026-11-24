import type { Coupon } from "@/lib/types";

function isPerfluenceUrl(url: URL): boolean {
  return url.protocol === "https:" &&
    !url.username && !url.password && !url.port &&
    (url.hostname === "prfl.me" || url.hostname.endsWith(".prfl.me"));
}

export function isPerfluencePartnerLink(link: string): boolean {
  try {
    return isPerfluenceUrl(new URL(link));
  } catch {
    return false;
  }
}

/**
 * Fail-closed validation ONLY for the automatically imported Perfluence widget.
 * Editorial placements have their own approved-link gates. A merchant's
 * ordinary site is not a substitute for a credited partner link.
 */
export function isPublicPerfluenceWidgetCoupon(
  coupon: Pick<Coupon, "affiliate">,
): boolean {
  const marker = coupon.affiliate.ordMarker?.trim();
  const disclosure = coupon.affiliate.ordText?.trim();
  const link = coupon.affiliate.link?.trim();
  if (!marker || !disclosure || !link ||
      !/реклама/iu.test(disclosure) ||
      !/^[a-z0-9]{8,40}$/i.test(marker)) return false;

  const declaredInText = disclosure.match(/\berid\s*[:=]\s*([a-z0-9]{8,40})\b/i)?.[1];
  // A conflicting, malformed or placeholder disclosure is not verified.
  // A disclosure without an embedded ERID may be completed by withErid()
  // *only* when the ORD field and original link agree.
  if (/\berid\b/i.test(disclosure) && declaredInText !== marker) return false;
  try {
    const url = new URL(link);
    return isPerfluenceUrl(url) &&
      url.searchParams.getAll("erid").length === 1 &&
      url.searchParams.get("erid") === marker;
  } catch {
    return false;
  }
}
