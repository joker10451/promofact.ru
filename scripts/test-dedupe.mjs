import assert from "node:assert/strict";
import { dedupeCoupons, isRealPromoCode, normalizeCode } from "../src/lib/dedupe.ts";

// Minimal fixtures preserve real Coupon fields used by dedupe. No external
// source feeds or production database are needed for these safety tests.
const coupon = (id, slug, code, link = `https://affiliate.example/click/${id}?erid=MARKER_${id}`, extra = {}) => ({
  id,
  store: {
    id, slug, name: slug, site: `https://${slug}.example`,
    logo: null, category: "Прочее", categorySlug: "drugoe",
    about: null, conditions: null, activeBloggers: 0,
  },
  promocode: {
    id, code, bonusName: `Offer ${id}`, terms: null, expires: "2026-12-31",
    isHit: false, isUniversal: true, isFirstOrderOnly: false,
    customerTypeLabel: "Для всех", region: "RU", isBarcode: false,
    barcodeImage: null, group: "test",
    ...extra,
  },
  affiliate: {
    link, landingLink: link, ordMarker: `MARKER_${id}`,
    ordText: `Реклама. erid: MARKER_${id}`,
  },
  extraLinks: [],
});
const bucket = (source, ...coupons) => ({ source, coupons });

// A generic code published manually for one retailer must NOT erase another
// retailer's genuine offer with the same value.
const manualA = coupon(1, "store-a", "SALE10");
const perfluenceB = coupon(2, "store-b", "SALE10");
const admitadC = coupon(3, "store-c", " sale10 ");
const collision = dedupeCoupons([
  bucket("admitad", admitadC),
  bucket("perfluence", perfluenceB),
  bucket("custom", manualA),
]);
assert.deepEqual(collision.coupons.map((c) => c.id), [1, 2, 3]);
assert.deepEqual(collision.stats, {
  total: 3, kept: 3, dropped: 0, droppedBySource: {},
});

// Same shop and code (case/whitespace insensitive): retain the highest
// priority source, with its own affiliate tracking and legal disclosure.
const supaSame = coupon(4, "store-a", "sale10");
const perfluenceSame = coupon(5, "store-a", " SALE10 ");
const admitadSame = coupon(6, "store-a", "SALE10");
const sameShop = dedupeCoupons([
  bucket("admitad", admitadSame),
  bucket("perfluence", perfluenceSame),
  bucket("supabase", supaSame),
  bucket("custom", manualA),
]);
assert.deepEqual(sameShop.coupons.map((c) => c.id), [1]);
assert.deepEqual(sameShop.stats.droppedBySource, {
  supabase: 1, perfluence: 1, admitad: 1,
});
assert.strictEqual(sameShop.coupons[0], manualA);
assert.equal(sameShop.coupons[0].affiliate.link, manualA.affiliate.link);
assert.equal(sameShop.coupons[0].affiliate.ordMarker, manualA.affiliate.ordMarker);
assert.equal(sameShop.coupons[0].affiliate.ordText, manualA.affiliate.ordText);

// If there is no manual offer, Perfluence outranks Admitad for same store/code.
const noManual = dedupeCoupons([
  bucket("admitad", admitadSame),
  bucket("perfluence", perfluenceSame),
]);
assert.deepEqual(noManual.coupons.map((c) => c.id), [5]);
assert.strictEqual(noManual.coupons[0], perfluenceSame);

// Duplicate buckets from the same source retain first arrival, not both.
const repeated = dedupeCoupons([
  bucket("admitad", admitadSame),
  bucket("admitad", coupon(9, "store-a", "sale10")),
]);
assert.deepEqual(repeated.coupons.map((c) => c.id), [6]);

// No-code offers are NOT combined just because their code marker is equal;
// distinct affiliate links, IDs and creative ERIDs must remain intact.
const linkA = coupon(10, "store-a", "NO_CODE");
const linkB = coupon(11, "store-a", "БЕЗ ПРОМОКОДА");
const linkC = coupon(12, "store-a", "НЕ НУЖЕН");
const noCode = dedupeCoupons([
  bucket("custom", linkA),
  bucket("perfluence", linkB),
  bucket("admitad", linkC),
]);
assert.deepEqual(noCode.coupons.map((c) => c.id), [10, 11, 12]);
assert(noCode.coupons.every((c) => c.affiliate.ordText.includes(c.affiliate.ordMarker)));
assert.strictEqual(isRealPromoCode("NO_CODE"), false);
assert.strictEqual(isRealPromoCode("NOT REQUIRE"), false);
assert.strictEqual(isRealPromoCode(" НЕ НУЖЕН "), false);
assert.strictEqual(isRealPromoCode("SALE10"), true);
assert.strictEqual(normalizeCode(" sale10 "), "SALE10");

// Same actual no-code offer must collapse when tracking URL, ID and title match.
const linkDuplicate = structuredClone(linkA);
const exactNoCode = dedupeCoupons([
  bucket("custom", linkA),
  bucket("perfluence", linkDuplicate),
]);
assert.deepEqual(exactNoCode.coupons.map((c) => c.id), [10]);
assert.equal(exactNoCode.stats.dropped, 1);

console.log("DEDUPE-1: merchant-scoped codes, source priority, ERID preservation, no-code offers PASS");
