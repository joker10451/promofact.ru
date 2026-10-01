/**
 * scripts/test-coupon-expiry.mjs
 * Unit- и регрессионные тесты для src/lib/couponExpiry.ts (P2.5)
 */

import assert from "node:assert";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { expiryTimestamp, isCouponActive } = await import("@/lib/couponExpiry");

console.log("================================================================================");
console.log("🚀 ЗАПУСК ТЕСТОВ МОДУЛЯ ВАЛИДАЦИИ СРОКОВ КУПОНОВ (src/lib/couponExpiry.ts)");
console.log("================================================================================\n");

// 1. null / undefined / пустая строка -> бессрочные акции
assert.strictEqual(expiryTimestamp(null), Infinity, "null должен возвращать Infinity");
assert.strictEqual(expiryTimestamp(undefined), Infinity, "undefined должен возвращать Infinity");
assert.strictEqual(expiryTimestamp(""), Infinity, "пустая строка должна возвращать Infinity");
assert.strictEqual(expiryTimestamp("   "), Infinity, "строка из пробелов должна возвращать Infinity");
assert.strictEqual(isCouponActive(null), true, "null купон всегда активен");
assert.strictEqual(isCouponActive(""), true, "купон без даты всегда активен");
console.log("✓ 1. Бессрочные купоны (null/empty) -> Infinity и всегда активны (PASS)");

// 2. Некорректные даты -> inactive
assert.ok(Number.isNaN(expiryTimestamp("invalid-date")), "некорректная дата возвращает NaN");
assert.strictEqual(isCouponActive("invalid-date"), false, "некорректная дата не активна");
console.log("✓ 2. Некорректные даты -> inactive (PASS)");

// 3. Граница 30 сентября 2026 -> 1 октября 2026 по Москве (UTC+03:00)
// 2026-09-30 означает 2026-09-30T23:59:59.999+03:00 = 2026-09-30T20:59:59.999Z
const dateStr = "2026-09-30";
const ts30Sep = expiryTimestamp(dateStr);
const expectedTs = new Date("2026-09-30T23:59:59.999+03:00").getTime();
assert.strictEqual(ts30Sep, expectedTs, "date-only 2026-09-30 должен давать 23:59:59.999+03:00");

// Момент 30 сентября 23:59:59.000 MSK (активен)
const tActive = new Date("2026-09-30T23:59:59.000+03:00").getTime();
assert.strictEqual(isCouponActive(dateStr, tActive), true, "30 сен 23:59:59 MSK купон ДОЛЖЕН быть активен");

// Момент 1 октября 00:00:00.000 MSK (истёк)
const tExpired = new Date("2026-10-01T00:00:00.000+03:00").getTime();
assert.strictEqual(isCouponActive(dateStr, tExpired), false, "1 окт 00:00:00 MSK купон НЕ должен быть активен");
console.log("✓ 3. Чёткая граница 30 сентября 23:59:59 MSK vs 1 октября 00:00:00 MSK (PASS)");

// 4. Полные ISO даты с явной таймзоной (Z или offset)
const isoZ = "2026-10-15T12:00:00Z";
assert.strictEqual(expiryTimestamp(isoZ), new Date("2026-10-15T12:00:00Z").getTime());
assert.strictEqual(isCouponActive(isoZ, new Date("2026-10-15T11:59:59Z").getTime()), true);
assert.strictEqual(isCouponActive(isoZ, new Date("2026-10-15T12:00:01Z").getTime()), false);
console.log("✓ 4. ISO формат с явной таймзоной обрабатывается корректно (PASS)");

// 5. Тест фильтрации cached coupons без изменения кэша
const mockCachedCoupons = [
  { id: 1, promocode: { expires: "2026-09-30" } },
  { id: 2, promocode: { expires: "2026-10-15" } },
  { id: 3, promocode: { expires: null } },
];

const nowAtSep30 = new Date("2026-09-30T12:00:00+03:00").getTime();
const activeAtSep30 = mockCachedCoupons.filter((c) => isCouponActive(c.promocode.expires, nowAtSep30));
assert.strictEqual(activeAtSep30.length, 3, "30 сентября должны быть активны все 3 купона");

const nowAtOct01 = new Date("2026-10-01T12:00:00+03:00").getTime();
const activeAtOct01 = mockCachedCoupons.filter((c) => isCouponActive(c.promocode.expires, nowAtOct01));
assert.strictEqual(activeAtOct01.length, 2, "1 октября купон 2026-09-30 должен отсеяться (осталось 2)");
assert.ok(!activeAtOct01.some((c) => c.id === 1), "Купон id:1 не должен входить в активный список");
console.log("✓ 5. Фильтрация кешированного каталога на лету по текущему моменту (PASS)");

console.log("\n🎉 ВСЕ ТЕСТЫ EXPIRY УСПЕШНО ПРОЙДЕНЫ!");
