import assert from "node:assert/strict";
import fs from "node:fs";
import { CUSTOM_COUPONS } from "../src/lib/customCoupons.ts";
import { STABLE_STORES } from "../src/lib/stableStores.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { getStoreHeadlineOfferCounts } from "../src/lib/storeOfferHeadline.ts";

const coupons = CUSTOM_COUPONS.filter(c => c.store.slug === "sberdevaysy");
assert.equal(coupons.length, 2, "Approved SberDevices placement requires exactly two codes");
assert.deepEqual(coupons.map(c => c.promocode.code).sort(), ["Sberdv171", "Sberdv71"].sort());
assert.deepEqual(getStoreHeadlineOfferCounts(coupons), { offers: 2, codes: 2, codeFree: 0 });
const pct = new Map([["Sberdv171", 6], ["Sberdv71", 5]]);
const link = "https://sberdevaysy1.prfl.me/sites/fq4aly?erid=2RanymNsVkw";
for (const coupon of coupons) {
  const n = pct.get(coupon.promocode.code);
  assert.equal(coupon.promocode.expires, "2026-10-31");
  assert.ok(coupon.promocode.bonusName.includes(`${n}%`));
  assert.ok(coupon.promocode.terms.includes(`${n}%`));
  assert.equal(coupon.affiliate.link, link);
  assert.equal(coupon.affiliate.landingLink, link);
  assert.equal(coupon.affiliate.ordMarker, "2RanymNsVkw");
  assert.match(coupon.affiliate.ordText, /ООО «САЛЮТДЕВАЙСЫ»/);
  assert.match(coupon.affiliate.ordText, /7730253720/);
  assert.match(coupon.affiliate.ordText, /2RanymNsVkw/);
  assert.equal(coupon.store.site, "https://sberdevices.ru/");
  assert.equal(coupon.store.categorySlug, "elektronika-i-tehnika");
  assert.equal(coupon.promocode.group, "perfluence");
  assert.equal(coupon.promocode.isFirstOrderOnly, false);
  assert.equal(isCouponActive(coupon.promocode.expires, Date.parse("2026-10-31T23:59:00+03:00")), true);
  assert.equal(isCouponActive(coupon.promocode.expires, Date.parse("2026-11-01T00:00:00+03:00")), false);
}
assert.equal(STABLE_STORES.sberdevaysy?.site, "https://sberdevices.ru/");
const registry = fs.readFileSync("src/lib/stableStores.ts", "utf8");
assert.ok(!registry.includes("Sberdv171") && !registry.includes("Sberdv71"));
assert.ok(!registry.includes("fq4aly") && !registry.includes("2RanymNsVkw"));
const source = fs.readFileSync("src/lib/perfluence.ts","utf8");
assert.ok(source.includes("liveSberDevicesCodes"));
assert.ok(source.includes('c.store.slug !== "sberdevaysy"'));
console.log("SberDevices 2 Perfluence codes, expiration, legal, link and live-feed preference PASS");
