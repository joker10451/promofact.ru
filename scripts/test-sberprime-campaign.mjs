import assert from "node:assert/strict";
import { CUSTOM_COUPONS } from "../src/lib/customCoupons.ts";
import { ARTICLES } from "../src/lib/articles.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";

const sberprimeCoupons = CUSTOM_COUPONS.filter((c) => c.store.slug === "sberprime");
assert.ok(sberprimeCoupons.length >= 2, "SberPrime must have at least 2 active coupons");

const promo2rub = sberprimeCoupons.find((c) => c.id === 50029);
assert.ok(promo2rub, "Approved SberPrime 60 days for 2 RUB offer must exist");
assert.equal(promo2rub.affiliate.link, "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF");
assert.equal(promo2rub.affiliate.landingLink, "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF");
assert.equal(promo2rub.affiliate.ordMarker, "2RanynswGSF");
assert.match(promo2rub.affiliate.ordText, /АО «ЦПЛ»/);
assert.match(promo2rub.affiliate.ordText, /2RanynswGSF/);
assert.ok(promo2rub.promocode.bonusName.includes("2 ₽"));
assert.ok(promo2rub.promocode.bonusName.includes("185 бонусов Спасибо"));
assert.ok(isCouponActive(promo2rub.promocode.expires, Date.parse("2026-10-23T15:00:00+03:00")));
assert.equal(promo2rub.store.slug, "sberprime");
assert.equal(promo2rub.store.categorySlug, "servisy-i-podpiski");

// Articles check
const sberprimeArticles = ARTICLES.filter((a) => a.related?.some((r) => r.href === "/store/sberprime"));
assert.ok(sberprimeArticles.length >= 2, "Must have at least 2 articles linking to SberPrime store");
for (const a of sberprimeArticles) {
  if (a.ctaButton) {
    assert.equal(a.ctaButton.href, "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF");
    assert.ok(a.ctaButton.disclaimer?.includes("2RanynswGSF"));
  }
}

console.log("SberPrime approved placement, 2 RUB offer, articles, ERID, and legal checks PASS");
