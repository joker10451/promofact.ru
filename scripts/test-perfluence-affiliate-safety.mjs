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

const fake = JSON.parse(JSON.stringify(approvedSample));
fake.groups[0].promocodes[0].ord_marker = "";
const missing = parsePayload(JSON.stringify({ data: [fake] }))[0];
assert.equal(new URL(missing.affiliate.link).searchParams.get("erid"), null);
assert.equal(isPublicPerfluenceWidgetCoupon(missing), false,
  "No marker in the source means no ERID in the published link");

const source = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.match(source, /isPublicPerfluenceWidgetCoupon/);
assert.match(source, /b\.source === "perfluence"/);
assert.match(source, /\.filter\(isPublicPerfluenceWidgetCoupon\)/);
assert.match(source, /getPerfluenceAuditCoupons/);
const publicRoute = fs.readFileSync("src/app/api/perfluence-snapshot/route.ts", "utf8");
assert.match(publicRoute, /getPerfluenceCoupons\(\)/);
const auditRoute = fs.readFileSync("src/app/api/perfluence-audit/route.ts", "utf8");
assert.match(auditRoute, /getPerfluenceAuditCoupons\(\)/);
const monitor = fs.readFileSync("scripts/daily-coupon-watch.mjs", "utf8");
assert.match(monitor, /\/api\/perfluence-audit/);
assert.doesNotMatch(monitor, /fetchJson\(SITE_URL \+ "\/api\/perfluence-snapshot"/);
console.log("PASS: Perfluence widget affiliate/erid/disclosure gate");
