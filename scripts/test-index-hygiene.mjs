import assert from "node:assert/strict";
import fs from "node:fs";

const { isStoreIndexable, isAutoImportedStore, MIN_OFFERS_AUTO_IMPORTED_STORE } = await import("../src/lib/storeIndexing.ts");
const { ACTIONS, isActionExpired } = await import("../src/lib/actions.ts");

// Store pages: no live offers is never indexable; auto-imported Admitad stores need 2.
assert.equal(isStoreIndexable("ostrovok", 0), false);
assert.equal(isStoreIndexable("ostrovok", 1), true, "Curated stores stay indexable with one offer");
assert.equal(isStoreIndexable("admitad-39099-indiwd", 1), false, "Auto-imported store with one offer is thin");
assert.equal(isStoreIndexable("admitad-39099-indiwd", MIN_OFFERS_AUTO_IMPORTED_STORE), true);
assert.equal(isAutoImportedStore(" Admitad-1-x "), true);
assert.equal(isAutoImportedStore("befree-ru"), false, "Named Admitad brands are curated, not auto-imported");

// Seasonal pages leave the index after their last day (Moscow time).
const summer = ACTIONS.find((a) => a.slug === "leto-2026");
assert.equal(isActionExpired(summer, Date.parse("2026-08-31T23:00:00+03:00")), false);
assert.equal(isActionExpired(summer, Date.parse("2026-09-01T00:00:01+03:00")), true);
assert.equal(isActionExpired({}, Date.now()), false, "No expires means evergreen");
for (const slug of ["leto-2026", "pervoe-sentyabrya", "den-shopinga-11-11", "chernaya-pyatnica-2026", "novogodnie-skidki-2027"]) {
  assert.ok(ACTIONS.find((a) => a.slug === slug)?.expires, `${slug} must declare when it ends`);
}
assert.equal(ACTIONS.find((a) => a.slug === "puteshestviya")?.expires, undefined, "Evergreen page keeps no expiry");

// The sitemap, the store page and the city page must use the same rules as each other.
const read = (p) => fs.readFileSync(p, "utf8");
const sitemap = read("src/app/sitemap.ts");
assert.match(sitemap, /isStoreIndexable\(store\.slug, store\.coupons\.length\)/, "Sitemap must use the store page's own rule");
assert.match(sitemap, /ACTIONS\.filter\(\(a\) => !isActionExpired\(a\)\)/, "Expired sales must not be in the sitemap");
assert.match(read("src/app/store/[slug]/page.tsx"), /index: isStoreIndexable\(slug, n\)/);
assert.match(read("src/app/akcii/[slug]/page.tsx"), /robots: \{ index: !isActionExpired\(action\)/);
const city = read("src/app/gorod/[slug]/page.tsx");
assert.match(city, /selectGeoOffers\(await getCoupons\(\), city\.name, undefined, cityNames\)/,
  "City metadata must count offers the same way as the page body and the sitemap");

// A store with live offers must not be hidden behind a redirect.
assert.doesNotMatch(read("next.config.ts"), /\/store\/kassir-ru/, "KASSIR.RU has live offers; the stale redirect must stay removed");

console.log("Index hygiene: store rule, seasonal expiry, sitemap/page consistency PASS");
