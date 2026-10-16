import assert from "node:assert/strict";
import fs from "node:fs";
import { TANUKI_OCT16_OFFERS, TANUKI_OCT16_ERID, TANUKI_OCT16_LINK } from "../src/lib/perfluenceRotatedOffers.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";
import { withoutForbiddenTanukiCoPromotion } from "../src/lib/publisherPlacementRules.ts";

const expected = {
  "20FU1416": { expires:"2026-10-29T23:59:59+03:00", percent:"20%", min:"1 090", first:true },
  "15FU1416": { expires:"2026-10-29T23:59:59+03:00", percent:"15%", min:"1 490", first:false },
  "FU1417": { expires:"2026-10-18T23:59:59+03:00", percent:"Ролл Фурай", min:"1 490", first:false },
  "ZB1177": { expires:"2026-11-01T23:59:59+03:00", percent:null, min:null, first:false },
};
assert.equal(TANUKI_OCT16_LINK, "https://tanuki.prfl.me/sites/wyy3z6?erid=2RanymqYc6X");
assert.equal(TANUKI_OCT16_ERID, "2RanymqYc6X");
assert.equal(TANUKI_OCT16_OFFERS.length,4);
assert.deepEqual(new Set(TANUKI_OCT16_OFFERS.map(c=>c.promocode.code)),new Set(Object.keys(expected)));
for (const coupon of TANUKI_OCT16_OFFERS) {
  const c=coupon.promocode; const ref=expected[c.code];
  assert(ref, "Unexpected coupon code");
  assert.equal(coupon.store.slug,"tanukifamily");
  assert.equal(c.expires,ref.expires);
  assert.equal(c.isFirstOrderOnly,ref.first);
  assert.equal(coupon.affiliate.link,TANUKI_OCT16_LINK);
  assert.equal(coupon.affiliate.landingLink,TANUKI_OCT16_LINK);
  assert.equal(coupon.affiliate.ordMarker,TANUKI_OCT16_ERID);
  assert(coupon.affiliate.ordText.includes("ООО") &&
    coupon.affiliate.ordText.includes("Корсика") &&
    coupon.affiliate.ordText.includes("7730290633") &&
    coupon.affiliate.ordText.includes("erid: "+TANUKI_OCT16_ERID));
  assert(c.bonusName?.includes(ref.percent??"ZB1177"));
  if(ref.min)assert(c.terms?.includes(ref.min));
  assert.equal(isCouponActive(c.expires,new Date(ref.expires).getTime()-1000),true);
  assert.equal(isCouponActive(c.expires,new Date(ref.expires).getTime()+1000),false);
  assert.equal(c.isBarcode,false);
}

const unknown = TANUKI_OCT16_OFFERS.find(c=>c.promocode.code==="ZB1177");
assert(unknown && unknown.promocode.terms?.includes("не предоставлены"));
assert(!/\b(?:\d+[%₽]|ролл в подарок|скидка \d+)/iu.test(unknown.promocode.bonusName||""),
  "Do not invent the benefit or minimum order for ZB1177");
const old = TANUKI_OCT16_OFFERS[0];
const stale={...old,id:992390, promocode:{...old.promocode,id:992390},
  affiliate:{...old.affiliate,link:"https://tanuki.prfl.me/sites/qbsv4v?erid=2RanymzKnrw",
  landingLink:"https://tanuki.prfl.me/sites/qbsv4v?erid=2RanymzKnrw",
  ordMarker:"2RanymzKnrw",ordText:"Реклама. erid: 2RanymzKnrw"}};
const deduped=dedupeCoupons([{source:"custom",coupons:TANUKI_OCT16_OFFERS},
  {source:"perfluence",coupons:[stale]}]);
assert.equal(deduped.coupons.filter(c=>c.promocode.code==="20FU1416").length,1);
assert.equal(deduped.coupons.find(c=>c.promocode.code==="20FU1416")?.affiliate.link,TANUKI_OCT16_LINK);

const farfor={...old, store:{...old.store,name:"FARFOR",slug:"farfor"}};
const yobido={...old, store:{...old.store,name:"Ёёёёёёё (ex. Ёбидоёби)",slug:"yobidoyobi"}};
const unrelated={...old, store:{...old.store,name:"Тануки-партнёр",slug:"another-restaurant"}};
assert.deepEqual(withoutForbiddenTanukiCoPromotion([old,farfor]).map(c=>c.store.slug),["farfor"]);
assert.deepEqual(withoutForbiddenTanukiCoPromotion([old,yobido]).map(c=>c.store.slug),["yobidoyobi"]);
assert.deepEqual(withoutForbiddenTanukiCoPromotion([old,unrelated]).map(c=>c.store.slug),
 ["tanukifamily","another-restaurant"]);
assert.equal(withoutForbiddenTanukiCoPromotion(TANUKI_OCT16_OFFERS).length,4,
 "Tanuki standalone storefront remains available");

const perfluence=fs.readFileSync("src/lib/perfluence.ts","utf8");
const custom=fs.readFileSync("src/lib/customCoupons.ts","utf8");
const home=fs.readFileSync("src/app/page.tsx","utf8");
const collections=fs.readFileSync("src/app/collections/[slug]/page.tsx","utf8");
assert(custom.includes("...TANUKI_OCT16_OFFERS"));
assert(perfluence.includes('if (c.store.slug === "tanukifamily")') &&
  perfluence.includes('c.affiliate.link === "'+TANUKI_OCT16_LINK+'"') &&
  perfluence.includes('c.affiliate.ordMarker === "'+TANUKI_OCT16_ERID+'"') &&
  perfluence.includes('c.affiliate.ordText.includes("erid: '+TANUKI_OCT16_ERID+'")'),
  "Do not surface stale Perfluence tracking URL/ERID");
assert(home.includes("withoutForbiddenTanukiCoPromotion(withoutForbiddenTravelCoPromotion(coupons))"));
assert(collections.includes("withoutForbiddenTanukiCoPromotion(all.filter(col.filter))"),
 "Editorial collections and their metadata must exclude incompatible co-promotions");
console.log("TANUKI 16 OCT: four site-approved codes, expiry, real benefit claims, URL/ERID rotation, stale suppression and prohibited combinations PASS");
