import assert from "node:assert/strict";
import fs from "node:fs";
import { getAllStores, isApprovedPublicCouponPlacement } from "../src/lib/perfluence.ts";
import { STABLE_STORES } from "../src/lib/stableStores.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { getStoreHeadlineOfferCounts } from "../src/lib/storeOfferHeadline.ts";

const stores = await getAllStores();
const sberStore = stores.find((s) => s.slug === "sberdevaysy");
assert.ok(sberStore && sberStore.coupons.length >= 2, "SberDevices must carry live Perfluence feed codes");
assert.deepEqual(
  sberStore.coupons.map((c) => c.promocode.code).sort(),
  ["Sberdv171", "Sberdv71"].sort(),
);
assert.deepEqual(getStoreHeadlineOfferCounts(sberStore.coupons), {
  offers: 2,
  codes: 2,
  codeFree: 0,
  barcodes: 0,
});
for (const coupon of sberStore.coupons) {
  assert.ok(isCouponActive(coupon.promocode.expires), `Active expiry required for ${coupon.promocode.code}`);
  assert.ok(coupon.affiliate.ordMarker && coupon.affiliate.link.includes(coupon.affiliate.ordMarker));
  assert.match(coupon.affiliate.ordText, /erid:\s*\w+/);
  assert.equal(coupon.store.categorySlug, "elektronika-i-tehnika");
}
assert.equal(STABLE_STORES.sberdevaysy?.site, "https://sberdevices.ru/");
const registry = fs.readFileSync("src/lib/stableStores.ts", "utf8");
assert.ok(!registry.includes("Sberdv171") && !registry.includes("Sberdv71"));
assert.ok(!fs.readFileSync("src/lib/customCoupons.ts", "utf8").includes("sberdevaysy"),
  "Feed handles SberDevices without manual customCoupons override");
const source = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.ok(source.includes("isApprovedOct16PublisherOffer"));
assert.ok(source.includes("const freshCustomCoupons = (await import"));
assert.equal(typeof isApprovedPublicCouponPlacement, "function");
console.log("SberDevices Perfluence feed codes, expiration, legal marking and live-feed preference PASS");
