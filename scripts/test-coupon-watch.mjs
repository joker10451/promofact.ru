import assert from "node:assert/strict";
import fs from "node:fs";
import { inspectCoupons, compareInventories, checkSourceCompleteness, checkPerfluenceAuditProvenance, reconcileCrossSourceChanges } from "./coupon-watch-core.mjs";

function coupon(id, code, expires = "2026-10-31", options = {}) {
  const erid = options.erid || "2RanykEXAMPLE";
  return {
    id, store: { slug: options.slug || "store-a" },
    promocode: { id, code, bonusName: "Скидка по условиям акции", expires, isBarcode: Boolean(options.barcode) },
    affiliate: {
      link: options.link || "https://store.prfl.me/sites/abc123?erid=" + erid,
      ordMarker: options.marker === undefined ? erid : options.marker,
      ordText: options.text === undefined ? "Реклама. АО Тест. erid: " + erid : options.text,
    },
  };
}

const timestamp = new Date("2026-10-15T09:00:00+03:00").getTime();
const valid = coupon(1, "SAVE15");
const base = inspectCoupons([valid], "manual", timestamp);
assert.equal(base.activeCount, 1);
assert.equal(base.codeCount, 1);
assert.equal(base.findings.length, 0);
assert.equal(Object.keys(base.records).length, 1);

const placeholder = inspectCoupons([coupon(2, "НЕ НУЖЕН")], "admitad", timestamp);
assert.equal(placeholder.codeCount, 0);
assert.equal(placeholder.noCodeCount, 1);
assert.equal(placeholder.findings.length, 0);

const ended = inspectCoupons([coupon(3, "END", "2026-10-14")], "manual", timestamp);
assert.equal(ended.activeCount, 0);
assert.equal(ended.expiredCount, 1);
assert.equal(compareInventories(base, ended, timestamp).length, 1);

const actuallyExpired = inspectCoupons([coupon(1, "SAVE15", "2026-10-14")], "manual", timestamp);
const before = inspectCoupons([coupon(1, "SAVE15", "2026-10-14")], "manual",
  new Date("2026-10-14T12:00:00+03:00").getTime());
assert.equal(compareInventories(before, actuallyExpired, timestamp).length, 0,
  "Expiry is expected and must not trigger a false missing-coupon alert");

const next = inspectCoupons([coupon(1, "SAVE15", "2026-10-31", {
  link: "https://store.prfl.me/sites/new987?erid=2RanykEXAMPLE",
})], "manual", timestamp);
assert.deepEqual(compareInventories(base, next, timestamp).map(c => c.type), ["changed"]);

const wrongLink = inspectCoupons([coupon(1, "SAVE15", "2026-10-31", {
  link: "https://store.prfl.me/sites/abc123?erid=2RanykOTHER",
})], "manual", timestamp);
assert(wrongLink.findings.some(f => f.severity === "critical" && f.detail.includes("ссылке")));

const wrongText = inspectCoupons([coupon(1, "SAVE15", "2026-10-31", {
  text: "Реклама. erid: 2RanykOTHER",
})], "manual", timestamp);
assert(wrongText.findings.some(f => f.severity === "critical" && f.detail.includes("тексте")));

const noErid = inspectCoupons([coupon(1, "SAVE15", "2026-10-31", {
  link: "https://store.prfl.me/sites/abc123", marker: "", text: "Реклама. Токен erid пока не предоставлен",
})], "manual", timestamp);
assert(noErid.findings.some(f => f.severity === "critical"));

// Missing ERID for an alcohol advertiser is not a formatting outage;
// public promotion remains forbidden by the shared publication policy.
const winlab = coupon(5, "10PFNS5229", "2026-10-31", {
  link: "https://winelab.prfl.me/sites/gittf8", marker: "",
  text: "Реклама. АО ВИНЛАБ, 18+",
});
winlab.store.slug = "winlab";
const alcoholAudit = inspectCoupons([winlab], "manual", timestamp);
assert.equal(alcoholAudit.criticalTotal, 0, "Alcohol retailer's absent ERID is not a feed failure");
assert(alcoholAudit.findings.some(f => f.severity === "warning" && f.detail.includes("Алкогольная категория")),
  "Alcohol category still needs an explicit blocked-placement warning");
