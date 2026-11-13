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
