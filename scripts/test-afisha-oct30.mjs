import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { PERFLUENCE_OCT18_BATCH_OFFERS } = await import("../src/lib/perfluenceOct18Batch.ts");
const { isApprovedPublicCouponPlacement } = await import("../src/lib/perfluence.ts");
const { isCouponActive } = await import("../src/lib/couponExpiry.ts");

const afishaCoupons = PERFLUENCE_OCT18_BATCH_OFFERS.filter(c => c.store.slug === "yandeks-afisha");
assert.equal(afishaCoupons.length, 4, "Must have 4 Afisha coupons");

const expectedCodes = {
  "ZT979715": { discount: "750 ₽", min: "5 000 ₽", first: true },
  "MM009981": { discount: "300 ₽", min: "2 000 ₽", first: true },
  "XE330781": { discount: "400 ₽", min: "3 000 ₽", first: true },
  "OZ934995": { discount: "10%", min: "3 000 ₽", first: false }
};

for (const c of afishaCoupons) {
  const code = c.promocode.code;
  const exp = expectedCodes[code];
  assert.ok(exp, `Unexpected code: ${code}`);
  assert.equal(c.affiliate.link, "https://yandafisha.prfl.me/sites/xocz1q?erid=2RanynJD4PD");
  assert.equal(c.affiliate.ordMarker, "2RanynJD4PD");
  assert.ok(c.affiliate.ordText.includes("2RanynJD4PD"));
  assert.ok(c.affiliate.ordText.includes("9705121040"));
  assert.equal(c.promocode.expires, "2027-03-05T23:59:59+03:00");
  assert.equal(c.promocode.isFirstOrderOnly, exp.first);
  assert.ok(c.promocode.bonusName.includes(exp.discount));
  assert.ok(c.promocode.terms.includes(exp.min));
  assert.ok(isApprovedPublicCouponPlacement(c), `Must be approved: ${code}`);
  assert.ok(isCouponActive(c.promocode.expires), `Must be active: ${code}`);
}

console.log("All 4 Yandex Afisha coupons verified and approved! PASS");
