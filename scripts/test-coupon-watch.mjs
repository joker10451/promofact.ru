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


const movedOld = inspectCoupons([coupon(10, "TRANSFER2026", "2026-10-31", { slug: "moved" })], "perfluence", timestamp);
const movedCurrent = inspectCoupons([], "perfluence", timestamp);
const movedManual = inspectCoupons([coupon(11, "TRANSFER2026", "2026-10-31", { slug: "moved" })], "manual", timestamp);
const movedChanges = compareInventories(movedOld, movedCurrent, timestamp);
const transfer = reconcileCrossSourceChanges(movedChanges, { perfluence: movedCurrent, manual: movedManual }, new Set(["perfluence", "manual"]));
assert.equal(transfer[0].type, "transferred", "Cross-source move must not be classified as disappearance");
assert.equal(reconcileCrossSourceChanges(movedChanges, { perfluence: movedCurrent, manual: movedManual }, new Set(["perfluence"]))[0].type, "removed",
  "A failed or skipped destination source must not disguise a real removal");
const notMoved = inspectCoupons([coupon(12, "DIFFERENT", "2026-10-31", { slug: "moved" })], "manual", timestamp);
assert.equal(reconcileCrossSourceChanges(movedChanges, { perfluence: movedCurrent, manual: notMoved }, new Set(["perfluence", "manual"]))[0].type, "removed");

const normalizedFromPartner = coupon(1001, "PARTNERERID");
normalizedFromPartner.affiliate.sourceLink = "https://store.prfl.me/sites/abc123?source=js-widget";
const tagged = inspectCoupons([normalizedFromPartner], "perfluence", timestamp);
assert.equal(tagged.criticalTotal, 0, "Sourced ERID should not be incorrectly marked as unknown");
assert.equal(tagged.findingsTotal, 1, "Original link gap must remain visible");
assert.match(tagged.findings[0].detail, /Исходная ссылка Perfluence без erid/);

const unknownSourceToken = coupon(1002, "UNKNOWNERID", "2026-10-31", {
  link: "https://store.prfl.me/sites/abc123", marker: "", text: "Реклама. ERID пока нет",
});
unknownSourceToken.affiliate.sourceLink = unknownSourceToken.affiliate.link;
const missingOriginal = inspectCoupons([unknownSourceToken], "perfluence", timestamp);
assert(missingOriginal.criticalTotal >= 1, "Completely unknown source token remains critical");

const suspiciousSource = coupon(1003, "SUSPICIOUS");
suspiciousSource.affiliate.sourceLink = "https://store.prfl.me/sites/abc123?erid=2RanyOTHER";
assert(inspectCoupons([suspiciousSource], "perfluence", timestamp)
  .findings.some((f) => f.severity === "critical" && f.detail.includes("исходной ссылки")),
  "Mismatched original token must be caught even when published URL is valid");

const lotsOfWarnings = Array.from({ length: 70 }, (_, i) => {
  const item = coupon(1100 + i, "NOISE" + i);
  item.affiliate.sourceLink = "https://store.prfl.me/sites/abc123";
  return item;
});
const priority = inspectCoupons([...lotsOfWarnings, unknownSourceToken], "perfluence", timestamp);
assert(priority.criticalTotal >= 1 && priority.findings.some((f) => f.severity === "critical"),
  "Warnings cannot push later critical offers beyond the report cap");
assert(priority.findingsTotal > priority.findings.length, "Reported totals must not be capped");

const oldState = inspectCoupons([coupon(1001, "PARTNERERID")], "perfluence", timestamp);
assert.equal(compareInventories(oldState, tagged, timestamp).length, 0,
  "Introducing sourceLink alone should not make existing offers appear changed");
const changedOriginal = coupon(1001, "PARTNERERID");
changedOriginal.affiliate.sourceLink = "https://store.prfl.me/sites/changed?source=js-widget";
const changed = inspectCoupons([changedOriginal], "perfluence", timestamp);
assert.equal(compareInventories(tagged, changed, timestamp)[0].type, "changed",
  "A later change of the source URL must be observable despite unchanged public link");

const provenanceTime = new Date("2026-10-20T12:00:00+03:00").getTime();
const provenanceCoupon = (id, expires = "2026-10-31") => {
  const entry = coupon(id, "SRC" + id, expires);
  entry.affiliate.sourceLink = "https://store.prfl.me/sites/abc123?source=js-widget";
  return entry;
};
const intact = [provenanceCoupon(1), provenanceCoupon(2), provenanceCoupon(3)];
assert.equal(checkPerfluenceAuditProvenance(intact, provenanceTime).ok, true);
const oldPublicSnapshot = intact.map(({ affiliate, ...rest }) => ({
  ...rest, affiliate: { ...affiliate, sourceLink: undefined },
}));
assert.equal(checkPerfluenceAuditProvenance(oldPublicSnapshot, provenanceTime).ok, false,
  "Sanitized fallback snapshots must not be accepted as a fresh raw feed");
const halfMissing = [
  intact[0], { ...intact[1], affiliate: { ...intact[1].affiliate, sourceLink: undefined } },
  { ...intact[2], affiliate: { ...intact[2].affiliate, sourceLink: undefined } },
];
const anomaly = checkPerfluenceAuditProvenance(halfMissing, provenanceTime);
assert.equal(anomaly.ok, false);
assert.equal(anomaly.missing, 2);
assert.match(anomaly.detail, /baseline сохранён/);
const oneMissing = [
  intact[0], intact[1],
  { ...intact[2], affiliate: { ...intact[2].affiliate, sourceLink: undefined } },
];
assert.equal(checkPerfluenceAuditProvenance(oneMissing, provenanceTime).ok, true,
  "Small gaps are diagnosed per offer without making the entire source unavailable");
const expiredMissing = provenanceCoupon(9, "2026-10-19");
delete expiredMissing.affiliate.sourceLink;
assert.equal(checkPerfluenceAuditProvenance([...intact, expiredMissing], provenanceTime).ok, true,
  "Expired records must not turn a healthy feed into an outage");

const workflow = fs.readFileSync(".github/workflows/daily-coupon-watch.yml", "utf8");
assert(workflow.includes('cron: "10 5 * * *"'));
assert(workflow.includes("permissions:\n  contents: read\n  issues: write"));
assert(workflow.includes("actions/cache/restore@v4"));
assert(workflow.includes("actions/cache/save@v4"));
assert(workflow.includes("hashFiles('audit-results/coupon-watch-state.json')"),
  "Do not lose last successful source snapshot or failure counters when today reports an incident");
assert(!workflow.includes("git push") && !workflow.includes("vercel deploy"),
  "Daily read-only monitoring must never trigger a repo push or Vercel build");
console.log("COUPON-WATCH: expiry, attribution, changes, outages safety and daily workflow PASS");
