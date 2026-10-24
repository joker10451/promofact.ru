import assert from "node:assert/strict";
import { PERFLUENCE_REPEAT_OCT24, PERFLUENCE_REPEAT_OCT24_OFFERS, isApprovedOct24Repost } from "../src/lib/perfluenceRepeatsOct24.ts";
import { isApprovedPublicCouponPlacement } from "../src/lib/perfluence.ts";
import { getCustomCoupons } from "../src/lib/customCoupons.ts";
import { isPausedPublisherStore } from "../src/lib/publisherPauses.ts";
const expected = new Map([
  ["pfsn124409", "2RanymAU35D"], ["pfsn394722", "2RanymAU35D"],
  ["pfs568042", "2RanymAU35D"], ["pfs1587883", "2RanymAU35D"],
  ["ZSLWVWXUC8", "2RanymGPzCb"], ["5XMGA7H6M6", "2RanymEuzvF"],
  ["WOW-EEFN", "2Ranymbfps5"], ["PERPREGT259702", "2RanymYhrJP"],
  ["SPPA2EFFE", "2RanymXDs23"], ["PERE7A4E5", "2RanymVjsjh"],
]);
assert.equal(PERFLUENCE_REPEAT_OCT24.length, 12);
assert.equal(PERFLUENCE_REPEAT_OCT24_OFFERS.length, 12);
for (const c of PERFLUENCE_REPEAT_OCT24_OFFERS) {
  const e = c.affiliate.ordMarker;
  assert.equal(new URL(c.affiliate.link).searchParams.get("erid"), e);
  assert.ok(c.affiliate.ordText.includes("erid: "+e));
  assert.equal(c.affiliate.landingLink, c.affiliate.link);
  if (c.promocode.code) assert.equal(e, expected.get(c.promocode.code));
  assert.equal(isApprovedOct24Repost(c), true, c.store.slug);
  assert.equal(isApprovedPublicCouponPlacement(c), true, c.store.slug);
  assert.equal(isApprovedOct24Repost({ ...c, affiliate: { ...c.affiliate, link: "https://bad.example" } }), false);
}
assert.equal(isPausedPublisherStore("dodo-pizza"), true);
assert.equal(getCustomCoupons().some(c => c.store.slug === "dodo-pizza"), false);
console.log("PASS: 12 Perfluence repost placements and Dodo publisher pause");
