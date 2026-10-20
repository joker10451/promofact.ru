import assert from "node:assert/strict";
import fs from "node:fs";
import { getCouponAudience } from "../src/lib/storeCouponAudience.ts";
import { refineOffer } from "../src/lib/offerRefiner.ts";
import { toCatalogCoupon } from "../src/lib/catalogCoupon.ts";

const p = (label, first = false) => ({ customerTypeLabel: label, isFirstOrderOnly: first });
assert.equal(getCouponAudience(p("Для всех")), "universal");
assert.equal(getCouponAudience(p(null)), "universal");
assert.equal(getCouponAudience(p("Первый заказ", true)), "first-order");
assert.equal(getCouponAudience(p("Повторные заказы")), "repeat-order");
assert.equal(getCouponAudience(p("Для постоянных клиентов")), "repeat-order");
assert.equal(getCouponAudience(p("Первый и повторный заказ")), "repeat-order");
const trio = [p("Для всех"), p("Для всех"), p("Для всех")];
assert.equal(trio.filter(c => getCouponAudience(c) === "repeat-order").length, 0);
assert.equal(trio.filter(c => getCouponAudience(c) === "universal").length, 3);

const gift = refineOffer("При заказе от 1 999 ₽", "Подарок на выбор при заказе от 1999 рублей", "WW-82894", "Pizza Sushi Wok", false);
assert.equal(gift.type, "gift");
assert.equal(gift.discount, "Подарок на выбор");
assert.match(gift.condition, /1\s*999\s*₽/);
assert.equal(refineOffer("Ролл в подарок", "При заказе от 1200 рублей", "TEST", "Магазин", false).discount, "Ролл в подарок");

const full = {
  id: 1,
  promocode: { id:1, code:"WW-82894", bonusName:"При заказе от 1 999 ₽", terms:"Подарок на выбор при заказе от 1999 рублей", expires:"2027-07-31",isHit:false,isBarcode:false,barcodeImage:null,isUniversal:true,isFirstOrderOnly:false,customerTypeLabel:"Для всех",minimumOrder:null,region:"RU",group:"admitad" },
  store: { id:1,name:"Pizza Sushi Wok",slug:"pizzasushiwok",logo:null,category:"Доставка из ресторанов",categorySlug:"dostavka-iz-restoranov",about:null,conditions:null,site:"https://merchant.example",activeBloggers:0 },
  affiliate: {link:"https://naiawork.com/test",landingLink:"https://naiawork.com/test",ordMarker:"ERID",ordText:"Реклама. erid: ERID"},
  extraLinks: [],
};
const light=toCatalogCoupon(full);
assert.equal(light.promocode.group,"admitad","Admitad origin must survive lightweight card conversion");
assert.equal(light.affiliate.link,full.affiliate.link);
assert.equal(light.affiliate.ordText,full.affiliate.ordText);
const summaryTable = fs.readFileSync("src/components/StoreSummaryTable.tsx", "utf8");
assert.ok(summaryTable.includes("customerTypeLabel?.trim()"), "Explicit audience label must be preserved");
assert.ok(!summaryTable.includes("<span>Для всех</span>"), "Unknown audience must never become universal");
const grid = fs.readFileSync("src/components/CouponGrid.tsx", "utf8");
assert.ok(grid.includes("new Map<string, CatalogCoupon[]>()"), "Grouping must use the store slug");
const seo = fs.readFileSync("src/lib/storeSeoContent.ts", "utf8");
assert.ok(!seo.includes("Подборку рекомендуют"), "Network publisher statistics must not imply endorsements");
const perfluence = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.ok(perfluence.includes("const hasRepeatOrderFlag ="), "Missing repeat-order flag must not imply first-order only");
assert.ok(perfluence.includes('isFirstOrderOnly: customerTypeLabel === "1-й заказ"'));
const card = fs.readFileSync("src/components/CouponTicket.tsx", "utf8");
assert.ok(!card.includes("Гарантия актуальности ПромоФакт"), "Never guarantee untested discounts");
const storePage = fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8");
assert.ok(!storePage.includes('firstOrderPromo ? "Скидка есть" : "Для всех"'));
console.log("AUDIT: audience truthfulness, counts, trust wording PASS");
console.log("CATALOG-QA-1: audience, gift and source preservation PASS");

