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
assert.ok(hero.includes('router.push(v ? `/catalog?q=${encodeURIComponent(v)}#catalog`'),
  "Hero search must navigate to the full catalog and preserve its search term");
assert.ok(hero.includes('ref={containerRef}'),
  "Preserve keyboard/search autocomplete behavior");
assert.ok(shops.includes('section aria-label="Популярные магазины"') &&
          shops.includes("index >= 6") &&
          shops.includes("s.coupons.length"),
  "Keep all real shop logos/counts; cap mobile display to six");
assert.ok(home.indexOf("<PopularStores />") < home.indexOf("<ExpiringDeals"),
  "Show real shops promptly, before urgent deals");
assert.ok(home.indexOf("<HomeOffersPreview") < home.indexOf("<SberCampaignTeasers"),
  "Real offer preview must precede sponsor advertisements");
const guide = fs.readFileSync("src/app/guide/page.tsx", "utf8");
const faqs = fs.readFileSync("src/lib/faqContent.ts", "utf8");
const faqComponent = fs.readFileSync("src/components/Faq.tsx", "utf8");
assert.ok(!home.includes("<SeoArticle />") && !home.includes("<Faq />") &&
          guide.includes("<SeoArticle />") && guide.includes("<Faq />") &&
          guide.includes("<HowItWorks />") && guide.includes("<Subscribe />"),
  "Move helpful instructions and full FAQ to a dedicated canonical landing");
assert.ok(guide.includes('"@type": "FAQPage"') &&
          guide.includes("FAQ_ITEMS.map((item)") &&
          faqComponent.includes('import { FAQ_ITEMS } from "@/lib/faqContent"') &&
          faqs.includes("export const FAQ_ITEMS"),
  "FAQ schema and visible answers must share one data source");
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
          home.indexOf("<CategoryPreview />") < home.indexOf("<HomeOffersPreview") &&
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

const couponGrid = fs.readFileSync("src/components/CouponGrid.tsx", "utf8");
const urgentDeals = fs.readFileSync("src/components/ExpiringDeals.tsx", "utf8");
const mobileNav = fs.readFileSync("src/components/MobileBottomNav.tsx", "utf8");
assert.ok(couponGrid.includes("allCoupons.length} предложений от {totalStoreCount} магазинов") &&
          couponGrid.includes("featuredCount = allCoupons.length - coupons.length") &&
          couponGrid.includes('href="#expiring"'),
  "Site-wide totals must reconcile with the non-duplicated coupon grid");
assert.ok(urgentDeals.includes('id="expiring"') && urgentDeals.includes("Скопировать") &&
          urgentDeals.includes("nofollow sponsored noopener"),
  "Featured offers must be copyable, linked and marked as sponsored");
assert.ok(mobileNav.includes('href: "/category"') && mobileNav.includes('active: pathname.startsWith("/category")'),
  "Mobile bottom navigation must link to the full category catalogue");
console.log("PromoFact discovery UX: truthful totals, featured links and mobile navigation PASS");

const calculator = fs.readFileSync("src/components/SavingsCalculator.tsx", "utf8");
const calculatorPage = fs.readFileSync("src/app/calculator/page.tsx", "utf8");
const categoryPreviewUpdated = fs.readFileSync("src/components/CategoryPreview.tsx", "utf8");
assert.ok(!couponGrid.includes("Быстрые смарт-фильтры") &&
          couponGrid.includes("Быстрые интерактивные фильтры"),
  "Do not render duplicate filter controls for the same quickFilter state");
assert.ok(categoryPreviewUpdated.includes("grid-flow-col") &&
          categoryPreviewUpdated.includes("overflow-x-auto") &&
          categoryPreviewUpdated.includes("snap-start"),
  "Keep mobile category preview to one horizontally scrollable row");
const homeResources = fs.readFileSync("src/components/HomeResourcesPreview.tsx", "utf8");
assert.ok(!home.includes("<SavingsCalculator />") &&
          home.includes("<HomeResourcesPreview />") &&
          homeResources.includes('href: "/calculator"') &&
          calculatorPage.includes("<SavingsCalculator />") &&
          sitemap.includes("url: `${SITE_URL}/calculator`"),
  "Large calculator must live on a dedicated linked, indexable route");
assert.ok(!calculator.includes("FEATURED_CALC_STORES") &&
          !calculator.includes("affiliateUrl") &&
          !calculator.includes("navigator.clipboard") &&
          calculator.includes("примерный математический расчёт"),
  "Calculator must not fabricate live voucher validity or copy stale hard-coded promo codes");
console.log("PromoFact compact home and honest calculator regressions PASS");

const homePreview = fs.readFileSync("src/components/HomeOffersPreview.tsx", "utf8");
const catalogPage = fs.readFileSync("src/app/catalog/page.tsx", "utf8");
const header = fs.readFileSync("src/components/Header.tsx", "utf8");
assert.ok(!home.includes("<CouponGrid") && home.includes("<HomeOffersPreview"),
  "Keep large, fully interactive catalogue off the homepage");
assert.ok(catalogPage.includes("<CouponGrid") && catalogPage.includes("coupons.map(toCatalogCoupon)") &&
          couponGrid.includes('new URLSearchParams(window.location.search).get("q")') &&
          catalogPage.includes('alternates: { canonical: `${SITE_URL}/catalog` }'),
  "Preserve full active coupon feed, functionality and indexable canonical route");
