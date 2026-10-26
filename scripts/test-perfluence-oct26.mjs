import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { PERFLUENCE_OCT26_WEBSITE_OFFERS, isApprovedOct26WebsitePlacement } =
  await import("../src/lib/perfluenceOct26Website.ts");
const { CUSTOM_COUPONS } = await import("../src/lib/customCoupons.ts");
const { isApprovedPublicCouponPlacement } = await import("../src/lib/perfluence.ts");
const { withoutForbiddenFloristBeautyCoPromotion } =
  await import("../src/lib/publisherPlacementRules.ts");

assert.equal(PERFLUENCE_OCT26_WEBSITE_OFFERS.length, 2);
const expected = [
  ["elementaree", "leam99", "https://elementareenw.prfl.me/sites/0jjvbb?erid=2RanykAqc3u", "2RanykAqc3u"],
  ["carte-blanche", "SZHM93427848", "https://carteblanche.prfl.me/sites/2phyrv?erid=2RanykJFYTd", "2RanykJFYTd"],
];
for (const [slug, code, link, erid] of expected) {
  const approved = PERFLUENCE_OCT26_WEBSITE_OFFERS.find(c => c.store.slug === slug);
  assert.ok(approved, slug);
  assert.equal(approved.promocode.code, code);
  assert.equal(approved.affiliate.link, link);
  assert.equal(approved.affiliate.landingLink, link);
  assert.equal(approved.affiliate.ordMarker, erid);
  assert.ok(approved.affiliate.ordText.includes("erid: " + erid));
  assert.equal(approved.promocode.expires, "2026-12-31T23:59:59+03:00");
  assert.ok(CUSTOM_COUPONS.some(c => c.store.slug === slug && c.affiliate.link === link));
  assert.equal(isApprovedOct26WebsitePlacement(approved), true);
  assert.equal(isApprovedPublicCouponPlacement(approved), true);
  const stale = {
    ...approved,
    affiliate: { ...approved.affiliate, link: link.replace("/sites/", "/sites/old-") },
  };
  assert.equal(isApprovedOct26WebsitePlacement(stale), false, "stale widget URL must be blocked");
  assert.equal(isApprovedPublicCouponPlacement(stale), false, "merged catalog must block wrong URL");
}

const carte = PERFLUENCE_OCT26_WEBSITE_OFFERS[1];
const cozy = { ...carte, store: { ...carte.store, slug: "cozy-home" } };
const noCoPromotion = withoutForbiddenFloristBeautyCoPromotion([carte, cozy]);
assert.deepEqual(noCoPromotion.map(c => c.store.slug), ["cozy-home"]);
assert.deepEqual(withoutForbiddenFloristBeautyCoPromotion([carte]).map(c => c.store.slug), ["carte-blanche"]);

console.log("PERFLUENCE OCT 26: approved website URLs, ERIDs, coupon terms, and Cozy Home restriction PASS");
