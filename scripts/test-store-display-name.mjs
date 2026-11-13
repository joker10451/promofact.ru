import assert from "node:assert/strict";

const { cleanStoreName, withoutLegacyTwins } = await import("../src/lib/storeDisplayName.ts");

assert.equal(cleanStoreName("Velodrive_RU"), "Velodrive");
assert.equal(cleanStoreName("Matras krovat RU"), "Matras krovat");
assert.equal(cleanStoreName("Matras krovat RU old"), "Matras krovat old");
assert.equal(cleanStoreName("Интернет-магазин «билайн»"), "Билайн");
// Реальные имена не ломаются.
for (const n of ["SUNLIGHT", "Яндекс Маркет", "Love Republic", "Золотое Яблоко", "Самокат", "Befree", "Aravia", "Яндекс Плюс", "Rusbase"]) {
  assert.equal(cleanStoreName(n), n);
}

const store = (slug, name, codes) => ({ slug, name, coupons: codes.map((code) => ({ promocode: { code } })) });
const live = store("admitad-162558-matras-krovat", "Matras krovat RU", ["A1"]);
const sameCodes = store("admitad-200746-matras-krovat", "Matras krovat RU old", ["A1"]);
const ownCode = store("admitad-200746-matras-krovat", "Matras krovat RU old", ["A1", "OLD2"]);
const plain = store("pyaterochka", "Пятёрочка", ["X"]);

assert.deepEqual(withoutLegacyTwins([live, sameCodes, plain]).map((s) => s.slug), [live.slug, "pyaterochka"]);
assert.equal(withoutLegacyTwins([live, ownCode]).length, 2, "legacy store with its own code stays listed");
assert.equal(withoutLegacyTwins([sameCodes]).length, 1, "no live twin: nothing hidden");
console.log("store display name: ok");

// По ревью: акции без кода тоже считаются своими офферами.
const deal = (bonusName) => ({ promocode: { code: "", bonusName } });
const liveDeals = { slug: "admitad-1-x", name: "Brand RU", coupons: [deal("Скидка 10%")] };
const oldSameDeal = { slug: "admitad-2-x", name: "Brand RU old", coupons: [deal("скидка 10%")] };
const oldOwnDeal = { slug: "admitad-2-x", name: "Brand RU old", coupons: [deal("Подарок к заказу")] };
const oldBlank = { slug: "admitad-2-x", name: "Brand RU old", coupons: [deal(null)] };
assert.equal(withoutLegacyTwins([liveDeals, oldSameDeal]).length, 1, "same code-free deal: hidden");
assert.equal(withoutLegacyTwins([liveDeals, oldOwnDeal]).length, 2, "own code-free deal: stays");
assert.equal(withoutLegacyTwins([liveDeals, oldBlank]).length, 2, "unidentifiable offer: stays");
// Подчёркивания в именах с пробелами не трогаем.
assert.equal(cleanStoreName("My_Brand Shop"), "My_Brand Shop");
console.log("store display name: review cases ok");
