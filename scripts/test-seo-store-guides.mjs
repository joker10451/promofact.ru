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
  "globus", "admitad-200746-matras-krovat", "internet-magazin-bilayn",
  "admitad-14113-tefal", "admitad-185231-maksavit", "polzaru",
  "admitad-21324-velodrive", "admitad-38329-pro32", "befree-ru",
  "tasty-coffee", "admitad-14032-street-beat", "admitad-13978-superstep",
];
assert.equal(priorities.length, 20, "Initial SEO store plan must cover all 20 canonical slugs");
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
const globusInput = {
  ...articleInput,
  name: "Globus", category: "Сервисы и подписки", categorySlug: "servisy-i-podpiski",
};
const globusParagraphs = buildStoreArticle(globusInput, "globus");
assert(globusParagraphs.includes(getStoreBuyerGuide("globus").intro),
  "Globus must not inherit the misleading subscription category in editorial content");
const pro32Input = { ...articleInput, name: "Pro32", category: "Сервисы и подписки", categorySlug: "servisy-i-podpiski" };
assert(buildStoreArticle(pro32Input, "admitad-38329-pro32")
  .includes(getStoreBuyerGuide("admitad-38329-pro32").intro),
  "Security software page must explain licenses instead of generic subscriptions");
assert(getStoreBuyerGuide("polzaru").checks.some(c => /противоречии рекламных цифр/.test(c.explanation)),
  "Do not promise potentially mismatched supplier discount figures");
console.log("Store SEO original buyer guides: 20 verified templates, canonical data and conditional rendering PASS");
