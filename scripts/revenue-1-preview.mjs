#!/usr/bin/env node
/**
 * REVENUE-1: owner-only, READ-ONLY Admitad earnings report.
 * GitHub Actions prints connectivity status only; exact amounts require
 * local execution with REVENUE_1_PRIVATE_REPORT=true.
 * This script never writes to Supabase, the website or a file.
 */
import { aggregateAdmitadActions, examinePerfluenceFeed,
  verifyAdmitadPage, revenueDateParam, safePublicPreview,
  safeRevenueFailure, revenueError } from "./revenue-1-core.mjs";

const MAX_PAGES = 50;
const LIMIT = 100;
function dateOnlyUTC(date) { return date.toISOString().slice(0,10); }
function getRange() {
  const end = process.env.REVENUE_1_DATE_END || dateOnlyUTC(new Date());
  const startDefault = new Date(Date.parse(end + "T00:00:00Z"));
  if (!Number.isFinite(startDefault.getTime()))
    throw revenueError("REVENUE_INVALID_DATE");
  startDefault.setUTCDate(startDefault.getUTCDate() - 27);
  const start = process.env.REVENUE_1_DATE_START || dateOnlyUTC(startDefault);
  const from = Date.parse(start + "T00:00:00Z");
  const to = Date.parse(end + "T00:00:00Z");
  revenueDateParam(start);
  revenueDateParam(end);
  if (to < from || to - from > 90 * 86400000)
    throw revenueError("REVENUE_DATE_RANGE_TOO_LARGE");
  return { start, end };
}
async function getActions(accessToken, websiteId, dates) {
  const all = [];
  let total = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * LIMIT;
    const url = new URL("https://api.admitad.com/statistics/actions/");
    url.searchParams.set("website",websiteId);
    url.searchParams.set("date_start",revenueDateParam(dates.start));
    url.searchParams.set("date_end",revenueDateParam(dates.end));
    url.searchParams.set("limit",String(LIMIT));
    url.searchParams.set("offset",String(offset));
    // Total=0 returns individual action records, not aggregated sums.
    url.searchParams.set("total","0");
    const response = await fetch(url, {
      headers: { "Authorization": "Bearer " + accessToken,
        "Accept": "application/json" },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403)
      throw revenueError("REVENUE_API_DENIED");
    if (!response.ok) throw revenueError("REVENUE_API_ERROR");
    const body = await response.json();
    const count = verifyAdmitadPage(body,LIMIT,offset);
    if (total !== null && count !== total)
      throw revenueError("REVENUE_PAGE_COUNT_MISMATCH");
    total = count;
    all.push(...body.results);
    if (all.length >= total) return all;
    if (body.results.length !== LIMIT)
      throw revenueError("REVENUE_PAGE_INCOMPLETE");
  }
  throw revenueError("REVENUE_PAGINATION_CAP");
}
async function probePerfluence() {
  const supplied = process.env.PERFLUENCE_RESULTS_URL;
  if (!supplied) return "NOT_CONNECTED";
  let u;
  try { u = new URL(supplied); } catch { return "INVALID_SOURCE"; }
  if (u.protocol !== "https:" ||
      !(u.hostname === "perfluence.net" || u.hostname.endsWith(".perfluence.net")))
    return "UNVERIFIED_SOURCE";
  const response = await fetch(u, { cache:"no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) return "SOURCE_UNAVAILABLE";
  const summary = examinePerfluenceFeed(await response.json());
  return summary.approvalStatus === "unverified" ? "FEED_AVAILABLE_BUT_UNVERIFIED" : "NOT_CONNECTED";
}
async function main() {
  const clientId = process.env.ADMITAD_CLIENT_ID || "";
  const clientSecret = process.env.ADMITAD_CLIENT_SECRET || "";
  const websiteId = process.env.ADMITAD_WEBSITE_ID || "";
  if (!clientId || !clientSecret)
    throw revenueError("REVENUE_MISSING_CREDENTIALS");
  if (!/^[0-9]{1,12}$/.test(websiteId))
    throw revenueError("REVENUE_INVALID_WEBSITE");
  const dates = getRange();
  // Separate client_credentials token with the statistics scope; never reuse
  // an advertising-coupons token with different permissions.
  const { getAdmitadAccessToken } = await import("../src/lib/admitadApi.ts");
  const token = await getAdmitadAccessToken(clientId,clientSecret,{scopes:"statistics"});
  if (!token?.accessToken || !String(token.scope || "").split(/[\s,]+/).includes("statistics"))
    throw revenueError("REVENUE_OAUTH_SCOPE_MISSING");
  const actions = await getActions(token.accessToken,websiteId,dates);
  const report = aggregateAdmitadActions(actions);
  console.info("REVENUE_1_ADMITAD_OK " + JSON.stringify({
    periodStart: dates.start, periodEnd:dates.end,
    ...safePublicPreview(report),
  }));
  // Do not display commissions in public GitHub Actions logs.
  if (process.env.REVENUE_1_PRIVATE_REPORT === "true" &&
      process.env.GITHUB_ACTIONS !== "true") {
    console.log("REVENUE_1_OWNER_REPORT " + JSON.stringify({
      periodStart:dates.start,periodEnd:dates.end, ...report,
      note:"approved commission is NOT paid/withdrawn cash",
    }));
  }
  const perfluenceStatus = await probePerfluence();
  console.info("REVENUE_1_PERFLUENCE " + JSON.stringify({
    status:perfluenceStatus,commissionApproved:null,
    note:"Perfluence result fees are not verified without supported approval/payout status",
  }));
}
main().catch(err => {
  // NEVER echo error.message from HTTP/remote JSON: it can contain credentials,
  // affiliate links, order IDs or personal data.
  console.error("REVENUE_1_FAILED " + safeRevenueFailure(err));
  process.exitCode=1;
});
