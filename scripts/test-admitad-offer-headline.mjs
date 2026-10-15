import assert from "node:assert/strict";
import { resolveAdmitadOfferHeadline, isConditionOnlyOfferTitle, hasBenefitHeadline } from "../src/lib/admitadOfferHeadline.ts";
import { rowToCoupon } from "../src/lib/admitadSupabase.ts";
import { refineOffer } from "../src/lib/offerRefiner.ts";
import { pickExpiringDeals } from "../src/lib/hotDeals.ts";

const cases = [
  ["Ив Роше", "SEP-Admitad-N1M", "при заказе от 4 000 ₽", "−25%", "25% от 4000 руб",
    "−25% · при заказе от 4 000 ₽"],
  ["Globus", "adm2026next", "при заказе от 8 790 ₽", "−20%",
    "Суммируется с акциями, действует на товары по ссылке", "−20% · при заказе от 8 790 ₽"],
  ["Befree", "15admitadTRD", "при заказе от 10 000 ₽", "−15%",
    "Скидка -15% на покупку от 10 000 руб.", "−15% · при заказе от 10 000 ₽"],
  ["Globus", "adm189next", "при заказе от 8 970 ₽", "−1 000 ₽",
    "Кроме товаров исключений и акционных товаров", "−1 000 ₽ · при заказе от 8 970 ₽"],
  ["Globus", "admtula", "при заказе от 3 500 ₽", "🚚 Бесплатная доставка",
    "Бесплатная доставка от 3500 руб", "Бесплатная доставка · при заказе от 3 500 ₽"],
  ["Pizza Sushi Wok", "WW-82894", "При заказе от 1 999 ₽", "Скидка",
    "Подарок на выбор при заказе от 1999 рублей", "Подарок на выбор · при заказе от 1 999 ₽"],
  ["Davines", "НЕ НУЖЕН", "При заказе от 4 000 ₽", "99%",
    "Маска ТСС в подарок при оплате банковской картой online на сумму свыше 4000 рублей",
    "Подарок к заказу · при заказе от 4 000 ₽"],
  ["Aravia", "НЕ НУЖЕН", "при заказе от 1 500 ₽", "🚚 Бесплатная доставка",
    "Подарок - крем-уход с пептидами, при заказе от 1500 рублей",
    "Подарок к заказу · при заказе от 1 500 ₽"],
  ["Randewoo", "ADMITAD", "при заказе от 3 000 ₽", "−7%",
    "Скидка 7% на заказы от 3 000₽", "−7% · при заказе от 3 000 ₽"],
];
for (const [store, code, title, discount, terms, expected] of cases) {
  const mapped = resolveAdmitadOfferHeadline(title, discount, terms);
  assert.equal(mapped, expected, store + ": must show benefit AND minimum order");
  const row = {
    id: "adm_" + code, code, store, store_slug: store.toLowerCase().replaceAll(" ", "-"),
    bonus_name: title, discount, terms, expires: "2099-12-31",
    affiliate_link: "https://publisher.example/g/test?erid=2RanykEXAMPLE",
    ord_marker: "2RanykEXAMPLE", ord_text: "Реклама. erid: 2RanykEXAMPLE",
    category: "Покупки",
  };
  const coupon = rowToCoupon(row);
  assert.ok(coupon, store + ": rowToCoupon must preserve coupon");
  assert.equal(coupon.promocode.bonusName, expected, store + ": live Admitad mapping");
  assert.equal(coupon.promocode.terms, terms, store + ": don't discard restrictions");
  assert.equal(coupon.promocode.code, code === "НЕ НУЖЕН" ? "" : code);
  assert.equal(hasBenefitHeadline(coupon.promocode.bonusName), true);
  if (code !== "НЕ НУЖЕН") {
    const ticket = refineOffer(expected, terms, code, store, false);
    assert.notEqual(ticket.discount, title, store + ": ticket must not claim threshold is discount");
  }
}

assert.equal(resolveAdmitadOfferHeadline("−15% на всё", "−15%", ""), "−15% на всё",
  "Already informative titles must remain unchanged");
assert.equal(resolveAdmitadOfferHeadline("при заказе от 500 ₽", "99%", "Условия у магазина"),
  "Выгода не уточнена · при заказе от 500 ₽", "Unlabelled 99% must not become a fake discount");
assert.equal(hasBenefitHeadline("Выгода не уточнена · при заказе от 500 ₽"), false);
assert.equal(isConditionOnlyOfferTitle("при заказе от 4 000 ₽"), true);
assert.equal(isConditionOnlyOfferTitle("−25% при заказе от 4 000 ₽"), false);
assert.equal(resolveAdmitadOfferHeadline("Скидка", "−25%", "Условия акции"), "−25%",
  "Recover benefit from a generic label without pretending it has a threshold");
assert.equal(resolveAdmitadOfferHeadline("при заказе от 3 000 ₽", "Скидка",
  "Кешбэк 10% за покупку"), "Кешбэк 10% · при заказе от 3 000 ₽",
  "Cashback must not be mislabeled as a discount");
assert.deepEqual(pickExpiringDeals([
  rowToCoupon({ id: "x1", store: "Yves", store_slug: "iv-roshe", code: "REAL",
    bonus_name: "при заказе от 4 000 ₽", discount: "−25%", terms: "Акция",
    expires: "2099-12-31", affiliate_link: "https://publisher.example/?erid=2RanykEXAMPLE",
    ord_marker: "2RanykEXAMPLE", ord_text: "Реклама. erid: 2RanykEXAMPLE" }),
  rowToCoupon({ id: "x2", store: "Other", store_slug: "other", code: "VAGUE",
    bonus_name: "при заказе от 500 ₽", discount: "Скидка", terms: "Условия",
    expires: "2099-12-31", affiliate_link: "https://publisher.example/?erid=2RanykEXAMPLE",
    ord_marker: "2RanykEXAMPLE", ord_text: "Реклама. erid: 2RanykEXAMPLE" }),
].filter(Boolean)).map(c => c.promocode.code), ["REAL"],
  "Hero should not prioritize coupons without a known benefit");
console.log("ADMITAD-BENEFIT: source discount, minimum order, gifts, free delivery, unknown-claims and cards PASS");
