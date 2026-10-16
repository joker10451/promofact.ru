import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DELIMOBIL_PAUSED_FROM, isPausedPublisherStore,
  withoutPausedPublisherOffers,
} from "../src/lib/publisherPauses.ts";
import { STABLE_STORES } from "../src/lib/stableStores.ts";

assert.equal(DELIMOBIL_PAUSED_FROM, "2026-10-16T14:11:00+03:00");
assert.equal(isPausedPublisherStore("delimobil"),true);
assert.equal(isPausedPublisherStore(" DELIMOBIL "),true);
assert.equal(isPausedPublisherStore("citydrive"),false);

// The blackout must remove all codes and even no-code affiliate promotions.
const offers=[
  { id:112,store:{slug:"delimobil"},promocode:{code:"h49fcs"},affiliate:{link:"https://delimobil.prfl.me/sites/dux1e5"} },
  { id:113,store:{slug:"delimobil"},promocode:{code:""},affiliate:{link:"https://delimobil.prfl.me/sites/dux1e5"} },
  { id:114,store:{slug:"citydrive"},promocode:{code:"SAVE1480"},affiliate:{link:"https://citydrive.prfl.me"} },
];
assert.deepEqual(withoutPausedPublisherOffers(offers).map(c=>c.id),[114]);
assert.equal(withoutPausedPublisherOffers(offers.filter(c=>c.store.slug==="delimobil")).length,0);
assert.equal(isPausedPublisherStore("tanukifamily"),false);

const registry=JSON.stringify(STABLE_STORES);
assert(!Object.hasOwn(STABLE_STORES,"delimobil"),"Do not publish halted offer through evergreen store fallback");
assert(!registry.includes("Промокод на 2000 бонусов на первую поездку"));

const source=fs.readFileSync("src/lib/perfluence.ts","utf8");
const route=fs.readFileSync("src/app/store/[slug]/page.tsx","utf8");
const snap=fs.readFileSync("src/app/api/perfluence-snapshot/route.ts","utf8");
const articles=fs.readFileSync("src/lib/articles.ts","utf8");

assert(source.includes("return withoutPausedPublisherOffers(await fetchData())"),
 "Direct API snapshots must not leak paused promo links");
assert(source.includes("return withoutPausedPublisherOffers(coupons).filter"),
 "Every source bucket, including cached/supabase/admitad, must be filtered after merge");
assert(source.includes("if (isPausedPublisherStore(slug)) continue"),
 "Paused advertiser must not reappear through evergreen store metadata");
assert(source.includes("const list = withoutPausedPublisherOffers(await getCachedMergedCoupons())"),
 "Store directories and dynamic sitemap must be protected");
assert(snap.includes("getPerfluenceCoupons()"),"Public Perfluence snapshot must use paused-offer filter");
assert(snap.includes('export const revalidate = 0'),"Snapshot must not use ISR after a partner stop");
assert(snap.includes('"Cache-Control": "no-store, max-age=0, must-revalidate"'),
 "Emergency blackout must prevent publicly cached offers from persisting after deployment");
assert(!snap.includes("stale-while-revalidate"),"Do not let CDN serve halted offers as stale");
assert.equal(route.split("if (isPausedPublisherStore(slug)) notFound()").length-1,2,
 "Both store page and metadata must 404 without showing affiliate buttons or old SEO text");
assert(!articles.includes('href: "/store/delimobil"'),
 "Historic article cross-promotion must be removed");
// Protect against accidental regression by historic (non-public) fixtures.
const bundled=JSON.parse(fs.readFileSync("src/data/perfluence-feed.json","utf8"));
assert(bundled.data.some(x=>x.project?.id===112),
 "The fixture models a real stale source and guards are needed even when it exists");
assert(!fs.readFileSync("src/lib/customCoupons.ts","utf8").includes("...DELIMOBIL"),
 "No hand-curated override of the partner stop");

// Unrelated approved advertisers must remain unaffected.
assert(Object.hasOwn(STABLE_STORES,"citydrive"));
assert(Object.hasOwn(STABLE_STORES,"tanukifamily"));
console.log("DELIMOBIL HALT: cached widget, snapshot API, page, SEO fallback, ads and article cross-links blocked; other stores unchanged PASS");
