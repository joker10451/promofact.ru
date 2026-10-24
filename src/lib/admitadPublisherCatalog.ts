import type { AdmitadApiCampaign, AdmitadApiWebsite, StoreMappingResult } from "./admitadApi";

/** Only site-scoped GET /coupons/website/{id}/ can enable this mode. */
export function verifiedPublisherWebsite(site: AdmitadApiWebsite | null | undefined): boolean {
  if (!site || !Number.isSafeInteger(site.id) || site.id <= 0 || site.status !== "active") return false;
  try {
    const url = new URL(site.site_url || "");
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      url.hostname.toLowerCase().replace(/^www\./, "") === "promofact.ru";
  } catch { return false; }
}

function advertiserHost(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return /^[a-z0-9.-]{4,190}$/.test(host) ? host : null;
  } catch { return null; }
}
const PINNED: Record<string,{ hosts: readonly string[]; slug:string; name:string }> = {
  "23573": {hosts:["davines.ru"],slug:"davines",name:"Davines"},
  "2402": {hosts:["shop.megafon.ru"],slug:"megafon",name:"МегаФон"},
  "19328": {hosts:["globus.ru"],slug:"globus",name:"Globus"},
  "19773": {hosts:["korston.ru"],slug:"korston",name:"Korston"},
};

/** Avoid fuzzy cross-store matches; derive collision-proof slugs for genuinely new programs. */
export function resolvePublisherStore(program: AdmitadApiCampaign, usual: StoreMappingResult): StoreMappingResult {
  const id=String(program?.id ?? "");
  const host=advertiserHost(program?.site_url || "");
  const pin=PINNED[id];
  const unmapped: StoreMappingResult={strategy:"UNMAPPED",canonicalSlug:"",storeName:program?.name || "Unknown",confidence:"none"};
  if (pin) return host && pin.hosts.includes(host)
    ? {strategy:"EXACT MATCH",canonicalSlug:pin.slug,storeName:pin.name,confidence:"high"}
    : unmapped;
  if (!host || !/^[1-9][0-9]{0,11}$/.test(id)) return unmapped;
  if (usual.strategy==="EXACT MATCH" &&
      /^[a-z0-9][a-z0-9-]{0,89}$/.test(usual.canonicalSlug)) return usual;
  const parts=host.split(".");
  if (parts.length < 2 || parts.some(x=>!x || !/^[a-z0-9-]+$/.test(x))) return unmapped;
  const suffix=parts[parts.length-1],label=parts[parts.length-2];
  if (!/^(ru|com|net|org|shop)$/.test(suffix) ||
      !/^[a-z][a-z0-9-]{1,35}$/.test(label) ||
      ["com","www","shop","online","login","admin","net"].includes(label)) return unmapped;
  const name=String(program?.name || "").trim();
  if (!name || name.length>100 || /[<>]/.test(name)) return unmapped;
  return {strategy:"DOMAIN MATCH",canonicalSlug:"admitad-"+id+"-"+label,storeName:name,confidence:"medium"};
}

export function validPublisherAffiliateLink(value: string, marker: string | null | undefined): boolean {
  try {
    const u=new URL(value);
    return u.protocol==="https:" && !u.username && !u.password && !u.port &&
      u.hostname.includes(".") && Boolean(marker) && u.searchParams.get("erid")===marker;
  }catch{return false}
}

/** Retain a baseline active offer unless its dated expiry is provably past in Moscow time. */
export function baselineStillEligible(expires: string | null | undefined, atMs = Date.now()): boolean {
  if (!expires) return true;
  if (!/^\d{4}-\d{2}-\d{2}/.test(expires)) return true;
  const end = Date.parse(expires.slice(0,10) + "T23:59:59+03:00");
  return !Number.isFinite(end) || end >= atMs;
}


/**
 * Exactly three Yandex Travel website-coupon IDs checked on 2026-10-19:
 * absent from GET /coupons/website/{site_id}/ AND separately 404 from
 * GET /coupons/{coupon_id}/website/{site_id}/ on this publisher's account.
 *
 * This register is NOT a general permission to drop active offers. Each
 * retirement is allowed only for the old campaign, known date, and after
 * another live independent 404 confirmation immediately before a publish.
 */
const REVIEWED_MISSING_WEBSITE_COUPONS: Readonly<Record<string, {
  campaign: string; expires: string; lastSeen?: string;
}>> = Object.freeze({
  "901876": { campaign: "25224", expires: "2026-10-31" },
  "939051": { campaign: "25224", expires: "2026-10-31" },
  "940388": { campaign: "25224", expires: "2026-10-31" },
  // Befree: absent from site-scoped list on 2026-10-24; still expires today.
  // Retirement is NOT approved by this entry alone: the worker MUST obtain
  // a fresh authoritative site-scoped 404 immediately before publishing.
  "967695": { campaign: "28532", expires: "2026-10-24", lastSeen: "2026-10-23" },
});

export function isReviewedMissingWebsiteCoupon(row: {
  id?: string | null;
  source_coupon_id?: string | null;
  source_campaign_id?: string | null;
  expires?: string | null;
  last_seen_at?: string | null;
}): boolean {
  const id = String(row.source_coupon_id || "");
  const approved = REVIEWED_MISSING_WEBSITE_COUPONS[id];
  return Boolean(approved && row.id === "adm_" + id &&
    String(row.source_campaign_id) === approved.campaign &&
    row.expires === approved.expires &&
    String(row.last_seen_at || "").slice(0, 10) === (approved.lastSeen || "2026-10-16"));
}
