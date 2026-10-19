import assert from "node:assert";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { FOODBAND_OFFERS } = await import("@/lib/foodbandOffers");
const { STABLE_STORES } = await import("@/lib/stableStores");
const { BRAND_CATEGORY } = await import("@/lib/categoryTaxonomy");
const { getStoreExtra } = await import("@/lib/storeExtras");
const { isCouponActive, expiryTimestamp } = await import("@/lib/couponExpiry");
const { getCustomCoupons } = await import("@/lib/customCoupons");

console.log("================================================================================");
console.log("🚀 ЗАПУСК ТЕСТОВ ОФФЕРОВ FOODBAND И МЕХАНИЗМА АВТОМАТИЧЕСКОГО СНЯТИЯ (P3.0)");
console.log("================================================================================\n");

// 1. Проверка состава офферов
assert.strictEqual(FOODBAND_OFFERS.length, 10, "Должно быть ровно 10 офферов Foodband");
console.log(`✓ 1. Успешно загружено 10 офферов Foodband`);

// 2. Проверка каждого оффера
const expectedCodes = [
  "admikgpromofact",
  "admirollpromofact",
  "admi_rollpromofact",
  "admitad_filapromofact",
  "admi35promofact",
  "admi_pep_promofact",
  "admitadanisa",
  "admi_fila_promofact",
  "YOURDAY",
  "admi_margo_promofact",
];

const seenIds = new Set();
const seenCodes = new Set();

for (let i = 0; i < FOODBAND_OFFERS.length; i++) {
  const c = FOODBAND_OFFERS[i];
  assert.ok(c.id > 0, `ID оффера #${i + 1} должен быть положительным числом`);
  assert.ok(!seenIds.has(c.id), `ID оффера #${c.id} не должен дублироваться`);
  seenIds.add(c.id);

  assert.strictEqual(c.store.slug, "foodband", `slug магазина должен быть foodband`);
  assert.strictEqual(c.promocode.code, expectedCodes[i], `Промокод #${i + 1} должен соответствовать спецификации: ${expectedCodes[i]}`);
  seenCodes.add(c.promocode.code);

  assert.ok(c.affiliate.link.startsWith("https://kdbov.com/coupon/"), `Партнёрская ссылка должна вести на kdbov.com`);
  assert.ok(c.affiliate.ordMarker, `Маркер ОРД (erid) должен быть указан`);
  assert.ok(c.affiliate.ordText.includes(c.affiliate.ordMarker), `Маркировка ordText должна содержать erid`);
  assert.ok(c.promocode.bonusName.length > 5, `Название бонуса должно быть содержательным`);
  assert.ok(c.promocode.terms.length > 10, `Условия должны быть подробно описаны`);
}
console.log(`✓ 2. Все 10 промокодов, ссылок и маркировок ERID валидны и уникальны`);

// 3. Проверка метаданных магазина в реестре STABLE_STORES и таксономии
assert.ok(STABLE_STORES["foodband"], "Foodband должен присутствовать в STABLE_STORES");
assert.strictEqual(STABLE_STORES["foodband"].categorySlug, "dostavka-iz-restoranov", "Категория должна быть 'Доставка из ресторанов'");
assert.strictEqual(BRAND_CATEGORY["foodband"], "dostavka-iz-restoranov", "BRAND_CATEGORY['foodband'] должен быть 'dostavka-iz-restoranov'");
assert.ok(getStoreExtra("foodband"), "StoreExtra для foodband должен быть настроен");
console.log(`✓ 3. Магазин Foodband зарегистрирован в STABLE_STORES, таксономии и StoreExtras`);

// 4. ТЕСТИРОВАНИЕ АВТОМАТИЧЕСКОГО СНЯТИЯ ПРИ ИСТЕЧЕНИИ СРОКА

// Момент сейчас (19 октября 2026): все 10 купонов активны
const nowOct19 = new Date("2026-10-19T18:00:00+03:00").getTime();
const activeOct19 = FOODBAND_OFFERS.filter(c => isCouponActive(c.promocode.expires, nowOct19));
assert.strictEqual(activeOct19.length, 10, "19 октября все 10 купонов Foodband должны быть активны");
console.log(`✓ 4.1. 19 октября 2026: активны все 10 купонов`);

// Момент 31 октября 2026 23:59:59 MSK: все 10 купонов ещё активны
const nowOct31 = new Date("2026-10-31T23:59:59+03:00").getTime();
const activeOct31 = FOODBAND_OFFERS.filter(c => isCouponActive(c.promocode.expires, nowOct31));
assert.strictEqual(activeOct31.length, 10, "31 октября 23:59:59 все 10 купонов Foodband должны быть активны");
console.log(`✓ 4.2. 31 октября 2026 23:59:59 MSK: активны все 10 купонов`);

// Момент 1 ноября 2026 00:00:01 MSK: 9 октябрьских купонов автоматически сняты!
const nowNov1 = new Date("2026-11-01T00:00:01+03:00").getTime();
const activeNov1 = FOODBAND_OFFERS.filter(c => isCouponActive(c.promocode.expires, nowNov1));
assert.strictEqual(activeNov1.length, 1, "1 ноября должен остаться только 1 долгосрочный купон (YOURDAY)");
assert.strictEqual(activeNov1[0].promocode.code, "YOURDAY", "Оставшийся купон должен быть YOURDAY");
console.log(`✓ 4.3. 1 ноября 2026 00:00:01 MSK: 9 купонов автоматически скрыты, остался только YOURDAY (PASS)`);

// Проверка интеграции с getCustomCoupons(now)
const customNov1 = getCustomCoupons(nowNov1).filter(c => c.store.slug === "foodband");
assert.strictEqual(customNov1.length, 1, "getCustomCoupons(nowNov1) должен возвращать только активный купон YOURDAY");
assert.strictEqual(customNov1[0].promocode.code, "YOURDAY");
console.log(`✓ 4.4. getCustomCoupons(nowNov1) автоматически отсекает истёкшие купоны на уровне источника`);

// Момент 1 января 2027 00:00:01 MSK: истекает и YOURDAY
const nowJan2027 = new Date("2027-01-01T00:00:01+03:00").getTime();
const customJan2027 = getCustomCoupons(nowJan2027).filter(c => c.store.slug === "foodband");
assert.strictEqual(customJan2027.length, 0, "1 января 2027 все купоны Foodband должны быть сняты");
console.log(`✓ 4.5. 1 января 2027 00:00:01 MSK: сняты абсолютно все купоны (PASS)`);

console.log("\n================================================================================");
console.log("🎉 ВСЕ ТЕСТЫ FOODBAND И СИСТЕМЫ ЭКСПИРАЦИИ УСПЕШНО ПРОЙДЕНЫ!");
console.log("================================================================================");