assert.ok(homePreview.includes('href="/catalog#catalog"') &&
          homePreview.includes('href={`/store/${coupon.store.slug}#coupon-${coupon.id}`}') &&
          homePreview.includes("coupon.affiliate.ordText"),
  "Preview links to genuine store coupons and preserves advertising disclosures");
assert.ok(header.includes('href="/catalog#catalog"') &&
          mobileNav.includes('href: "/catalog"') &&
          sitemap.includes("url: `${SITE_URL}/catalog`"),
  "Main menu, bottom navigation and sitemap must link to new catalogue");
console.log("PromoFact dedicated catalog and homepage preview regressions PASS");

assert.ok(homeResources.includes('href: "/guide"') &&
          homeResources.includes('href: "/sovety"') &&
          !home.includes("<HowItWorks />") &&
          !home.includes("<LatestTips />") &&
          !home.includes("<Subscribe />") &&
          !home.includes("<TeamBanner />") &&
          !home.includes("FAQ_JSONLD"),
  "Homepage must show short resource links rather than redundant long content blocks");
assert.ok(sitemap.includes("url: `${SITE_URL}/guide`") &&
          guide.includes('alternates: { canonical: `${SITE_URL}/guide` }'),
  "New guide must have a canonical and sitemap entry");
console.log("PromoFact editorial cleanup: concise homepage and dedicated help route PASS");


const storeLanding = fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8");
const storeCouponBrowserPos = storeLanding.indexOf("<StoreCouponBrowser");
const storeBannerPos = storeLanding.indexOf("getActivePromoBanners({ storeSlug: store.slug })");
assert.ok(storeCouponBrowserPos !== -1 && storeBannerPos !== -1 && storeCouponBrowserPos < storeBannerPos,
  "Store coupon cards must be displayed before any large affiliate banners");
const storeBannerSources = fs.readFileSync("src/lib/promoBanners.ts", "utf8");
const otpEntry = storeBannerSources.split('id: "otp-bank-debet-card-2026"')[1]?.split("startsAt:")[0] ?? "";
assert.ok(otpEntry.includes('storeSlug: "otp-bank"') &&
          !otpEntry.includes('storeSlugs:'),
  "OTP creative is strictly restricted to its own bank page");
console.log("Store landing UX: merchant coupon priority and OTP cross-brand isolation PASS");

const customOffers = fs.readFileSync("src/lib/customCoupons.ts","utf8");
const mergedOffers = fs.readFileSync("src/lib/perfluence.ts","utf8");
const promoRegistry = fs.readFileSync("src/lib/promoBanners.ts","utf8");
const rotated = fs.readFileSync("src/lib/perfluenceRotatedOffers.ts","utf8");
const browser = fs.readFileSync("src/components/StoreCouponBrowser.tsx","utf8");
assert.ok(home.indexOf("<PopularStores />") < home.indexOf("<CategoryPreview />") &&
  home.indexOf("<CategoryPreview />") < home.indexOf("<ExpiringDeals") &&
  home.indexOf("<ExpiringDeals") < home.indexOf("<HomeOffersPreview"),
  "Restore October 13 home structure before the October 14 visual pass");
assert.ok(urgentDeals.includes("lg:grid-cols-4") &&
  urgentDeals.includes("line-clamp-2") &&
  !urgentDeals.includes('rawTitle.length > 82 ? "Промокод магазина"'),
  "Restore four-column urgent deals without generic replacement titles");
assert.ok(logo.includes("style={{ width: size, height: size }}") &&
  logo.includes('slug === "podruzhka" ? "/brands/podruzhka-mark.svg"'),
  "Keep 28px logo fallback and stable Podruzhka mark in restored layout");
assert.ok(customOffers.includes('code: "2921098554627"') &&
  customOffers.includes('code: "2921098553491"') &&
  customOffers.includes('sites/q8ufig?erid=2RanymdB9PR') &&
  customOffers.includes('sites/xza4uw?erid=2Ranymef8fm'),
  "Preserve both Podruzhka approved placements after visual rollback");
assert.ok(browser.includes("hasRetailBarcodeOffer") &&
  browser.includes("hasOnlinePromoOffer") &&
  browser.includes("grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:gap-5") &&
  browser.includes("Промокод для сайта и штрихкод для магазина") &&
  !browser.includes("mb-4 grid gap-2 rounded-2xl border border-violet-200") &&
  !browser.includes("sm:grid-cols-2 sm:p-4"),
  "Podruzhka keeps distinct redemption methods in two full-width, compact and unstretched cards");
assert.ok(mergedOffers.includes("const freshCustomCoupons") &&
  mergedOffers.indexOf("const freshCustomCoupons") > mergedOffers.indexOf("export async function getCombinedCoupons()") &&
  mergedOffers.includes("base-source-buckets-no-custom-v2"),
  "Fresh custom coupons must not depend on persistent pre-deployment snapshots");
assert.ok(rotated.includes("25GFC1TL4") &&
  rotated.includes("SGPFB7JJGY") &&
  !customOffers.includes("...WINLAB_ROTATED_OFFERS_PENDING_ERID") &&
  promoRegistry.includes('PAUSED_PROMO_BANNER_IDS'),
  "Preserve Magnit and partner compliance rules");
console.log("October 13 visual rollback + current publisher campaigns and fresh custom coupon cache PASS");
