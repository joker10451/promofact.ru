import assert from "node:assert/strict";

const { getMaxVerifiedDiscount, hasGiftOffer } = await import("../src/lib/storeDiscount.ts");
const { buildStoreDescription, buildStoreArticle } = await import("../src/lib/storeSeoContent.ts");

const coupons = (...titles) => titles.map((bonusName) => ({ promocode: { bonusName } }));

const gifts = coupons(
  "Подарок к заказу при заказе от 1 999 ₽",
  "Подарок к заказу при заказе от 2 219 ₽",
  "Подарок к заказу при заказе от 2 449 ₽",
);
assert.equal(getMaxVerifiedDiscount(gifts), null, "Order minimum must not become savings");
assert.equal(hasGiftOffer(gifts), true);
assert.equal(getMaxVerifiedDiscount(coupons("Подарок 500 ₽ при заказе от 2 449 ₽")), null);
assert.equal(getMaxVerifiedDiscount(coupons("Акция при заказе от 2 449 ₽")), null);
assert.equal(getMaxVerifiedDiscount(coupons("Кэшбэк 10%")), null);

assert.equal(getMaxVerifiedDiscount(coupons("Скидка 500 ₽ при заказе от 1 999 ₽")), "до 500 ₽");
assert.equal(getMaxVerifiedDiscount(coupons("500 ₽ скидка при заказе от 1 999 ₽")), "до 500 ₽");
assert.equal(getMaxVerifiedDiscount(coupons("При заказе от 1 999 ₽ скидка 500 ₽")), "до 500 ₽");
assert.equal(getMaxVerifiedDiscount(coupons("−15% при заказе от 2 449 ₽")), "до 15%");
assert.equal(getMaxVerifiedDiscount(coupons("Скидка 15% при заказе от 2 449 ₽")), "до 15%");
assert.equal(getMaxVerifiedDiscount(coupons("Скидка до 20%")), "до 20%");
assert.equal(getMaxVerifiedDiscount(coupons("Подарок к заказу", "Скидка 10%")), "до 10%");

const seoInput = {
  name: "Pizza Sushi Wok",
  category: "Доставка из ресторанов",
  categorySlug: "dostavka-iz-restoranov",
  coupons: gifts.map(({ promocode }, i) => ({
    code: ["WW-82894", "RR-75195", "ZZ-83424"][i],
    bonusName: promocode.bonusName,
  })),
  couponCount: 3,
  maxDiscount: getMaxVerifiedDiscount(gifts),
  hasGiftOffer: hasGiftOffer(gifts),
  isFirstOrder: false,
  activeBloggers: 0,
  monthYear: "Октябрь 2026",
  monthRu: "октябрь 2026",
  todayRu: "12 октября 2026",
};
const desc = buildStoreDescription(seoInput);
const article = buildStoreArticle(seoInput, "pizzasushiwok").join(" ");
assert.match(desc, /подарки к заказу/i);
assert.doesNotMatch(desc, /скидка\s+до\s+2\s*449|скидка\s+до\s+1\s*999/i);
assert.match(article, /подарки к заказу/i);
assert.doesNotMatch(article, /скидка.*(?:2\s*449|1\s*999)/i);
assert.doesNotMatch(article, /уменьшает стоимость заказа|экономит на доставке/i);

const realDiscountDescription = buildStoreDescription({
  ...seoInput,
  maxDiscount: "до 500 ₽",
  hasGiftOffer: false,
  coupons: [{ code: "SAVE500", bonusName: "Скидка 500 ₽ при заказе от 1 999 ₽" }],
  couponCount: 1,
});
assert.match(realDiscountDescription, /скидка до 500 ₽/i);

console.log("✓ Store discount: gift minimum is not savings; real %/RUB discounts and SEO texts PASS");
