import assert from "node:assert/strict";
const { buildStoreDescription } = await import("../src/lib/storeSeoContent.ts");

const base = { category: "Доставка из ресторанов", categorySlug: "dostavka-iz-restoranov", about: null, conditions: null,
  couponCount: 4, maxDiscount: "до 25%", hasGiftOffer: false, isFirstOrder: true, activeBloggers: 0,
  monthYear: "Ноябрь 2026", monthRu: "ноябрь 2026", todayRu: "12 ноября 2026" };
const long = buildStoreDescription({ ...base, name: "Додо Пицца",
  coupons: [{ code: "ABC12", bonusName: "Скидка 25% на первый заказ от 899 ₽ в приложении и на сайте Додо Пиццы при доставке", isBarcode: false }] });
assert.ok(long.length <= 160, "snippet must fit 160 characters");
assert.ok(long.includes("Скидка 25% на первый заказ"), "a long offer must be cut at a word, not dropped for a generic tail");
assert.ok(!long.includes("Актуально на"), "generic tail replaced by the concrete offer");

const short = buildStoreDescription({ ...base, name: "Магазин", coupons: [{ code: "XY", bonusName: "Скидка 10%", isBarcode: false }] });
assert.ok(short.length <= 160);
console.log("Store descriptions PASS");

// Code names are the words people search for; a long offer is cut at a word boundary, never mid-word.
const offer = "Скидка 25% на первый заказ от 899 ₽ в приложении и на сайте Додо Пиццы при доставке";
const withCodes = buildStoreDescription({ ...base, name: "Додо Пицца", coupons: [{ code: "ABC12", bonusName: offer, isBarcode: false }] });
assert.ok(withCodes.includes("Коды: ABC12."), "real code names are included");
const text = withCodes.slice(withCodes.indexOf("ABC12.") + 7).replace(/…$/, "");
assert.ok(offer.startsWith(text) && (offer[text.length] === " " || offer.length === text.length), "cut must land on a word boundary");
const letual = buildStoreDescription({ ...base, name: "ЛЭТУАЛЬ", couponCount: 3,
  coupons: ["НАБЕРИ", "ШАНС", "ПЯТНИЦА"].map((code) => ({ code, bonusName: `Промокод ${code} — скидка в ЛЭТУАЛЬ`, isBarcode: false })) });
assert.ok(letual.length <= 160 && letual.includes("НАБЕРИ") && letual.includes("ШАНС"));
console.log("Store descriptions (codes, word boundary) PASS");
