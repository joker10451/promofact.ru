import assert from "node:assert/strict";
import fs from "node:fs";

const { moscowDay, endsToday, selectTodayOffers, todayOfferCount, MIN_TODAY_OFFERS } = await import("../src/lib/todayOffers.ts");

// The date follows the Moscow calendar, not UTC.
const lateUtc = Date.parse("2026-11-10T22:30:00Z"); // 01:30 on 11 Nov in Moscow
assert.equal(moscowDay(lateUtc).iso, "2026-11-11");
assert.equal(moscowDay(lateUtc).label, "11 ноября 2026");
assert.equal(moscowDay(lateUtc).short, "11 ноября");
const noon = Date.parse("2026-11-10T09:00:00Z");
assert.equal(moscowDay(noon).iso, "2026-11-10");
assert.equal(moscowDay(noon).label, "10 ноября 2026");

const c = (id, store, code, expires) => ({ id, store: { slug: store, name: store }, promocode: { code, expires } });
// A plain date means "through the end of that day", Moscow time.
assert.equal(endsToday(c(1, "a", "X", "2026-11-10"), noon), true);
assert.equal(endsToday(c(1, "a", "X", "2026-11-11"), noon), false);
assert.equal(endsToday(c(1, "a", "X", "2026-11-10T23:59:59+03:00"), noon), true);
assert.equal(endsToday(c(1, "a", "X", null), noon), false, "No expiry never ends today");

const coupons = [
  c(1, "shop-a", "AAA", "2026-11-10"),       // ends today
  c(2, "shop-a", "AAB", "2026-12-01"),       // same store, later
  c(3, "shop-b", "", "2026-12-01"),          // code-free deal
  c(4, "shop-b", "BBB", "2026-12-01"),       // same store, has a code -> must win
  c(5, "shop-c", "CCC", "2026-11-09"),       // expired yesterday: never shown
  c(6, "shop-d", "DDD", null),               // no expiry
  c(7, "shop-e", "", "2026-12-05"),          // deal only
];
const t = selectTodayOffers(coupons, noon);
assert.deepEqual(t.endingToday.map((x) => x.id), [1], "Ending-today block holds the store's last-day offer");
assert.ok(!t.best.some((x) => x.store.slug === "shop-a"), "A store shown in the ending-today block is not repeated");
assert.equal(t.best.find((x) => x.store.slug === "shop-b").id, 4, "A code beats a code-free deal of the same store");
assert.ok(![...t.endingToday, ...t.best].some((x) => x.id === 5), "Expired offers are never listed");
assert.deepEqual(t.best.map((x) => x.id), [4, 6, 7], "Offers with codes first, then deals, ranking order kept");
assert.equal(t.activeCount, 6);
assert.equal(t.storeCount, 4, "Counts stores with a live offer; the expired-only store is excluded");
assert.equal(todayOfferCount(t), 4);
assert.equal(selectTodayOffers(coupons, noon, 2).best.length, 1, "The limit counts the ending-today block too");
assert.equal(MIN_TODAY_OFFERS, 3);

// The page, sitemap and links use the same rule and the same threshold.
const read = (p) => fs.readFileSync(p, "utf8");
const page = read("src/app/promokody/segodnya/page.tsx");
assert.match(page, /export const revalidate = 3600/);
assert.match(page, /robots: \{ index: n >= MIN_TODAY_OFFERS/, "Thin page must stay out of the index");
assert.match(page, /placement="today_coupon"/);
assert.doesNotMatch(page, /проверен[оы]? сегодня|работают гарантированно|100%/i, "No unverifiable claims");
assert.match(read("src/app/sitemap.ts"), /todayOfferCount\(selectTodayOffers\(coupons, Date\.now\(\)\)\) >= MIN_TODAY_OFFERS/);
assert.match(read("src/components/Footer.tsx"), /href="\/promokody\/segodnya"/, "Site-wide internal link");
assert.match(read("src/app/catalog/page.tsx"), /href="\/promokody\/segodnya"/);
assert.match(read("src/components/CouponTicket.tsx"), /case "today_coupon":\s*return "today"/);

console.log("Today's offers: Moscow date, ending-today block, one best offer per store, thin-page guard PASS");

// The legacy /promokody/:slug redirect must not swallow the daily page (it did, as a 404 on /store/segodnya).
const cfg = read("next.config.ts");
const legacyRule = cfg.match(/source: "\/promokody\/:slug(\([^"]*\))",/);
assert.ok(legacyRule, "Legacy /promokody/:slug redirect must carry an exclusion for the daily page");
const asRegex = new RegExp("^/promokody/" + legacyRule[1] + "$");
assert.equal(asRegex.test("/promokody/segodnya"), false, "/promokody/segodnya must not redirect");
assert.equal(asRegex.test("/promokody/ozon"), true, "Store slugs still redirect to /store/<slug>");
assert.equal(asRegex.test("/promokody/segodnya-x"), true, "Only the exact slug is excluded");
console.log("Legacy redirect excludes the daily page PASS");
