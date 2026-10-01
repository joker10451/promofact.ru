/**
 * scripts/test-coupon-expiry.mjs
 * Unit- и регрессионные тесты для src/lib/couponExpiry.ts (P2.5)
 */

import assert from "node:assert";
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { expiryTimestamp, isCouponActive } = await import("@/lib/couponExpiry");
const { isoDate, normalizeAffiliateLink } = await import("@/lib/perfluence");

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

// 6. Regression test project 112 (Делимобиль): точное время 00:59 MSK vs 23:59 MSK
const delimobilRaw = {
  promos: [
    { code: "h49fcs", date: "31.10.2026 00:59" },
    { code: "nxr645", date: "31.10.2026 23:59" },
  ],
};

const parsedPromos = delimobilRaw.promos.map((p) => ({
  code: p.code,
  expires: isoDate(p.date),
}));

assert.strictEqual(parsedPromos.length, 2, "Парсер должен сохранить ОБА coupon");
assert.strictEqual(parsedPromos[0].expires, "2026-10-31T00:59:00+03:00", "h49fcs должен иметь точный ISO datetime с таймзоной +03:00");
assert.strictEqual(parsedPromos[1].expires, "2026-10-31T23:59:00+03:00", "nxr645 должен иметь точный ISO datetime с таймзоной +03:00");

// Момент времени: 31 октября 2026 00:58:00 MSK (за минуту до 00:59)
const timeBefore0059 = new Date("2026-10-31T00:58:00+03:00").getTime();
assert.strictEqual(isCouponActive(parsedPromos[0].expires, timeBefore0059), true, "Перед 00:59 h49fcs должен быть active");
assert.strictEqual(isCouponActive(parsedPromos[1].expires, timeBefore0059), true, "Перед 00:59 nxr645 должен быть active");

// Момент времени: 31 октября 2026 01:00:00 MSK (через минуту после 00:59)
const timeAfter0059 = new Date("2026-10-31T01:00:00+03:00").getTime();
assert.strictEqual(isCouponActive(parsedPromos[0].expires, timeAfter0059), false, "После 00:59 h49fcs обязан стать inactive");
assert.strictEqual(isCouponActive(parsedPromos[1].expires, timeAfter0059), true, "После 00:59 nxr645 всё ещё active до 23:59");

// Момент времени: 1 ноября 2026 00:01:00 MSK
const timeAfter2359 = new Date("2026-11-01T00:01:00+03:00").getTime();
assert.strictEqual(isCouponActive(parsedPromos[1].expires, timeAfter2359), false, "После 23:59 nxr645 обязан стать inactive");
console.log("✓ 6. Регрессионный тест Project 112 (Делимобиль): точный datetime 00:59 MSK и 23:59 MSK (PASS)");

// 7. Live dynamic data > stale supplemental/bundled data (Link and ERID update + normalizeAffiliateLink Safety)
const oldLink = "https://delimobil.prfl.me/sites/0q95fq?source=js-widget&source_id=8842";
const oldErid = "2RanynunP9u";

const newLink = "https://delimobil.prfl.me/sites/dux1e5?source=js-widget&source_id=8842";
const newErid = "2RanymwUCq1";

const normalizedNewLink = normalizeAffiliateLink(newLink, newErid);
assert.strictEqual(
  normalizedNewLink,
  "https://delimobil.prfl.me/sites/dux1e5?erid=2RanymwUCq1",
  "Новая ссылка подписчика с актуальным erid должна формироваться без старых параметров виджета"
);
assert.ok(!normalizedNewLink.includes("0q95fq"), "Новая ссылка не должна содержать старый slug 0q95fq");
assert.ok(!normalizedNewLink.includes(oldErid), "Новая ссылка не должна содержать старый erid");

// Безопасность normalizeAffiliateLink: НЕ модифицировать сторонние / прямые URL параметром erid
const directExternalUrl = "https://example.com/promo-landing?tag=special";
assert.strictEqual(
  normalizeAffiliateLink(directExternalUrl, newErid),
  directExternalUrl,
  "Сторонний/прямой URL не должен модифицироваться параметром erid"
);
console.log("✓ 7. Регрессионный тест обновления link/erid и безопасности normalizeAffiliateLink (PASS)");

// 8. Тест generic publication enrichment & semantic freshness invariant (Пункт 5)
const {
  enrichWithPublicationDetails,
  createLiveSnapshot,
  assertSemanticFreshness,
} = await import("./sync-catalog.mjs");

