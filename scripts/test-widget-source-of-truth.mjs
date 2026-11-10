import assert from "node:assert/strict";
import fs from "node:fs";

const { isPublishableWidgetOffer } = await import("../src/lib/perfluence.ts");

const offer = (slug, affiliate = {}) => ({
  store: { slug },
  promocode: { code: "NEWCODE1" },
  affiliate: {
    link: "https://magnit.prfl.me/sites/abc123?erid=2RanyNewErid",
    landingLink: "https://magnit.prfl.me/sites/abc123?erid=2RanyNewErid",
    ordMarker: "2RanyNewErid",
    ordText: "Реклама. АО «Тандер», ИНН 2310031475. erid: 2RanyNewErid",
    ...affiliate,
  },
});

// A renewed widget code for a store with dated allowlists publishes by itself.
assert.equal(isPublishableWidgetOffer(offer("magnit-dostavka")), true);
assert.equal(isPublishableWidgetOffer(offer("perekrestok-dostavka")), true);
// Marking must still be complete and consistent.
assert.equal(isPublishableWidgetOffer(offer("magnit-dostavka", { ordMarker: "" })), false);
assert.equal(isPublishableWidgetOffer(offer("magnit-dostavka", { ordText: "erid: 2RanyNewErid" })), false);
assert.equal(isPublishableWidgetOffer(offer("magnit-dostavka", {
  link: "https://magnit.prfl.me/sites/abc123?erid=2RanyOtherErid" })), false);
assert.equal(isPublishableWidgetOffer(offer("magnit-dostavka", {
  link: "https://evil.example/sites/abc123?erid=2RanyNewErid" })), false);
// Hard bans survive the widget-as-source policy.
assert.equal(isPublishableWidgetOffer(offer("winlab")), false, "Alcohol advertising stays blocked");
assert.equal(isPublishableWidgetOffer(offer("flor2u")), false, "Placement under review stays blocked");

const source = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.match(source, /viaWidgetRule\(c\)\s*\?\s*isPublishableWidgetOffer\(c\)/,
  "Combined catalog must route widget offers through the widget rule");
assert.match(source, /return withoutPausedPublisherOffers\(coupons\)/,
  "Paused publisher stores must still be removed before publication");

console.log("Widget source of truth: verified widget offers publish, bans and pauses hold PASS");

// Regulated advertisers never take the automatic widget path.
const { isRegulatedAdvertiser, isMedicalAdvertiser, meetsMandatoryDisclaimers } = await import("../src/lib/regulatedAds.ts");
for (const slug of ["sberzdorovie", "sberbank", "otp-bank", "rosgosstrakh", "admitad-188182-tbank", "polzaru", "plati-po-miru"]) {
  assert.equal(isRegulatedAdvertiser(slug), true, slug + " is regulated");
  assert.equal(isPublishableWidgetOffer(offer(slug)), false, slug + " must not auto-publish from the widget");
}
for (const slug of ["magnit-dostavka", "hotpot-city", "pyaterochka", "farfor"]) {
  assert.equal(isRegulatedAdvertiser(slug), false, slug + " is not regulated (whole segments only)");
}
assert.equal(isMedicalAdvertiser("sberzdorovie"), true);
assert.equal(isMedicalAdvertiser("sberbank"), false);

// A medical ad without its mandatory warning is never shown, on any path.
const med = (ordText) => ({ store: { slug: "sberzdorovie" }, affiliate: { ordText } });
assert.equal(meetsMandatoryDisclaimers(med("Реклама. ООО «Инновационная медицина» erid: 2RanymXDs23")), false);
assert.equal(meetsMandatoryDisclaimers(med("Реклама. erid: 2RanymVjsjh. ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ, НЕОБХОДИМА КОНСУЛЬТАЦИЯ СПЕЦИАЛИСТА")), true);
assert.equal(meetsMandatoryDisclaimers({ store: { slug: "farfor" }, affiliate: { ordText: "Реклама. erid: 2Ranyxxxxx" } }), true);

const src2 = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.match(src2, /viaWidgetRule\(c\)\s*\?\s*isPublishableWidgetOffer\(c\)/, "Combined catalog routes regulated advertisers away from the widget rule");
assert.match(src2, /\.filter\(meetsMandatoryDisclaimers\)/, "Mandatory disclaimers are enforced after every approval path");
console.log("Regulated advertisers: widget rule excluded, medical warning enforced PASS");
