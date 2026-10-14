import assert from "node:assert/strict";
import { isRealPromoCode } from "../src/lib/dedupe.ts";
import { getStoreHeadlineOfferCounts,formatStoreOfferTitle,formatStoreOfferCounts,formatPriorityStoreTitle,pluralRu } from "../src/lib/storeOfferHeadline.ts";
import { buildStoreArticle, buildStoreDescription } from "../src/lib/storeSeoContent.ts";
import fs from "node:fs";

const coupons = (codes) => codes.map(code=>({promocode:{code}}));
assert.deepEqual(getStoreHeadlineOfferCounts(coupons(["ABC","NOT REQUIRED","НЕ НУЖЕН","","АКЦИЯ","REAL2"])),{offers:6,codes:2,codeFree:4,barcodes:0});
for (const placeholder of ["NOT REQUIRED","NOT REQUIRE","Not needed","NO CODE","НЕ НУЖЕН","БЕЗ ПРОМОКОДА","АКЦИЯ"]) {
  assert.equal(isRealPromoCode(placeholder),false,placeholder);
}
assert.equal(isRealPromoCode("CODE20"),true);
assert.equal(pluralRu(1,"промокод","промокода","промокодов"),"промокод");
assert.equal(pluralRu(2,"промокод","промокода","промокодов"),"промокода");
assert.equal(pluralRu(5,"промокод","промокода","промокодов"),"промокодов");
assert.equal(pluralRu(11,"акция","акции","акций"),"акций");
assert.equal(pluralRu(21,"акция","акции","акций"),"акция");
assert.equal(formatStoreOfferCounts(3,3),"3 промокода и 3 акции");
assert.equal(formatStoreOfferCounts(0,1),"1 акция");
assert.equal(formatStoreOfferCounts(1,0),"1 промокод");
assert.equal(formatStoreOfferCounts(1,0,1),"1 промокод и 1 штрихкод");
assert.deepEqual(getStoreHeadlineOfferCounts([{promocode:{code:"2921098554627",isBarcode:false}},{promocode:{code:"2921098553491",isBarcode:true}}]),{offers:2,codes:1,codeFree:0,barcodes:1});
assert.equal(formatStoreOfferTitle({name:"Befree",month:"октябрь 2026",codes:3,codeFree:3}),"Промокоды и акции Befree на октябрь 2026: 3 промокода и 3 акции");
assert.equal(formatStoreOfferTitle({name:"Sportmaster",month:"октябрь 2026",codes:0,codeFree:2}),"Акции Sportmaster на октябрь 2026: 2 акции");
assert.equal(formatStoreOfferTitle({name:"Tasty Coffee",month:"октябрь 2026",codes:1,codeFree:0,searchBrandPromo:true}),"Промокод Tasty Coffee на октябрь 2026: 1 промокод");
assert.equal(formatStoreOfferTitle({name:"Tasty Coffee",month:"октябрь 2026",codes:0,codeFree:0,searchBrandPromo:true}),"Скидки и акции Tasty Coffee на октябрь 2026");
assert.equal(formatPriorityStoreTitle({slug:"tasty-coffee",month:"октябрь 2026",codes:1,codeFree:0}),"Tasty Coffee: 1 промокод — октябрь 2026");
assert.equal(formatPriorityStoreTitle({slug:"randewoo",month:"октябрь 2026",codes:1,codeFree:2}),"Randewoo: 1 промокод и 2 акции");
assert.equal(formatPriorityStoreTitle({slug:"yandeks-puteshestviya",month:"октябрь 2026",codes:1,codeFree:0}),"Яндекс Путешествия: 1 промокод");
assert.equal(formatPriorityStoreTitle({slug:"pyaterochka",month:"октябрь 2026",codes:2,codeFree:0}),"Пятёрочка Доставка: 2 промокода");
assert.equal(formatPriorityStoreTitle({slug:"randewoo",month:"октябрь 2026",codes:0,codeFree:3}),"Randewoo: 3 акции");
assert.equal(formatPriorityStoreTitle({slug:"randewoo",month:"октябрь 2026",codes:0,codeFree:0}),null);
assert.equal(formatPriorityStoreTitle({slug:"some-other-store",month:"октябрь 2026",codes:2,codeFree:0}),null);
const sportmaster = {
  name: "Спортмастер",
  category: "Спорт и отдых",
  categorySlug: "sport-i-otdyh",
  coupons: [
    { code: "MOUNTAIN", bonusName: "Скидки на обувь" },
    { code: "НЕ НУЖЕН", bonusName: "Скидка месяца на подборку товаров" },
    { code: "NOT REQUIRED", bonusName: "Бонусы ко дню рождения" },
  ],
  couponCount: 3,
  maxDiscount: "до 20%",
  hasGiftOffer: false,
  isFirstOrder: false,
  activeBloggers: 0,
  monthYear: "Октябрь 2026",
  monthRu: "октябрь 2026",
  todayRu: "12 октября 2026",
};
const sportArticle = buildStoreArticle(sportmaster, "sportmaster");
assert.match(sportArticle[0], /1 промокод и 2 акции/);
assert.doesNotMatch(sportArticle.join(" "), /3 рабочих промокода/);
assert.match(sportArticle[2], /1 промокод/);
assert.doesNotMatch(sportArticle[2], /НЕ НУЖЕН|NOT REQUIRED/);
assert.match(buildStoreDescription(sportmaster), /1 промокод и 2 акции/);
const onlyDeals = {
  ...sportmaster,
  coupons: sportmaster.coupons.slice(1),
  couponCount: 2,
};
assert.match(buildStoreArticle(onlyDeals, "sportmaster")[0], /2 акции/);
assert.match(buildStoreDescription(onlyDeals), /2 акции/);
assert.doesNotMatch(buildStoreDescription(onlyDeals), /2 кода/);

const storeSource = fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8");
assert.ok(storeSource.includes("const offerCountLabel = formatStoreOfferCounts(realCodeCount, codeFreeCount, barcodeCount)"));
assert.ok(storeSource.includes("{offerCountLabel}. Срок действия указан в карточке."));
assert.ok(storeSource.includes("Предложений сегодня"));
const browserSource = fs.readFileSync("src/components/StoreCouponBrowser.tsx", "utf8");
assert.ok(browserSource.includes("formatStoreOfferCounts(codes, codeFree)"));
const tableSource = fs.readFileSync("src/components/StoreSummaryTable.tsx", "utf8");
assert.ok(tableSource.includes("isRealPromoCode(coupon.promocode.code)"));
assert.ok(tableSource.includes("Сводная таблица промокодов и акций"));
console.log("Sportmaster 1-code + 2-deals page, SEO copy and table labeling PASS");
console.log("Real-code vs code-free SEO title tests PASS");
