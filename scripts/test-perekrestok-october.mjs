import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PEREKRESTOK_OCT16_OFFERS, PEREKRESTOK_OCT16_LINK, PEREKRESTOK_OCT16_ERID,
} from "../src/lib/perfluenceRotatedOffers.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";

const approved = {
  "171LREDEY": { amount:"30%", expires:"2026-10-31T23:59:59+03:00" },
  "172E2Y5TJ": { amount:"300 ₽", expires:"2026-10-31T23:59:59+03:00" },
  "174NYBBJV": { amount:"1 ₽", expires:"2026-10-31T23:59:59+03:00" },
};
assert.equal(PEREKRESTOK_OCT16_ERID, "2RanyngM9SB");
assert.equal(PEREKRESTOK_OCT16_LINK, "https://perekrestok.prfl.me/sites/9833ce?erid=2RanyngM9SB");
assert.equal(PEREKRESTOK_OCT16_OFFERS.length, 3);
assert.deepEqual(new Set(PEREKRESTOK_OCT16_OFFERS.map(c=>c.promocode.code)),new Set(Object.keys(approved)));
for (const item of PEREKRESTOK_OCT16_OFFERS) {
  const c=item.promocode, details=approved[c.code];
  assert(details);
  assert.equal(item.store.slug,"perekrestok-dostavka");
  assert.equal(c.expires,details.expires);
  assert(c.bonusName.includes(details.amount));
  assert(c.terms?.includes("Промокод "+c.code));
  assert.equal(item.affiliate.link,PEREKRESTOK_OCT16_LINK);
  assert.equal(item.affiliate.landingLink,PEREKRESTOK_OCT16_LINK);
  assert.equal(item.affiliate.ordMarker,PEREKRESTOK_OCT16_ERID);
  assert(item.affiliate.ordText.includes("ИКС 5 ДИДЖИТАЛ"));
  assert(item.affiliate.ordText.includes("9722010808"));
  assert(item.affiliate.ordText.includes("erid: "+PEREKRESTOK_OCT16_ERID));
  assert.equal(c.isBarcode,false);
  assert.equal(isCouponActive(c.expires,Date.parse(c.expires)-1),true);
  assert.equal(isCouponActive(c.expires,Date.parse(c.expires)+1),false);
}

// Even a duplicate from the old widget must not override the project-specific
// approved link, expiry or ERID.
const stale=PEREKRESTOK_OCT16_OFFERS[0];
const old={...stale,id:199876, promocode:{...stale.promocode,id:199876,expires:"2026-10-31T23:59:59+03:00"},
  affiliate:{...stale.affiliate,link:"https://perekrestok.prfl.me/sites/rlj0bi?source=js-widget&source_id=8842",
  landingLink:"https://perekrestok.prfl.me/sites/rlj0bi?source=js-widget&source_id=8842",
  ordMarker:"2Ranyo8ekC3",ordText:"Реклама. erid: 2Ranyo8ekC3"}};
const merged=dedupeCoupons([{source:"perfluence",coupons:[old]},
  {source:"custom",coupons:PEREKRESTOK_OCT16_OFFERS}]).coupons;
assert.equal(merged.length,3);
assert.equal(merged.find(c=>c.promocode.code==="171LREDEY")?.promocode.expires,approved["171LREDEY"].expires);
assert.equal(merged.find(c=>c.promocode.code==="171LREDEY")?.affiliate.link,PEREKRESTOK_OCT16_LINK);

const custom=fs.readFileSync("src/lib/customCoupons.ts","utf8");
const perfluence=fs.readFileSync("src/lib/perfluence.ts","utf8");
assert(custom.includes("...PEREKRESTOK_OCT16_OFFERS"));
assert(perfluence.includes('if (c.store.slug === "perekrestok-dostavka")'));
assert(perfluence.includes('c.affiliate.link === "'+PEREKRESTOK_OCT16_LINK+'"'));
assert(perfluence.includes('c.affiliate.ordMarker === "'+PEREKRESTOK_OCT16_ERID+'"'));
assert(perfluence.includes('c.affiliate.ordText.includes("erid: '+PEREKRESTOK_OCT16_ERID+'")'));
assert(perfluence.includes('["171LREDEY", "172E2Y5TJ", "174NYBBJV"]'));
console.log("PEREKRESTOK 19 OCT: approved site URL/ERID, 3 codes, expiry, conservative claims, dedupe and old-link suppression PASS");
