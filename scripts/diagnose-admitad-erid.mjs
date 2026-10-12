#!/usr/bin/env node
/**
 * Inspect ONE Admitad coupon on the connected site without altering production.
 *
 * Compares:
 *  1. GET /coupons/website/{w_id}/?campaign={campaign_id}
 *  2. GET /coupons/{coupon_id}/website/{w_id}/
 *  3. ERID copied manually from the publisher's dashboard.
 *
 * Outputs booleans and short token fingerprints, never credentials or full URLs.
 * No Supabase writes, no sync, no campaign approvals.
 */
import crypto from "node:crypto";
import {
  getAdmitadConfig,
  resolveWebsite,
  getWebsiteCoupons,
  admitadFetch,
} from "../src/lib/admitadApi.ts";
import { compareCouponEridSources } from "../src/lib/admitadEridDiagnostics.ts";

const campaignId = String(process.env.AUDIT_CAMPAIGN_ID || "").trim();
const couponId = String(process.env.AUDIT_COUPON_ID || "").trim();
const dashboardErid = String(process.env.AUDIT_DASHBOARD_ERID || "").trim();

function fingerprint(value) {
  return value ? crypto.createHash("sha256").update(value).digest("hex").slice(0, 12) : null;
}
function safeSummary(source) {
  return {
    found: source.found,
    couponId: source.couponId,
    hasCode: Boolean(source.code),
    eridPresent: Boolean(source.urlErid),
    eridFingerprint: fingerprint(source.urlErid),
    framesetEridMatchesGoto: source.framesetErid ? source.framesetErid === source.urlErid : null,
    descriptionEridMatchesGoto: source.descriptionErid ? source.descriptionErid === source.urlErid : null,
    trackingPromoCode: source.tracking,
    linkIdentityFingerprint: fingerprint(source.linkIdentity),
  };
}
function singleCoupon(response, expectedId) {
  const data = Array.isArray(response) ? response :
    Array.isArray(response?.results) ? response.results :
    response && typeof response === "object" ? [response] : [];
  return data.find((coupon) => String(coupon?.id) === String(expectedId)) || null;
}

async function main() {
  if (!/^\d+$/.test(campaignId) || !/^\d+$/.test(couponId) || !/^[a-zA-Z0-9_-]{10,80}$/.test(dashboardErid)) {
    throw new Error("Invalid or missing campaign/coupon IDs or dashboard ERID");
  }
  const config = getAdmitadConfig();
  if (!config) throw new Error("Admitad API credentials are not configured");
  const resolved = await resolveWebsite(config);
  if (!resolved.website?.id) throw new Error("Publisher website could not be resolved");

  const websiteId = String(resolved.website.id);
  const [coupons, detailResponse] = await Promise.all([
    getWebsiteCoupons(websiteId, { campaign: campaignId }),
    admitadFetch(`/coupons/${couponId}/website/${websiteId}/`, { method: "GET" }),
  ]);

  const fromList = coupons.find((coupon) => String(coupon.id) === couponId && String(coupon.campaign?.id) === campaignId) || null;
  const fromDetail = singleCoupon(detailResponse, couponId);
  const c = compareCouponEridSources(fromList, fromDetail, dashboardErid);

  console.log(JSON.stringify({
    readOnly: true,
    campaignId,
    couponId,
    dashboardFingerprint: fingerprint(dashboardErid),
    apiList: safeSummary(c.list),
    apiDetail: safeSummary(c.detail),
    checks: {
      listMatchesDashboard: c.listMatchesDashboard,
      detailMatchesDashboard: c.detailMatchesDashboard,
      listMatchesDetail: c.listMatchesDetail,
      sameTrackingRoute: c.sameTrackingRoute,
      sameCouponCode: c.sameCouponCode,
      listInternalConflict: c.listInternalConflict,
      detailInternalConflict: c.detailInternalConflict,
    },
    interpretation: !c.list.found || !c.detail.found
      ? "MISSING_SOURCE: inspect API coverage or permissions"
      : c.listInternalConflict || c.detailInternalConflict
        ? "INTERNAL_ERID_CONFLICT: halt publication and investigate source fields"
        : c.listMatchesDashboard && c.detailMatchesDashboard
          ? "ALL_SOURCES_MATCH"
          : c.listMatchesDetail
            ? "DASHBOARD_VS_API_DIFFER: backend source/creative needs clarification"
            : "API_LIST_VS_DETAIL_DIFFER: inspect endpoint-specific data",
  }, null, 2));
}

main().catch((e) => {
  // Avoid printing raw API bodies or credentials in CI logs.
  console.error("READ_ONLY_ERID_DIAGNOSTIC_FAILED", e instanceof Error ? e.message.split("\n")[0].slice(0, 180) : "unknown error");
  process.exitCode = 1;
});
