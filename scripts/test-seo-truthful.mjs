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


const stableRegistry = fs.readFileSync("src/lib/stableStores.ts", "utf8");
for (const slug of ["askona", "polzaru"]) {
  assert.ok(stableRegistry.includes(`"${slug}": {`), `${slug}: stable legacy destination exists`);
}
for (const originalWebsite of ["https://www.askona.ru/", "https://polza.ru/"]) {
  assert.ok(stableRegistry.includes(`site: "${originalWebsite}"`), "Uses verified official merchant destination");
}
assert.ok(!stableRegistry.includes('code: "ASKONA"'), "Do not fabricate an Askona promo code");
assert.ok(store.includes("index: n > 0"), "Never index a store without live offers");
assert.ok(store.includes("Подтверждённых промокодов для {store.name} пока нет"), "Empty-state text must be truthful");
assert.ok(!store.includes("в магазине действуют сезонные скидки"), "Do not imply unverified promotions exist");

const article = fs.readFileSync("src/app/sovety/[slug]/page.tsx", "utf8");
assert.ok(article.includes("article.image ? { image: new URL(article.image, SITE_URL).toString() }"));
assert.ok(article.includes("logo: {"));
assert.ok(article.includes("url: `${SITE_URL}/icon.png`"));
assert.ok(!article.includes("article.published ?? new Date().toISOString()"));

const faqContent = fs.readFileSync("src/lib/faqContent.ts", "utf8");
const howItWorks = fs.readFileSync("src/components/HowItWorks.tsx", "utf8");
const seoHelp = fs.readFileSync("src/components/SeoArticle.tsx", "utf8");
for (const [name, content] of [["FAQ",faqContent],["HowItWorks",howItWorks],["SeoArticle",seoHelp]]) {
  for (const unsupported of ["Скидка применится сразу","получи скидку мгновенно","почему они реально работают","Мы решили это","не передаём данные третьим лицам","добавляем новые купоны в день запуска"]) {
    assert.ok(!content.includes(unsupported), name+": remove unverified promise "+unsupported);
  }
}
assert.match(faqContent, /Admitad и Perfluence/);
assert.match(faqContent, /согласия/);
assert.match(faqContent, /итоговую сумму перед оплатой/);
assert.match(howItWorks, /проверь итоговую сумму/);
assert.match(seoHelp, /не подтверждает, что промокод подойдёт/);
const guidePage = fs.readFileSync("src/app/guide/page.tsx", "utf8");
assert.match(guidePage, /FAQ_ITEMS\.map/);
assert.match(guidePage, /<Faq \/>/);
console.log("Help and FAQ honest affiliate claims + shared structured answers PASS");

console.log("SEO truthful Offer/Article structured-data tests PASS");