// Сценарий А: Live Widget (date-only) + Publication Details (точный datetime)
const mockLiveWidget = [
  {
    project: { id: 112, name: "Делимобиль" },
    groups: [
      {
        promocodes: [
          { code: "h49fcs", date: "31.10.2026" },
          { code: "nxr645", date: "31.10.2026" },
        ],
        links_for_subscribers: [{ link: newLink }],
        ord_marker: newErid,
      },
    ],
  },
];

const mockPubDetails = new Map([
  [
    112,
    {
      promos: new Map([
        ["h49fcs", "31.10.2026 00:59"],
        ["nxr645", "31.10.2026 23:59"],
      ]),
      links: [normalizedNewLink],
      erids: [newErid],
    },
  ],
]);

enrichWithPublicationDetails(mockLiveWidget, mockPubDetails);
assert.strictEqual(
  mockLiveWidget[0].groups[0].promocodes[0].date,
  "31.10.2026 00:59",
  "h49fcs должен быть обогащен точным временем 00:59"
);
assert.strictEqual(
  mockLiveWidget[0].groups[0].promocodes[1].date,
  "31.10.2026 23:59",
  "nxr645 должен быть обогащен точным временем 23:59"
);
assert.strictEqual(
  isoDate(mockLiveWidget[0].groups[0].promocodes[0].date),
  "2026-10-31T00:59:00+03:00",
  "isoDate обязан преобразовать обогащенный h49fcs в полный ISO datetime с таймзоной +03:00"
);

// Сценарий Б: Тест БЕЗ publication detail (fallback)
const mockWidgetWithoutPub = [
  {
    project: { id: 812, name: "PREMIER" },
    groups: [
      {
        promocodes: [{ code: "wtuynkrk", date: "31.10.2026" }],
        links_for_subscribers: [{ link: "https://premier.prfl.me/sites/xlwp23" }],
      },
    ],
  },
];
enrichWithPublicationDetails(mockWidgetWithoutPub, null);
assert.strictEqual(
  mockWidgetWithoutPub[0].groups[0].promocodes[0].date,
  "31.10.2026",
  "Без publication detail дата должна оставаться date-only (время НЕ выдумывается)"
);
assert.strictEqual(
  isoDate(mockWidgetWithoutPub[0].groups[0].promocodes[0].date),
  "2026-10-31",
  "isoDate для date-only возвращает чистый YYYY-MM-DD"
);

// Сценарий В: Тест инварианта assertSemanticFreshness
const liveSnap = createLiveSnapshot(mockLiveWidget);
assert.doesNotThrow(() => {
  assertSemanticFreshness(mockLiveWidget, liveSnap);
}, "Семантический инвариант должен успешно проходить при неизменных live-данных");

// Проверяем, что попытка подмешать устаревший промокод или удалить live промокод вызывает исключение
const corruptedProjects = JSON.parse(JSON.stringify(mockLiveWidget));
corruptedProjects[0].groups[0].promocodes.pop(); // удалили nxr645
assert.throws(
  () => {
    assertSemanticFreshness(corruptedProjects, liveSnap);
  },
  /Semantic Freshness Violation/,
  "Удаление live промокода обязано приводить к Semantic Freshness Violation"
);
console.log("✓ 8. Generic publication enrichment & semantic freshness invariant tests (PASS)");

// 9. Статический аудит безопасности и структуры workflow sync-catalog.yml (Пункт 4)
const workflowContent = fs.readFileSync(".github/workflows/sync-catalog.yml", "utf-8");

assert.ok(
  workflowContent.includes("PERFLUENCE_SESSION_B64: ${{ secrets.PERFLUENCE_SESSION_B64 }}"),
  "sync-catalog.yml обязан ссылаться на secrets.PERFLUENCE_SESSION_B64"
);
assert.ok(
  workflowContent.includes("data/perfluence_session.json"),
  "sync-catalog.yml обязан создавать data/perfluence_session.json"
);
assert.ok(
  workflowContent.includes("rm -f data/perfluence_session.json"),
  "sync-catalog.yml обязан безопасно удалять data/perfluence_session.json"
);
assert.ok(
  workflowContent.includes("if: always()"),
  "sync-catalog.yml обязан выполнять cleanup сессии с условием if: always()"
);
assert.ok(
  !workflowContent.includes("echo ${{ secrets.PERFLUENCE_SESSION_B64 }}"),
  "Запрещен прямой вывод секрета в echo"
);
console.log("✓ 9. Статический аудит безопасности и структуры sync-catalog.yml (PASS)");

console.log("\n🎉 ВСЕ ТЕСТЫ EXPIRY УСПЕШНО ПРОЙДЕНЫ!");
