import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { STABLE_STORES } from "../src/lib/stableStores.ts";
import { BRAND_REGISTRY, getLocalBrandLogo } from "../src/lib/brandLogos.ts";
import { COLLECTIONS } from "../src/lib/collections.ts";

const logoPath = path.resolve("./public/brands/rosgosstrakh.png");
assert.ok(fs.existsSync(logoPath) && fs.statSync(logoPath).size > 1000, "Rosgosstrakh logo must exist");
assert.strictEqual(getLocalBrandLogo("rosgosstrakh"), "/brands/rosgosstrakh.png");
assert.strictEqual(getLocalBrandLogo("rgs"), "/brands/rosgosstrakh.png");
assert.strictEqual(BRAND_REGISTRY.rosgosstrakh?.domain, "rgs.ru");

const store = STABLE_STORES.rosgosstrakh;
assert.ok(store && store.id === 4463 && store.slug === "rosgosstrakh", "STABLE_STORES retains rosgosstrakh metadata");

const sampleCoupon = {
  id: 435414513,
  promocode: {
    id: 435414513,
    code: "SAMPLE",
    bonusName: "Скидка 10% на страховой полис для путешествий",
    terms: "Скидка на полис онлайн",
    expires: "2026-12-31",
    isHit: false,
    isUniversal: true,
    isFirstOrderOnly: false,
    customerTypeLabel: "Все клиенты",
    region: "RU",
    isBarcode: false,
    barcodeImage: null,
    group: "perfluence",
  },
  store: { ...store, activeBloggers: store.activeBloggers ?? 0 },
  affiliate: {
    link: "https://rosgostravel.prfl.me/sites/4cawc2?erid=2RanyTest11",
    landingLink: "https://rosgostravel.prfl.me/sites/4cawc2?erid=2RanyTest11",
    ordMarker: "2RanyTest11",
    ordText: "Реклама. ПАО СК Росгосстрах erid: 2RanyTest11",
  },
  extraLinks: [],
};

const financeCol = COLLECTIONS.find((c) => c.slug === "finansy-i-karty");
assert.ok(financeCol && financeCol.filter(sampleCoupon), "Rosgosstrakh fits finance collection filter");
const travelCol = COLLECTIONS.find((c) => c.slug === "vygodnye-oteli");
assert.ok(travelCol && travelCol.filter(sampleCoupon), "Rosgosstrakh fits travel collection filter");

console.log("Rosgosstrakh metadata, logo and collections filter PASS");
