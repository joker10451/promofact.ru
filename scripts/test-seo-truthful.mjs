import assert from "node:assert/strict";
import fs from "node:fs";
import { getOfferSchema, getOfferDisplayName } from "../src/lib/seoOfferSchema.ts";

const url = "https://merchant.example/offer";
const deal = getOfferSchema("Магазин", url, { code: "НЕ НУЖЕН", bonusName: "Акция без кода" });
assert.equal(deal["@type"], "Offer");
assert.equal(deal.category, "Акция");
assert.equal(deal.url, url);
assert.ok(!("discountCode" in deal));
assert.ok(!("validThrough" in deal));
assert.ok(!("offers" in deal));
assert.equal(getOfferDisplayName("Магазин", { code: null }), "Акция Магазин");

const promo = getOfferSchema("Магазин", url, {
  code: "SAVE10", bonusName: null, expires: "2026-11-05",
});
assert.equal(promo["@type"], "Coupon");
assert.equal(promo.discountCode, "SAVE10");
assert.equal(promo.name, "Промокод SAVE10");
assert.equal(promo.validThrough, "2026-11-05");
assert.equal(promo.offers.priceValidUntil, "2026-11-05");
assert.equal(getOfferSchema("Магазин", url, { code: "NOT REQUIRED" })["@type"], "Offer");
assert.equal(getOfferSchema("Магазин", url, { code: "" })["@type"], "Offer");
const realLogo = "https://assets.example.com/merchant-logo.png";
const withLogo = getOfferSchema("Магазин", url, { code: "SAVE10" }, realLogo);
assert.deepEqual(withLogo.seller, { "@type": "Organization", name: "Магазин", logo: realLogo });
const withoutLogo = getOfferSchema("Магазин", url, { code: "SAVE10" });
assert.ok(!("logo" in withoutLogo.seller), "No invented logo on stores without trusted image");


const store = fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8");
assert.ok(store.includes("getOfferSchema(store.name"));
assert.ok(store.includes("c.promocode, store.logo"), "Existing store logo is passed to Offer/Coupon JSON-LD");
assert.ok(store.includes("...(store.site ? { url: store.site } : {})"), "Merchant schema URL must be the merchant's site, not our own store landing");
assert.ok(store.includes("...(store.logo ? { logo: store.logo } : {})"), "Merchant logo must use an existing source only");

assert.ok(store.includes("realCodeCount > 0 && <JsonLd data={howToJsonLd} />"));
assert.ok(store.includes("Как воспользоваться акцией"));
assert.ok(store.includes("getOfferDisplayName(store.name"));

const article = fs.readFileSync("src/app/sovety/[slug]/page.tsx", "utf8");
assert.ok(article.includes("article.image ? { image: new URL(article.image, SITE_URL).toString() }"));
assert.ok(article.includes("logo: {"));
assert.ok(article.includes("url: `${SITE_URL}/icon.png`"));
assert.ok(!article.includes("article.published ?? new Date().toISOString()"));
console.log("SEO truthful Offer/Article structured-data tests PASS");
