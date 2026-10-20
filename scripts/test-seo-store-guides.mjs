import assert from "node:assert/strict";
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));
const { STORE_BUYER_GUIDES, getStoreBuyerGuide } = await import("../src/lib/storeBuyerGuides.ts");
const { buildStoreArticle } = await import("../src/lib/storeSeoContent.ts");

const priorities = [
  "admitad-29791-hollyshop",
  "admitad-25914-yandex",
  "megafon", "korston", "sunlight-ru", "foxford", "aravia",
  "yandeks-puteshestviya",
];
assert.equal(Object.keys(STORE_BUYER_GUIDES).length, priorities.length);
for (const slug of priorities) {
  const guide = getStoreBuyerGuide(slug);
  assert(guide, "Missing editorial guide for " + slug);
  assert(guide.heading.length > 15);
  assert(guide.intro.length > 95, "Need original, useful copy for " + slug);
  assert.equal(guide.checks.length, 3);
  assert.equal(new Set(guide.checks.map(x => x.title)).size, 3);
  for (const { title, explanation } of guide.checks) {
    assert(title.length >= 8);
    assert(explanation.length >= 65, "Too short or generic: " + slug);
    assert(!/(гарантирован|проверен сегодня|точно работает|обязательно действует|\d+% скидк|\b[A-ZА-Я]{6}\d+\b)/iu.test(title+" "+explanation),
      "Unverified claims and artificial promo codes are forbidden: " + slug);
  }
}
assert.equal(getStoreBuyerGuide("unknown-store"), null);

const articleInput = {
  name: "Яндекс Практикум",
  category: "Маркетплейсы", categorySlug: "marketpleysy",
  about: null, conditions: null,
  coupons: [{ code: "CODETEST", bonusName: null, isBarcode: false }],
  couponCount: 1, maxDiscount: null, hasGiftOffer: false,
  isFirstOrder: false, activeBloggers: 0,
  monthYear: "Октябрь 2026", monthRu: "октябрь 2026", todayRu: "20 октября 2026",
};
const paragraphs = buildStoreArticle(articleInput, "admitad-25914-yandex");
assert(paragraphs.includes(getStoreBuyerGuide("admitad-25914-yandex").intro),
  "Education store must not inherit a misleading marketplace angle");
assert(!paragraphs.some(p => /электронику и товары для дома/i.test(p)),
  "Education store should not advertise electronics");

const page = fs.readFileSync("src/app/store/[slug]/page.tsx","utf8");
assert.match(page, /store\.coupons\.length > 0 \? getStoreBuyerGuide\(slug\) : null/);
assert.match(page, /buyerGuide\.checks\.map/);
assert.match(page, /aria-labelledby="store-buyer-guide"/);
assert.match(page, /StoreCouponBrowser/);
assert.match(page, /StoreSummaryTable/);
assert.match(page, /Проверяйте условия конкретного предложения перед оплатой/);
assert.doesNotMatch(page, /ymReachGoal\("affiliate_click"/,
  "Editorial guide must not generate false outbound click events");
console.log("Store SEO original buyer guides: 8 verified templates and visible conditional rendering PASS");
