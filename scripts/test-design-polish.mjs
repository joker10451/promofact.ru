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
assert.ok(home.indexOf("<HomeOffersPreview") < home.indexOf("<PopularStores />") &&
          home.indexOf("<PopularStores />") < home.indexOf("<ExpiringDeals"),
  "Show real coupon preview immediately after search, before shops and urgent deals");
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
          home.indexOf("<HomeOffersPreview") < home.indexOf("<PopularStores />") &&
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

const ticketAudience = fs.readFileSync("src/components/CouponTicket.tsx", "utf8");
assert.ok(ticketAudience.includes("Уточните условия") && !ticketAudience.includes('                Для всех'),
  "Do not claim unknown coupon eligibility is universal");
assert.ok(ticketAudience.includes('offer.isNoCode ? "Без промокода" : "Промокод указан ниже"'),
  "Subscription coupon copy must reflect whether a code exists");
assert.ok(couponGrid.includes("grid grid-cols-1 gap-4 md:grid-cols-2") &&
          !couponGrid.includes("columns-1 md:columns-2"),
  "Coupon catalog must use predictable two-column grid");
console.log("PromoFact design pass: eligibility labels and responsive grid PASS");

assert.ok(homePreview.includes("Промокоды, с которых стоит начать") &&
          homePreview.includes('coupon.promocode.code ? "Есть промокод" : "Акция магазина"') &&
          homePreview.includes('coupon.promocode.code ? "Посмотреть промокод" : "Условия акции"'),
  "Homepage cards must distinguish code offers from direct deals");
assert.ok(shops.includes('s.coupons.length % 100 !== 11'),
  "Shop offer labels must handle Russian 11-14 plural exceptions");
console.log("PromoFact home visual and copy checks PASS");

assert.ok(home.includes("isRealPromoCode(c.promocode.code)"),
  "Homepage promocode preview must exclude NOT REQUIRED / НЕ НУЖЕН placeholders");
console.log("PromoFact homepage real-code classification PASS");

const customOffers = fs.readFileSync("src/lib/customCoupons.ts", "utf8");
const campaignRegistry = fs.readFileSync("src/lib/promoBanners.ts", "utf8");
const ulybatlLanding = fs.readFileSync("src/app/akcii/ulybatl-sber-185/page.tsx", "utf8");
assert.ok(customOffers.includes('code: "2921098554627"') &&
          customOffers.includes('expires: "2026-10-15"') &&
          customOffers.includes('sites/q8ufig?erid=2RanymdB9PR'),
  "Podruzhka online gift must use current code, expiry and approved affiliate placement");
assert.ok(customOffers.includes('sites/xza4uw?erid=2Ranymef8fm') &&
          customOffers.includes('expires: "2026-10-18"') &&
          customOffers.includes('Изображение и номер этого штрихкода партнёр пока не передал'),
  "Distinct in-store Podruzhka campaign must not fabricate missing barcode");
assert.ok(campaignRegistry.includes('PAUSED_PROMO_BANNER_IDS.has(b.id)') &&
          campaignRegistry.includes('"sber-ulybatl-185-2026"') &&
          ulybatlLanding.includes('PAUSED_PROMO_BANNER_IDS.has(campaign.id)'),
  "Ulybatl suspension must suppress active banners and visitor signup CTA");
console.log("PromoFact Perfluence 14 October campaign freshness and pause guards PASS");

const rotated = fs.readFileSync("src/lib/perfluenceRotatedOffers.ts", "utf8");
const custom = fs.readFileSync("src/lib/customCoupons.ts", "utf8");
assert.ok(["25GFC1TL4", "SGPFB7JJGY", "Чай", "2RanynuJXUf"].every(x => rotated.includes(x)),
  "Magnit codes and approved publisher ERID must match 14 October account");
assert.ok(["10PFNS5229", "WCPFOKT4737", "5OKTPF4737"].every(x => rotated.includes(x)),
  "WinLab rotated codes must be retained in staging");
assert.ok(custom.includes("...MAGNIT_ROTATED_OFFERS") && !custom.includes("WINLAB_ROTATED_OFFERS_PENDING_ERID"),
  "Publish Magnit codes but hold WinLab until advertising marker is verified");
assert.ok(campaignRegistry.includes('"winlab-rozygrysh-2026"'),
  "Do not display obsolete September WinLab creative after code rotation");
console.log("Perfluence code rotation and safe staged WinLab offers PASS");

const categoryPageSource = fs.readFileSync("src/app/category/[slug]/page.tsx", "utf8");
const expiringSource = fs.readFileSync("src/components/ExpiringDeals.tsx", "utf8");
const summarySource = fs.readFileSync("src/components/StoreSummaryTable.tsx", "utf8");
const refinerSource = fs.readFileSync("src/lib/offerRefiner.ts", "utf8");
assert.ok(!ticket.includes("line-clamp-2") && !ticket.includes('className="truncate"') &&
  ticket.includes("break-all [overflow-wrap:anywhere] select-all"), "Shared coupon cards must not clip deal descriptions or codes");
