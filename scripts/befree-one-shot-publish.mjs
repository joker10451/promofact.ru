#!/usr/bin/env node
/**
 * One-shot publisher-controlled pilot for a *single* Befree coupon. Never re-run
 * after successful publication. Existing published IDs must remain unchanged.
 * No tokens, promotion codes, tracking links, ERID values or PII in logs.
 */
import { getSupabaseAdmin } from "../src/lib/supabase.ts";
import { getEffectiveCampaignAllowlist } from "../src/lib/admitadAutopilot.ts";
import { validateRetainsActiveCampaigns } from "./check-admitad-sync-preflight.mjs";
import { runAdmitadSafeSync } from "../src/lib/admitadSyncWorker.ts";

const expectedCampaigns={
  "141770":2,
  "1667":3,
  "17220":1,
  "25224":6,
  "26110":3
};
const targetId="adm_942686";

function fail(code) {
  const error=new Error(code);
  error.code=code;
  throw error;
}
function validateActive(rows, checkBefree) {
  if (!Array.isArray(rows)) fail("ACTIVE_ROWS_NOT_ARRAY");
  const old=rows.filter(r => String(r.source_campaign_id)!=="28532");
  const byCamp={};
  for (const r of old) {
    const cid=String(r.source_campaign_id);
    byCamp[cid]=(byCamp[cid]||0)+1;
  }
  if (old.length!==15 || Object.keys(byCamp).length!==5 ||
      Object.entries(expectedCampaigns).some(([id,count]) => byCamp[id]!==count)) {
    fail("PREEXISTING_CAMPAIGN_BASELINE_CHANGED");
  }
  const newRows=rows.filter(r => String(r.source_campaign_id)==="28532");
  if (!checkBefree && newRows.length!==0) fail("BEFREE_ALREADY_PUBLISHED");
  if (checkBefree) {
    if (rows.length!==16 || newRows.length!==1 || newRows[0].id!==targetId ||
        String(newRows[0].source_coupon_id)!=="942686" ||
        newRows[0].store_slug!=="befree-ru" ||
        newRows[0].sync_status!=="PUBLISHABLE" ||
        newRows[0].legal_status!=="PRESENT" ||
        newRows[0].erid_status!=="PRESENT" ||
        !newRows[0].ord_marker || !newRows[0].ord_text ||
        !newRows[0].ord_text.includes(newRows[0].ord_marker)) {
      fail("BEFREE_POST_PUBLISH_VALIDATION_FAILED");
    }
    const link=newRows[0].affiliate_link || newRows[0].affiliate_url;
    let u; try { u=new URL(link); } catch {fail("BEFREE_POST_LINK_INVALID");}
    if (u.protocol!=="https:" || u.hostname!=="bednari.com" ||
        u.searchParams.get("erid")!==newRows[0].ord_marker) fail("BEFREE_POST_LINK_OR_ERID_MISMATCH");
    if (!newRows[0].expires || new Date(newRows[0].expires.slice(0,10)+"T23:59:59+03:00")<=new Date())
      fail("BEFREE_POST_EXPIRED");
  }
  return {baseline:old.length,befree:newRows.length};
}
async function getActive(supa) {
  const {data,error}=await supa.from("admitad_coupons")
    .select("id,source_campaign_id,source_coupon_id,store_slug,sync_status,legal_status,erid_status,ord_marker,ord_text,affiliate_link,affiliate_url,expires")
    .eq("is_active",true).limit(3000);
  if(error || !Array.isArray(data)) fail("ACTIVE_READ_FAILED");
  if(data.length>=3000) fail("ACTIVE_READ_TRUNCATED");
  return data;
}
async function main() {
  if (process.env.BEFREE_ONE_SHOT_EXECUTE !== "YES" ||
      process.env.ADMITAD_BEFREE_PILOT_ENABLED !== "true" ||
      process.env.PRODUCTION_ALLOWLIST_PARITY_CONFIRMED !== "true") {
    fail("MISSING_EXPLICIT_OPERATOR_GATES");
  }
  const approved=getEffectiveCampaignAllowlist();
  if (approved.length!==6 || !approved.includes("28532"))
    fail("UNEXPECTED_PUBLISHER_CAMPAIGN_LIST");
  const supa=getSupabaseAdmin();
  if(!supa) fail("SUPABASE_ADMIN_NOT_CONFIGURED");
  const previous=await getActive(supa);
  validateActive(previous,false);
  validateRetainsActiveCampaigns(process.env.ADMITAD_APPROVED_CAMPAIGNS, previous.map(r=>r.source_campaign_id),
    previous.length,15);
  const baselineIds=new Set(previous.map(r=>r.id));

  // API dry-run must conservatively retain 15 old + exactly one vetted new.
  const preview=await runAdmitadSafeSync({skipDbWrite:true});
  if(!preview.success || preview.aggregates?.publishable!==16) {
    fail("DRY_RUN_EXPECTED_SIXTEEN_FAILED");
  }
  console.info("BEFREE_ONE_SHOT_DRY_RUN "+JSON.stringify({
    status:"PASS",expectedActive:16,publishWrites:0
  }));
  // Re-read baseline between preview and publish; defend against concurrent writers.
  const immediatelyBefore=await getActive(supa);
  validateActive(immediatelyBefore,false);
  if(immediatelyBefore.some(r=>!baselineIds.has(r.id))) fail("BASELINE_CHANGED_DURING_PREFLIGHT");
  const live=await runAdmitadSafeSync();
  if(!live.success || live.aggregates?.publishable!==16)
    fail("SYNC_NOT_SUCCESS_OR_COUNT_MISMATCH");

  const rows=await getActive(supa);
  validateActive(rows,true);
  if(previous.some(r=>!rows.find(c=>c.id===r.id)))
    fail("PREEXISTING_COUPON_WENT_MISSING");
  console.info("BEFREE_ONE_SHOT_PUBLISH "+JSON.stringify({
    result:"PASS",previousActive:15,befreeActive:1,totalActive:rows.length,
    couponId:"942686",snapshotStatus:"SUCCESS"
  }));
}
main().catch(err=>{
  const c=typeof err?.code==="string" && /^[A-Z0-9_]+$/.test(err.code)
    ? err.code : "UNEXPECTED_PUBLISH_ERROR";
  console.error("BEFREE_ONE_SHOT_FAILED "+c);
  process.exitCode=1;
});
