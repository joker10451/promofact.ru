import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const home = read("src/app/page.tsx");
const hero = read("src/components/Hero.tsx");
const header = read("src/components/Header.tsx");
const stores = read("src/components/PopularStores.tsx");
const coupons = read("src/components/CouponGrid.tsx");
const featured = read("src/components/ExpiringDeals.tsx");
const css = read("src/app/globals.css");
const regulations = read("src/components/SberCampaignTeasers.tsx");
const storeLogo = read("src/components/StoreLogo.tsx");
const storePage = read("src/app/store/[slug]/page.tsx");
const categoryPage = read("src/app/category/[slug]/page.tsx");
const merchantIndex = read("src/app/promokody/page.tsx");
const adviceIndex = read("src/app/sovety/page.tsx");
const collectionsPage = read("src/app/collections/[slug]/page.tsx");

assert.ok(home.includes('className="pf-v3"'), "Editorial design must be scoped to the homepage");
assert.ok(css.includes(".pf-v3 {"), "Scoped design tokens required");
assert.ok(hero.includes("Скидки, которые") && hero.includes("легко найти."), "Editorial H1 must render");
assert.ok(hero.includes('ref={containerRef}') && hero.includes("submitSearch(q)"), "Search behavior must remain wired");
assert.ok(hero.includes('window.dispatchEvent(new CustomEvent("promo:search"'), "Hero-to-catalog search must be preserved");
assert.ok(hero.includes("stores.slice(0, 6)"), "Quick tags must come from real active shop data");
assert.ok(!hero.includes("REAL_POPULAR_TAGS"), "Do not imply static suggested shops have active coupons");
assert.ok(stores.includes('aria-label="Популярные магазины"'), "Accessible live popular-stores section required");
assert.ok(stores.includes('index >= 6 ? "hidden sm:flex"'), "Mobile popular-store cap remains six");
assert.ok(header.includes("MegaMenu groups={groups}") && header.includes("MobileCatalogMenu groups={groups}"), "Do not break category menus");
assert.ok(header.includes("<HeaderSearchTrigger />"), "Global search preserved");
assert.ok(coupons.includes('id="catalog"'), "Catalog anchor cannot be renamed");
assert.ok(coupons.includes('onClick={() => setQuickFilter("first")}'), "Original first-order filter required");
assert.ok(coupons.includes('onClick={() => setQuickFilter("discount_20")}'), "Thresholded deal filter required");
assert.equal((coupons.match(/Быстрые смарт-фильтры/g) || []).length, 0, "Second duplicate smart filter removed");
assert.ok(!coupons.includes("Левая колонка: Категории (Desktop sticky)"), "Old sidebar must not block content on desktop");
assert.ok(coupons.includes('id="pf3-category"') && coupons.includes('onChange={(e) => setFilter(e.target.value)}'), "All categories require a keyboard-accessible selector");
assert.ok(featured.includes("grid-flow-col") && featured.includes("snap-x snap-mandatory"),
  "All real expiring deals remain accessible through a mobile horizontal rail");
assert.ok(home.indexOf("<PopularStores />") < home.indexOf("<CouponGrid"), "Shop browsing should precede coupon catalog");
assert.ok(home.indexOf("<CouponGrid") < home.indexOf("<SberCampaignTeasers />"), "Real offers should precede advertising");
assert.ok(home.includes("<SeoArticle />") && home.includes("<Faq />"), "SEO and helpful content must be preserved");
assert.ok(home.includes("<SavingsCalculator />"), "Secondary calculator must still exist, just collapsed");
assert.ok(regulations.includes("<SberKidsPromoHome />") && regulations.includes("<SberUlybatlHome />"), "Full advertiser pages remain linked");
assert.ok(featured.includes("coupon.affiliate.ordText"), "Legal ad copy must remain visible");
assert.ok(featured.includes("nofollow sponsored noopener"), "Affiliate relationship must remain disclosed");
assert.ok(featured.includes("copy(coupon.promocode.code"), "Promo-copy logic must remain wired");
console.log("PromoFact Editorial 3.0 design/data/legal regression PASS");

assert.ok(!hero.includes("border-[10px]"), "Decorative fake shopping bag removed");
assert.ok(hero.includes("Ваш путь к выгоде"), "Editorial desktop sidebar explains real user flow");
assert.ok(css.includes(".pf3-serif"), "Serif typography in editorial design system");
assert.ok(coupons.includes("Все категории") && coupons.includes("Сбросить категорию"), "Category controls usable without hidden rail");

assert.ok(storeLogo.includes(String.raw`name.replace(/[^\p{L}\p{N}]/gu`),
  "Brand fallback must recognize Unicode letters (including Cyrillic)");
assert.equal("Пятёрочка".replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase(), "П",
  "Unicode monogram for Russian brand must display its letter");

for (const [name, route] of [["store", storePage], ["category", categoryPage]]) {
  assert.ok(route.includes('className="pf3-detail"'), `${name} must use Editorial styles`);
  assert.ok(route.includes("<Header />") && route.includes("<Footer />"), `${name} must have complete navigation`);
  assert.ok(route.includes("generateMetadata") && route.includes("canonical"), `${name} must preserve SEO metadata`);
}
assert.ok(storePage.includes("StoreCouponBrowser") && storePage.includes("getOfferSchema"),
  "Merchant page must preserve real offers and their schema");
assert.ok(categoryPage.includes('placement="category_coupon"') && categoryPage.includes("getCoupons"),
  "Category page must retain offers and affiliate tracking");
assert.ok(css.includes(".pf3-detail {"), "Editorial sitewide detail-page tokens required");

for (const [name, route] of [["all shops", merchantIndex], ["articles", adviceIndex], ["collections", collectionsPage]]) {
  assert.ok(route.includes('className="pf3-detail"'), `${name} must use Editorial styles`);
  assert.ok(route.includes("<Header />") && route.includes("<Footer />"), `${name} must preserve complete navigation`);
}
assert.ok(merchantIndex.includes("getStores") && merchantIndex.includes("store.coupons.length"),
  "Shop directory must only display real active shops");
assert.ok(collectionsPage.includes("collection_coupon") && collectionsPage.includes("getCoupons"),
  "Collections must preserve real coupon data");