assert.ok(!shops.includes("w-full truncate") && !homePreview.includes("line-clamp-3") &&
  !expiringSource.includes("line-clamp-2"), "Homepage and urgent offer previews must show complete text");
assert.ok(categoryPageSource.includes("realCodeCount") &&
  categoryPageSource.includes("codeFreeCount") &&
  categoryPageSource.includes("flex flex-wrap items-center gap-2 pb-2"),
  "Category totals distinguish codes from deals and store navigation wraps");
assert.ok(summarySource.includes('className="grid gap-3 p-3 md:hidden"') &&
  summarySource.includes('className="hidden overflow-x-auto md:block"') &&
  summarySource.includes('return "Срок не указан"'),
  "Small screens need readable mobile summary cards and unknown expiry must remain unknown");
assert.ok(refinerSource.includes("const formattedTitle = title ||") &&
  refinerSource.includes("Уточните минимальную сумму заказа"),
  "Offer titles must not be auto-truncated or display dangling minimum order clauses");
console.log("PromoFact whole-site shared-card overflow and source-copy safeguards PASS");

const mergedFeed = fs.readFileSync("src/lib/perfluence.ts", "utf8");
const directoryForWinlab = fs.readFileSync("src/app/promokody/page.tsx", "utf8");
const searchApiForWinlab = fs.readFileSync("src/app/api/search/route.ts", "utf8");
const winlabLanding = fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8");
assert.ok(expiringSource.includes("lg:grid-cols-2") &&
  !expiringSource.includes("lg:grid-cols-4") &&
  expiringSource.includes('rawTitle.length > 82 ? "Промокод магазина"') &&
  expiringSource.includes('href={`/store/${coupon.store.slug}#coupon-${coupon.id}`}'),
  "Urgent offers must be short two-column teasers with access to complete terms");
assert.ok(directoryForWinlab.includes('allStores.find((store) => store.slug === "winlab")') &&
  directoryForWinlab.includes('href="/store/winlab"') &&
  searchApiForWinlab.includes('STABLE_STORES.winlab') &&
  home.includes('STABLE_STORES.winlab') &&
  winlabLanding.includes('slug === "winlab"'),
  "Unmarked WinLab must remain a discoverable store, not a live offer");
assert.ok(mergedFeed.includes('if (c.store.slug === "winlab") return false') &&
  !customOffers.includes("...WINLAB_ROTATED_OFFERS_PENDING_ERID"),
  "Do not reactivate WinLab partner codes until its current ERID is verified");
console.log("Urgent deals redesign and WinLab merchant preservation PASS");

const brandAsset = fs.readFileSync("public/brands/podruzhka-mark.svg", "utf8");
const brandRegistrySource = fs.readFileSync("src/lib/brandLogos.ts", "utf8");
const storeLogoSource = fs.readFileSync("src/components/StoreLogo.tsx", "utf8");
const stableRegistrySource = fs.readFileSync("src/lib/stableStores.ts", "utf8");
const storeBrowserSource = fs.readFileSync("src/components/StoreCouponBrowser.tsx", "utf8");
const podruzhkaRetail = customOffers.split("  {\n    id: 50042,")[1]?.split("extraLinks:")[0] || "";
const podruzhkaOnline = customOffers.split("  {\n    id: 50041,")[1]?.split("extraLinks:")[0] || "";
assert.ok(brandAsset.includes('viewBox="0 0 128 128"') &&
  brandRegistrySource.includes('logoUrl: "/brands/podruzhka-mark.svg"') &&
  stableRegistrySource.includes('"logo": "/brands/podruzhka-mark.svg"') &&
  storeLogoSource.includes('slug === "podruzhka" ? "/brands/podruzhka-mark.svg"'),
  "Podruzhka logo must use a stable, local store mark, not a failing remote favicon");
assert.ok(podruzhkaOnline.includes('code: "2921098554627"') &&
  podruzhkaOnline.includes("isBarcode: false") &&
  podruzhkaRetail.includes('code: ""') &&
  podruzhkaRetail.includes("isBarcode: true") &&
  podruzhkaRetail.includes("barcodeImage: null") &&
  podruzhkaRetail.includes("isHit: false"),
  "Online and retail Podruzhka offers must have different mechanics and no invented barcode");
assert.ok(ticket.includes("const missingBarcode = promocode.isBarcode && !promocode.code && !promocode.barcodeImage") &&
  ticket.includes(') : missingBarcode ? (') &&
  ticket.includes("Штрихкод ожидает загрузки") &&
  ticket.includes('role="status"') &&
  ticket.includes('Штрихкод ещё не предоставлен — показать его кассиру пока нельзя'),
  "Retail barcode without source bytes must never look redeemable");
assert.ok(storeBrowserSource.includes("hasRetailBarcodeOffer") &&
  storeBrowserSource.includes("Онлайн-промокод и розничная акция по штрихкоду") &&
  storeBrowserSource.includes("Штрихкод ожидается") === false &&
  storeBrowserSource.includes("штрихкод ожидается"),
  "Podruzhka dual-mechanic offers need explicit labels instead of generic audience filters");
console.log("Podruzhka logo, online code and missing in-store barcode guards PASS");
