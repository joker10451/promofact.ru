import assert from "node:assert/strict";
import fs from "node:fs";
import { WINLAB_ROTATED_OFFERS_PENDING_ERID, WINLAB_LINK_PENDING_ERID } from "../src/lib/perfluenceRotatedOffers.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";

assert.equal(WINLAB_LINK_PENDING_ERID,"https://winelab.prfl.me/sites/gittf8");
assert.equal(new URL(WINLAB_LINK_PENDING_ERID).searchParams.has("erid"),false,
  "Never manufacture an ERID for a URL provided without its ad marker");

const expected=[
  {code:"10PFNS5229",discount:"10%",expires:"2026-10-31T23:59:59+03:00"},
  {code:"WCPFOKT4737",discount:"10%",expires:"2026-10-21T10:59:00+03:00"},
  {code:"5OKTPF4737",discount:"5%",expires:"2026-10-21T10:59:00+03:00"},
];
assert.equal(WINLAB_ROTATED_OFFERS_PENDING_ERID.length,expected.length);
for(const test of expected){
  const item=WINLAB_ROTATED_OFFERS_PENDING_ERID.find(x=>x.promocode.code===test.code);
  assert(item,"The exact advertiser-approved code must remain in staging");
  assert.equal(item.store.slug,"winlab");
  assert.equal(item.promocode.expires,test.expires);
  assert(item.promocode.bonusName.includes(test.discount));
  assert.equal(item.affiliate.link,WINLAB_LINK_PENDING_ERID);
  assert.equal(item.affiliate.landingLink,WINLAB_LINK_PENDING_ERID);
  assert.equal(item.affiliate.ordMarker,"");
  assert(item.affiliate.ordText.includes("18+"));
  assert(item.affiliate.ordText.includes("публикация заблокирована"));
  assert.equal(isCouponActive(test.expires,Date.parse(test.expires)-1),true);
  assert.equal(isCouponActive(test.expires,Date.parse(test.expires)+1),false);
}
const custom=fs.readFileSync("src/lib/customCoupons.ts","utf8");
const perfluence=fs.readFileSync("src/lib/perfluence.ts","utf8");
const rotated=fs.readFileSync("src/lib/perfluenceRotatedOffers.ts","utf8");
assert(!custom.includes("...WINLAB_ROTATED_OFFERS_PENDING_ERID"),
  "Staged WinLab promotions must not enter the live custom coupon set without ERID");
assert(perfluence.includes('if (c.store.slug === "winlab") return false'),
  "WinLab coupons must remain blocked in the production merged feed");
assert(!rotated.includes("https://winelab.prfl.me/sites/ujkqzr"),
  "Old site-specific WinLab link must not remain");
assert(!rotated.includes("10PFNS6570"),"Old widget promo should not masquerade as renewed offer");
console.log("WINLAB October: new URL, three codes, exact Moscow cutoffs, 18+ and missing-ERID fail-closed staging PASS");
