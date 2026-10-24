import assert from "node:assert/strict";
import fs from "node:fs";

// Simulate Vercel production with a configured but unreachable Perfluence widget.
// Rendering must use the versioned, approved bundled feed without network I/O.
process.env.VERCEL = "1";
process.env.NODE_ENV = "production";
process.env.PERFLUENCE_WIDGET_URL = "https://perfluence-unreachable.invalid/widget";

const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async () => {
  calls++;
  throw new Error("Production rendering must not request the Perfluence widget");
};
try {
  const { getPerfluenceCoupons, isPerfluenceConfigured } = await import("../src/lib/perfluence.ts");
  assert.equal(isPerfluenceConfigured(), true, "The live endpoint is deliberately configured");
  const visible = await getPerfluenceCoupons();
  assert.ok(visible.length > 0, "The checked-in Perfluence feed must retain publishable offers");
  assert.equal(calls, 0, "No remote request or timeout on Vercel production");
} finally {
  globalThis.fetch = originalFetch;
}

const table = fs.readFileSync("src/components/StoreSummaryTable.tsx", "utf8");
assert.ok(table.includes('ymReachGoal("affiliate_click",'), "Comparison-table outbound clicks must be tracked");
assert.ok(table.includes('prepareAttributedCouponClick(event.currentTarget, coupon, "store_summary", "store")'),
  "Affiliate tracking parameters must remain intact");
for (const fragment of ['store: storeSlug', 'coupon_id: coupon.id', 'placement: "store_summary"',
  'page_type: "store"', 'source_component: "store_summary"']) {
  assert.ok(table.includes(fragment), "Missing anonymous analytics context: " + fragment);
}
assert.doesNotMatch(table, /\bcode:\s*(?:code|coupon\.promocode\.code)\b/,
  "Never send raw promo codes to analytics");
console.log("PASS: Vercel uses published local Perfluence feed without timeouts, summary CTA goals instrumented");
