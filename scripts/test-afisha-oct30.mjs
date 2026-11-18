import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { PERFLUENCE_OCT18_BATCH_OFFERS } = await import("../src/lib/perfluenceOct18Batch.ts");
const { PERFLUENCE_NOV06_OFFERS } = await import("../src/lib/perfluenceNov06Offers.ts");
const { isApprovedPublicCouponPlacement } = await import("../src/lib/perfluence.ts");
const { isCouponActive } = await import("../src/lib/couponExpiry.ts");

// Legacy Afisha coupons in Oct18 batch must be 0 (superseded on Nov 18)
const legacyCoupons = PERFLUENCE_OCT18_BATCH_OFFERS.filter(c => c.store.slug === "yandeks-afisha");
assert.equal(legacyCoupons.length, 0, "Legacy Afisha coupons must be removed from oct18 batch");

// Active Afisha coupons are in PERFLUENCE_NOV06_OFFERS
const activeAfisha = PERFLUENCE_NOV06_OFFERS.filter(c => c.store.slug === "yandeks-afisha");
assert.equal(activeAfisha.length, 4, "Must have 4 active Afisha coupons");

for (const c of activeAfisha) {
  assert.equal(c.affiliate.link, "https://yaafisha.prfl.me/sites/urcykp?erid=2RanynSbxDJ");
  assert.equal(c.affiliate.ordMarker, "2RanynSbxDJ");
  assert.ok(c.affiliate.ordText.includes("2RanynSbxDJ"));
  assert.ok(isApprovedPublicCouponPlacement(c), `Must be approved: ${c.promocode.code}`);
  assert.ok(isCouponActive(c.promocode.expires), `Must be active: ${c.promocode.code}`);
}

console.log("Yandex Afisha clean transition verified! PASS");
