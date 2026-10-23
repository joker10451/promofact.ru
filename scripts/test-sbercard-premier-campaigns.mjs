import assert from "node:assert/strict";
import fs from "node:fs";
import { CUSTOM_COUPONS } from "../src/lib/customCoupons.ts";

const sbercardCoupons = CUSTOM_COUPONS.filter((c) => c.id === 50031);
assert.equal(sbercardCoupons.length, 1, "Exactly one SberCard coupon must exist");
const sbercard = sbercardCoupons[0];

assert.equal(sbercard.store.slug, "sberbank");
assert.equal(
  sbercard.affiliate.link,
  "https://sberbank1.prfl.me/sites/7nue8j?erid=2RanykaY4Us",
  "SberCard must track via the approved promofact.ru site placement"
);
assert.equal(sbercard.affiliate.ordMarker, "2RanykaY4Us");
assert.ok(
  sbercard.affiliate.ordText.includes("erid: 2RanykaY4Us"),
  "SberCard ordText must contain the approved ERID"
);
assert.ok(
  sbercard.affiliate.ordText.includes("ПАО Сбербанк"),
  "SberCard advertiser must be ПАО Сбербанк"
);

const premierCoupons = CUSTOM_COUPONS.filter((c) => c.id === 50032);
assert.equal(premierCoupons.length, 1, "Exactly one PREMIER coupon must exist");
const premier = premierCoupons[0];

assert.equal(premier.store.slug, "premier");
assert.equal(premier.promocode.code, "dcjutya4");
assert.equal(
  premier.affiliate.link,
  "https://premier.prfl.me/sites/gsj9qt?erid=2Ranymq94ZR",
  "PREMIER must track via the approved promofact.ru site placement"
);
assert.equal(premier.affiliate.ordMarker, "2Ranymq94ZR");
assert.ok(
  premier.affiliate.ordText.includes("erid: 2Ranymq94ZR"),
  "PREMIER ordText must contain the approved ERID"
);
assert.ok(
  premier.affiliate.ordText.includes("ООО \"ПРЕМЬЕР\""),
  "PREMIER advertiser must be ООО ПРЕМЬЕР"
);

console.log("SberCard and PREMIER approved placements, codes, ERIDs, and legal checks PASS");
