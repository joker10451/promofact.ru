import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PERFLUENCE_OCT16_APPROVED_OFFERS,
  PERFLUENCE_OCT16_PLACEMENTS,
  PERFLUENCE_OCT16_CODES,
  isApprovedOct16PublisherOffer,
} from "../src/lib/perfluenceOct16Offers.ts";
import { CUSTOM_COUPONS } from "../src/lib/customCoupons.ts";
import { withoutForbiddenFloristBeautyCoPromotion } from "../src/lib/publisherPlacementRules.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";

const plan = {
  librederm: [
    ["PC078BC488BA", "20%", "2026-10-31T23:59:59+03:00"],
  ],
  fmart: [
    ["FMARTPE23khl6x", "23%", "2026-10-31T23:59:59+03:00"],
    ["FMARTPE900btr9u", "900 ₽", "2026-10-31T23:59:59+03:00"],
    ["FMARTPE403c8la", "40%", "2026-10-17T23:59:59+03:00"],
    ["fmartpe2063dcr", "20%", "2026-10-31T23:59:59+03:00"],
  ],
  letual: [
    ["НАБЕРИ", "20 000 ₽", "2026-10-31T23:59:59+03:00"],
    ["УДАЧА", "3 000 ₽", "2026-10-23T23:59:59+03:00"],
    ["ОКТЯБРЬ", null, "2026-10-31T23:59:59+03:00"],
  ],
  sberdevaysy: [
    ["Sberdv171", "6%", "2026-10-31"],
    ["Sberdv71", "5%", "2026-10-31"],
  ],
};
assert.equal(PERFLUENCE_OCT16_APPROVED_OFFERS.length,8);
const all=CUSTOM_COUPONS.filter(c=>Object.hasOwn(plan,c.store.slug));
assert.equal(all.length,10, "Exactly ten site-approved coupons across four projects");

for (const [slug, codes] of Object.entries(plan)) {
  const p=PERFLUENCE_OCT16_PLACEMENTS[slug];
  const live=all.filter(c=>c.store.slug===slug);
  assert.equal(live.length,codes.length,slug+" count");
  assert.deepEqual(new Set(live.map(c=>c.promocode.code)),new Set(codes.map(c=>c[0])));
  assert.deepEqual(new Set(PERFLUENCE_OCT16_CODES[slug]),new Set(codes.map(c=>c[0])));
  assert.equal(new URL(p.link).searchParams.get("erid"),p.erid);
  for (const [code, amount, expires] of codes) {
    const c=live.find(x=>x.promocode.code===code);
    assert(c,slug+" "+code);
    assert.equal(c.promocode.expires,expires);
    if (amount) assert(c.promocode.bonusName.includes(amount),slug+" "+code+" amount");
    assert.equal(c.affiliate.link,p.link);
    assert.equal(c.affiliate.landingLink,p.link);
    assert.equal(c.affiliate.ordMarker,p.erid);
    assert(c.affiliate.ordText.includes("erid: "+p.erid));
    assert(c.affiliate.ordText.includes(p.legal.slice(0,13)));
    assert.equal(c.promocode.isFirstOrderOnly,false,"No invented first-order rule");
    assert.equal(isApprovedOct16PublisherOffer(c),true);
    // Date-only publisher fields run through 23:59:59 Moscow, not
    // 00:00 UTC at the beginning of the calendar date.
    const cut=expires.length===10
      ? Date.parse(expires+"T23:59:59+03:00")
      : Date.parse(expires);
    assert.equal(isCouponActive(expires,cut-1000),true);
    assert.equal(isCouponActive(expires,cut+1000),false);
    const stale={...c,id:c.id+900000,affiliate:{
      ...c.affiliate,
      link:p.link.replace(/erid=[^&]+/,"erid=OLD_TOKEN"),
      ordMarker:"OLD_TOKEN",
      ordText:"Реклама. erid: OLD_TOKEN",
    }};
    assert.equal(isApprovedOct16PublisherOffer(stale),false,
      "Widget URL/marker rotation must never reintroduce a stale tracking link");
    const newUnknown={...c,promocode:{...c.promocode,code:"UNAPPROVED_OCT16"}};
    assert.equal(isApprovedOct16PublisherOffer(newUnknown),false,
      "Never publish a code from an unreviewed widget feed for an approved placement");
    const merged=dedupeCoupons([{source:"custom",coupons:[c]},
      {source:"perfluence",coupons:[stale]}]).coupons.filter(isApprovedOct16PublisherOffer);
    assert.equal(merged.length,1);
    assert.equal(merged[0].affiliate.link,p.link);
  }
}

const naberi=all.find(c=>c.promocode.code==="НАБЕРИ");
const udacha=all.find(c=>c.promocode.code==="УДАЧА");
const october=all.find(c=>c.promocode.code==="ОКТЯБРЬ");
assert(naberi.promocode.terms.includes("не скидка 20 000 ₽ на любой заказ"));
assert(udacha.promocode.terms.includes("не предоставлены"));
assert(october.promocode.terms.includes("не указаны"));
const gift=all.find(c=>c.promocode.code==="FMARTPE403c8la");
assert.equal(gift.promocode.expires,"2026-10-17T23:59:59+03:00");

const fmart=all.find(c=>c.store.slug==="fmart");
const letual=all.find(c=>c.store.slug==="letual");
const librederm=all.find(c=>c.store.slug==="librederm");
const flor2u={...fmart,store:{...fmart.store,slug:"flor2u",name:"Flor2u"}};
const goldApple={...letual,store:{...letual.store,slug:"zolotoe-yabloko",name:"Золотое Яблоко"}};
assert.deepEqual(withoutForbiddenFloristBeautyCoPromotion([fmart,flor2u,letual,goldApple,librederm])
  .map(c=>c.store.slug),["flor2u","zolotoe-yabloko","librederm"]);
assert.equal(withoutForbiddenFloristBeautyCoPromotion([fmart,letual]).length,2,
  "Both stores may be advertised individually or without incompatible partners");

const custom=fs.readFileSync("src/lib/customCoupons.ts","utf8");
const src=fs.readFileSync("src/lib/perfluence.ts","utf8");
const home=fs.readFileSync("src/app/page.tsx","utf8");
const collections=fs.readFileSync("src/app/collections/[slug]/page.tsx","utf8");
assert(custom.includes("...PERFLUENCE_OCT16_APPROVED_OFFERS"));
assert(src.includes("filter(isApprovedOct16PublisherOffer)"));
assert(src.includes("withoutPausedPublisherOffers(await fetchData()).filter(isApprovedOct16PublisherOffer)"));
assert(src.includes("const freshCustomCoupons = (await import"));
assert(!src.includes("liveSberDevicesCodes"));
assert(home.includes("withoutForbiddenFloristBeautyCoPromotion"));
assert.equal((collections.match(/withoutForbiddenFloristBeautyCoPromotion/g)||[]).length,3);
console.log("PERFLUENCE 16 OCT: 4 projects, 10 codes, dates, attribution, legality, stale suppression, no fabricated benefits, incompatible selections PASS");
