import assert from "node:assert/strict";

const { getAllStores, getCombinedCoupons, isApprovedPublicCouponPlacement } = await import("../src/lib/perfluence.ts");
const { GOLDAPPLE_ROTATED_OFFERS, GOLDAPPLE_OCT21_LINK, GOLDAPPLE_OCT21_ERID, GOLDAPPLE_OCT21_LEGAL } = await import("../src/lib/perfluenceRotatedOffers.ts");
const { withoutForbiddenFloristBeautyCoPromotion } = await import("../src/lib/publisherPlacementRules.ts");

console.log("=== Testing Gold Apple (Золотое Яблоко) Website Placement ===");

// 1. Verify constant exports
assert.equal(GOLDAPPLE_OCT21_LINK, "https://gldppl.prfl.me/smart_zakupka/lr8e4c?erid=2Ranyo8yEMy");
assert.equal(GOLDAPPLE_OCT21_ERID, "2Ranyo8yEMy");
assert.equal(GOLDAPPLE_OCT21_LEGAL, 'Реклама. ООО "ЕКАТЕРИНБУРГ ЯБЛОКО", адрес: г. Екатеринбург, ул. Сакко и Ванцетти, 62, ОГРН 1126670019585 erid: 2Ranyo8yEMy');
assert.equal(GOLDAPPLE_ROTATED_OFFERS.length, 2);

// 2. Policy: isApprovedPublicCouponPlacement
for (const c of GOLDAPPLE_ROTATED_OFFERS) {
  assert.equal(isApprovedPublicCouponPlacement(c), true, `Coupon ${c.promocode.code} must pass approval policy`);
}

// Bogus code must fail
const bogusCode = {
  ...GOLDAPPLE_ROTATED_OFFERS[0],
  promocode: { ...GOLDAPPLE_ROTATED_OFFERS[0].promocode, code: "BOGUS" },
};
assert.equal(isApprovedPublicCouponPlacement(bogusCode), false, "Bogus promo code must be rejected");

// Altered link must fail
const badLink = {
  ...GOLDAPPLE_ROTATED_OFFERS[0],
  affiliate: { ...GOLDAPPLE_ROTATED_OFFERS[0].affiliate, link: "https://evil.com" },
};
assert.equal(isApprovedPublicCouponPlacement(badLink), false, "Wrong affiliate link must be rejected");

// Altered ERID must fail
const badErid = {
  ...GOLDAPPLE_ROTATED_OFFERS[0],
  affiliate: { ...GOLDAPPLE_ROTATED_OFFERS[0].affiliate, ordMarker: "WRONGERID" },
};
assert.equal(isApprovedPublicCouponPlacement(badErid), false, "Wrong ERID must be rejected");

// 3. Merged coupons in catalog
const combined = await getCombinedCoupons();
const goldAppleCoupons = combined.filter((c) => c.store.slug === "zolotoe-yabloko");
assert.equal(goldAppleCoupons.length, 2, "Both Gold Apple coupons must be present in combined coupons");

const codes = goldAppleCoupons.map((c) => c.promocode.code).sort();
assert.deepEqual(codes, ["PERF", "ПРАЗДНИК"].sort(), "Both PERF and ПРАЗДНИК must be present");

for (const c of goldAppleCoupons) {
  assert.equal(c.affiliate.link, GOLDAPPLE_OCT21_LINK);
  assert.equal(c.affiliate.ordMarker, GOLDAPPLE_OCT21_ERID);
  assert.ok(c.affiliate.ordText.includes("erid: 2Ranyo8yEMy"));
  assert.ok(c.affiliate.ordText.includes('ООО "ЕКАТЕРИНБУРГ ЯБЛОКО"'));
}

// 4. Store directory verification
const allStores = await getAllStores();
const goldAppleStore = allStores.find((s) => s.slug === "zolotoe-yabloko");
assert.ok(goldAppleStore, "Золотое Яблоко must be present in getAllStores()");
assert.equal(goldAppleStore.name, "Золотое Яблоко");
assert.equal(goldAppleStore.coupons.length, 2, "Золотое Яблоко store must have 2 coupons");

// 5. Publisher co-promotion restriction with Letual
const curated = withoutForbiddenFloristBeautyCoPromotion(combined);
const hasGoldApple = curated.some((c) => c.store.slug === "zolotoe-yabloko");
const hasLetual = curated.some((c) => c.store.slug === "letual");
assert.ok(hasGoldApple, "Gold Apple must be in the catalog");
assert.equal(hasLetual, false, "Letual must be omitted from curated blocks when Gold Apple is present");

console.log("PASS: Gold Apple website placement, approval policy, and publisher rules verified successfully!");
