#!/usr/bin/env node
/**
 * CATALOG-GROWTH-1 — read-only live eligibility audit.
 * No writes to Admitad, Supabase, Vercel, or campaign allowlists.
 * Never print OAuth credentials, coupon codes, tracking URLs, ERID values or legal text.
 */
import {
  getAdmitadConfig,
  resolveWebsite,
  getConnectedPrograms,
  getWebsiteCoupons,
  evaluateQualityGate,
  evaluateLegalGate,
  matchCanonicalStore,
} from "../src/lib/admitadApi.ts";

const targets = [
  { id: 28532, slug: "befree-ru", host: "befree.ru" },
  { id: 14647, slug: "sportmaster", host: "sportmaster.ru" },
  { id: 22484, slug: "randewoo", host: "randewoo.ru" },
];

function hostOf(value) {
  try {
    return new URL(value.startsWith("http") ? value : "https://" + value)
      .hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function inDateWindow(coupon, now) {
  if (coupon.date_start) {
    const start = new Date(coupon.date_start.slice(0, 10) + "T00:00:00+03:00");
    if (!Number.isFinite(start.getTime()) || start > now) return false;
  }
  if (coupon.date_end) {
    const end = new Date(coupon.date_end.slice(0, 10) + "T23:59:59+03:00");
    if (!Number.isFinite(end.getTime()) || end < now) return false;
  }
  return true;
}

async function main() {
  const config = getAdmitadConfig();
  if (!config) throw Object.assign(new Error(), { code: "CREDENTIALS_UNAVAILABLE" });
  const resolved = await resolveWebsite(config);
  if (!resolved.website || resolved.website.status !== "active") {
    throw Object.assign(new Error(), { code: "WEBSITE_NOT_ACTIVE" });
  }

  // These are publisher-scoped read-only API methods, never write operations.
  const [programs, coupons] = await Promise.all([
    getConnectedPrograms(String(resolved.website.id)),
    getWebsiteCoupons(String(resolved.website.id)),
  ]);
  const now = new Date();
  const programMap = new Map(programs.map((p) => [p.id, p]));
  const summary = [];

  for (const target of targets) {
    const program = programMap.get(target.id);
    const offers = coupons.filter((c) => c.campaign?.id === target.id);
    const siteMatch = program ? hostOf(program.site_url || "") === target.host : false;
    const mapping = program ? matchCanonicalStore(program) : null;
    const mappingMatch = mapping?.strategy === "EXACT MATCH" && mapping.canonicalSlug === target.slug;
    // A program may require moderation of new sites but still have an
    // ACTIVE approval for this publisher. Only connection_status determines it.
    const connectionActive = program?.status === "active" &&
      program.connection_status === "active";
    let qualityPassed = 0;
    let marked = 0;
    let eligibleForManualReview = 0;
    let personal = 0;
    let futureOrExpired = 0;
    let missingAffiliateLink = 0;
    const seenCodes = new Set();
    let duplicateCodes = 0;

    for (const c of offers) {
      const quality = evaluateQualityGate(c, program);
      const legal = evaluateLegalGate(c, program);
      const dated = inDateWindow(c, now);
      const link = c.goto_link || c.frameset_link || "";
      const hasLink = (() => {
        try {
          const u = new URL(link);
          return u.protocol === "https:" && u.hostname !== "" && !u.username && !u.password;
        } catch { return false; }
      })();
      const legalOk = legal.eridStatus === "PRESENT" && legal.legalInfoStatus === "PRESENT";
      if (quality.passed) qualityPassed++;
      if (legalOk) marked++;
      if (c.is_personal) personal++;
      if (!dated) futureOrExpired++;
      if (!hasLink) missingAffiliateLink++;
      const normCode = (c.promocode || "").trim().toUpperCase();
      if (normCode && normCode !== "NOT REQUIRED" && normCode !== "НЕ ТРЕБУЕТСЯ") {
        if (seenCodes.has(normCode)) duplicateCodes++;
        else seenCodes.add(normCode);
      }
      if (connectionActive && siteMatch && mappingMatch &&
          quality.passed && legalOk && dated && hasLink && !c.is_personal) {
        eligibleForManualReview++;
      }
    }

    summary.push({
      campaign_id: target.id, store_slug: target.slug,
      publisher_connected: Boolean(program),
      program_status: program?.status || "NOT_FOUND",
      connection_status: program?.connection_status || "NOT_FOUND",
      program_has_moderation_process: program?.moderation === true,
      site_match: siteMatch, exact_mapping: mappingMatch,
      coupons_seen: offers.length, quality_passed: qualityPassed,
      erid_and_legal_present: marked, personal,
      outside_valid_dates: futureOrExpired, invalid_partner_link: missingAffiliateLink,
      duplicate_codes: duplicateCodes, ready_for_manual_review: eligibleForManualReview,
      publication_approved_by_this_audit: false,
    });
  }

  console.log("READ_ONLY_ADMITAD_CATALOG_AUDIT " + JSON.stringify({
    checked_at_utc: now.toISOString(),
    website_verified: true,
    campaign_count: programs.length,
    total_api_coupons: coupons.length,
    results: summary,
    publish_changes: 0,
  }));
}

main().catch((err) => {
  // Never log raw API responses or error details (may contain secrets/URLs).
  console.error("READ_ONLY_ADMITAD_CATALOG_AUDIT_FAILED " + (err?.code || "API_OR_AUTH_FAILURE"));
  process.exitCode = 1;
});
