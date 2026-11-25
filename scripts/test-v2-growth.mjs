import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pampaduOffersData from "../src/data/pampadu-offers.json" with { type: "json" };
import { CUSTOM_COUPONS } from "../src/lib/customCoupons.ts";
import { buildStoreDescription } from "../src/lib/storeSeoContent.ts";
import { getStoreHeadlineOfferCounts } from "../src/lib/storeOfferHeadline.ts";
import { getArticlesNewestFirst } from "../src/lib/articles.ts";
import { getCurrentSeasonalPromo } from "../src/lib/seasonalEvents.ts";
import { withUtm, buildArticleCandidates } from "./hybrid-post-sources.mjs";

// 1. Pampadu offers & 1-click UI safeguards (no cpaRub leaked into CUSTOM_COUPONS)
assert.ok(pampaduOffersData.offers.length >= 6, "At least 6 active Pampadu offers must exist");
const pampaduCoupons = CUSTOM_COUPONS.filter((c) => c.promocode.group === "pampadu");
assert.equal(pampaduCoupons.length, pampaduOffersData.offers.length, "All Pampadu registry offers must map to CUSTOM_COUPONS");
for (const c of pampaduCoupons) {
  assert.ok(Array.isArray(c.promocode.highlights) && c.promocode.highlights.length >= 2, `Missing highlights on ${c.store.slug}`);
  assert.ok(c.affiliate.ordMarker && c.affiliate.ordText.includes(c.affiliate.ordMarker), `Valid ERID required for ${c.store.slug}`);
  assert.equal(Object.hasOwn(c.promocode, "cpaRub"), false, "Never expose internal cpaRub on public Coupon objects");
}

// 2. Finance cards must NOT leak pseudo promo codes into bank <meta description> or counts
const otpPampadu = pampaduCoupons.find((c) => c.store.slug === "otp-bank");
assert.ok(otpPampadu, "OTP Bank Pampadu offer must exist");
const headlineCounts = getStoreHeadlineOfferCounts([otpPampadu]);
assert.equal(headlineCounts.codes, 0, "Pampadu finance cards must not be counted as promo codes");
assert.equal(headlineCounts.codeFree, 1, "Pampadu finance card should be counted as a direct offer");

const otpMeta = buildStoreDescription({
  name: "ОТП Банк",
  category: "Сервисы и подписки",
  categorySlug: "servisy-i-podpiski",
  coupons: [{ code: otpPampadu.promocode.code, bonusName: otpPampadu.promocode.bonusName, isBarcode: false, group: "pampadu" }],
  couponCount: 1,
  maxDiscount: null,
  isFirstOrder: false,
  activeBloggers: 1520,
  monthYear: "Ноябрь 2026",
  monthRu: "ноябрь 2026",
  todayRu: "25 ноября 2026",
});
assert.ok(!otpMeta.includes("OTP120DAYS"), `Technical Pampadu key must not appear in bank SEO description: ${otpMeta}`);

// 3. Newest-first sorting on /sovety puts November 2026 articles ahead of September 2026
const sortedArticles = getArticlesNewestFirst();
assert.ok(sortedArticles.length >= 10, "Articles list must be populated");
const firstTwoDates = sortedArticles.slice(0, 2).map((a) => a.published || "0000-00-00");
assert.ok(firstTwoDates[0] >= "2026-11-01", `Expected newest article >= Nov 2026 at top, got ${firstTwoDates[0]}`);
const lastArticle = sortedArticles[sortedArticles.length - 1];
assert.ok((lastArticle.published || "2026-09-01") < firstTwoDates[0], "Older articles must sort after newer ones");

// 4. Seasonal transition: December 2026 points to New Year 2027
const decPromo = getCurrentSeasonalPromo(new Date("2026-12-05T12:00:00+03:00"));
assert.ok(decPromo && decPromo.href === "/akcii/novogodnie-skidki-2027", "December must promote New Year 2027");

// 5. UTM helper tags only promofact.ru links and preserves external affiliate tracking links intact
assert.equal(
  withUtm("https://promofact.ru/collections/finansy-i-karty", "telegram", "social", "credit-cards"),
  "https://promofact.ru/collections/finansy-i-karty?utm_source=telegram&utm_medium=social&utm_campaign=credit-cards",
);
assert.equal(
  withUtm("https://trk.ppdu.ru/click?uid=263585&oid=2684&erid=2SDnjeCxpmJ&siteId=30575", "telegram", "social", "yandex-pay"),
  "https://trk.ppdu.ru/click?uid=263585&oid=2684&erid=2SDnjeCxpmJ&siteId=30575",
);
const tgArticles = buildArticleCandidates([]);
assert.ok(tgArticles.length > 0 && tgArticles[0].text.includes("utm_source=telegram"), "TG article posts must include UTM tracking on site links");

// 6. CouponTicket renders 1-click CTA for pampadu without banned SEO claims
const ticketSrc = fs.readFileSync(path.resolve("src/components/CouponTicket.tsx"), "utf8");
assert.ok(ticketSrc.includes('promocode.group === "pampadu"'), "CouponTicket must distinguish 1-click Pampadu finance cards");
assert.ok(ticketSrc.includes("Оформить карту"), "Finance cards must render direct bank application CTA");

// 7. VkusVill custom overrides removed so live feed's distinct ladder (600/350/300/250/200) + erid win cleanly
const { getAllStores } = await import("../src/lib/perfluence.ts");
const stores = await getAllStores();
const vkusvill = stores.find((s) => s.slug === "vkusvill-dostavka");
assert.ok(vkusvill && vkusvill.coupons.length === 5, "VkusVill must keep 5 active offers from live Perfluence feed");
assert.equal(new Set(vkusvill.coupons.map((c) => c.id)).size, 5, "All 5 VkusVill coupons must have distinct coupon IDs");
const vkusvillAmounts = new Set(vkusvill.coupons.map((c) => c.promocode.bonusName.match(/(\d+)\s*₽/)?.[1]).filter(Boolean));
assert.deepEqual(vkusvillAmounts, new Set(["600", "350", "300", "250", "200"]), "VkusVill must not regress to duplicate nominal amounts");
assert.ok(vkusvill.coupons.every((c) => c.affiliate.ordMarker === "2Ranyo8ey8Q"), "VkusVill must carry unified renewed ERID 2Ranyo8ey8Q");

console.log("V2-GROWTH: Pampadu 1-click UX, SEO metadata, newest-first sorting, Dec seasonality, UTM & clean store parity PASS");
