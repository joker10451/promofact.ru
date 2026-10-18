import assert from "node:assert/strict";
import fs from "node:fs";
import { extractMinimumOrder } from "../src/lib/admitadNormalizer.ts";
import { rowToCoupon } from "../src/lib/admitadSupabase.ts";
import { resolveAdmitadOfferHeadline } from "../src/lib/admitadOfferHeadline.ts";
import { refineOffer } from "../src/lib/offerRefiner.ts";
import { getStoreHeadlineOfferCounts } from "../src/lib/storeOfferHeadline.ts";

// Source-shaped rows from the actual published Admitad Supabase snapshot:
// campaign Tasty Coffee. Never invent code values or overwrite source ERIDs.
const common = {
  store: "Tasty Coffee", store_slug: "tasty-coffee",
  site: "https://shop.tastycoffee.ru/",
  affiliate_link: "https://ad.admitad.com/g/publisher-test/?i=3&erid=ERID-SOURCE-COFFEE",
  ord_marker: "ERID-SOURCE-COFFEE", ord_text: "Реклама. erid: ERID-SOURCE-COFFEE",
  is_active: true, region: "RU",
};
const row = (id, code, bonus_name, discount, terms, expires = null) => ({
  ...common, id: "adm_" + id, source_coupon_id: String(id),
  code, bonus_name, discount, terms, description: terms, expires,
});

const rows = [
  row(678330,"Admitad","на по купону","−10%",
    "Действует на чай и кофе, кроме сортов недели и месяца, мин. сумма заказа - 1000 р.", "2026-12-31"),
  row(942125,"TKPRDM-UYVG1GJO","на весь ассортимент","−15%","Скидка 15%","2027-04-29"),
  row(462917,"не нужен","При заказе от 6 ₽","Скидка","при покупке от 6 пачек кофе по 250 г"),
  row(462918,"не нужен","по промокоду при оформлении","Скидка","при покупке 6 пачек чая по 250 г"),
  row(462916,"не нужен","по промокоду","НАКОПИТЕЛЬНАЯ СИСТЕМА",
    "За каждые 1000 рублей в заказе вы получаете +1% к накопительной скидке на следующие заказы. Максимальная скидка — 15% Скидка увеличивается автоматически после получения заказа."),
  row(135538,"NOT REQUIRED","по промокоду при оформлении","Скидка",
    "Вввод промокода не требуется, акция распространяется на товары из категорий"),
  row(135537,"NOT REQUIRED","по промокоду при оформлении","Скидка",
    "Вввод промокода не требуется, акция распространяется на товары из категории чай"),
];
const coupons=rows.map(rowToCoupon);
assert(coupons.every(Boolean));
const [ten,fifteen,coffee,tea,loyalty,categories,categoryTea] = coupons;
assert.equal(ten.promocode.code, "Admitad", "Publisher code 'Admitad' is legitimate and must be preserved");
assert.equal(ten.promocode.bonusName,"−10%");
assert.equal(fifteen.promocode.code,"TKPRDM-UYVG1GJO");
assert.equal(fifteen.promocode.bonusName,"на весь ассортимент");
assert.equal(fifteen.promocode.expires,"2027-04-29");
assert.equal(coffee.promocode.bonusName,"Акция при покупке 6 пачек кофе");
assert.equal(tea.promocode.bonusName,"Акция при покупке 6 пачек чая");
assert.match(loyalty.promocode.bonusName,/Накопительная программа.*15%/);
assert.match(categories.promocode.bonusName,/без промокода/);
assert.match(categoryTea.promocode.bonusName,/чай без промокода/);
assert.match(categories.promocode.terms,/^Ввод промокода не требуется/);
assert.doesNotMatch(categories.promocode.terms,/Вввод|из категорий\s*$/);
assert.equal(coffee.promocode.code,"");
assert.equal(tea.promocode.code,"");
assert.equal(categories.promocode.code,"");
assert.deepEqual(getStoreHeadlineOfferCounts(coupons),{offers:7,codes:2,codeFree:5,barcodes:0});

for(const c of coupons) {
  assert.equal(c.affiliate.link,common.affiliate_link);
  assert.equal(c.affiliate.ordMarker,common.ord_marker);
  assert.equal(c.store.conditions,null,"Specific coupon terms cannot contaminate store-wide conditions");
  assert.equal(c.promocode.isFirstOrderOnly,false);
}
assert.equal(coffee.promocode.expires,null);
assert.equal(extractMinimumOrder("при покупке от 6 пачек кофе по 250 г"),null);
assert.equal(extractMinimumOrder("при покупке от 10 уроков"),null);
assert.equal(extractMinimumOrder("мин. сумма заказа - 1000 р.")?.value,1000);
assert.equal(extractMinimumOrder("при заказе от 1 500 ₽")?.value,1500);
assert.equal(resolveAdmitadOfferHeadline("на по купону","−10%",rows[0].terms),"−10%");

function rendered(c) {
  return refineOffer(c.promocode.bonusName,c.promocode.terms || "",c.promocode.code,c.store.name,c.promocode.isFirstOrderOnly);
}
const tenOffer=rendered(ten);
assert.equal(tenOffer.discount,"−10%");
assert.match(tenOffer.condition,/1\s*000\s*₽/);
for(const c of [coffee,tea,categories,categoryTea]) {
  const offer=rendered(c);
  assert.equal(offer.isNoCode,true);
  assert.equal(offer.missingCodeClaim,undefined,"Automatic deal is not a missing-code warning");
  assert.doesNotMatch(offer.discount+" "+offer.condition, /−6\s*₽|на по купону|При заказе от 6 ₽|Вввод/i);
}
const loyalOffer=rendered(loyalty);
assert.equal(loyalOffer.type,"default");
assert.match(loyalOffer.discount,/Накопительная программа/);
assert.match(loyalOffer.condition,/\+1% к будущей скидке/);
assert.doesNotMatch(loyalOffer.discount,/^−15%/,"Loyalty ceiling is not immediate 15% saving");

const table=fs.readFileSync("src/components/StoreSummaryTable.tsx","utf8");
assert.ok(table.includes('return "Срок не указан"'));
assert.ok(!table.includes("lastDay = new Date(now.getFullYear()"));
assert.ok(!table.includes("Обновлено сегодня"));
const seo=fs.readFileSync("src/lib/storeSeoContent.ts","utf8");
assert.ok(seo.includes("для акций без даты уточняйте актуальность"));
console.log("PASS: Tasty Coffee 2 codes + 5 deals, source-verified discount, no fake 6-ruble saving, no false promo warning, honest dates, source ERID preserved");