const missingCode = refineOffer("по промокоду", "Первый урок бесплатно", "", "Яндекс Практикум", false);
assert.equal(missingCode.missingCodeClaim, true);
assert.match(missingCode.discount, /Первый урок бесплатно/);
assert.doesNotMatch(missingCode.discount, /по промокоду/i);
assert.doesNotMatch(missingCode.condition, /скидка применится/i);
const missingCodeLong = refineOffer("по промокоду при оформлении",
  "Второй продукт в подарок при покупке первого", "", "hollyshop", false);
assert.equal(missingCodeLong.type, "default");
assert.match(missingCodeLong.discount, /Второй продукт/);
const workingCode = refineOffer("скидка 10% по промокоду", "от 1000 рублей", "REAL10", "Davines", false);
assert.equal(workingCode.missingCodeClaim, undefined);
const storeBrowser = (await import("node:fs")).readFileSync("src/components/StoreCouponBrowser.tsx","utf8");
assert.match(storeBrowser, /filteredCoupons\.slice\(0, visibleLimit\)/);
assert.match(storeBrowser, /Показать ещё/);
console.log("CATALOG-QA-2: missing-code honesty and progressive reveal PASS");

// A code-free gift must never instruct users to apply a non-existent code.
const noCodeGift = refineOffer("Подарок к заказу", "Подарок при заказе от 3000 ₽", "", "Davines", false);
assert.equal(noCodeGift.isNoCode, true);
assert.doesNotMatch(noCodeGift.condition,/по промокоду/i);
const noCodeCopy = fs.readFileSync("src/lib/offerRefiner.ts","utf8");
assert.ok(!noCodeCopy.includes('скидка применится автоматически в корзине.'));
const storeHeading = fs.readFileSync("src/app/store/[slug]/page.tsx","utf8");
assert.ok(!storeHeading.includes('hasGift ? " — подарки к заказу"'));
console.log("Source-backed store headings and no-code gift claims PASS");

const subscriptionUnknown = refineOffer("Подписка Яндекс Плюс", "Специальные условия подписки", "", "Яндекс Плюс", false);
assert.equal(subscriptionUnknown.type, "subscription");
assert.doesNotMatch(subscriptionUnknown.discount, /(?:30|60) дней за 1 ₽/);
const subscriptionDays = refineOffer("30 дней доступа", "Подписка за 99 ₽", "CODE", "Иви", true);
assert.equal(subscriptionDays.discount, "30 дней за 99 ₽");
assert.equal(subscriptionDays.condition, "для новых пользователей");
const subscriptionDaysNoPrice = refineOffer("60 дней подписки", "", "", "Кинопоиск", false);
assert.equal(subscriptionDaysNoPrice.discount, "60 дней доступа");
console.log("CATALOG-QA-3: subscription prices, durations and audiences source-backed PASS");

const { isPromoHighlightEligible, pickExpiringDeals, pickHotDeals } = await import("../src/lib/hotDeals.ts");
const futureCode = structuredClone(full);
futureCode.id = 7001;
futureCode.promocode.id = 7001;
futureCode.promocode.code = "SALE10";
futureCode.promocode.bonusName = "−25% · при заказе от 4 000 ₽";
futureCode.promocode.expires = "2099-10-31";
futureCode.affiliate.link = "https://publisher.prfl.me/sites/example?erid=2RanykEXAMPLE";
futureCode.affiliate.landingLink = futureCode.affiliate.link;
futureCode.affiliate.ordMarker = "2RanykEXAMPLE";
futureCode.affiliate.ordText = "Реклама. Рекламодатель: пример. erid: 2RanykEXAMPLE";
assert.ok(isPromoHighlightEligible(futureCode), "Current code with matching ERID is eligible");
const placeholders = ["НЕ НУЖЕН", "NOT REQUIRE", "БЕЗ ПРОМОКОДА", "NO_CODE"];
for (const code of placeholders) {
  assert.equal(isPromoHighlightEligible({ ...futureCode, promocode: { ...futureCode.promocode, code } }), false,
    `Placeholder ${code} must not be advertised as a promo code`);
}
assert.equal(isPromoHighlightEligible({ ...futureCode, promocode: { ...futureCode.promocode, isBarcode: true } }), false,
  "Retail barcodes must not appear in online promo highlights");
