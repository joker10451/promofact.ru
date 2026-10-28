import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { PERFLUENCE_OCT28_PLACEMENTS, PERFLUENCE_OCT28_OFFERS, isApprovedOct28PublisherPlacement } =
  await import("../src/lib/perfluenceOct28Website.ts");
const { CUSTOM_COUPONS } = await import("../src/lib/customCoupons.ts");
const { isApprovedPublicCouponPlacement } = await import("../src/lib/perfluence.ts");
const { isCouponActive } = await import("../src/lib/couponExpiry.ts");

const expected = [
  ["yandex-plus", "FYBSF2X94G", "https://yaplus45.prfl.me/sites/e6efea?erid=2RanymRXMTZ", "2026-12-31T23:59:59+03:00"],
  ["ostrovok", "PF4ALL80", "https://ostrovok.prfl.me/sites/w6t56h?erid=2RanymjKCqh", "2026-11-30T23:59:59+03:00"],
  ["rutube", "", "https://rutube1years.prfl.me/sites/a8svoz?erid=2Ranymuh7p7", null],
  ["rutube", "kv7qjypp", "https://rutube.prfl.me/sites/wtd3o5?erid=2RanymtD8Xm", "2026-10-31T23:59:59+03:00"],
  ["rutube", "fe5t74q6", "https://rutube.prfl.me/sites/st0g64?erid=2Ranymrj9FR", "2026-10-31T23:59:59+03:00"],
  ["rutube", "wpcvmer8", "https://rutube.prfl.me/sites/i0xxxi?erid=2RanymqF9y5", "2026-10-31T23:59:59+03:00"],
  ["rutube", "", "https://rutube.prfl.me/sites/v3rj1c?erid=2RanymomAgj", null],
];
assert.equal(PERFLUENCE_OCT28_PLACEMENTS.length, 7);
assert.equal(PERFLUENCE_OCT28_OFFERS.length, 7);
const allIds = new Set(PERFLUENCE_OCT28_OFFERS.map(c=>c.id));
assert.equal(allIds.size, 7, "each offer must have a distinct ID");
for (const [slug, code, link, expiry] of expected) {
  const offer = PERFLUENCE_OCT28_OFFERS.find(c=>c.store.slug===slug && c.affiliate.link===link);
  assert.ok(offer, link);
  assert.equal(offer.promocode.code, code);
  assert.equal(offer.promocode.expires, expiry);
  const erid = new URL(link).searchParams.get("erid");
  assert.equal(offer.affiliate.ordMarker, erid);
  assert.equal(offer.affiliate.landingLink, link);
  assert.ok(offer.affiliate.ordText.includes("Реклама."));
  assert.ok(offer.affiliate.ordText.includes("erid: " + erid));
  assert.ok(CUSTOM_COUPONS.some(c=>c.id===offer.id));
  assert.equal(isApprovedOct28PublisherPlacement(offer), true);
  assert.equal(isApprovedPublicCouponPlacement(offer), true);
  for (const mutation of [
    {...offer, affiliate:{...offer.affiliate, link:link.replace("/sites/","/sites/old-")}},
    {...offer, affiliate:{...offer.affiliate, ordMarker:"2RanyWrong"}},
    {...offer, promocode:{...offer.promocode, code:"OLD_CODE"}},
  ]) {
    assert.equal(isApprovedOct28PublisherPlacement(mutation), false, "stale data must be blocked");
    assert.equal(isApprovedPublicCouponPlacement(mutation), false, "catalog must fail closed");
  }
  if (expiry === "2026-10-31T23:59:59+03:00") {
    assert.equal(isCouponActive(expiry, Date.parse("2026-10-31T23:59:59+03:00")), true);
    assert.equal(isCouponActive(expiry, Date.parse("2026-11-01T00:00:00+03:00")), false);
  }
}
assert.equal(PERFLUENCE_OCT28_OFFERS.filter(c=>c.store.slug==="rutube").length, 5);
assert.equal(isApprovedOct28PublisherPlacement(PERFLUENCE_OCT28_OFFERS[0] &&
 {...PERFLUENCE_OCT28_OFFERS[0], promocode:{...PERFLUENCE_OCT28_OFFERS[0].promocode, group:"admitad"}}), true);
console.log("PERFLUENCE OCT 28: 7 refreshed links, distinct codes/ERIDs, dates, fail-closed historical data PASS");
