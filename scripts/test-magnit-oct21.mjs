import assert from "node:assert/strict";
import fs from "node:fs";
import { MAGNIT_ROTATED_OFFERS, MAGNIT_OCT21_LINK, MAGNIT_OCT21_ERID } from "../src/lib/perfluenceRotatedOffers.ts";
import { isApprovedPublicCouponPlacement, getCombinedCoupons } from "../src/lib/perfluence.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";

const current = {
  "25GFC1TL4": { value: "31%", until: "2026-10-31T23:59:59+03:00" },
  "SGPFB7JJGY": { value: "26%", until: "2026-10-31T23:59:59+03:00" },
  "Пирог": { value: "Пирог", until: "2026-10-27T23:59:59+03:00" },
};
const old = "https://mgntgm.prfl.me/sites/vjjrfu?erid=2RanynuJXUf";
assert.equal(MAGNIT_OCT21_LINK, "https://mgntgm.prfl.me/sites/gdpiqn?erid=2RanymKnUcb");
assert.equal(MAGNIT_OCT21_ERID, "2RanymKnUcb");
assert.equal(MAGNIT_ROTATED_OFFERS.length, 3);
assert.deepEqual(new Set(MAGNIT_ROTATED_OFFERS.map(x=>x.promocode.code)), new Set(Object.keys(current)));
assert.equal(new Set(MAGNIT_ROTATED_OFFERS.map(x=>x.id)).size, 3);

for(const item of MAGNIT_ROTATED_OFFERS) {
  const c=item.promocode, expected=current[c.code];
  assert(expected, "Unknown/unapproved code "+c.code);
  assert.equal(item.store.slug, "magnit-dostavka");
  assert.equal(c.expires, expected.until);
  assert(c.bonusName.includes(expected.value), c.bonusName);
  assert.equal(item.affiliate.link, MAGNIT_OCT21_LINK);
  assert.equal(item.affiliate.landingLink, MAGNIT_OCT21_LINK);
  assert.equal(item.affiliate.ordMarker, MAGNIT_OCT21_ERID);
  assert(item.affiliate.ordText.includes('АО "Тандер"'));
  assert(item.affiliate.ordText.includes("ИНН 2310031475"));
  assert(item.affiliate.ordText.includes("erid: "+MAGNIT_OCT21_ERID));
  assert.equal(isApprovedPublicCouponPlacement(item), true);
  assert.equal(isCouponActive(c.expires, Date.parse(c.expires)-1), true);
  assert.equal(isCouponActive(c.expires, Date.parse(c.expires)+1), false);
  assert.equal(c.isBarcode, false);
  assert.equal(c.isFirstOrderOnly, false, "Do not invent first order requirement");
}

const sample=MAGNIT_ROTATED_OFFERS[0];
const stale={...sample,id:1998258,
  promocode:{...sample.promocode,id:1998258},
  affiliate:{...sample.affiliate,link:old,landingLink:old,
    ordMarker:"2RanynuJXUf",ordText:'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanynuJXUf'}};
assert.equal(isApprovedPublicCouponPlacement(stale), false, "Old site placement must not leak into public catalog");
assert.equal(isApprovedPublicCouponPlacement({...sample,promocode:{...sample.promocode,code:"Чай"}}),false);
assert.equal(isApprovedPublicCouponPlacement({...sample,affiliate:{...sample.affiliate,ordMarker:"WRONG"}}),false);
assert.equal(isApprovedPublicCouponPlacement({...sample,affiliate:{...sample.affiliate,ordText:"Реклама. erid: "+MAGNIT_OCT21_ERID}}),false);
const deduped=dedupeCoupons([
  {source:"perfluence",coupons:[stale]},
  {source:"custom",coupons:MAGNIT_ROTATED_OFFERS}
]).coupons;
assert.equal(deduped.length,3,"Old widget offer must not create a duplicate");
assert.equal(deduped.find(x=>x.promocode.code==="25GFC1TL4")?.affiliate.link,MAGNIT_OCT21_LINK);

const merged=await getCombinedCoupons();
const magnit=merged.filter(c=>c.store.slug==="magnit-dostavka");
assert.equal(magnit.length,3,"Current site catalog should contain exactly three approved Magnit offers");
for(const item of magnit) {
 assert(current[item.promocode.code], "Unexpected Magnit code visible to visitors: "+item.promocode.code);
 assert.equal(item.affiliate.link,MAGNIT_OCT21_LINK);
 assert.equal(item.affiliate.ordMarker,MAGNIT_OCT21_ERID);
}
const custom=fs.readFileSync("src/lib/customCoupons.ts","utf8");
assert(custom.includes("...MAGNIT_ROTATED_OFFERS"));
const source=fs.readFileSync("src/lib/perfluenceRotatedOffers.ts","utf8");
assert(!source.includes("https://mgntgm.prfl.me/sites/vjjrfu"),"No historical Magnit placement should remain as a CTA constant");
assert(!source.includes("2RanynuJXUf"),"Old ERID must not survive in the approved manual offer source");
console.log("Magnit 21 Oct: three confirmed codes, approved site URL/ERID, expiry, old widget fail-closed and dedupe PASS");