assert.equal(isPromoHighlightEligible({ ...futureCode, promocode: { ...futureCode.promocode, expires: "2026-10-10" } }), false,
  "Expired voucher must not be featured");
assert.equal(isPromoHighlightEligible({ ...futureCode, affiliate: { ...futureCode.affiliate, ordMarker: "", ordText: "Реклама. Токен erid не предоставлен" } }), false,
  "Disclosure containing the word erid but no actual token must not pass");
assert.equal(isPromoHighlightEligible({ ...futureCode, affiliate: { ...futureCode.affiliate, ordText: "Реклама. erid: 2RanykOTHER" } }), false,
  "Conflicting ad text vs marker is not safe for promotion");
assert.equal(isPromoHighlightEligible({ ...futureCode, affiliate: { ...futureCode.affiliate, link: "https://publisher.prfl.me/sites/example?erid=2RanykOTHER" } }), false,
  "Tracking URL and disclosure must not disagree");
assert.equal(isPromoHighlightEligible({ ...futureCode, affiliate: { ...futureCode.affiliate, link: "javascript:alert(1)" } }), false,
  "Only HTTP(S) affiliate links allowed in highlights");
const beforeExactExpiry = new Date("2026-10-31T00:58:00+03:00").getTime();
const afterExactExpiry = new Date("2026-10-31T01:00:00+03:00").getTime();
const exactExpiryCode = { ...futureCode, promocode: { ...futureCode.promocode, expires: "2026-10-31T00:59:00+03:00" } };
assert.equal(isPromoHighlightEligible(exactExpiryCode, beforeExactExpiry), true);
assert.equal(isPromoHighlightEligible(exactExpiryCode, afterExactExpiry), false,
  "A 00:59 Moscow expiry cannot be interpreted as 23:59");
assert.deepEqual(pickExpiringDeals([futureCode, { ...futureCode, id: 7002, promocode: { ...futureCode.promocode, code: "НЕ НУЖЕН" } }], 4).map(c => c.id), [7001]);
assert.deepEqual(pickHotDeals([futureCode, { ...futureCode, id: 7003, promocode: { ...futureCode.promocode, code: "NO_CODE" } }], 3).map(c => c.id), [7001]);
for (const path of ["src/app/page.tsx", "src/app/catalog/page.tsx", "src/app/promokody/page.tsx", "src/app/category/[slug]/page.tsx"]) {
  const page = fs.readFileSync(path, "utf8");
  const isrSeconds = Number(page.match(/export const revalidate = (\d+);/)?.[1]);
  assert.ok(Number.isInteger(isrSeconds) && isrSeconds >= 60 && isrSeconds <= 3600,
    `${path} must use bounded ISR for live inventory rather than a perpetual build snapshot`);
}
const expiryCardSource = fs.readFileSync("src/components/ExpiringDeals.tsx", "utf8");
assert.ok(expiryCardSource.includes("const end = expiryTimestamp(expires)") &&
  !expiryCardSource.includes("new Date(`${expires}T23:59:59+03:00`)"),
  "Urgent offer labels must honor full ISO expiry timestamps");
for (const marker of ["НЕ НУЖЕН", "NOT REQUIRE", "NO_CODE"]) {
  const noCodeOffer = refineOffer("Скидка 10% без кода", "Условия рекламодателя", marker, "Магазин", false);
  assert.equal(noCodeOffer.isNoCode, true, `Refiner must treat ${marker} as code-free, not copyable`);
}
console.log("CATALOG-QA-4: safe highlights, ERID matching, expiry and ISR freshness PASS");
