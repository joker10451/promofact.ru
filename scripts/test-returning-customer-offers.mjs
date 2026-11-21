import assert from "node:assert/strict";
import { getCouponAudience, isReturningCustomerOffer } from "../src/lib/storeCouponAudience.ts";

assert.equal(isReturningCustomerOffer({ isFirstOrderOnly: true, customerTypeLabel: "Для всех" }), false);
assert.equal(isReturningCustomerOffer({ isFirstOrderOnly: false, customerTypeLabel: "Для всех" }), true);
assert.equal(isReturningCustomerOffer({ isFirstOrderOnly: false, customerTypeLabel: "На повторный заказ" }), true);
assert.equal(isReturningCustomerOffer({ isFirstOrderOnly: false }), false);
assert.equal(isReturningCustomerOffer({ isFirstOrderOnly: false, customerTypeLabel: "Условия уточняются" }), false);
assert.equal(getCouponAudience({ isFirstOrderOnly: false, customerTypeLabel: "Для всех" }), "universal");
console.log("Returning customer eligibility: PASS");
