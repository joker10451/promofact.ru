/**
 * Release regressions for visitor-visible expiry and analytics consent.
 * Static contract checks complement real Playwright flows and SSR build.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("./scripts/ts-loader.mjs", pathToFileURL("./"));
const { isCouponActive, expiryTimestamp } = await import("../src/lib/couponExpiry.ts");
const before = Date.parse("2026-10-18T23:59:59.999+03:00");
const after = before + 1;
assert.equal(expiryTimestamp("2026-10-18"), before);
assert.equal(isCouponActive("2026-10-18", before), true);
assert.equal(isCouponActive("2026-10-18", after), false);
assert.equal(isCouponActive("2026-10-20T00:59:00+03:00", Date.parse("2026-10-20T01:00:00+03:00")), false);

const read = (name) => fs.readFileSync(name, "utf8");
const clock = read("src/lib/useCouponClock.ts");
assert.match(clock, /setInterval\(update, 30_000\)/);
assert.match(clock, /visibilitychange/);
assert.match(clock, /window\.addEventListener\("focus", update\)/);
assert.match(clock, /useState<number \| null>\(null\)/);

for (const file of [
  "src/components/ExpiringDeals.tsx",
  "src/components/CouponGrid.tsx",
  "src/components/HomeOffersPreview.tsx",
]) {
  const s = read(file);
  assert.match(s, /useCouponClock\(\)/, file + ": visitor time must update after hydration");
  assert.match(s, /isCouponActive\(c\.promocode\.expires, (now|clientNow)\)/,
    file + ": an expired coupon must be removed from visible cards");
}
const urgent = read("src/components/ExpiringDeals.tsx");
assert.match(urgent, /visibleCoupons\.map/);
assert.match(urgent, /event\.preventDefault\(\)/);
assert.match(urgent, /!isCouponActive\(coupon\.promocode\.expires\)/);
assert.match(urgent, /copy\(coupon\.promocode\.code, coupon\.store\.name, coupon\.promocode\.expires\)/);
const grid = read("src/components/CouponGrid.tsx");
assert.match(grid, /currentCoupons\.length} предложений от {totalStoreCount}/);
assert.match(grid, /new Set\(currentCoupons\.map/);
assert.match(grid, /expiryTimestamp\(a\.promocode\.expires\)/);
const ticket = read("src/components/CouponTicket.tsx");
assert.match(ticket, /e\.preventDefault\(\);\s*setExpiredAttempt\(true\)/);
assert.match(ticket, /!isCouponActive\(promocode\.expires\)/);
assert.match(ticket, /Срок действия этого предложения истёк/);
const metrika = read("src/components/YandexMetrika.tsx");
assert.match(metrika, /getConsent\(\) === "declined"\) return;/);
const home = read("src/app/page.tsx");
assert.match(home, /<ExpiringDeals coupons={hotDeals}/);
assert.match(home, /<HomeOffersPreview coupons={featuredCoupons}/);
assert(!home.includes("<CouponGrid"), "Main page must keep compact real coupons and not reinstate a full grid");
console.log("PASS: cached offers disappear client-side, deadlines guard links/copy, analytics respect decline");
