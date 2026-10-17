import assert from "node:assert/strict";
import { extractMinimumOrder, resolveCustomerType } from "../src/lib/admitadNormalizer.ts";
import { resolveAdmitadOfferHeadline, hasBenefitHeadline } from "../src/lib/admitadOfferHeadline.ts";
import { rowToCoupon } from "../src/lib/admitadSupabase.ts";
import { refineOffer } from "../src/lib/offerRefiner.ts";

// Quantities are not money. Do not generate "10 ₽" from "10 lessons".
for (const value of [
  "Действует на первую покупку от 10 уроков с русскоязычным преподавателем.",
  "Добавляет 3 урока к любому пакету занятий от 10 уроков",
  "Бонус при бронировании от 2 гостей",
  "При покупке от 5 товаров",
  "От 10 занятий",
]) {
  assert.equal(extractMinimumOrder(value), null, "No fictitious RUB amount: " + value);
}
for (const [source, expected] of [
  ["при заказе от 1 999 ₽", 1999],
  ["от 4 299 руб.", 4299],
  ["от 4.299 рублей", 4299],
  ["при заказе на сумму от 4299", 4299],
  ["от 500 RUB", 500],
]) {
  assert.equal(extractMinimumOrder(source)?.value, expected, source);
}
assert.equal(resolveCustomerType(undefined, "на первую покупку уроков английского", "").customerType, "new_customers");
assert.equal(resolveCustomerType(undefined, "Добавляет 3 урока", "Действует на первую покупку от 10 уроков").customerType, "new_customers");
assert.equal(resolveCustomerType(undefined, "", "Скидка действует на первую оплату новым клиентам школы").customerType, "new_customers");
assert.equal(resolveCustomerType(undefined, "Скидка на весь ассортимент", "Для всех клиентов").customerType, "all_customers");
assert.equal(resolveCustomerType(undefined, "Для новых и повторных покупателей", "").customerType, "repeat_customers");

// Source-backed legacy snapshot fields from Englex / Admitad campaign 18326.
// Do not replace the publisher's code, URL, ERID, or expiration date.
const lessonsTerms = "Действует на первую покупку от 10 уроков с русскоязычным преподавателем. Предложение не распространяется на Интенсивный курс";
const lessonHeadline = resolveAdmitadOfferHeadline("по промокоду", "Добавляет 3 урока к любо…", lessonsTerms);
assert.match(lessonHeadline, /3 дополнительных урока/);
assert.doesNotMatch(lessonHeadline, /10 ₽/);
assert.equal(hasBenefitHeadline(lessonHeadline), true);

const pctTerms = "Скидка действует на первую оплату новым клиентам школы. Скидка распространяется только на русскоязычных преподавателей";
const pctHeadline = resolveAdmitadOfferHeadline("на первую покупку уроков английского с русскоязычным преподавателем", "−40%", pctTerms);
assert.match(pctHeadline, /^−40%/);
assert.equal(hasBenefitHeadline(pctHeadline), true);

const row = (code, discount, bonus_name, terms, firstOrder = false) => ({
  id: "adm_18326_" + code,
  code, discount, bonus_name, terms,
  store: "Инглекс", store_slug: "admitad-18326-englex",
  site: "https://englex.ru", is_first_order_only: firstOrder,
  affiliate_link: "https://xpuvo.com/g/fixture/?i=3&erid=ERID-SOURCE-2026",
  ord_marker: "ERID-SOURCE-2026",
  ord_text: "Реклама. ООО «ИНГЛЕКС», erid: ERID-SOURCE-2026",
  expires: "2027-01-31",
});
for (const [source, expectedTitle] of [
  [row("ADMITAD3", "Добавляет 3 урока к любо…", "по промокоду", lessonsTerms), /3 дополнительных урока/],
  [row("ADMITAD", "−40%", "на первую покупку уроков английского с русскоязычным преподавателем", pctTerms), /−40%/],
]) {
  const coupon = rowToCoupon(source);
  assert.ok(coupon);
  assert.match(coupon.promocode.bonusName, expectedTitle);
  assert.equal(coupon.promocode.isFirstOrderOnly, true);
  assert.equal(coupon.promocode.customerTypeLabel, "Первый заказ");
  assert.equal(coupon.promocode.isUniversal, false);
  assert.equal(coupon.promocode.code, source.code);
  assert.equal(coupon.promocode.expires, "2027-01-31");
  assert.equal(coupon.affiliate.link, source.affiliate_link);
  assert.equal(coupon.affiliate.ordMarker, source.ord_marker);
  const refined = refineOffer(coupon.promocode.bonusName, coupon.promocode.terms, coupon.promocode.code, "Инглекс", coupon.promocode.isFirstOrderOnly);
  assert.doesNotMatch(refined.condition + " " + refined.discount, /10 ₽/);
}
const ordinary = rowToCoupon(row("SHOP20", "−20%", "Скидка 20%", "Для всех клиентов. При заказе от 1 999 ₽"));
assert.equal(ordinary?.promocode.isFirstOrderOnly, false);
assert.equal(ordinary?.promocode.customerTypeLabel, "Для всех");
assert.equal(extractMinimumOrder(ordinary?.promocode.terms || "")?.value, 1999);
console.log("PASS: Englex lesson quantity, first-payment audience, real benefits and unchanged affiliate identifiers");
