#!/usr/bin/env node
/**
 * Program-scoped Admitad batch publishing. No coupon codes, tracking URLs, ERID
 * values, OAuth credentials or PII are written to stdout.
 *
 * Intended only for reviewed program IDs in BATCH_VERIFIED_CAMPAIGNS.
 * First-run mode retains all existing active IDs and caps added offers.
 * Recurring mode permits removal of genuinely expired/revoked offers through
 * the existing atomic sync and catastrophic-drop protection.
 */
import { getSupabaseAdmin } from "../src/lib/supabase.ts";
import { getBatchCampaignAllowlist, getEffectiveCampaignAllowlist } from "../src/lib/admitadAutopilot.ts";
import { runAdmitadSafeSync } from "../src/lib/admitadSyncWorker.ts";
import { validateRetainsActiveCampaigns } from "./check-admitad-sync-preflight.mjs";

const MAX_FIRST_BATCH = 11;
const MAX_RECURRING_NEW = 25;
const EXPECTED_FIRST_BASELINE = 16;
const EXPECTED_BASELINE_CAMPAIGNS = Object.freeze({
  "141770":2,"1667":3,"17220":1,"25224":6,"26110":3,"28532":1
});

function abort(code) {const err=new Error(code);err.code=code;throw err;}
async function activeRows(supa) {
  const {data,error}=await supa.from("admitad_coupons")
    .select("id,source_campaign_id,source_coupon_id,store_slug,is_active,sync_status,legal_status,erid_status,ord_marker,ord_text,affiliate_link,expires,code")
    .eq("is_active",true).limit(3000);
  if(error || !Array.isArray(data))abort("ACTIVE_SNAPSHOT_READ_FAILED");
  if(data.length>=3000)abort("ACTIVE_SNAPSHOT_TRUNCATED");
  return data;
}
function baselineCheck(rows,mode) {
  if(mode!=="initial") return;
  if(rows.length!==EXPECTED_FIRST_BASELINE)abort("FIRST_BATCH_BASELINE_COUNT_CHANGED");
  const actual={};
  for(const row of rows) {
    const id=String(row.source_campaign_id);
    actual[id]=(actual[id]||0)+1;
  }
  if(Object.keys(actual).length!==Object.keys(EXPECTED_BASELINE_CAMPAIGNS).length ||
     Object.entries(EXPECTED_BASELINE_CAMPAIGNS).some(([id,count])=>actual[id]!==count))
    abort("FIRST_BATCH_BASELINE_CAMPAIGNS_CHANGED");
}
function verifyRows(rows,previous,batchSet,mode) {
  const previousIds=new Set(previous.map(r=>r.id));
  const added=rows.filter(r=>!previousIds.has(r.id));
  const foreign=added.filter(r=>!batchSet.has(String(r.source_campaign_id)));
  if(foreign.length)abort("NEW_OFFER_OUTSIDE_BATCH");
  if(mode==="initial" && previous.some(r=>!rows.some(now=>now.id===r.id)))
    abort("PREVIOUS_ACTIVE_OFFER_LOST");
  if(added.length>(mode==="initial"?MAX_FIRST_BATCH:MAX_RECURRING_NEW))
    abort("NEW_OFFERS_OVER_BATCH_CAP");
  for(const r of added){
    if(!r.id || !r.source_coupon_id || r.sync_status!=="PUBLISHABLE" ||
       r.legal_status!=="PRESENT" || r.erid_status!=="PRESENT" ||
       !r.ord_marker || !r.ord_text?.includes(r.ord_marker))
      abort("NEW_OFFER_LEGAL_OR_ID_INVALID");
    const expiry=r.expires?new Date(r.expires.slice(0,10)+"T23:59:59+03:00"):null;
    if(expiry && (!Number.isFinite(expiry.getTime()) || expiry<=new Date()))
      abort("NEW_OFFER_EXPIRED");
    let url;
    try{url=new URL(r.affiliate_link);}catch{abort("NEW_AFFILIATE_URL_INVALID");}
    if(url.protocol!=="https:" || !url.hostname || url.username || url.password ||
       url.searchParams.get("erid")!==r.ord_marker)
      abort("NEW_AFFILIATE_ERID_MISMATCH");
  }
  return added.length;
}
async function main() {
  const mode=process.env.ADMITAD_BATCH_MODE;
  if(!["initial","recurring"].includes(mode))abort("INVALID_BATCH_MODE");
  const csv=process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS||"";
  const batch=getBatchCampaignAllowlist();
  if(batch.length!==3 || batch.join(",")!=="28532,14647,22484" ||
     csv!=="28532,14647,22484")abort("BATCH_CAMPAIGNS_NOT_REVIEWED");
  if(process.env.ADMITAD_BATCH_RUN_APPROVED!=="true")abort("BATCH_RUN_NOT_APPROVED");
  const baseCsv=process.env.ADMITAD_APPROVED_CAMPAIGNS||"";
  const allApprovals=getEffectiveCampaignAllowlist();
  if(allApprovals.length!==8 || !batch.every(id=>allApprovals.includes(id)))
    abort("EFFECTIVE_ALLOWLIST_UNEXPECTED");

  const supa=getSupabaseAdmin();if(!supa)abort("DATABASE_NOT_CONFIGURED");
  const [before,meta]=await Promise.all([
    activeRows(supa),
    supa.from("admitad_sync_meta").select("last_status,last_success_at,last_success_count")
      .eq("id","admitad_main").single()
  ]);
  if(meta.error || !meta.data || meta.data.last_status!=="SUCCESS")
    abort("AUTHORITATIVE_SYNC_NOT_HEALTHY");
  validateRetainsActiveCampaigns(baseCsv+","+csv,
    before.map(x=>x.source_campaign_id),before.length,Number(meta.data.last_success_count));
  baselineCheck(before,mode);

  const opts={
    onlyNewCampaignIds:batch,maxNewOffers:mode==="initial"?MAX_FIRST_BATCH:MAX_RECURRING_NEW,
    requireActiveRetention:mode==="initial"
  };
  const preview=await runAdmitadSafeSync({...opts,skipDbWrite:true});
  if(!preview.success)abort("BATCH_DRY_RUN_FAILED");
  const p=Number(preview.aggregates?.publishable);
  if(!Number.isSafeInteger(p)||p<=0||
     (mode==="initial" && (p<EXPECTED_FIRST_BASELINE || p>EXPECTED_FIRST_BASELINE+MAX_FIRST_BATCH)))
    abort("BATCH_DRY_RUN_UNEXPECTED_COUNT");
  console.info("ADMITAD_BATCH_PREVIEW "+JSON.stringify({
    mode,previousActive:before.length,proposedActive:p,newOfferCap:opts.maxNewOffers,
    dbWrites:0
  }));

  const justBefore=await activeRows(supa);
  if(justBefore.length!==before.length ||
     justBefore.some(x=>!before.some(y=>y.id===x.id)))
    abort("CONCURRENT_SNAPSHOT_CHANGED");
  const applied=await runAdmitadSafeSync(opts);
  if(!applied.success)abort("BATCH_ATOMIC_SYNC_FAILED");
  const after=await activeRows(supa);
  const added=verifyRows(after,before,new Set(batch),mode);
  const {data:latest,error:metaError}=await supa.from("admitad_sync_meta")
    .select("last_status,last_success_count").eq("id","admitad_main").single();
  if(metaError || latest?.last_status!=="SUCCESS" || Number(latest.last_success_count)!==after.length)
    abort("BATCH_POST_SYNC_METADATA_FAILED");
  console.info("ADMITAD_BATCH_PUBLISHED "+JSON.stringify({
    mode,previousActive:before.length,added,activeNow:after.length,
    candidateCampaigns:batch.length,outcome:"PASS"
  }));
}
main().catch(e=>{
  const reason=/^[A-Z0-9_]+$/.test(e?.code||"")?e.code:"BATCH_RUNTIME_FAILURE";
  console.error("ADMITAD_BATCH_FAILED "+reason);
  process.exitCode=1;
});
