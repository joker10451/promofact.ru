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
