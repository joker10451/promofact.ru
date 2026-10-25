import assert from "node:assert/strict";
import { isPublicAdmitadRow } from "../src/lib/admitadPublicVisibility.ts";
import { ARTICLES } from "../src/lib/articles.ts";
import { buildStoreDescription } from "../src/lib/storeSeoContent.ts";
import { formatPriorityStoreTitle } from "../src/lib/storeOfferHeadline.ts";
import { isApprovedPublicCouponPlacement } from "../src/lib/perfluence.ts";
import { YANDEX_TRAVEL_ROTATED_OFFERS } from "../src/lib/perfluenceRotatedOffers.ts";

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

// Статья про Яндекс Путешествия гашена как тонкая (215 слов) — теперь это
// транзакционная страница магазина. Проверяем, что обновлённый CTA и очистка
// от устаревших офферов живут на ней, а не в статье.
const article = ARTICLES.find(x => x.slug === "ekonomim-na-puteshestviyah-i-biletah");
assert.ok(article, "Travel economics article must remain accessible");
const renderedTravel = JSON.stringify(article);
assert.ok(renderedTravel.includes("/store/yandeks-puteshestviya"),
  "Travel article must link to the verified store page");
for(const stale of ["ADM-PREMIUMPRO2O27", "PF-PREMIUMPRO-B66N2", "2RanynC1c4T", "sites/hmthkf"]) {
  assert.equal(renderedTravel.includes(stale), false, "Stale promotion reference in travel article: "+stale);
}
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
// Publisher-origin verification: a Perfluence-only code allowlist must never
// suppress separately published Admitad codes on the same canonical brand page.
const perfluenceSample = YANDEX_TRAVEL_ROTATED_OFFERS.find(c => c.promocode.code === "BOLSHE");
assert.ok(perfluenceSample);
assert.equal(isApprovedPublicCouponPlacement(perfluenceSample), true);
for (const [code,link,erid] of [
  ["ADM-ALL-2027","https://uknty.com/g/nevqu0gdl5c7dde8999c6b3b8b6079/?i=3&erid=2bL9aMPo2e49hMef4rrUYJtCP6","2bL9aMPo2e49hMef4rrUYJtCP6"],
  ["ADM-PREMIUMPRO2O27","https://uknty.com/g/42hf24sehic7dde8999c6b3b8b6079/?i=3&erid=2bL9aMPo2e49hMef4rrUYJtCP8","2bL9aMPo2e49hMef4rrUYJtCP8"],
]) {
  const coupon = {...perfluenceSample,
    promocode:{...perfluenceSample.promocode,code,group:"admitad"},
    affiliate:{...perfluenceSample.affiliate,link,landingLink:link,ordMarker:erid,ordText:"Реклама. Яндекс Путешествия erid: "+erid},
  };
  assert.equal(isApprovedPublicCouponPlacement(coupon),true, "Verified Admitad travel code hidden: "+code);
  assert.equal(isApprovedPublicCouponPlacement({...coupon,affiliate:{...coupon.affiliate,link:"https://untrusted.example/"}}),false);
  assert.equal(isApprovedPublicCouponPlacement({...coupon,promocode:{...coupon.promocode,code:"UNAPPROVED2027"}}),false);
}
console.log("PASS: verified Yandex Travel Admitad codes coexist with Perfluence without weakening ERID checks");

console.log("PASS: current SEO copy, stale Randewoo campaign blocked, Yandex Travel evergreen CTA");
