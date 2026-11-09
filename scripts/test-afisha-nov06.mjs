import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { PERFLUENCE_NOV06_OFFERS } = await import("../src/lib/perfluenceNov06Offers.ts");
const { isApprovedPublicCouponPlacement, getAllStores } = await import("../src/lib/perfluence.ts");
const { isCouponActive } = await import("../src/lib/couponExpiry.ts");

const afishaCoupons = PERFLUENCE_NOV06_OFFERS.filter(c => c.store.slug === "yandeks-afisha");
assert.equal(afishaCoupons.length, 4, "Must have 4 Nov06 Afisha coupons");

const expectedCodes = {
  "ZT979715": { discount: "750 ₽", min: "5 000 ₽", first: true },
  "MM009981": { discount: "300 ₽", min: "2 000 ₽", first: true },
  "XE330781": { discount: "400 ₽", min: "3 000 ₽", first: true },
  "OZ934995": { discount: "10%", min: null, first: false }
};

for (const c of afishaCoupons) {
  const code = c.promocode.code;
  const exp = expectedCodes[code];
  assert.ok(exp, `Unexpected code: ${code}`);
  assert.equal(c.affiliate.link, "https://yandafisha.prfl.me/sites/p3q5ez?erid=2RanynfupB6");
  assert.equal(c.affiliate.ordMarker, "2RanynfupB6");
  assert.ok(c.affiliate.ordText.includes("2RanynfupB6"));
  assert.ok(c.affiliate.ordText.includes("9705121040"));
  assert.equal(c.promocode.expires, "2027-03-05T23:59:59+03:00");
  assert.equal(c.promocode.isFirstOrderOnly, exp.first);
  assert.ok(c.promocode.bonusName.includes(exp.discount));
  assert.ok(isApprovedPublicCouponPlacement(c), `Must be approved: ${code}`);
  assert.ok(isCouponActive(c.promocode.expires), `Must be active: ${code}`);
}

const stores = await getAllStores();
const afishaStore = stores.find(s => s.slug === "yandeks-afisha");
assert.ok(afishaStore, "Afisha store must be present");
assert.equal(afishaStore.coupons.length, 4, "Afisha store must have exactly 4 active coupons");

console.log("All 4 Yandex Afisha Nov06 coupons verified and store has 4 coupons! PASS");
