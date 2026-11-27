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
  category: "Банки и финансы",
  categorySlug: "finansy",
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

// 8. Offer refiner never misclassifies explicit ruble discounts mentioning "подарков"/"роллов" as gifts
const { refineOffer } = await import("../src/lib/offerRefiner.ts");
const yandexFlowers = refineOffer(
  "Скидка 1 100 ₽ на первый заказ цветов от 3 000 ₽",
  "Свежий промокод QX7GZZ даёт скидку 1 100 ₽ при заказе букетов, композиций и подарков от 3 000 ₽",
  "QX7GZZ",
  "Яндекс Цветы",
  true,
);
assert.equal(yandexFlowers.type, "rub");
assert.equal(yandexFlowers.discount, "−1 100 ₽");

const farforRub = refineOffer(
  "Скидка 500 ₽ на любой заказ от 1 890 ₽ в FARFOR",
  "Промокод YMM14572 даёт скидку 500 ₽ на заказ пиццы, сетов и роллов от 1 890 ₽",
  "YMM14572",
  "FARFOR",
  false,
);
assert.equal(farforRub.type, "rub");
assert.equal(farforRub.discount, "−500 ₽");

// 9. Banking cards, fixed-price sets, exchange rates, deposit rates & duplicate slug consolidation
const tbankPlat = refineOffer(
  "Кредитная карта Т-Банк Платинум: лимит до 1 000 000 ₽ и рассрочка 0% до 12 месяцев",
  "Беспроцентный период до 55 дней на любые покупки, рассрочка 0% до 12 месяцев.",
  "TBANKPLATINUM",
  "Т-Банк",
  false,
);
assert.notEqual(tbankPlat.discount, "−0%");
assert.equal(tbankPlat.discount, "Рассрочка 0% до 12 мес.");

const otpGrace = refineOffer(
  "Кредитная карта ОТП Банк: 120 дней без % на любые покупки и 0 ₽ обслуживание",
  "Честный беспроцентный период 120 дней без процентов на любые покупки.",
  "OTP120DAYS",
  "ОТП Банк",
  false,
);
assert.equal(otpGrace.type, "default");
assert.equal(otpGrace.discount, "120 дней без %");

const alfaCard = refineOffer(
  "Дебетовая Альфа-Карта МИР: суперкэшбэк до 100% и 0 ₽ за обслуживание всегда",
  "Выбор любимых категорий с кэшбэком до 100%.",
  "ALFASMART",
  "Альфа-Банк",
  false,
);
assert.equal(alfaCard.discount, "Кешбэк до 100%");

const otpCert = refineOffer(
  "Сертификат на 2000 ₽ в подарок за оформление дебетовой ОТП Карты",
  "Сертификат отправляется после совершения первой покупки от 100 ₽",
  "",
  "ОТП Банк",
  false,
);
assert.equal(otpCert.type, "gift");
assert.equal(otpCert.discount, "Сертификат 2 000 ₽");
assert.equal(otpCert.condition, "после первой покупки от 100 ₽");

const farforSet = refineOffer(
  "Сет «Запеченный» за 599 ₽ для новых клиентов",
  "При заказе в приложении",
  "ZDZ99554",
  "FARFOR",
  true,
);
assert.equal(farforSet.type, "default");
assert.equal(farforSet.discount, "Сет «Запеченный» за 599 ₽");

const megaRate = refineOffer(
  "Повышенный курс списания бонусов Спасибо (1 бонус = 1,5 ₽) на Мегамаркете",
  "Акция на Мегамаркете",
  "",
  "Мегамаркет",
  false,
);
assert.equal(megaRate.type, "default");
assert.equal(megaRate.discount, "1 бонус = 1,5 ₽");

const vkladRate = refineOffer(
  "Розыгрыш 18,5 млн бонусов Спасибо за вклад в Сбере",
  "Ставка до 13,5% годовых на срок 3–7 месяцев.",
  "СПАСИБО",
  "Вклад в Сбере",
  false,
);
assert.notEqual(vkladRate.discount, "−5%");

const activeSlugs = new Set(stores.filter((s) => s.coupons.length > 0).map((s) => s.slug));
for (const canonical of ["food-band", "polzaru", "plati-po-miru", "debetovaya-sberkarta", "chistaya-liniya"]) {
  assert.ok(activeSlugs.has(canonical), `Canonical feed store missing: ${canonical}`);
}
for (const dup of ["foodband", "polza", "platipomiru", "sberbank", "arnest-yunirus-na-ozon", "yandex-practicum"]) {
  assert.ok(!activeSlugs.has(dup), `Duplicate/retired store must not be active: ${dup}`);
}
const letualStore = stores.find((s) => s.slug === "letual");
assert.ok(
  letualStore &&
    letualStore.coupons.length >= 1 &&
    letualStore.coupons.some(
      (c) =>
        c.affiliate.link.includes("letu.prfl.me/") &&
        Boolean(c.affiliate.ordMarker) &&
        c.affiliate.ordText.includes(`erid: ${c.affiliate.ordMarker}`),
    ),
  "L'Etoile must expose fresh verified Perfluence feed placement with valid ERID",
);
assert.equal(fs.readFileSync("src/lib/storeExtras.ts", "utf8").includes("kv7qjypp"), false,
  "Expired kv7qjypp FAQ must stay removed from storeExtras");
const nextCfgSrc = fs.readFileSync("next.config.ts", "utf8");
assert.ok(nextCfgSrc.includes("poweredByHeader: false") && nextCfgSrc.includes("Strict-Transport-Security"),
  "Next config must expose security headers and disable X-Powered-By");

// 10. All bank/financial storefronts belong to canonical category "finansy" ("Банки и финансы")
for (const finSlug of ["otp-bank", "debetovaya-sberkarta", "vklad-v-sbere", "plati-po-miru", "t-bank", "alfa-bank", "yandex-pay", "zenit"]) {
  const s = stores.find((item) => item.slug === finSlug);
  assert.ok(s, `Finance store missing: ${finSlug}`);
  assert.equal(s.categorySlug, "finansy", `Expected ${finSlug} in category finansy, got ${s.categorySlug}`);
  assert.equal(s.category, "Банки и финансы", `Expected ${finSlug} category label "Банки и финансы", got ${s.category}`);
}
const sberprimeStore = stores.find((item) => item.slug === "sberprime");
assert.equal(sberprimeStore?.categorySlug, "servisy-i-podpiski", "SberPrime subscription stays in servisy-i-podpiski");

console.log("V2-GROWTH: Pampadu 1-click UX, SEO metadata, newest-first sorting, Dec seasonality, UTM & clean store parity PASS");
