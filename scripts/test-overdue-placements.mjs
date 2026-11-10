import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const { OVERDUE_PLACEMENT_ERIDS, carriesOverduePlacement } = await import("../src/lib/overduePlacements.ts");
const { getAllStores } = await import("../src/lib/perfluence.ts");

assert.equal(OVERDUE_PLACEMENT_ERIDS.size, 91);
const mk = (o) => ({ affiliate: { ordMarker: "", link: "", landingLink: "", ordText: "", ...o } });
assert.equal(carriesOverduePlacement(mk({ ordMarker: "2Ranymq94ZR" })), true);
assert.equal(carriesOverduePlacement(mk({ link: "https://x.prfl.me/s?erid=2Ranyo4fyN3" })), true);
assert.equal(carriesOverduePlacement(mk({ ordText: "Реклама. erid: 2RanymUAmpP" })), true);
assert.equal(carriesOverduePlacement(mk({ ordMarker: "2RanykSwE92" })), false);

// Public catalogue: nothing overdue, and the renewed placements are the ones shown.
const stores = await getAllStores();
const all = stores.flatMap((s) => s.coupons.map((c) => [s.slug, c]));
assert.deepEqual(all.filter(([, c]) => carriesOverduePlacement(c)).map(([s]) => s), []);
const fresh = { premier: "2RanykSwE92", poizon: "2RanynpojsA", "yandeks-lavka": "2RanyoHVWwN", sberprime: "2RanynswGSF" };
for (const [slug, erid] of Object.entries(fresh)) {
  const s = stores.find((x) => x.slug === slug);
  assert.ok(s?.coupons.some((c) => c.affiliate.ordMarker === erid), `${slug} must carry ${erid}`);
}

// Hand-written pages (articles, banners): no overdue ERID outside the denylist and the raw feed data.
// promoBanners: expired banners are hidden by endsAt. AdminClient: placeholder text.
// sberkarta/page.tsx: credit SberCard has no renewed placement yet (needs a new post in Perfluence).
const skip = new Set(["overduePlacements.ts", "promoBanners.ts", "AdminClient.tsx"]);
const hits = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(tsx?)$/.test(f.name) && !skip.has(f.name) && !p.endsWith(path.join("sberkarta","page.tsx")) && f.name !== "customCoupons.ts") {
      const t = fs.readFileSync(p, "utf8");
      for (const e of OVERDUE_PLACEMENT_ERIDS) if (t.includes(e)) hits.push(`${p}: ${e}`);
    }
  }
})("src");
assert.deepEqual(hits, []);
console.log("overdue placements: OK");
