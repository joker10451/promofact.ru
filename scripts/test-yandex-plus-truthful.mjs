import assert from "node:assert/strict";
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { refineOffer } = await import("../src/lib/offerRefiner.ts");
const { PERFLUENCE_OCT28_OFFERS } = await import("../src/lib/perfluenceOct28Website.ts");
const { isApprovedPublicCouponPlacement, getCombinedCoupons, getAllStores } =
  await import("../src/lib/perfluence.ts");
const { STABLE_STORES } = await import("../src/lib/stableStores.ts");
const { getStoreExtra } = await import("../src/lib/storeExtras.ts");
const { buildStoreArticle } = await import("../src/lib/storeSeoContent.ts");

const official = PERFLUENCE_OCT28_OFFERS.find(c => c.store.slug === "yandex-plus");
assert.ok(official, "Verified Perfluence placement must exist");
assert.equal(official.promocode.code, "FYBSF2X94G");
assert.equal(official.promocode.expires, "2026-12-31T23:59:59+03:00");
assert.equal(official.affiliate.link, "https://yaplus45.prfl.me/sites/e6efea?erid=2RanymRXMTZ");
assert.equal(official.affiliate.ordMarker, "2RanymRXMTZ");
const offer = refineOffer(official.promocode.bonusName || "", official.promocode.terms || "",
  official.promocode.code, official.store.name, official.promocode.isFirstOrderOnly);
assert.equal(offer.type, "subscription");
assert.equal(offer.discount, "45 дней бесплатно / 30 дней за 1 ₽");
assert.match(offer.condition, /новым пользователям/);
assert.match(offer.condition, /без активной подписки/);
assert.doesNotMatch(offer.discount, /[−-]1\s*₽/);
assert.equal(isApprovedPublicCouponPlacement(official), true);

// A price paid for access is not the amount saved at checkout.
const priceOnly = refineOffer("по промокоду", "Доступ к подписке за 1 ₽ на 30 дней",
  "SAMPLE", "Тестовая подписка", false);
assert.notEqual(priceOnly.discount, "−1 ₽");
const realOneRubleDiscount = refineOffer("Скидка 1 ₽ на заказ", "", "SAMPLE", "Магазин", false);
assert.equal(realOneRubleDiscount.discount, "−1 ₽");

// These five Admitad codes had no benefit / expiry in public copy.
// Fail closed only for their specific codes; never delete or rewrite DB records.
const uncertain = ["3CL7UZV8DB", "JJVKYHYSX5", "PC2F8F2ALL", "P2U2VHZDD6", "SKG7PFYYMN"];
for (const code of uncertain) {
  const stale = { ...official,
    promocode: { ...official.promocode, code, group: "admitad" } };
  assert.equal(isApprovedPublicCouponPlacement(stale), false, code);
}
const current = await getCombinedCoupons();
const currentPlus = current.filter(c => c.store.slug === "yandex-plus");
assert.ok(currentPlus.some(c => c.promocode.code === "FYBSF2X94G"));
assert.ok(currentPlus.every(c => !uncertain.includes(c.promocode.code)));

const stores = await getAllStores();
const store = stores.find(s => s.slug === "yandex-plus");
assert.ok(store);
assert.doesNotMatch(store.conditions || "", /2025/);
assert.match(store.conditions || "", /FYBSF2X94G/);
assert.doesNotMatch(STABLE_STORES["yandex-plus"].conditions || "", /2025/);
const extras = getStoreExtra("yandex-plus");
assert.ok(extras);
assert.deepEqual(extras.requiredActiveCodes, ["FYBSF2X94G"]);
assert.ok(extras.customDescription("октябре").includes("45 дней"));
const article = buildStoreArticle({
  name: store.name, category: store.category, categorySlug: store.categorySlug,
  coupons: store.coupons.map(c => ({ code:c.promocode.code, bonusName:c.promocode.bonusName })),
  couponCount:store.coupons.length, maxDiscount:null, isFirstOrder:false,
  activeBloggers:0, monthYear:"Октябрь 2026", monthRu:"октябрь", todayRu:"28 октября",
}, "yandex-plus").join(" ");
assert.match(article, /45 дней бесплатно/);
assert.doesNotMatch(article, /собер[иь] корзину|заказ от|продуктов|сумму чека/i);
const howTo = fs.readFileSync("src/components/HowToApply.tsx", "utf8");
const page = fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8");
assert.match(howTo, /SUBSCRIPTION_STEPS/);
assert.match(page, /slug === "yandex-plus" \? "subscription"/);

console.log("YANDEX PLUS: truthful subscription pricing, 2026 expiry, affiliate ERID, quarantine and UI PASS");
