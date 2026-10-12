import assert from "node:assert/strict";
import { isRealPromoCode } from "../src/lib/dedupe.ts";
import { getStoreHeadlineOfferCounts,formatStoreOfferTitle,formatStoreOfferCounts,pluralRu } from "../src/lib/storeOfferHeadline.ts";

const coupons = (codes) => codes.map(code=>({promocode:{code}}));
assert.deepEqual(getStoreHeadlineOfferCounts(coupons(["ABC","NOT REQUIRED","НЕ НУЖЕН","","АКЦИЯ","REAL2"])),{offers:6,codes:2,codeFree:4});
for (const placeholder of ["NOT REQUIRED","Not needed","NO CODE","НЕ НУЖЕН","БЕЗ ПРОМОКОДА","АКЦИЯ"]) {
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
assert.equal(formatStoreOfferTitle({name:"Befree",month:"октябрь 2026",codes:3,codeFree:3}),"Промокоды и акции Befree на октябрь 2026: 3 промокода и 3 акции");
assert.equal(formatStoreOfferTitle({name:"Sportmaster",month:"октябрь 2026",codes:0,codeFree:2}),"Акции Sportmaster на октябрь 2026: 2 акции");
assert.equal(formatStoreOfferTitle({name:"Tasty Coffee",month:"октябрь 2026",codes:1,codeFree:0,searchBrandPromo:true}),"Промокод Tasty Coffee на октябрь 2026: 1 промокод");
assert.equal(formatStoreOfferTitle({name:"Tasty Coffee",month:"октябрь 2026",codes:0,codeFree:0,searchBrandPromo:true}),"Скидки и акции Tasty Coffee на октябрь 2026");
console.log("Real-code vs code-free SEO title tests PASS");
