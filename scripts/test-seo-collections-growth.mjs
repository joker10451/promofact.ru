import assert from "node:assert/strict";
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));
const { COLLECTIONS, getCollectionCoupons, MIN_INDEXABLE_COLLECTION_OFFERS } =
  await import("../src/lib/collections.ts");

assert.equal(MIN_INDEXABLE_COLLECTION_OFFERS, 3);
const priority = ["first-order", "food-delivery", "vecher-kino",
  "krasota-i-parfyum", "vygodnye-oteli"];
for (const slug of priority) {
  const col = COLLECTIONS.find(c => c.slug === slug);
  assert(col, "Missing established collection " + slug);
  assert.equal(col.buyerTips?.length, 3, "Three unique buyer checks for " + slug);
  assert.equal(new Set(col.buyerTips).size, 3, "No duplicate advice for " + slug);
  for (const tip of col.buyerTips) {
    assert(tip.length > 60, "Advice must offer practical detail");
    assert(!/гарантирован|проверен сегодня|скидка применится сразу/iu.test(tip),
      "Do not promise unverified merchant results");
  }
}

const coupon = (slug, name, cat, isFirstOrderOnly = false) => ({
  id: slug, store: { slug, name, categorySlug: cat },
  promocode: { code: "", isFirstOrderOnly, isUniversal: false, isHit: false },
});
const first = COLLECTIONS.find(c => c.slug === "first-order");
assert.equal(getCollectionCoupons(first, [
  coupon("yes", "Yes", "other", true),
  coupon("no", "No", "other", false),
]).length, 1);
const delivery = COLLECTIONS.find(c => c.slug === "food-delivery");
const clean = getCollectionCoupons(delivery, [
  coupon("pyaterochka", "Пятёрочка", "dostavka-produktov"),
  coupon("vkusvill-dostavka", "ВкусВилл Доставка", "dostavka-produktov"),
  coupon("farfor", "FARFOR", "dostavka-iz-restoranov"),
  coupon("tanukifamily", "Тануки", "dostavka-iz-restoranov"),
]);
assert.deepEqual(clean.map(c => c.store.slug), ["pyaterochka", "farfor"],
  "Sitemap and page must share co-promotion restrictions");

const page = fs.readFileSync("src/app/collections/[slug]/page.tsx", "utf8");
const sitemap = fs.readFileSync("src/app/sitemap.ts", "utf8");
assert.match(page, /export const revalidate = 900;/);
assert.match(sitemap, /export const revalidate = 900;/);
assert.match(page, /getCollectionCoupons\(col, all\)/);
assert.match(page, /robots: \{ index: count >= MIN_INDEXABLE_COLLECTION_OFFERS, follow: true \}/);
assert.match(sitemap, /getCollectionCoupons\(col, coupons\)\.length >= MIN_INDEXABLE_COLLECTION_OFFERS/);
assert.match(page, /col\.buyerTips\.map/);
assert.match(page, /href="\/catalog"/);
assert.doesNotMatch(page, /MONTH_YEAR|Обновляем ежедневно|Скидка применится сразу|availability: "https:\/\/schema.org\/InStock"/);
assert.equal((page.match(/<JsonLd data=\{listing\}/g) || []).length, 0,
  "Avoid duplicated JSON-LD ItemList in the page");
console.log("SEO collection growth: 5 buyer guides, dynamic ISR, coherent robots/sitemap and placement rules PASS");
