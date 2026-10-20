import assert from "node:assert/strict";
import fs from "node:fs";
import { isPublicPerfluenceWidgetCoupon } from "../src/lib/perfluenceAffiliateSafety.ts";

const approved = {
  affiliate: {
    link: "https://example.prfl.me/sites/abc123?erid=2RanyTESTabc",
    landingLink: "https://example.prfl.me/sites/abc123?erid=2RanyTESTabc",
    ordMarker: "2RanyTESTabc",
    ordText: "Реклама. ООО Тест. erid: 2RanyTESTabc",
  },
};
assert.equal(isPublicPerfluenceWidgetCoupon(approved), true);
assert.equal(isPublicPerfluenceWidgetCoupon({ affiliate: { ...approved.affiliate, ordText: "Реклама. ООО Тест." } }), true, "Server adds erid to Perfluence disclosure after import");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, link: "https://example.prfl.me/smart_zakupka/abc123?erid=2RanyTESTabc" },
}), true, "Channel origin is a separate placement-approval question, not a malformed link");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, link: "https://shop.example/", ordMarker: "" },
}), false, "Never allow a merchant-site fallback");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, link: "https://example.prfl.me/sites/abc123?erid=OTHER" },
}), false, "Mismatched erid must be hidden");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, link: "https://evilprfl.me/sites/abc123?erid=2RanyTESTabc" },
}), false, "Lookalike tracking domain must be rejected");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, link: "http://example.prfl.me/sites/abc123?erid=2RanyTESTabc" },
}), false);
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, ordText: "" },
}), false);


assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, ordText: "Реклама. ООО Тест. erid: 2RanyWRONGabc" },
}), false, "Text ERID must match link and ORD field");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, ordText: "Реклама. ООО Тест. erid пока не получен" },
}), false, "Placeholder ERID text is not a valid disclosure");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, link: "https://example.prfl.me/sites/abc123?erid=2RanyTESTabc&erid=2RanyTESTabc" },
}), false, "Duplicate ERID parameters must not pass");
assert.equal(isPublicPerfluenceWidgetCoupon({
  affiliate: { ...approved.affiliate, link: "https://example.prfl.me/sites/abc123", ordMarker: "2RanyTESTabc" },
}), false, "ORD marker alone cannot repair an unverified source URL");

const { parsePayload } = await import("../src/lib/perfluence.ts");
const sample = JSON.stringify({ data: [{
  project: { id: 1409, name: "ВинЛаб", site: "https://winlab.ru" },
  groups: [{
    landing: { link: "https://winlab.prfl.me/sites/test123?source=js-widget",
      ord_marker: "", ord_custom_text: "Реклама. ООО Тест. erid пока не получен" },
    promocodes: [{ id: 4737, code: "WCPFOKT4737", date: "2026-10-31" }],
  }],
}] });
const [winlab] = parsePayload(sample);
assert.equal(winlab.affiliate.link, "https://winlab.prfl.me/sites/test123",
  "An absent source ORD marker must never create a URL token");
assert.equal(isPublicPerfluenceWidgetCoupon(winlab), false,
  "Unknown WinLab ERID must remain quarantined");
assert.equal(winlab.affiliate.sourceLink,
  "https://winlab.prfl.me/sites/test123?source=js-widget",
  "Source URL must preserve the original WinLab link without ERID");

const feed = JSON.parse(fs.readFileSync("src/data/perfluence-feed.json", "utf8"));
const approvedSample = feed.data.find((item) => JSON.stringify(item).includes("PERPREGA309361"));
assert.ok(approvedSample);
const pregnancy = parsePayload(JSON.stringify({ data: [approvedSample] }))
  .find((c) => c.promocode.code === "PERPREGA309361");
assert.ok(pregnancy);
assert.equal(pregnancy.affiliate.link,
  "https://sberanalizy.prfl.me/sites/jhtq64?erid=2Ranym5xMV5",
  "A real Perfluence-supplied token may be appended to its tracking link");
assert.equal(isPublicPerfluenceWidgetCoupon(pregnancy), true,
  "Verified SberHealth code must not disappear from the catalog");
assert.equal(pregnancy.affiliate.sourceLink,
  "https://sberanalizy.prfl.me/sites/jhtq64?source=js-widget&source_id=8842",
  "Original Perfluence link must remain unchanged even after enrichment");

const fake = JSON.parse(JSON.stringify(approvedSample));
fake.groups[0].promocodes[0].ord_marker = "";
const missing = parsePayload(JSON.stringify({ data: [fake] }))[0];
assert.equal(new URL(missing.affiliate.link).searchParams.get("erid"), null);
assert.equal(isPublicPerfluenceWidgetCoupon(missing), false,
  "No marker in the source means no ERID in the published link");

