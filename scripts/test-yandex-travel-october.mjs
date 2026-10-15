import assert from "node:assert/strict";
import fs from "node:fs";
import { YANDEX_TRAVEL_ROTATED_OFFERS } from "../src/lib/perfluenceRotatedOffers.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { withoutForbiddenTravelCoPromotion } from "../src/lib/publisherPlacementRules.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";

const offers = YANDEX_TRAVEL_ROTATED_OFFERS;
const link = "https://travelyandex.prfl.me/sites/k9msuz?erid=2RanykJ47QF";
const marker = "2RanykJ47QF";
const wanted = ["PF-ALLIOOO-EGGTH", "BOLSHE", "SHARJAH26"];
assert.equal(offers.length, 3, "Perfluence page grants exactly three current site coupons");
assert.deepEqual(offers.map(c => c.promocode.code), wanted);
for (const c of offers) {
  assert.equal(c.store.slug, "yandeks-puteshestviya");
  assert.equal(c.affiliate.link, link);
  assert.equal(c.affiliate.landingLink, link);
  assert.equal(c.affiliate.ordMarker, marker);
  assert(c.affiliate.ordText.includes("ООО") && c.affiliate.ordText.includes("ЯНДЕКС.ВЕРТИКАЛИ") &&
    c.affiliate.ordText.includes("7704340327") && c.affiliate.ordText.includes("erid: " + marker));
  assert.equal(c.promocode.region, "RU");
  assert.equal(c.promocode.isBarcode, false);
}

const first = offers[0];
assert.equal(first.promocode.expires, "2026-10-16T10:59:00+03:00");
assert.equal(first.promocode.bonusName.includes("1 000 ₽"), true);
assert.equal(isCouponActive(first.promocode.expires,
  new Date("2026-10-16T10:58:59+03:00").getTime()), true);
assert.equal(isCouponActive(first.promocode.expires,
  new Date("2026-10-16T11:00:00+03:00").getTime()), false,
  "Promo with 10:59 Moscow expiry must not survive to evening October 16");
assert.equal(offers[1].promocode.expires, "2026-10-31T23:59:59+03:00");
assert(offers[1].promocode.bonusName.includes("5 000 ₽"));
assert.equal(offers[2].promocode.expires, "2026-10-31T23:59:59+03:00");
assert(!/(?:−|скидка)\s*\d+[%₽]/i.test(offers[2].promocode.bonusName),
  "Do not invent a percentage or RUB benefit for SHARJAH26");
assert(offers[2].promocode.terms.includes("Размер скидки или бонуса"));

// The old feed's PRE-rotation code must never survive despite old cache snapshots.
const old = { ...offers[0], promocode: { ...offers[0].promocode,
  id: 9988712, code: "PF-PREMIUMPRO-B66N2" }, id: 9988712 };
const deduped = dedupeCoupons([{ source: "custom", coupons: offers }, { source: "perfluence", coupons: [old] }]);
assert(deduped.coupons.some(c => c.promocode.code === old.promocode.code),
  "Deduping itself is not enough: a separate stale-code suppression is required");
const merged = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert(merged.includes('if (c.store.slug === "yandeks-puteshestviya")') &&
  merged.includes('"PF-ALLIOOO-EGGTH", "BOLSHE", "SHARJAH26"'),
  "Post-dedupe code must block the old partner placement");
const custom = fs.readFileSync("src/lib/customCoupons.ts", "utf8");
assert(custom.includes("...YANDEX_TRAVEL_ROTATED_OFFERS"),
  "Fresh approved publisher vouchers must be in live custom source");

const music = { ...offers[0], store: { ...offers[0].store, name: "МТС Музыка", slug: "mts-music" } };
assert.deepEqual(withoutForbiddenTravelCoPromotion([music, ...offers]).map(c => c.store.slug),
  ["mts-music"], "Yandex Travel must not be jointly advertised with MTS Music");
assert.equal(withoutForbiddenTravelCoPromotion(offers).length, 3,
  "When no forbidden partner is present, Travel offers remain available");
const homepage = fs.readFileSync("src/app/page.tsx", "utf8");
assert(homepage.includes("withoutForbiddenTravelCoPromotion(coupons)") &&
  homepage.includes("pickExpiringDeals(curatedCoupons") &&
  homepage.includes("featuredCoupons = curatedCoupons.filter"),
  "Curated homepage must enforce the partner co-publication rule");
console.log("YANDEX TRAVEL: new code, Moscow 10:59 expiry, separate links, old-code suppression and no MTS Music pairing PASS");
