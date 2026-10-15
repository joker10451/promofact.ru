import assert from "node:assert/strict";
import fs from "node:fs";
import { YANDEX_TRAVEL_ROTATED_OFFERS } from "../src/lib/perfluenceRotatedOffers.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { withoutForbiddenTravelCoPromotion } from "../src/lib/publisherPlacementRules.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";

const offers = YANDEX_TRAVEL_ROTATED_OFFERS;
const link = "https://travelyandex.prfl.me/sites/k9msuz?erid=2RanykJ47QF";
const marker = "2RanykJ47QF";
const newLink = "https://yandextravel.prfl.me/sites/t21yi1?erid=2RanynSc5X1";
const newMarker = "2RanynSc5X1";
const wanted = ["PF-ALLIOOO-EGGTH", "BOLSHE", "SHARJAH26", "PF-PREMIUMPRO-B66N2"];
assert.equal(offers.length, 4, "Three existing coupons plus renewed 2,500 RUB voucher");
assert.deepEqual(offers.map(c => c.promocode.code), wanted);
for (const c of offers) {
  assert.equal(c.store.slug, "yandeks-puteshestviya");
  const approvedLink = c.promocode.code === "PF-PREMIUMPRO-B66N2" ? newLink : link;
  const approvedMarker = c.promocode.code === "PF-PREMIUMPRO-B66N2" ? newMarker : marker;
  assert.equal(c.affiliate.link, approvedLink);
  assert.equal(c.affiliate.landingLink, approvedLink);
  assert.equal(c.affiliate.ordMarker, approvedMarker);
  assert(c.affiliate.ordText.includes("ООО") && c.affiliate.ordText.includes("ЯНДЕКС.ВЕРТИКАЛИ") &&
    c.affiliate.ordText.includes("7704340327") && c.affiliate.ordText.includes("erid: " + approvedMarker));
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

// The old snapshot still has the SAME code under outdated affiliate details.
const renewed = offers[3];
assert.equal(renewed.promocode.expires, "2026-10-16T10:59:00+03:00");
assert(renewed.promocode.bonusName.includes("2 500 ₽"));
assert.equal(isCouponActive(renewed.promocode.expires, new Date("2026-10-16T10:58:59+03:00").getTime()), true);
assert.equal(isCouponActive(renewed.promocode.expires, new Date("2026-10-16T10:59:01+03:00").getTime()), false);
const old = { ...renewed, id: 9988712,
  promocode: { ...renewed.promocode, id: 9988712 },
  affiliate: { ...renewed.affiliate, link, landingLink: link, ordMarker: marker, ordText: "Реклама. erid: " + marker } };
const deduped = dedupeCoupons([{ source: "custom", coupons: offers }, { source: "perfluence", coupons: [old] }]);
assert.equal(deduped.coupons.filter(c => c.promocode.code === renewed.promocode.code).length, 1,
  "Approved custom version must win over stale affiliate snapshot");
assert.equal(deduped.coupons.find(c => c.promocode.code === renewed.promocode.code).affiliate.link, newLink);
const merged = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert(merged.includes('if (c.store.slug === "yandeks-puteshestviya")') &&
  merged.includes('code === "PF-PREMIUMPRO-B66N2"') &&
  merged.includes('c.affiliate.link === "' + newLink + '"') &&
  merged.includes('c.affiliate.ordMarker === "' + newMarker + '"'),
  "Previously banned code must be allowed only with current approved link and ERID");
const custom = fs.readFileSync("src/lib/customCoupons.ts", "utf8");
assert(custom.includes("...YANDEX_TRAVEL_ROTATED_OFFERS"),
  "Fresh approved publisher vouchers must be in live custom source");

const music = { ...offers[0], store: { ...offers[0].store, name: "МТС Музыка", slug: "mts-music" } };
assert.deepEqual(withoutForbiddenTravelCoPromotion([music, ...offers]).map(c => c.store.slug),
  ["mts-music"], "Yandex Travel must not be jointly advertised with MTS Music");
assert.equal(withoutForbiddenTravelCoPromotion(offers).length, 4,
  "When no forbidden partner is present, Travel offers remain available");
const homepage = fs.readFileSync("src/app/page.tsx", "utf8");
assert(homepage.includes("withoutForbiddenTravelCoPromotion(coupons)") &&
  homepage.includes("pickExpiringDeals(curatedCoupons") &&
  homepage.includes("featuredCoupons = curatedCoupons.filter"),
  "Curated homepage must enforce the partner co-publication rule");
console.log("YANDEX TRAVEL: renewed 2,500 RUB code, Moscow 10:59 expiry, separate links, stale snapshot suppression and MTS Music rule PASS");
