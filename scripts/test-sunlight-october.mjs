import assert from "node:assert";
import fs from "node:fs";

const feed = JSON.parse(fs.readFileSync("src/data/perfluence-feed.json", "utf-8"));
const projects = feed.data || [];
const sunlight = projects.find(p => p.project?.id === 1100 || p.project?.name?.toLowerCase().includes("sunlight"));

assert.ok(sunlight, "Sunlight project 1100 must exist in perfluence-feed.json");
const promos = sunlight.groups[0]?.promocodes || [];
assert.strictEqual(promos.length, 4, "Sunlight must have 4 promocodes");

for (const promo of promos) {
  assert.strictEqual(promo.date, "31.10.2026", `Promo ${promo.code} date must be extended to 31.10.2026`);
  assert.ok(promo.promo_terms.includes("31 октября 2026"), `Promo ${promo.code} terms must state 31 октября 2026`);
}

console.log("✓ Sunlight: all 4 promo codes extended to 31.10.2026 PASS");
