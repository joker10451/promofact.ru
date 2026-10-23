import assert from "node:assert/strict";
import fs from "node:fs";
import { hasActiveRequiredCoupons, getStoreExtra } from "../src/lib/storeExtras.ts";
import { PERFLUENCE_OCT16_APPROVED_OFFERS, isApprovedOct16PublisherOffer } from "../src/lib/perfluenceOct16Offers.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";

const when=Date.parse("2026-10-16T12:00:00+03:00");
const candidates=PERFLUENCE_OCT16_APPROVED_OFFERS.filter(c=>c.store.slug==="fmart");
assert.equal(candidates.length, 4, "There must be four currently approved FMART codes");
const merged=dedupeCoupons([{source:"custom",coupons:candidates},
  {source:"perfluence",coupons:candidates.map(c=>({...c,affiliate:{...c.affiliate,ordMarker:"STALE"}}))}]).coupons
  .filter(isApprovedOct16PublisherOffer)
  .filter(c=>isCouponActive(c.promocode.expires,when));
assert.equal(merged.length, 4, "All four approved FMART coupons must survive source priority and expiry");
assert(merged.every(c=>c.affiliate.link==="https://fmart-flowers.prfl.me/sites/283ede?erid=2Ranynyf7r3"));
assert(merged.every(c=>c.affiliate.ordMarker==="2Ranynyf7r3"));

// Regression: full ISO expires were appended with another T23:59 and incorrectly
// returned false, suppressing truthful SEO titles even for currently active codes.
const extra={requiredActiveCodes:["FMARTPE23khl6x"],customTitle:()=>"Validated"};
assert.equal(hasActiveRequiredCoupons(extra,candidates,when),true);
assert.equal(hasActiveRequiredCoupons(extra,candidates,Date.parse("2026-11-01T00:00:00+03:00")),false);
assert.equal(candidates.some(c=>c.promocode.code==="FMARTPE403c8la"),false,"Expired 40% code no longer advertised");
const dateOnly={requiredActiveCodes:["SEOTEST"],customTitle:()=>"Validated"};
assert.equal(hasActiveRequiredCoupons(dateOnly,[{promocode:{code:"SEOTEST",expires:"2026-10-31"}}],
  Date.parse("2026-10-31T21:00:00+03:00")),true);
assert.equal(hasActiveRequiredCoupons(dateOnly,[{promocode:{code:"SEOTEST",expires:"2026-11-01"}}],
  Date.parse("2026-11-02T00:00:00+03:00")),false);
assert.equal(hasActiveRequiredCoupons(dateOnly,[{promocode:{code:"SEOTEST",expires:"INVALID"}}],when),false);
assert.equal(hasActiveRequiredCoupons(dateOnly,[{promocode:{code:"OTHER",expires:"2026-10-31"}}],when),false);
assert.equal(Boolean(getStoreExtra("winlab")?.requiredActiveCodes?.length),true);

// Navigation is SSR inventory-driven, no empty/nonpayable promotions, and
// each link points to a real canonical store + a real page anchor.
const growth=fs.readFileSync("src/components/PrioritySearchLinks.tsx","utf8");
const home=fs.readFileSync("src/app/page.tsx","utf8");
const store=fs.readFileSync("src/app/store/[slug]/page.tsx","utf8");
const e2e=fs.readFileSync("scripts/test-e2e-scenarios.mjs","utf8");
assert(growth.includes('stores.filter(s => s.coupons.length > 0)'));
for (const slug of ["yandex-eda","pyaterochka","sberprime","fmart"]) {
  assert(growth.includes('slug: "'+slug+'"'),"GSC entry must exist: "+slug);
}
assert(growth.includes('href={`/store/${item.slug}#offers`}'));
assert(home.includes("<PrioritySearchLinks stores={stores} />"));
assert(home.indexOf("<PopularStores />") < home.indexOf("<PrioritySearchLinks stores={stores} />"));
assert(home.indexOf("<PrioritySearchLinks stores={stores} />") < home.indexOf("<CategoryPreview />"));
assert(store.includes('id="offers"'));
assert(store.includes('slug === "flowwow"')&&store.includes('href="/store/fmart#offers"'));
assert(store.includes('slug === "fmart"')&&store.includes("а не отдельные промокоды"));
assert(e2e.includes("SCENARIO 13: FMART"));
assert(e2e.includes('page.locator(\'article[id^="coupon-"] button[aria-label^="Скопировать промокод "]\')'));
assert(e2e.includes("FMART must use approved ERID"));
const pause=fs.readFileSync("src/lib/publisherPauses.ts","utf8");
assert(pause.includes('new Set(["delimobil"])'),"No paused campaign may be resurrected by new links");
console.log("SEO-GROWTH-2: live inventory links, separate FMART attribution, safe expiry-based metadata and UI regression PASS");
