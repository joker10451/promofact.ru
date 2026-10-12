#!/usr/bin/env node
/**
 * One-shot read-only preflight for the 2026-10-12 Befree pilot.
 * No writes, no coupon codes, affiliate URLs, PII, tokens or legal details in logs.
 */
import {
  getAdmitadConfig, resolveWebsite, getConnectedPrograms, getWebsiteCoupons,
  mapApiCouponToRaw, matchCanonicalStore, evaluateQualityGate, evaluateLegalGate
} from "../src/lib/admitadApi.ts";
import { normalizeAdmitadCoupon } from "../src/lib/admitadNormalizer.ts";
import { checkBefreePilot } from "../src/lib/admitadAutopilot.ts";
import { getSupabaseAdmin } from "../src/lib/supabase.ts";
import { validateRetainsActiveCampaigns } from "./check-admitad-sync-preflight.mjs";

async function run() {
  const csv = process.env.ADMITAD_APPROVED_CAMPAIGNS ?? "";
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("SUPABASE_ADMIN_UNAVAILABLE");
  const [active, meta] = await Promise.all([
    supabase.from("admitad_coupons").select("id,source_campaign_id,source_coupon_id")
      .eq("is_active",true).limit(3000),
    supabase.from("admitad_sync_meta").select("last_success_count,last_success_at,last_status")
      .eq("id","admitad_main").single()
  ]);
  if (active.error || meta.error || !Array.isArray(active.data) || !meta.data)
    throw new Error("BASELINE_READ_FAILED");
  if (meta.data.last_status !== "SUCCESS") throw new Error("BASELINE_NOT_SUCCESS");
  const old = active.data;
  const baseline = validateRetainsActiveCampaigns(csv,
    old.map(c => c.source_campaign_id),old.length,Number(meta.data.last_success_count));
  if (old.some(c => String(c.source_campaign_id) === "28532")) throw new Error("BEFREE_ALREADY_ACTIVE");
  if (old.length !== 15) throw new Error("BASELINE_NOT_15");

  const config = getAdmitadConfig();
  if (!config) throw new Error("ADMITAD_CONFIG_UNAVAILABLE");
  const site = await resolveWebsite(config);
  if (!site.website || site.website.status !== "active") throw new Error("PUBLISHER_WEBSITE_UNAVAILABLE");
  const [programs,coupons] = await Promise.all([
    getConnectedPrograms(String(site.website.id)),
    getWebsiteCoupons(String(site.website.id))
  ]);
  const program = programs.find(p => p.id === 28532);
  if (!program || program.status !== "active" || program.connection_status !== "active")
    throw new Error("BEFREE_CAMPAIGN_NOT_CONNECTED");
  const mapping = matchCanonicalStore(program);
  if (mapping.strategy !== "EXACT MATCH" || mapping.canonicalSlug !== "befree-ru")
    throw new Error("BEFREE_MAPPING_MISMATCH");
  const target = coupons.find(c => c.id === 942686 && c.campaign?.id === 28532);
  if (!target) throw new Error("BEFREE_COUPON_NOT_FOUND");
  if (target.is_personal || target.is_unique || target.exclusive)
    throw new Error("BEFREE_COUPON_RESTRICTED");
  const quality=evaluateQualityGate(target,program);
  const legal=evaluateLegalGate(target,program);
  if(!quality.passed || legal.eridStatus!=="PRESENT" || legal.legalInfoStatus!=="PRESENT")
    throw new Error("BEFREE_QUALITY_LEGAL_FAILED");
  const raw=mapApiCouponToRaw(target);
  const normalized=normalizeAdmitadCoupon(raw);
  const input={
    campaignId:String(target.campaign.id),couponId:String(target.id),
    promocode:raw.promocode||"",affiliateLink:normalized?.affiliate?.url||raw.gotolink||"",
    erid:legal.eridValue||""
  };
  if(!normalized || !checkBefreePilot(input).passed)
    throw new Error("BEFREE_PILOT_GATE_FAILED");
  const expiry=target.date_end ? new Date(target.date_end.slice(0,10)+"T23:59:59+03:00") : null;
  if(!expiry || !Number.isFinite(expiry.getTime()) || expiry<=new Date())
    throw new Error("BEFREE_EXPIRED_OR_INDEFINITE");
  if(target.date_start){
    const start=new Date(target.date_start.slice(0,10)+"T00:00:00+03:00");
    if(!Number.isFinite(start.getTime())||start>new Date())throw new Error("BEFREE_NOT_STARTED");
  }
  console.info("BEFREE_ONE_SHOT_PREFLIGHT "+JSON.stringify({
    ok:true,old_active:old.length,old_campaigns:baseline.retainedCampaignCount,
    publisher_connected:true,selected_coupon_id:942686,
    selected_coupon_expires:target.date_end.slice(0,10),
    pilot_gate:true,db_writes:0
  }));
}
run().catch(error=>{
  // Only a constant reason prefix and sanitized code, never print raw API data.
  const code=typeof error?.message==="string" && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "PRECHECK_FAILED";
  console.error("BEFREE_ONE_SHOT_PREFLIGHT_FAILED "+code);
  process.exitCode=1;
});