const { inspectCoupons } = await import("./coupon-watch-core.mjs");
const timestamp = new Date("2026-10-20T12:00:00+03:00").getTime();
const pregnancyAudit = inspectCoupons([pregnancy], "perfluence", timestamp);
assert.equal(pregnancyAudit.criticalTotal, 0);
assert(pregnancyAudit.findings.some((f) => f.severity === "warning" &&
  f.detail.includes("Исходная ссылка Perfluence без erid")),
  "Audit must detect a missing ERID in the untouched source URL");
const winlabAudit = inspectCoupons([winlab], "perfluence", timestamp);
assert(winlabAudit.findings.some((f) => f.severity === "critical" &&
  f.detail.includes("без параметра erid")),
  "The unknown WinLab marker must still cause a critical incident");

const { getPerfluenceCoupons, getPerfluenceAuditCoupons, normalizeAffiliateLink } =
  await import("../src/lib/perfluence.ts");
const safeCoupon = (await getPerfluenceCoupons()).find((c) => c.promocode.code === "PERPREGA309361");
assert.ok(safeCoupon, "The accepted SberHealth coupon must remain publicly available");
assert.equal(safeCoupon.affiliate.sourceLink, undefined,
  "Original source-only URL must not be shipped in public catalog JSON");
const auditCoupon = (await getPerfluenceAuditCoupons()).find((c) => c.promocode.code === "PERPREGA309361");
assert.ok(auditCoupon?.affiliate.sourceLink, "Unfiltered audit feed retains provenance");
const malicious = "https://evilprfl.me/sites/fake?source=js-widget";
assert.equal(normalizeAffiliateLink(malicious, "2RanyTESTabc"), malicious,
  "Lookalike domain must never be decorated with a Perfluence ERID");


const { isApprovedPublicCouponPlacement } = await import("../src/lib/perfluence.ts");
const validWinLab = {
  ...winlab,
  affiliate: { ...winlab.affiliate,
    link: "https://winelab.prfl.me/sites/lnf1cg?erid=2RanyEXAMPLE",
    ordMarker: "2RanyEXAMPLE",
    ordText: "Реклама. ООО Тест. erid: 2RanyEXAMPLE" },
};
assert.equal(isPublicPerfluenceWidgetCoupon(validWinLab), true,
  "A syntactically valid ERID alone cannot certify a paused advertiser");
assert.equal(isApprovedPublicCouponPlacement(validWinLab), false,
  "WinLab must remain blocked even after a token is present in the Perfluence feed");
const oldIvi = { ...validWinLab, store: { ...validWinLab.store, slug: "ivi" },
  promocode: { ...validWinLab.promocode, code: "FILM35" } };
assert.equal(isApprovedPublicCouponPlacement(oldIvi), false,
  "Old IVI promo must not leak through public API");
const approvedIvi = { ...oldIvi, promocode: { ...oldIvi.promocode, code: "begrnta7swiz" } };
assert.equal(isApprovedPublicCouponPlacement(approvedIvi), true,
  "New approved IVI promo must pass the shared policy");
const wrongTanuki = { ...approvedIvi, store: { ...approvedIvi.store, slug: "tanukifamily" },
  promocode: { ...approvedIvi.promocode, code: "20FU1416" } };
assert.equal(isApprovedPublicCouponPlacement(wrongTanuki), false,
  "Tanuki must require exact approved affiliate link and ERID");
const publishedPerfluence = await getPerfluenceCoupons();
assert(publishedPerfluence.every(isApprovedPublicCouponPlacement),
  "No unapproved publisher may appear in the public snapshot");
assert(publishedPerfluence.every((c) => !c.affiliate.sourceLink),
  "Original audit-only tracking URLs must not leak into public API");

const source = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.match(source, /isPublicPerfluenceWidgetCoupon/);
assert.match(source, /b\.source === "perfluence"/);
assert.match(source, /\.filter\(isPublicPerfluenceWidgetCoupon\)/);
assert.match(source, /getPerfluenceAuditCoupons/);
assert.match(source, /sourceLink: rawLink/);
assert.match(source, /\.map\(withoutPerfluenceAuditMetadata\)/);
const publicRoute = fs.readFileSync("src/app/api/perfluence-snapshot/route.ts", "utf8");
assert.match(publicRoute, /getPerfluenceCoupons\(\)/);
const auditRoute = fs.readFileSync("src/app/api/perfluence-audit/route.ts", "utf8");
assert.match(auditRoute, /getPerfluenceAuditCoupons\(\)/);
const monitor = fs.readFileSync("scripts/daily-coupon-watch.mjs", "utf8");
assert.match(monitor, /\/api\/perfluence-audit/);
assert.doesNotMatch(monitor, /fetchJson\(SITE_URL \+ "\/api\/perfluence-snapshot"/);
console.log("PASS: Perfluence widget affiliate/erid/disclosure gate");
