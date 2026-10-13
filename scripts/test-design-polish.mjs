import assert from "node:assert/strict";
import fs from "node:fs";

const hero = fs.readFileSync("src/components/Hero.tsx", "utf8");
const shops = fs.readFileSync("src/components/PopularStores.tsx", "utf8");
const home = fs.readFileSync("src/app/page.tsx", "utf8");
const ticket = fs.readFileSync("src/components/CouponTicket.tsx", "utf8");
const logo = fs.readFileSync("src/components/StoreLogo.tsx", "utf8");
const adTeasers = fs.readFileSync("src/components/SberCampaignTeasers.tsx", "utf8");

assert.ok(hero.includes("Найдите скидку.") && hero.includes("Заплатите меньше."),
  "Keep the current, recognizable brand tagline");
assert.ok(hero.includes("Актуальные промокоды и купоны на скидку"),
  "Retain organic search intent");
assert.ok(hero.includes('placeholder="Магазин или промокод"'),
  "Compact search label needs to fit mobile without hiding its meaning");
assert.ok(hero.includes("suggestions.map((store, index)") &&
          hero.includes("stores.find((store) => store.slug === slug)"),
  "All shortcut shops must come from the real store index");
assert.ok(!hero.includes("REAL_POPULAR_TAGS"),
  "Do not suggest shops with no actual active promotions");
assert.ok(hero.includes('window.dispatchEvent(new CustomEvent("promo:search"'),
  "Do not disconnect hero from live coupon search");
assert.ok(hero.includes('ref={containerRef}'),
  "Preserve keyboard/search autocomplete behavior");
assert.ok(shops.includes('section aria-label="Популярные магазины"') &&
          shops.includes("index >= 6") &&
          shops.includes("s.coupons.length"),
  "Keep all real shop logos/counts; cap mobile display to six");
assert.ok(home.indexOf("<PopularStores />") < home.indexOf("<ExpiringDeals"),
  "Show real shops promptly, before urgent deals");
assert.ok(home.indexOf("<CouponGrid") < home.indexOf("<SberCampaignTeasers"),
  "Real offers must precede sponsor advertisements");
assert.ok(home.includes("<SeoArticle />") && home.includes("<Faq />"),
  "Preserve helpful SEO content");
assert.ok(ticket.includes("const { promocode, store, affiliate } = coupon") && ticket.includes("copyAndOpen") && ticket.includes("handleDirectCtaClick"),
  "Leave commission/clipboard flows in the original coupon component");
assert.ok(adTeasers.includes("SberKidsPromoHome") && adTeasers.includes("SberUlybatlHome"),
  "Preserve legal advertiser landings and disclosures");
console.log("PromoFact polish-current: UX/data/legal regressions PASS");

assert.ok(logo.includes(String.raw`name.replace(/[^\p{L}\p{N}]/gu`),
  "Brand fallback must preserve Cyrillic and Latin letters, not show placeholder dots");
assert.equal("Пятёрочка".replace(/[^\p{L}\p{N}]/gu,"").charAt(0).toUpperCase(),"П",
  "Cyrillic logo fallback must render the real initial");

const categoryPreview = fs.readFileSync("src/components/CategoryPreview.tsx", "utf8");
const categoryIndex = fs.readFileSync("src/app/category/page.tsx", "utf8");
const sitemap = fs.readFileSync("src/app/sitemap.ts", "utf8");

assert.ok(home.includes("<CategoryPreview />") &&
          home.indexOf("<PopularStores />") < home.indexOf("<CategoryPreview />") &&
          home.indexOf("<CategoryPreview />") < home.indexOf("<CouponGrid") &&
          !home.includes("<VisualCategoryTiles />"),
  "Home must preview categories before coupon cards, not render a second full catalogue");
assert.ok(categoryPreview.includes(".slice(0, 6)") &&
          categoryPreview.includes("getCategories()") &&
          categoryPreview.includes("canonicalCategorySlug") &&
          categoryPreview.includes('href="/category"'),
  "Homepage shows only six real active categories and links to the full index");
assert.ok(categoryIndex.includes("<VisualCategoryTiles />") &&
          categoryIndex.includes('alternates: { canonical: `${SITE_URL}/category` }'),
  "Full category route must retain the full canonical category catalogue");
assert.ok(sitemap.includes("url: `${SITE_URL}/category`"),
  "Category index must be discoverable in sitemap");
console.log("PromoFact category discovery: homepage preview, full route and sitemap PASS");
