#!/usr/bin/env node
/**
 * P0 Oct-19 Admitad recovery: one-use, read-only baseline + post-publish check.
 * The script deliberately never writes, never prints partner URLs, auth or ERIDs.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("ADM_RECOVERY_DATABASE_NOT_CONFIGURED");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const oldEpoch = Date.parse("2026-10-16T00:39:50.177652+00:00");
const retired = ["901876","939051","940388"];
async function readMeta() {
  const { data, error } = await db.from("admitad_sync_meta")
    .select("last_status,last_success_at,last_success_count")
    .eq("id","admitad_main").single();
  if (error || !data) throw new Error("ADM_RECOVERY_META_READ_FAILED");
  return data;
}
async function readRetired() {
  const { data, error } = await db.from("admitad_coupons")
    .select("id,source_coupon_id,source_campaign_id,expires,is_active,last_seen_at")
    .in("source_coupon_id", retired);
  if (error || !data) throw new Error("ADM_RECOVERY_COUPONS_READ_FAILED");
  return data;
}
function matchesOriginal(row) {
  return row.id === "adm_" + row.source_coupon_id &&
    row.source_campaign_id === "25224" &&
    row.expires === "2026-10-31" &&
    String(row.last_seen_at || "").slice(0,10) === "2026-10-16";
}
const [mode] = process.argv.slice(2);
const [meta, rows] = await Promise.all([readMeta(),readRetired()]);
if (meta.last_status !== "SUCCESS") throw new Error("ADM_RECOVERY_UNEXPECTED_STATUS");
const t = Date.parse(meta.last_success_at || "");
if (!Number.isFinite(t) || rows.some(row=>!matchesOriginal(row))) {
  throw new Error("ADM_RECOVERY_BASELINE_IDENTITY_MISMATCH");
}
if (mode === "before") {
  if (t !== oldEpoch || Number(meta.last_success_count) !== 441 ||
      rows.length !== retired.length ||
      rows.some(row => row.is_active !== true)) {
    throw new Error("ADM_RECOVERY_BASELINE_CHANGED__NO_WRITES");
  }
  console.log("ADM_RECOVERY_PRECHECK_PASS",JSON.stringify({
    previousActive:441,reviewedCouponIds:retired.length,write:false,
  }));
} else if (mode === "after") {
  if (t <= oldEpoch || Number(meta.last_success_count) < 434 ||
      Number(meta.last_success_count) > 466 ||
      rows.some(row => row.is_active === true)) {
    throw new Error("ADM_RECOVERY_POST_PUBLISH_VERIFICATION_FAILED");
  }
  console.log("ADM_RECOVERY_POSTCHECK_PASS",JSON.stringify({
    active:Number(meta.last_success_count),retired:retired.length,
    lastSuccessAt:meta.last_success_at,
  }));
} else {
  throw new Error("ADM_RECOVERY_MODE_MUST_BE_BEFORE_OR_AFTER");
}
