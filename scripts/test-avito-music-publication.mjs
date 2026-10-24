import assert from "node:assert/strict";
import fs from "node:fs";
import { getAllStores, getCombinedCoupons } from "../src/lib/perfluence.ts";
import { getActivePromoBanners } from "../src/lib/promoBanners.ts";
import { COLLECTIONS, getCollectionCoupons } from "../src/lib/collections.ts";
import { isApprovedOct24Repost } from "../src/lib/perfluenceRepeatsOct24.ts";

const stores = await getAllStores();
const avito = stores.find(s => s.slug === "avito-puteshestviya");
assert.ok(avito);
assert.equal(avito.coupons.length, 2, "Only two approved Avito affiliate offers");
const links = new Map([
  ["2RanymPovcK", "https://avito.prfl.me/sites/r252zn?erid=2RanymPovcK"],
  ["2RanymRHutf", "https://avito.prfl.me/sites/9n9bh6?erid=2RanymRHutf"],
]);
for (const c of avito.coupons) {
  const erid = c.affiliate.ordMarker;
  assert.equal(c.affiliate.link, links.get(erid), "Approved partner link and per-offer erid");
  assert.equal(c.affiliate.landingLink, links.get(erid));
  assert.ok(c.affiliate.ordText.includes("erid: " + erid));
  assert.equal(c.promocode.code, "");
  assert.equal(c.promocode.expires, null, "Never invent unknown Avito expiry");
  assert.equal(isApprovedOct24Repost(c), true);
}
const catalog = await getCombinedCoupons();
const travel = COLLECTIONS.find(c => c.slug === "vygodnye-oteli");
assert.ok(travel);
const selected = getCollectionCoupons(travel, catalog).filter(c => c.store.slug === "avito-puteshestviya");
assert.equal(selected.length, 2);
for (const item of selected) assert.equal(item.affiliate.link, links.get(item.affiliate.ordMarker),
  "Travel collection must never reuse stale Avito widget attribution");

const music = stores.find(s => s.slug === "yandex-music");
assert.ok(music, "Music landing is available");
assert.equal(music.categorySlug, "servisy-i-podpiski");
assert.equal(music.coupons.length, 1, "Exactly one approved Music promo");
assert.equal(music.coupons[0].promocode.code, "5XMGA7H6M6");
assert.equal(music.coupons[0].affiliate.link, "https://yamuz45.prfl.me/sites/c9oxgw?erid=2RanymEuzvF");
assert.equal(music.coupons[0].affiliate.ordMarker, "2RanymEuzvF");
assert.equal(music.coupons[0].promocode.expires, "2026-10-31T23:59:59+03:00");
assert.equal(catalog.filter(c => c.store.slug === "yandex-music").length, 1);
assert.equal(getActivePromoBanners({ storeSlug: "yandex-music" }).filter(b => b.id === "yandex-music-45days").length, 1);
const books = stores.find(s => s.slug === "yandex-knigi");
assert.ok(books, "Books landing is available");
assert.equal(books.coupons.length, 1, "No duplicate Books offers");
assert.equal(books.coupons[0].promocode.code, "ZSLWVWXUC8");
assert.equal(books.coupons[0].affiliate.link, "https://yabooks45.prfl.me/sites/hw769q?erid=2RanymGPzCb");
assert.equal(books.coupons[0].affiliate.ordMarker, "2RanymGPzCb");
assert.equal(books.coupons[0].promocode.expires, "2026-10-31T23:59:59+03:00");
assert.equal(catalog.filter(c => c.store.slug === "yandex-knigi").length, 1);
const sber = stores.find(s => s.slug === "sberzdorovie");
assert.ok(sber);
assert.deepEqual(sber.coupons.map(c => c.promocode.code).sort(),
  ["PERPREGT259702", "SPPA2EFFE", "PERE7A4E5"].sort());
assert.equal(getActivePromoBanners({ storeSlug: "sberzdorovie" })
  .some(b => b.code === "PERPREGA309361"), false);

const page = fs.readFileSync("src/app/store/[slug]/page.tsx","utf8");
const ticket = fs.readFileSync("src/components/CouponTicket.tsx","utf8");
const howto = fs.readFileSync("src/components/HowToApply.tsx","utf8");
const seo = fs.readFileSync("src/lib/storeSeoContent.ts","utf8");
assert.ok(page.includes('variant={avitoByLink ? "avito-links" : "code"}'));
assert.ok(page.includes('noKnownExpiry ? "Срок действия партнёром не указан'));
assert.ok(ticket.includes('"Проверить скидку в Авито →"'));
assert.ok(howto.includes("Как получить скидку в Авито Путешествиях"));
assert.ok(seo.includes('slug === "avito-puteshestviya"'));
console.log("PASS: Avito links and conditional checkout copy, Music stale-code halt, Sber 3 current codes");
