import assert from "node:assert/strict";
import {
  examinePublisherSnapshot, refreshOptions, assertSnapshotUnchanged,
  assertSafeResult, redactedFailure, CATALOG_MAX_NEW,
} from "./catalog-1-guards.mjs";
import fs from "node:fs";

const current = Date.parse("2026-10-16T09:00:00+03:00");
const base = {
  id: "adm_123", source_coupon_id: "123", source_campaign_id: "141770",
  expires: "2026-10-31", ord_marker: "erid123",
  ord_text: "Реклама. erid: erid123",
  affiliate_link: "https://merchant.example/click?x=1&erid=erid123",
  legal_status: "PRESENT", erid_status: "PRESENT",
};
const expired = {
  ...base, id: "adm_234", source_coupon_id: "234", source_campaign_id: "29791",
  expires: "2026-10-14",
};
const meta = {
  last_status: "SUCCESS", last_success_count: 2,
  last_success_at: "2026-10-13T23:44:34Z", last_success_sync_run_id: "snapshot1",
};
const original = examinePublisherSnapshot([base, expired], meta, current);
assert.equal(original.count, 2);
assert.equal(original.campaignCount, 2);
assert.equal(original.expired, 1);
assert.equal(original.invalid, 0);
assert.equal(original.invalidDates, 0);
assert.deepEqual(original.campaigns, ["141770","29791"]);
assert.deepEqual(refreshOptions(original, "preview", false), {
  skipDbWrite: true, requireActiveRetention: true,
  maxNewOffers: CATALOG_MAX_NEW,
  onlyNewCampaignIds: ["141770","29791"],
});
assert.deepEqual(refreshOptions(original, "publish", true), {
  ...refreshOptions(original, "preview", false), skipDbWrite: false,
});
assert.throws(() => refreshOptions(original, "publish", false), /CATALOG_PUBLISH_NOT_APPROVED/);
assert.throws(() => refreshOptions(original, "unknown", true), /CATALOG_INVALID_MODE/);
assertSnapshotUnchanged(original,
  examinePublisherSnapshot([expired, base], meta, current));
assert.throws(() => assertSnapshotUnchanged(original,
  examinePublisherSnapshot([{...base,affiliate_link:"https://merchant.example/new?erid=erid123"},expired],meta,current)),
  /CATALOG_SNAPSHOT_CHANGED/);
assert.equal(assertSafeResult({
  success: true,status: "SUCCESS",aggregates:{publishable:1},
},original),1);
assert.throws(() => assertSafeResult({
  success: true,status:"SUCCESS",aggregates:{publishable:0},
},original),/CATALOG_RETENTION_CHECK_FAILED/);
assert.throws(() => examinePublisherSnapshot([base],meta,current),/CATALOG_META_COUNT_MISMATCH/);
assert.throws(() => examinePublisherSnapshot([base,base],meta,current),/CATALOG_ID_OR_CAMPAIGN_INVALID/);
const untrusted = {...base,affiliate_link:"https://merchant.example/click?erid=wrong"};
const bad = examinePublisherSnapshot([untrusted,expired],meta,current);
assert.equal(bad.invalid,1);
assert.throws(() => refreshOptions(bad,"preview",false),/CATALOG_INVALID_ACTIVE_ROWS/);
const withBadDate = examinePublisherSnapshot([{...base,expires:"bad-date"},expired],meta,current);
assert.equal(withBadDate.invalidDates,1);
assert.throws(() => refreshOptions(withBadDate,"preview",false),/CATALOG_INVALID_ACTIVE_ROWS/);
assert.throws(() => refreshOptions({...original,ageHours:200},"publish",true),/CATALOG_BASELINE_TOO_OLD/);
assert.equal(redactedFailure(new Error("SECRET https://example?token=abc")),"CATALOG_OPERATION_FAILED");

const worker = fs.readFileSync("src/lib/admitadSyncWorker.ts","utf8");
const runner = fs.readFileSync("scripts/catalog-1-refresh.mjs","utf8");
const workflow = fs.readFileSync(".github/workflows/admitad-publisher-catalog.yml","utf8");
assert.ok(worker.includes("PUBLISHER_COUPON_ID_CAMPAIGN_CHANGED"),
  "Coupon IDs cannot silently transfer between different merchants");
assert.ok(runner.includes("assertSnapshotUnchanged") && runner.includes("skipDbWrite: true") &&
  runner.includes("ADMITAD_CATALOG_PUBLISH_APPROVED"),
  "Runner must preview first and require explicit approval");
assert.match(workflow,/cron: ['"]27 \*\/6 \* \* \*['"]/);
assert.match(workflow,/concurrency:/);
assert.match(workflow,/catalog-1-refresh\.mjs/);
assert.match(workflow,/inputs\.confirm == true/);
assert.match(workflow,/vars\.ADMITAD_PUBLISHER_AUTO_REFRESH_ENABLED == 'true'/);
assert.match(workflow,/github\.event_name == 'schedule'/);
console.log("CATALOG-1: no-write preview, new-program guard, retention, identity and approval PASS");
