import assert from "node:assert/strict";
import { PERFLUENCE_OCT16_APPROVED_OFFERS, PERFLUENCE_OCT16_CODES } from "../src/lib/perfluenceOct16Offers.ts";
import { CUSTOM_COUPONS } from "../src/lib/customCoupons.ts";

console.log("--- Testing Oct 27 Security & Samokat Legal Disclaimers ---");

const letualCodes = PERFLUENCE_OCT16_CODES.letual;
assert.ok(letualCodes.includes("ШАНС"), "ЛЭТУАЛЬ must contain ШАНС");
assert.ok(!letualCodes.includes("УДАЧА"), "ЛЭТУАЛЬ must NOT contain УДАЧА");

const shansCoupon = PERFLUENCE_OCT16_APPROVED_OFFERS.find((c) => c.store.slug === "letual" && c.promocode.code === "ШАНС");
assert.ok(shansCoupon && shansCoupon.promocode.bonusName.includes("3 000 ₽"));

const samokatCoupons = CUSTOM_COUPONS.filter((c) => c.store.slug === "samokat");
assert.ok(samokatCoupons.length > 0, "Samokat custom Adjust coupon must exist");
for (const c of samokatCoupons) {
  assert.ok(c.affiliate.ordText.includes("31.12.2026"), "Samokat ordText must run through 31.12.2026");
}

console.log("ALL OCT 27 / SAMOKAT CHECKS PASSED");
