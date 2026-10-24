#!/usr/bin/env node
/**
 * Read-only affiliate attribution hygiene audit.
 * Never follows partner redirects or creates a billable click.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * This checks stored snapshot integrity, NOT payout attribution.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { DENIED_ADMITAD_CAMPAIGN_IDS } from "../src/lib/admitadPublicVisibility.ts";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!projectUrl || !serviceKey) {
  console.error("Missing Supabase audit credentials. No requests made.");
  process.exit(2);
}
const db = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const PAGE = 500;
async function fetchRows() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db.from("admitad_coupons")
      .select("id,store_slug,source_campaign_id,code,is_active,expires,affiliate_link,affiliate_url,ord_marker,ord_text,site,sync_status,legal_status,erid_status")
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error("Admitad snapshot query failed: " + error.code);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}
function moscowDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = name => parts.find(part => part.type === name)?.value;
  return get("year") + "-" + get("month") + "-" + get("day");
}
function validLink(row) {
  const marker = String(row.ord_marker || "").trim();
  const href = String(row.affiliate_link || row.affiliate_url || "").trim();
  try {
    const u = new URL(href);
    return u.protocol === "https:" && !u.username && !u.password && !u.port &&
      new RegExp("^/g/[a-z0-9_-]+/?$", "i").test(u.pathname) &&
      /^[0-9]+$/.test(u.searchParams.get("i") || "") &&
      !!marker && u.searchParams.get("erid") === marker &&
      String(row.ord_text || "").includes(marker) &&
      /реклама/iu.test(String(row.ord_text || "")) &&
      /^[0-9]{1,12}$/.test(String(row.source_campaign_id || ""));
  } catch { return false; }
}
function issueSample(row, problem) {
  return { store: row.store_slug, id: row.id, issue: problem };
}
async function main() {
  const [rows, metaResult] = await Promise.all([
    fetchRows(),
    db.from("admitad_sync_meta").select("last_success_at,last_status").eq("id", "admitad_main").maybeSingle(),
  ]);
  if (metaResult.error) throw new Error("Sync meta query failed: " + metaResult.error.code);
  const today = moscowDate();
  const active = rows.filter(r => r.is_active === true);
  const eligible = active.filter(r => !r.expires || String(r.expires).slice(0,10) >= today);
  const restricted = eligible.filter(r => DENIED_ADMITAD_CAMPAIGN_IDS.has(String(r.source_campaign_id || "")));
  const publiclyEligible = eligible.filter(r => !DENIED_ADMITAD_CAMPAIGN_IDS.has(String(r.source_campaign_id || "")));
  const expiredActive = active.filter(r => r.expires && String(r.expires).slice(0,10) < today);
  const broken = publiclyEligible.filter(r => !validLink(r));
  const unexpectedPublisher = publiclyEligible.filter(r => !String(r.affiliate_link || r.affiliate_url || "").includes("c7dde8999c"));
  const campaignMap = new Map();
  for (const row of publiclyEligible) {
    const id = String(row.source_campaign_id || "");
    if (!campaignMap.has(id)) campaignMap.set(id, new Set());
    campaignMap.get(id).add(row.store_slug);
  }
  const crossStoreCampaigns = [...campaignMap].filter(([, stores]) => stores.size > 1).map(([id]) => id);

  const feed = JSON.parse(fs.readFileSync("src/data/perfluence-feed.json", "utf8"));
  let perfluenceOffers = 0, channelPlacement = 0, missingPerfluenceErid = 0, missingPerfluenceLink = 0;
  const channelProjects = new Set(), missingEridProjects = new Set();
  for (const item of feed.data || []) {
    for (const group of item.groups || []) {
      const raw = (group.links_for_subscribers || [])[0]?.link ||
        (Array.isArray(group.landing) ? group.landing[0]?.link : group.landing?.link) || "";
      for (const promo of group.promocodes?.length ? group.promocodes : [{}]) {
        perfluenceOffers++;
        const marker = promo.ord_marker ||
          (Array.isArray(group.landing) ? group.landing[0]?.ord_marker : group.landing?.ord_marker) || "";
        if (!raw) missingPerfluenceLink++;
        if (!marker) { missingPerfluenceErid++; missingEridProjects.add(item.project?.name); }
        if (raw.includes("/smart_zakupka/")) { channelPlacement++; channelProjects.add(item.project?.name); }
      }
    }
  }

  const successAt = metaResult.data?.last_success_at;
  const hoursSinceSync = successAt ? Math.round((Date.now() - new Date(successAt).getTime()) / 3600000) : null;
  const report = {
    admitad: {
      stored: rows.length, markedActive: active.length, notExpiredActive: eligible.length,
      deniedByPublisherAccount: restricted.length,
      actuallyEligibleForPublicRead: publiclyEligible.length,
      expiredButStillMarkedActive: expiredActive.length,
      failedFormatOrErid: broken.length, differentPublisherFragment: unexpectedPublisher.length,
      crossStoreCampaigns: crossStoreCampaigns.length,
      sample: [...restricted.map(r => issueSample(r,"PUBLISHER_ACCOUNT_DENIED")),
        ...expiredActive.map(r => issueSample(r,"EXPIRED_ACTIVE")),
        ...broken.map(r => issueSample(r,"BAD_LINK_OR_ERID")),
        ...unexpectedPublisher.map(r => issueSample(r,"PUBLISHER_FRAGMENT_DIFFERENT"))].slice(0,20),
      lastSuccess: successAt || null, hoursSinceSync, syncStatus: metaResult.data?.last_status || null,
    },
    perfluenceBundledSnapshot: {
      offers: perfluenceOffers, missingLink: missingPerfluenceLink,
      missingErid: missingPerfluenceErid, channelOriginOffers: channelPlacement,
      channelOriginProjects: [...channelProjects], missingEridProjects: [...missingEridProjects],
      note: "Bundled feed is not equivalent to current live Perfluence API",
    },
    limits: "Syntactic and metadata checks only; no clicks, order attribution or final merchant redirects verified",
  };
  console.log(JSON.stringify(report, null, 2));
  const unhealthy = broken.length || unexpectedPublisher.length || crossStoreCampaigns.length ||
    !successAt || (hoursSinceSync !== null && hoursSinceSync > 48);
  if (unhealthy) process.exitCode = 1;
}
main().catch(err => { console.error("Affiliate audit failed:", err.message); process.exitCode = 2; });
