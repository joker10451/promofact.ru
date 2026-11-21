import assert from "node:assert/strict";
import { matchesCouponSearch } from "../src/lib/couponSearch.ts";
import { isReturningCustomerOffer } from "../src/lib/storeCouponAudience.ts";

const coupon = (name, slug, code = "SAVE500", bonusName = "Скидка 500 ₽") => ({
  store: { name, slug, category: "Красота" }, promocode: { code, bonusName },
});
const sunlight = coupon("SUNLIGHT", "sunlight-ru");
assert.equal(matchesCouponSearch(sunlight, "санлайт"), true);
assert.equal(matchesCouponSearch(sunlight, "cfykfqn"), true);
assert.equal(matchesCouponSearch(sunlight, "save500"), true);
assert.equal(matchesCouponSearch(sunlight, "500"), true);
assert.equal(matchesCouponSearch(sunlight, "красота"), true);
assert.equal(matchesCouponSearch(sunlight, "несуществующиймагазин"), false);
assert.equal(matchesCouponSearch(sunlight, " "), true);
assert.equal(matchesCouponSearch(coupon("Пятёрочка", "pyaterochka"), "пятерочка"), true);
assert.equal(matchesCouponSearch(coupon("ИВИ", "ivi"), "!!!"), false);
assert.equal(isReturningCustomerOffer({ isFirstOrderOnly: true }), false);
assert.equal(isReturningCustomerOffer({ isFirstOrderOnly: false, customerTypeLabel: "Для всех" }), true);
console.log("Shopping UX: aliases, wrong layout, codes, benefits, categories, returning-customer eligibility PASS");
