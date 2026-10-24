import assert from "node:assert/strict";
import { isPublicAdmitadRow } from "../src/lib/admitadPublicVisibility.ts";
import { ARTICLES } from "../src/lib/articles.ts";
import { buildStoreDescription } from "../src/lib/storeSeoContent.ts";
import { formatPriorityStoreTitle } from "../src/lib/storeOfferHeadline.ts";

const randewoo = {
  is_active: true, sync_status: "PUBLISHABLE", legal_status: "PRESENT",
  erid_status: "PRESENT", source_campaign_id: "22484", store_slug: "randewoo",
  ord_marker: "2bL9aMPo2e49hMef4rqyKXgYCe",
  ord_text: "Реклама. ООО «Рандеву». erid: 2bL9aMPo2e49hMef4rqyKXgYCe",
  affiliate_link: "https://bywiola.com/g/zo4r4l1htlc7dde8999c0dd11956d5/?i=3&erid=2bL9aMPo2e49hMef4rqyKXgYCe",
  expires: "2027-02-11", terms: "Скидка 7% на заказы от 3 000 ₽",
};
assert.equal(isPublicAdmitadRow({...randewoo, source_coupon_id: "898761"}), true,
  "Approved Randewoo 7% coupon must remain visible");
assert.equal(isPublicAdmitadRow({...randewoo, source_coupon_id: "938879", expires: null,
  terms: "Начало учебного года. Aroma Box"}), false,
  "Undated September teachers' campaign must not be published in October");
assert.equal(isPublicAdmitadRow({...randewoo, store_slug: "another-store",
  source_campaign_id: "99999", source_coupon_id: "938879"}), true,
  "Stale-offer exclusion must not block unrelated merchants");

const article = ARTICLES.find(x => x.slug === "yandeks-puteshestviya-oteli-promokod");
assert.ok(article, "Historical SEO article must remain accessible");
assert.ok(article.title.includes("Яндекс Путешествия"));
assert.ok(article.body.join(" ").includes("ADM-PREMIUMPRO2O27"));
assert.ok(article.body.join(" ").includes("25 000 ₽"));
assert.ok(article.body.join(" ").includes("30 ноября 2026"));
assert.equal(article.ctaButton?.href, "/store/yandeks-puteshestviya#offers",
  "Evergreen article CTA must lead to verified offer cards, not obsolete affiliate attribution");
const renderedArticle = JSON.stringify(article);
for(const stale of ["PF-PREMIUMPRO-B66N2", "2RanynC1c4T", "sites/hmthkf"]) {
  assert.equal(renderedArticle.includes(stale), false, "Obsolete promotion reference: "+stale);
}

const input = (name, categorySlug) => ({
  name, category: "Продукты и напитки", categorySlug,
  coupons:[{code:"CODE123",bonusName:"Скидка по условиям предложения"}],
  couponCount:1,maxDiscount:null,isFirstOrder:false,activeBloggers:0,
  monthYear:"Октябрь 2026",monthRu:"октябрь 2026",todayRu:"25 октября 2026",
});
const coffee = buildStoreDescription(input("Tasty Coffee","produkty-i-napitki"));
assert.match(coffee,/кофе, чай/i);
assert.doesNotMatch(coffee,/маркетплейс|электроник/i);
const perfume = buildStoreDescription(input("Randewoo","kosmetika-i-parfyumeriya"));
assert.match(perfume,/парфюмерия и косметика/i);
const travel = buildStoreDescription(input("Яндекс Путешествия","puteshestviya-i-turizm"));
assert.match(travel,/даты проживания/i);

for(const [slug] of [["tasty-coffee"],["randewoo"],["yandeks-puteshestviya"]]) {
  assert.match(formatPriorityStoreTitle({slug,month:"октябрь 2026",codes:1,codeFree:1}),/^Промокоды /);
}
console.log("PASS: current SEO copy, stale Randewoo campaign blocked, Yandex Travel evergreen CTA");
