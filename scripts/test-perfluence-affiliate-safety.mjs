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

const source = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.match(source, /isPublicPerfluenceWidgetCoupon/);
assert.match(source, /b\.source === "perfluence"/);
console.log("PASS: Perfluence widget affiliate/erid/disclosure gate");
