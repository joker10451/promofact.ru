import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import fs from "fs";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { getAllStores, parsePayload } = await import("../src/lib/perfluence.ts");
const { isCouponActive } = await import("../src/lib/couponExpiry.ts");

const rawFeed = JSON.parse(fs.readFileSync("src/data/perfluence-feed.json", "utf-8"));
const items = rawFeed.data || [];

const stores = await getAllStores();
const storeMap = new Map(stores.map(s => [s.slug, s]));

// Legally restricted or stopped projects that cannot be displayed publicly
const EXCLUDED_SLUGS = new Set([
  "winlab",  // Alcohol advertising law restriction (no ERID)
  "flor2u",  // Smart_zakupka approved; promofact.ru pending review
]);

const missingReport = [];

for (const item of items) {
  const proj = item.project || {};
  const parsed = parsePayload(JSON.stringify({ data: [item] }));
  const slug = parsed[0]?.store?.slug;
  if (!slug || EXCLUDED_SLUGS.has(slug)) continue;

  const siteStore = storeMap.get(slug);
  const siteCodes = new Set((siteStore?.coupons || []).map(c => c.promocode.code.trim().toUpperCase()));

  for (const g of item.groups || []) {
    for (const p of g.promocodes || []) {
      const code = p.code ? p.code.trim().toUpperCase() : "";
      if (!code) continue;

      const active = isCouponActive(p.date);
      if (active && !siteCodes.has(code)) {
        missingReport.push({
          project: proj.name,
          slug,
          code,
          name: p.name || p.comment,
          exp: p.date
        });
      }
    }
  }
}

if (missingReport.length > 0) {
  console.error("FAIL: The following active Perfluence promo codes are missing on promofact.ru:");
  for (const m of missingReport) {
    console.error(`- [${m.project}] (/store/${m.slug}) Code: "${m.code}" | "${m.name}" | Exp: ${m.exp}`);
  }
  assert.fail(`Found ${missingReport.length} active promo codes missing from website catalog!`);
}

console.log("PASS: 100% of active Perfluence promo codes are rendered on promofact.ru!");
