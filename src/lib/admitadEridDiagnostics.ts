/**
 * Read-only Admitad ERID comparison. Keep source fields separate:
 * an API list URL, single-coupon API URL, and dashboard URL may differ.
 * Never replace a publisher-supplied erid or infer that one is invalid.
 */
export interface CouponEridSource {
  id?: number;
  promocode?: string | null;
  goto_link?: string | null;
  frameset_link?: string | null;
  description?: string | null;
  is_tracking_promo_code?: boolean;
  is_tracking_promocode?: boolean;
}

function extractUrlErid(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.searchParams.get("erid");
  } catch {
    return null;
  }
}

function linkIdentity(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // Affiliate tracking route and publisher identifier, excluding ERID and SubID.
    return [u.protocol, u.hostname.toLowerCase(), u.pathname, u.searchParams.get("i") || ""].join("|");
  } catch {
    return null;
  }
}

export function inspectCouponErid(coupon?: CouponEridSource | null) {
  const urlErid = extractUrlErid(coupon?.goto_link);
  const framesetErid = extractUrlErid(coupon?.frameset_link);
  const descriptionErid = coupon?.description?.match(/\berid\s*[:=]\s*([a-zA-Z0-9_-]+)/i)?.[1] || null;
  const tracking = coupon?.is_tracking_promo_code ?? coupon?.is_tracking_promocode ?? null;
  return {
    found: Boolean(coupon),
    couponId: coupon?.id ?? null,
    code: coupon?.promocode ?? null,
    urlErid,
    framesetErid,
    descriptionErid,
    linkIdentity: linkIdentity(coupon?.goto_link),
    tracking,
  };
}

export function compareCouponEridSources(
  list: CouponEridSource | null,
  detail: CouponEridSource | null,
  dashboardErid: string,
) {
  const l = inspectCouponErid(list);
  const d = inspectCouponErid(detail);
  return {
    list: l,
    detail: d,
    listMatchesDashboard: l.urlErid === dashboardErid,
    detailMatchesDashboard: d.urlErid === dashboardErid,
    listMatchesDetail: Boolean(l.urlErid && d.urlErid && l.urlErid === d.urlErid),
    sameTrackingRoute: Boolean(l.linkIdentity && d.linkIdentity && l.linkIdentity === d.linkIdentity),
    sameCouponCode: Boolean(l.code && d.code && l.code === d.code),
    listInternalConflict: Boolean(l.descriptionErid && l.urlErid && l.descriptionErid !== l.urlErid),
    detailInternalConflict: Boolean(d.descriptionErid && d.urlErid && d.descriptionErid !== d.urlErid),
  };
}
