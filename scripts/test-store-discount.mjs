import assert from "node:assert/strict";
import fs from "node:fs";

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
const actualAdmitadGift = [
  {
    promocode: {
      bonusName: "При заказе от 1 999 ₽",
      terms: "Подарок на выбор при заказе от 1999 рублей",
    },
  },
];
assert.equal(hasGiftOffer(actualAdmitadGift), true, "Gift in partner terms must be visible to SEO");
assert.equal(getMaxVerifiedDiscount(actualAdmitadGift), null, "Order minimum must not become a saving");
assert.equal(hasGiftOffer(coupons("При заказе от 1 999 ₽")), false, "No unsupported gift inference");

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

const categorySource = fs.readFileSync("src/app/category/[slug]/page.tsx", "utf8");
const relatedStoreSource = fs.readFileSync("src/components/OtherStores.tsx", "utf8");
assert.match(categorySource, /getMaxVerifiedDiscount\(list\)/);
assert.match(relatedStoreSource, /getMaxVerifiedDiscount\(store\.coupons\)/);
assert.doesNotMatch(categorySource, /до −30%/, "Never invent 30% discount for empty/offer-only categories");
assert.doesNotMatch(relatedStoreSource, /function getStoreMaxDiscount/, "Do not fork discount parsing");
console.log("✓ Store discount: gift minimum is not savings; real %/RUB discounts and SEO texts PASS");

