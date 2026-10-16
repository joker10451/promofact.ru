#!/usr/bin/env node
/**
 * CATALOG-1: read-only scheduled publisher preview; explicitly approved
 * manual publish uses the SAME guardrails, never widens approved campaigns.
 * All diagnostics are aggregate counts; no coupon codes, links, ERIDs, PII.
 */
import { examinePublisherSnapshot, refreshOptions, assertSnapshotUnchanged,
  assertSafeResult, redactedFailure, CATALOG_MAX_ROWS } from "./catalog-1-guards.mjs";

async function main() {
  if (process.env.ADMITAD_PUBLISH_WEBSITE_COUPONS !== "true" ||
      process.env.ADMITAD_WEBSITE_HOST !== "promofact.ru")
    throw new Error("CATALOG_UNEXPECTED_PUBLISHER_SCOPE");

  const mode = process.env.ADMITAD_PUBLISHER_CATALOG_DRY_RUN === "false"
    ? "publish" : "preview";
  const explicitlyApproved = process.env.ADMITAD_CATALOG_PUBLISH_APPROVED === "true";
  if (mode === "publish" && !explicitlyApproved)
    throw new Error("CATALOG_PUBLISH_NOT_APPROVED");

  const { getSupabaseAdmin } = await import("../src/lib/supabase.ts");
  const { runAdmitadSafeSync } = await import("../src/lib/admitadSyncWorker.ts");
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("CATALOG_DATABASE_UNAVAILABLE");

  async function readSnapshot() {
    const [offers, meta] = await Promise.all([
      admin.from("admitad_coupons")
        .select("id,source_campaign_id,source_coupon_id,expires,ord_marker,ord_text,affiliate_link,erid_status,legal_status")
        .eq("is_active",true).limit(CATALOG_MAX_ROWS),
      admin.from("admitad_sync_meta")
        .select("last_status,last_success_count,last_success_at,last_success_sync_run_id")
        .eq("id","admitad_main").single(),
    ]);
    if (offers.error || meta.error || !Array.isArray(offers.data) || !meta.data)
      throw new Error("CATALOG_READ_FAILED");
    return examinePublisherSnapshot(offers.data, meta.data);
  }

  const before = await readSnapshot();
  const options = refreshOptions(before, mode, explicitlyApproved);
  console.info("CATALOG_1_BASELINE " + JSON.stringify({
    activeOffers: before.count, campaigns: before.campaignCount,
    pastDateRows: before.expired, invalidRows: before.invalid,
    baselineAgeHours: before.ageHours, mode, databaseWrites: 0,
  }));

  // Always run a complete no-write preview before attempting a live write.
  const preview = await runAdmitadSafeSync({
    ...options, skipDbWrite: true,
  });
  const expected = assertSafeResult(preview, before);
  console.info("CATALOG_1_PREVIEW_PASS " + JSON.stringify({
    proposedActive: expected, activeBefore: before.count,
    oldExpired: before.expired, newCampaignsAllowed: 0,
    maximumNewCoupons: options.maxNewOffers, databaseWrites: 0,
  }));
  if (mode === "preview") return;

  // A separate writer could change the snapshot while Admitad API is fetched.
  // Refuse to publish if IDs, campaign IDs, expiry, links or ERIDs changed.
  const immediatelyBefore = await readSnapshot();
  assertSnapshotUnchanged(before, immediatelyBefore);

  // Publisher scope must be validated by runAdmitadSafeSync against the actual
  // authenticated website; only pre-approved original campaign IDs may grow.
  const applied = await runAdmitadSafeSync(options);
  const publishedCount = assertSafeResult(applied, before);
  const after = await readSnapshot();
  const previouslyApproved = new Set(before.campaigns);
  if (after.campaigns.some(id => !previouslyApproved.has(id)) ||
      after.count !== publishedCount)
    throw new Error("CATALOG_POST_PUBLISH_VERIFICATION_FAILED");
  console.info("CATALOG_1_PUBLISHED " + JSON.stringify({
    previouslyActive: before.count, nowActive: after.count,
    campaigns: after.campaignCount, databaseWrites: 1,
    outcome: "VERIFIED",
  }));
}

main().catch(error => {
  // Output only fixed error identifiers, never exceptions containing remote
  // URLs, keys, click IDs, discount codes, or advertising tokens.
  console.error("CATALOG_1_FAILED " + redactedFailure(error));
  process.exitCode = 1;
});
