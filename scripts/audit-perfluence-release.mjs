/**
 * Offline, reproducible release gate for the bundled Perfluence feed.
 * This does not assert that a code works at checkout or that live Perfluence
 * and Supabase currently contain the same records.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { parsePayload, getPerfluenceCoupons, isPerfluenceConfigured,
  isApprovedPublicCouponPlacement } = await import("../src/lib/perfluence.ts");
const { isPublicPerfluenceWidgetCoupon } =
  await import("../src/lib/perfluenceAffiliateSafety.ts");
const { withoutPausedPublisherOffers } =
  await import("../src/lib/publisherPauses.ts");
const { isApprovedOct16PublisherOffer } =
  await import("../src/lib/perfluenceOct16Offers.ts");
const { isApprovedOct18WebsitePlacement } =
  await import("../src/lib/perfluenceOct18Scheduled.ts");
const { isCouponActive } = await import("../src/lib/couponExpiry.ts");

const feed = JSON.parse(fs.readFileSync("src/data/perfluence-feed.json", "utf8"));
const now = Date.now();
const parsed = parsePayload(JSON.stringify(feed));
const active = parsed.filter((c) => isCouponActive(c.promocode.expires, now));
const verified = active.filter(isPublicPerfluenceWidgetCoupon);
const blocked = verified.filter((c) => !isApprovedPublicCouponPlacement(c));
const selected = withoutPausedPublisherOffers(verified)
  .filter(isApprovedOct16PublisherOffer)
  .filter(isApprovedOct18WebsitePlacement)
  .filter(isApprovedPublicCouponPlacement);

const publicSnapshot = await getPerfluenceCoupons();
assert(publicSnapshot.every((c) =>
  isCouponActive(c.promocode.expires, now) &&
  isPublicPerfluenceWidgetCoupon(c) &&
  isApprovedPublicCouponPlacement(c) &&
  c.affiliate.sourceLink === undefined),
  "Public fallback snapshot must contain only active approved offers, never audit-only URLs");

if (!isPerfluenceConfigured()) {
  // Without a live widget URL, the server uses this bundled feed. Check
  // the actual output, not only the gate's implementation.
  const identity = (c) => [c.store.slug, c.promocode.code, c.id, c.affiliate.link].join("|");
  assert.deepEqual(publicSnapshot.map(identity).sort(), selected.map(identity).sort(),
    "Public snapshot must match the combined security gates for the bundled feed");
}

const stats = {
  generatedAt: new Date(now).toISOString(),
  feedProjectCount: feed.data?.length ?? 0,
  candidates: parsed.length,
  currentlyActive: active.length,
  passedAffiliateValidation: verified.length,
  excludedByPlacementRules: blocked.length,
  publishedSnapshot: publicSnapshot.length,
  verifiedButBlocked: blocked.map((c) => ({ store: c.store.slug, code: c.promocode.code })),
  note: "Archived bundled feed only. Not an independent live publisher or merchant-cart verification."
};
console.log("PERFLUENCE RELEASE GATE:\n" + JSON.stringify(stats, null, 2));
assert(publicSnapshot.every((c) => c.store.slug !== "winlab"),
  "WinLab must not appear even if a source updates its ORD marker");
console.log("PERFLUENCE RELEASE GATE PASS");
