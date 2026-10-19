import assert from "node:assert/strict";
import fs from "node:fs";
import { getAttributedCouponHref, prepareAttributedCouponClick } from "../src/lib/admitadOutboundLink.ts";
import { rowToCoupon } from "../src/lib/admitadSupabase.ts";
import { refineOffer } from "../src/lib/offerRefiner.ts";
import { getMaxVerifiedDiscount } from "../src/lib/storeDiscount.ts";

const base={store:"Aravia",store_slug:"aravia",site:"https://aravia.ru/",
 affiliate_link:"https://ad.admitad.com/g/verified/?erid=EXAMPLE-ERID",
 ord_marker:"EXAMPLE-ERID",ord_text:"Реклама. erid: EXAMPLE-ERID"};
const row=(id,code,bonus_name,discount,terms)=>({...base,id:"adm_"+id,source_coupon_id:String(id),
 code,bonus_name,discount,terms,description:terms,is_active:true});
const rows=[
 row(942802,"НОЧЬ","на по промокоду НОЧЬ","−20%","-20% на все, кроме ПРОФ, %, обучение и сертификаты"),
 row(942801,"НЕ НУЖЕН","по промокоду","Двойной кэшбек на всё","Двойной кэшбек на всё, кроме товаров категории Уход за волосами"),
 row(942800,"НЕ НУЖЕН","на Повышенный кешбэк на категорию Уход за волосами по списку","−30%","Повышенный кешбэк - 30% на категорию Уход за волосами по списку"),
 row(942799,"НЕ НУЖЕН","при заказе от 1 500 ₽","🚚 Бесплатная доставка","Подарок - арт. 9201 ARAVIA Professional Крем-уход с пептидами + бесплатная доставка"),
 row(942798,"НЕ НУЖЕН","по промокоду","Подарки за заказы!","За заказ от 3 500₽ – арт. В013, маска. За заказ от 7 000 ₽ – арт. 6300, набор. Подарки суммируются"),
 row(896263,"НЕ НУЖЕН","на Aravia: 3D-диагностика и массаж лица в Москве от","−2 000 ₽","Aravia: 3D-диагностика и массаж лица в Москве от 2000 руб."),
 row(896262,"НЕ НУЖЕН","по промокоду","Бесплатная диагностика к…","*проходит в Учебных центрах Aravia во всех городах присутствия * косметолог проводит диагностику кожи лица, делает экспресс-процедуру; можно купить косметику со скидкой 50%"),
 row(685162,"NOT REQUIRE","на номинал подарочных сертификатов","−10%","Акция для зарегистрированных пользователей интернет-магазина aravia.ru"),
 row(584854,"НЕ НУЖЕН","на Специальные условия для мастеров - заказывайте со скидкой каждый следующий месяц","−40%","Мы подарим вам скидку 40% на заказ в следующем календарном месяце. Нужен подтверждающий документ специалиста индустрии красоты. Промокод отправляется по электронной почте."),
 row(420506,"НЕ НУЖЕН","при заказе от 3 000 ₽","🚚 Бесплатная доставка","Бесплатная доставка по России при заказе от 3 000 рублей, но не более 10 кг.")
];
const coupons=rows.map(rowToCoupon);
assert(coupons.every(Boolean));
const [night,double,cb,gift,gifts,procedure,diagnostics,certificate,masters,shipping]=coupons;
const refined=c=>refineOffer(c.promocode.bonusName,c.promocode.terms||"",c.promocode.code,c.store.name,c.promocode.isFirstOrderOnly);
assert.equal(night.promocode.code,"НОЧЬ");assert.equal(refined(night).discount,"−20%");
assert.match(double.promocode.bonusName,/Двойной кешбэк/);
assert.match(cb.promocode.bonusName,/Кешбэк 30%/);
assert.equal(refined(cb).discount,"Кешбэк 30%");
assert.doesNotMatch(refined(cb).discount,/^[−-]/);
assert.match(refined(gift).discount,/Подарок/);assert.match(refined(gift).condition,/1\s*500\s*₽/);
assert.match(refined(gifts).discount,/Подарок/);assert.match(refined(gifts).condition,/3\s*500\s*₽/);
assert.equal(refined(procedure).discount,"3D-диагностика и массаж лица");
assert.match(refined(procedure).condition,/Стоимость от 2 000 ₽/);
assert.equal(refined(diagnostics).discount,"Бесплатная диагностика кожи");
assert.match(refined(diagnostics).condition,/косметику.*50%/);
assert.equal(refined(certificate).discount,"−10%");
assert.equal(refined(masters).discount,"−40%");
assert.match(refined(masters).condition,/следующего месяца/);
assert.match(refined(shipping).discount,/Бесплатная доставка/);
assert.equal(getMaxVerifiedDiscount(coupons),"до 40%");
for(const c of coupons){assert.equal(c.affiliate.link,base.affiliate_link);assert.equal(c.affiliate.ordMarker,base.ord_marker);}
const href=getAttributedCouponHref(night,"store_summary","store");
const u=new URL(href);
assert.equal(u.searchParams.get("erid"),base.ord_marker);
assert.equal(u.searchParams.get("subid"),"store_summary");
assert.equal(u.searchParams.get("subid1"),"store");
assert.equal(u.searchParams.get("subid2"),String(night.id));
assert.equal(u.searchParams.get("subid3"),"promofact");
const original=night.affiliate.link;
const anchor={href};prepareAttributedCouponClick(anchor,night,"store_summary","store");
const click=new URL(anchor.href);
assert.match(click.searchParams.get("subid4")||"",/^[0-9a-f-]{36}$/i);
assert.equal(click.searchParams.get("erid"),base.ord_marker);
assert.equal(night.affiliate.link,original);
assert.equal(new URL(getAttributedCouponHref(night,"expiring_deal","home")).searchParams.get("subid"),"expiring_deal");
// Admitad website coupons can legitimately use different i= tracking values.
// Never rewrite i or ERID when adding our SubIDs.
for (const i of ["3", "31"]) {
  const sourceUrl = `https://dkfrh.com/g/va69o33134c7dde8999c9ebcee8c5e/?i=${i}&erid=EXAMPLE-ERID`;
  const offer = { ...night, affiliate: { ...night.affiliate, link: sourceUrl } };
  const decorated = new URL(getAttributedCouponHref(offer, "store_summary", "store"));
  assert.equal(decorated.searchParams.get("i"), i);
  assert.equal(decorated.searchParams.get("erid"), "EXAMPLE-ERID");
  assert.equal(decorated.pathname, new URL(sourceUrl).pathname);
  const trackedAnchor = { href: decorated.toString() };
  prepareAttributedCouponClick(trackedAnchor, offer, "store_summary", "store");
  const tracked = new URL(trackedAnchor.href);
  assert.equal(tracked.searchParams.get("i"), i);
  assert.equal(tracked.searchParams.get("erid"), "EXAMPLE-ERID");
}
const perf={...night,promocode:{...night.promocode,group:"perfluence"}};
assert.equal(getAttributedCouponHref(perf,"store_summary","store"),original);
const pAnchor={href:original};prepareAttributedCouponClick(pAnchor,perf,"store_summary","store");assert.equal(pAnchor.href,original);
for(const path of ["src/app/store/[slug]/page.tsx","src/app/store/[slug]/[code]/page.tsx","src/app/category/[slug]/page.tsx","src/app/collections/[slug]/page.tsx","src/app/gorod/[slug]/[category]/page.tsx"]){
 const source=fs.readFileSync(path,"utf8");
 assert.doesNotMatch(source,/url:\s*c(?:oupon)?\.affiliate\.link/,"JSON-LD redirects must not leak: "+path);
}
const summary=fs.readFileSync("src/components/StoreSummaryTable.tsx","utf8");
const expiring=fs.readFileSync("src/components/ExpiringDeals.tsx","utf8");
assert.match(summary,/getAttributedCouponHref\(coupon, "store_summary", "store"\)/);
assert.match(summary,/prepareAttributedCouponClick\(event.currentTarget, coupon, "store_summary", "store"\)/);
assert.match(expiring,/getAttributedCouponHref\(coupon, "expiring_deal", "home"\)/);
assert.match(expiring,/prepareAttributedCouponClick\(event.currentTarget, coupon, "expiring_deal", "home"\)/);
console.log("PASS: Aravia semantics; attributed Admitad anchors; Perfluence unaffected; no affiliate URLs in JSON-LD");
