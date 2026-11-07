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
assert.match(source, /widgetCoupons\.has\(c\)\s*\?\s*isPublishableWidgetOffer\(c\)/,
  "Combined catalog must route widget offers through the widget rule");
assert.match(source, /return withoutPausedPublisherOffers\(coupons\)/,
  "Paused publisher stores must still be removed before publication");

console.log("Widget source of truth: verified widget offers publish, bans and pauses hold PASS");
