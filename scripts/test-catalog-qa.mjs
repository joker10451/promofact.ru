import assert from "node:assert/strict";
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