// No bypass for a spoofed WinLab slug pointing to a different host.
const spoofedAlcohol = { ...winlab, affiliate: { ...winlab.affiliate, link: "https://unknown.prfl.me/sites/gittf8" } };
assert(inspectCoupons([spoofedAlcohol], "manual", timestamp).criticalTotal > 0,
  "Unknown domains must not inherit the alcohol-category ERID exception");

const unsafe = inspectCoupons([coupon(1, "SAVE15", "2026-10-31", { link: "javascript:alert(1)" })],
  "manual", timestamp);
assert(unsafe.findings.some(f => f.detail.includes("HTTP")));

const duplicates = inspectCoupons([coupon(1, "SALE"), coupon(2, "sale", "2026-10-31", {
  link: "https://store.prfl.me/sites/other?erid=2RanykEXAMPLE",
})], "perfluence", timestamp);
assert(duplicates.findings.some(f => f.detail.includes("Одинаковый код")));

const expiring = inspectCoupons([coupon(1, "SAVE15", "2026-10-16")], "manual", timestamp);
assert.equal(expiring.expiring.length, 1);

const equal = inspectCoupons([valid], "manual", timestamp);
assert.equal(compareInventories(base, equal, timestamp).length, 0);
assert.equal(compareInventories({ records: {} }, equal, timestamp)[0].type, "new");


const fullRemote = inspectCoupons(Array.from({ length: 25 }, (_, i) => coupon(
  i + 100, "SALE" + (i + 100))), "perfluence", timestamp);
const partialRemote = inspectCoupons(Array.from({ length: 5 }, (_, i) => coupon(
  i + 100, "SALE" + (i + 100))), "perfluence", timestamp);
const drop = checkSourceCompleteness(fullRemote, partialRemote, "perfluence", timestamp);
assert.equal(drop.ok, false, "Major drop must be treated as an unreliable partner response");
assert.equal(drop.lost, 20);
assert(checkSourceCompleteness(fullRemote, fullRemote, "perfluence", timestamp).ok);
assert(checkSourceCompleteness(fullRemote, partialRemote, "manual", timestamp).ok,
  "Intentional manual removals are version-controlled and must not be marked as source outages");
const blankRemote = inspectCoupons([], "perfluence", timestamp);
assert.equal(checkSourceCompleteness(fullRemote, blankRemote, "perfluence", timestamp).ok, false,
  "An empty response must never purge the remote successful baseline");
const previouslyExpired = inspectCoupons(Array.from({ length: 20 }, (_, i) =>
  coupon(i + 200, "EXP" + i, "2026-10-14")).concat(
  Array.from({ length: 5 }, (_, i) => coupon(i + 300, "ACTIVE" + i))),
  "perfluence", new Date("2026-10-14T12:00:00+03:00").getTime());
const stillActive = inspectCoupons(Array.from({ length: 5 }, (_, i) =>
  coupon(i + 300, "ACTIVE" + i)), "perfluence", timestamp);
assert(checkSourceCompleteness(previouslyExpired, stillActive, "perfluence", timestamp).ok,
  "Planned expiration of old offers must not look like a partner data outage");

const workflow = fs.readFileSync(".github/workflows/daily-coupon-watch.yml", "utf8").replace(/\r\n/g, "\n");
assert(workflow.includes('cron: "10 5 * * *"'));
assert(workflow.includes("permissions:\n  contents: read\n  issues: write"));
assert(workflow.includes("actions/cache/restore@v4"));
assert(workflow.includes("actions/cache/save@v4"));
assert(workflow.includes("hashFiles('audit-results/coupon-watch-state.json')"),
  "Do not lose last successful source snapshot or failure counters when today reports an incident");
assert(!workflow.includes("git push") && !workflow.includes("vercel deploy"),
  "Daily read-only monitoring must never trigger a repo push or Vercel build");
console.log("COUPON-WATCH: expiry, attribution, changes, outages safety and daily workflow PASS");
