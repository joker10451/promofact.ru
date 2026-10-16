#!/usr/bin/env node
/**
 * Fail-closed preflight for manual Admitad snapshot publication.
 *
 * Checks ONLY proposal safety against active Supabase data. This is not an
 * approval decision and cannot verify Vercel environment variables itself.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

export function parseCampaignIds(csv) {
  if (typeof csv !== "string" || !csv.trim()) throw new Error("APPROVAL_LIST_EMPTY");
  const tokens = csv.split(",").map((value) => value.trim());
  if (tokens.some((v) => !/^[0-9]{1,12}$/.test(v))) {
    throw new Error("APPROVAL_LIST_MALFORMED");
  }
  if (new Set(tokens).size !== tokens.length) throw new Error("APPROVAL_LIST_DUPLICATED");
  return new Set(tokens);
}

/** Broad publisher baseline detection permits a read-only defer, never new write rights. */
export function hasActiveCampaignsOutsideBatch(csv, activeIds) {
  const approved = parseCampaignIds(csv);
  return activeIds.some(raw => {
    const id = String(raw ?? "").trim();
    if (!/^[0-9]{1,12}$/.test(id)) throw new Error("ACTIVE_CAMPAIGN_ID_INVALID");
    return !approved.has(id);
  });
}

export function validateRetainsActiveCampaigns(csv, activeIds, activeRowCount, expectedCount) {
  const approved = parseCampaignIds(csv);
  if (!Number.isSafeInteger(activeRowCount) || !Number.isSafeInteger(expectedCount) ||
      activeRowCount < 0 || expectedCount < 0 || activeRowCount !== expectedCount) {
    throw new Error("ACTIVE_SNAPSHOT_COUNT_MISMATCH");
  }
  const active = new Set();
  for (const raw of activeIds) {
    const id = String(raw ?? "").trim();
    if (!/^[0-9]{1,12}$/.test(id)) throw new Error("ACTIVE_CAMPAIGN_ID_INVALID");
    active.add(id);
  }
  const missing = [...active].filter((id) => !approved.has(id));
  if (missing.length > 0) throw new Error("PREVIOUSLY_ACTIVE_CAMPAIGN_EXCLUDED");
  return { approvedCount: approved.size, retainedCampaignCount: active.size, activeRows: activeRowCount };
}

async function main() {
  if (process.env.PRODUCTION_ALLOWLIST_PARITY_CONFIRMED !== "true") {
    throw new Error("VERCEL_PRODUCTION_ALLOWLIST_NOT_CONFIRMED");
  }
  const csv = process.env.ADMITAD_APPROVED_CAMPAIGNS || "";
  parseCampaignIds(csv);
  // Dynamic import keeps unit tests isolated from service keys and network.
  const { getSupabaseAdmin } = await import("../src/lib/supabase.ts");
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");

  const [offers, meta] = await Promise.all([
    admin.from("admitad_coupons").select("source_campaign_id").eq("is_active", true).limit(3000),
    admin.from("admitad_sync_meta").select("last_success_count,last_success_at")
      .eq("id", "admitad_main").single(),
  ]);
  if (offers.error || meta.error || !Array.isArray(offers.data) || !meta.data ||
      !meta.data.last_success_at) {
    throw new Error("ACTIVE_SNAPSHOT_READ_FAILED");
  }
  if (offers.data.length >= 3000) throw new Error("ACTIVE_SNAPSHOT_LIMIT_REACHED");
  const result = validateRetainsActiveCampaigns(
    csv,
    offers.data.map((r) => r.source_campaign_id),
    offers.data.length,
    Number(meta.data.last_success_count),
  );
  console.info(JSON.stringify({event:"admitad_sync_preflight",outcome:"PASS",...result}));
}

const invokedAsScript = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedAsScript) {
  main().catch((err) => {
    // Reason codes only; never log credentials, tokens or affiliate URLs.
    const allowed = new Set([
      "APPROVAL_LIST_EMPTY","APPROVAL_LIST_MALFORMED","APPROVAL_LIST_DUPLICATED",
      "ACTIVE_SNAPSHOT_COUNT_MISMATCH","ACTIVE_CAMPAIGN_ID_INVALID",
      "PREVIOUSLY_ACTIVE_CAMPAIGN_EXCLUDED","VERCEL_PRODUCTION_ALLOWLIST_NOT_CONFIRMED",
      "SUPABASE_ADMIN_NOT_CONFIGURED","ACTIVE_SNAPSHOT_READ_FAILED",
      "ACTIVE_SNAPSHOT_LIMIT_REACHED",
    ]);
    const code = allowed.has(err?.message) ? err.message : "UNEXPECTED_PREFLIGHT_FAILURE";
    console.error(JSON.stringify({event:"admitad_sync_preflight",outcome:"FAIL",reason:code}));
    process.exitCode = 1;
  });
}
