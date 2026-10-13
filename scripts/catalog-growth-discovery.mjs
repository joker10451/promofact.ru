#!/usr/bin/env node
/**
 * Aggregate-only website-scoped Admitad inventory discovery.
 * Technical readiness is NOT advertiser consent. Nothing is published or saved.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const HOLD_REASONS = Object.freeze([
  "CONNECTION_INACTIVE", "QUALITY_GATE", "PERSONAL_OR_EXCLUSIVE",
  "INVALID_DATES", "LEGAL_MISSING", "AFFILIATE_OR_ERID_MISMATCH",
  "STORE_UNMAPPED", "NO_EXPIRY_REVIEW", "DUPLICATE_CODE_REVIEW",
]);

function mskDate(value, end = false) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:$|[T ])/.test(value)) return null;
  const n = Date.parse(value.slice(0,10) + (end ? "T23:59:59+03:00" : "T00:00:00+03:00"));
  return Number.isFinite(n) ? n : null;
}
function validDates(offer, now) {
  const start = offer.date_start ? mskDate(offer.date_start) : -Infinity;
  const end = offer.date_end ? mskDate(offer.date_end,true) : Infinity;
  return start !== null && end !== null && start <= now && end >= now;
}
function markedAffiliateUrl(offer, erid) {
  try {
    const u = new URL(offer.goto_link || offer.frameset_link || "");
    return u.protocol === "https:" && !u.username && !u.password &&
      !u.port && u.hostname.length > 2 && Boolean(erid) &&
      u.searchParams.get("erid") === erid;
  } catch { return false; }
}
function idOf(x) {
  const raw=String(x??"");
  return /^\d{1,12}$/.test(raw)?raw:null;
}

/** No source objects or codes ever leave this function. */
export function summarizePublisherInventory({
  programs,coupons,qualityGate,legalGate,storeMapping,
  now=new Date(),configuredAllowlist=[]
}) {
  if (!Array.isArray(programs)||!Array.isArray(coupons)||!Number.isFinite(+now))
    throw new Error("INPUT_NOT_VALID");
  const connected=new Map(programs.map(p=>[idOf(p.id),p]).filter(([id])=>id));
  const allowlist=new Set(configuredAllowlist.map(String));
  const grouped=new Map();
  const codes=new Set();
  const blocks=Object.fromEntries(HOLD_REASONS.map(k=>[k,0]));
  let reviewable=0,unknownCampaignOffers=0;
  for (const c of coupons) {
    const id=idOf(c?.campaign?.id);
    const program=connected.get(id);
    if (!program) { unknownCampaignOffers++;continue; }
    let entry=grouped.get(id);
    if (!entry) {
      const mapping=storeMapping(program);
      const slug=/^[a-z0-9-]{1,100}$/.test(mapping?.canonicalSlug||"")?mapping.canonicalSlug:"";
      entry={campaign_id:id,store_slug:slug,mapping: mapping?.strategy||"UNMAPPED",
        campaign_in_configured_allowlist:allowlist.has(id),
        offers:0,technically_reviewable:0,approved_for_publication:0,
        holds:Object.fromEntries(HOLD_REASONS.map(k=>[k,0]))};
      grouped.set(id,entry);
    }
    entry.offers++;
    const reasons=[];
    if (program.status!=="active"||program.connection_status!=="active")reasons.push("CONNECTION_INACTIVE");
    if (qualityGate(c,program)?.passed!==true)reasons.push("QUALITY_GATE");
    if (c.is_personal||c.is_unique||c.exclusive)reasons.push("PERSONAL_OR_EXCLUSIVE");
    if (!validDates(c,+now))reasons.push("INVALID_DATES");
    const legal=legalGate(c,program);
    if (legal?.eridStatus!=="PRESENT"||legal?.legalInfoStatus!=="PRESENT")reasons.push("LEGAL_MISSING");
    if (!markedAffiliateUrl(c,legal?.eridValue))reasons.push("AFFILIATE_OR_ERID_MISMATCH");
    if (entry.mapping!=="EXACT MATCH"||!entry.store_slug)reasons.push("STORE_UNMAPPED");
    if (!c.date_end)reasons.push("NO_EXPIRY_REVIEW");
    const code=String(c.promocode||"").trim().toUpperCase();
    if (code && code!=="NOT REQUIRED" && code!=="НЕ НУЖЕН") {
      const key=id+"::"+code;
      if (codes.has(key))reasons.push("DUPLICATE_CODE_REVIEW");
      codes.add(key);
    }
    if (!reasons.length) { entry.technically_reviewable++;reviewable++; }
    for (const reason of reasons) { entry.holds[reason]++; blocks[reason]++; }
  }
  const ranked=[...grouped.values()].sort((a,b)=>
    b.technically_reviewable-a.technically_reviewable||
    b.offers-a.offers||Number(a.campaign_id)-Number(b.campaign_id));
  return {
    checked_at_utc:new Date(now).toISOString(),
    source:"ADMITAD_PUBLISHER_WEBSITE",read_only:true,db_writes:0,
    publication_authorized:false, live_perfluence_collision_check:"NOT_DONE",
    program_count:connected.size,coupon_count:coupons.length,
    unknown_campaign_offers:unknownCampaignOffers,
    technically_reviewable_for_manual_approval:reviewable,
    approved_for_publication:0,
    connected_programs_with_offers:ranked.length,
    hold_reason_counts:blocks,top_programs:ranked.slice(0,25),
  };
}

async function main() {
  if (process.env.CATALOG_GROWTH_READ_ONLY!=="true")throw new Error("READ_ONLY_CONFIRMATION_REQUIRED");
  const api=await import("../src/lib/admitadApi.ts");
  const autopilot=await import("../src/lib/admitadAutopilot.ts");
  const config=api.getAdmitadConfig();
  if (!config)throw new Error("API_CREDENTIALS_MISSING");
  const selection=await api.resolveWebsite(config);
  const site=selection.website;
  if (!site||site.status!=="active")throw new Error("WEBSITE_INACTIVE");
  // Publisher-level protection; never silently analyze another connected site.
  let origin;
  try { origin=new URL((site.site_url||"").startsWith("http")?site.site_url:"https://"+site.site_url).hostname.toLowerCase().replace(/^www\./,""); }catch{}
  if (origin!=="promofact.ru")throw new Error("WEBSITE_SCOPE_MISMATCH");
  const [programs,coupons]=await Promise.all([
    api.getConnectedPrograms(String(site.id)),
    api.getWebsiteCoupons(String(site.id)),
  ]);
  const report=summarizePublisherInventory({
    programs,coupons,
    qualityGate:api.evaluateQualityGate,legalGate:api.evaluateLegalGate,
    storeMapping:api.matchCanonicalStore,
    configuredAllowlist:autopilot.getEffectiveCampaignAllowlist(),
  });
  console.log("PROMOFACT_GROWTH_READ_ONLY "+JSON.stringify(report));
  console.log("GROWTH_RELEASE_GUARD needs_coupon_specific_permission_and_live_cross_network_dedupe");
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e=>{
    const safe=new Set(["READ_ONLY_CONFIRMATION_REQUIRED","API_CREDENTIALS_MISSING","WEBSITE_INACTIVE","WEBSITE_SCOPE_MISMATCH"]);
    console.error("PROMOFACT_GROWTH_READ_ONLY_FAILED "+(safe.has(e?.message)?e.message:"READ_ONLY_DATA_OR_API_ERROR"));
    process.exitCode=1;
  });
}
