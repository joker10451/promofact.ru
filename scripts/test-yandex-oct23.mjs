import assert from "node:assert/strict";
import { CUSTOM_COUPONS } from "../src/lib/customCoupons.ts";
import { isApprovedPublicCouponPlacement, getCombinedCoupons, getAllStores } from "../src/lib/perfluence.ts";
import { withoutForbiddenFloristBeautyCoPromotion } from "../src/lib/publisherPlacementRules.ts";

const expected = [
  ["yandeks-tsvety", "QX7GZZ", "2026-12-31T23:59:59+03:00", "https://yaflowers.prfl.me/sites/oluvpa?erid=2RanymRX1bZ", "2RanymRX1bZ", "1 100"],
  ["yandex-eda", "paf250", "2026-11-15T23:59:59+03:00", "https://edayandex.prfl.me/sites/tndr3w?erid=2RanymUUzAF", "2RanymUUzAF", "520"],
  ["yandex-eda", "lmj210", "2026-11-01T23:59:59+03:00", "https://edayandex.prfl.me/sites/tndr3w?erid=2RanymUUzAF", "2RanymUUzAF", "520"],
];

for (const [slug, code, expiry, link, erid, amount] of expected) {
  const offer = CUSTOM_COUPONS.find(c => c.store.slug === slug && c.promocode.code === code);
  assert.ok(offer, `Missing approved coupon ${slug} / ${code}`);
  assert.equal(offer.promocode.expires, expiry);
  assert.equal(offer.affiliate.link, link);
  assert.equal(offer.affiliate.landingLink, link);
  assert.equal(offer.affiliate.ordMarker, erid);
  assert.ok(offer.affiliate.ordText.includes("ИНН 9705114405"));
  assert.ok(offer.affiliate.ordText.includes("erid: " + erid));
  assert.ok(offer.promocode.bonusName?.includes(amount));
  assert.equal(isApprovedPublicCouponPlacement(offer), true);
  assert.equal(isApprovedPublicCouponPlacement({
    ...offer, affiliate: { ...offer.affiliate, link: "https://example.org/" },
  }), false);
  assert.equal(isApprovedPublicCouponPlacement({
    ...offer, affiliate: { ...offer.affiliate, ordMarker: "INVALIDTOKEN" },
  }), false);
  assert.equal(isApprovedPublicCouponPlacement({
    ...offer, promocode: { ...offer.promocode, code: "UNAPPROVED" },
  }), false);
}

const combined = await getCombinedCoupons();
const selected = combined.filter(c => ["yandeks-tsvety", "yandex-eda"].includes(c.store.slug));
assert.equal(selected.length, 3, "Only three approved Yandex coupons should be publicly merged");
assert.deepEqual(selected.map(c => c.promocode.code).sort(), ["QX7GZZ", "lmj210", "paf250"].sort());

const stores = await getAllStores();
for (const slug of ["yandeks-tsvety", "yandex-eda"]) {
  assert.ok(stores.find(s => s.slug === slug), `Store ${slug} should have a public page`);
}

const flowers = selected.find(c => c.store.slug === "yandeks-tsvety");
const fmart = CUSTOM_COUPONS.find(c => c.store.slug === "fmart");
assert.ok(flowers && fmart);
assert.equal(withoutForbiddenFloristBeautyCoPromotion([flowers, fmart])
  .some(c => c.store.slug === "yandeks-tsvety"), false);
assert.equal(withoutForbiddenFloristBeautyCoPromotion([flowers])
  .some(c => c.store.slug === "yandeks-tsvety"), true);
console.log("PASS: Yandex Oct23 placements, links, ERIDs and co-promotion policy");
