/**
 * scripts/test-internal-graph.mjs
 * Тест графа внутренней перелинковки, отсутствия Orphan-страниц и глубины обхода (Crawl Depth):
 * 1. 0 Orphan Pages (каждая страница имеет входящие внутренние ссылки)
 * 2. Crawl Depth <= 3 от главной страницы (Home -> Category/Catalog -> Store -> Coupon)
 * 3. Bidirectional graph (Store <-> Category <-> Article)
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

async function runInternalGraphSuite() {
  console.log("================================================================================");
  console.log("            INTERNAL LINKING GRAPH & ZERO-ORPHAN AUDIT SUITE                    ");
  console.log("================================================================================\n");

  let passCount = 0;
  let failCount = 0;

  function test(description, fn) {
    try {
      fn();
      console.log(`✓ [PASS] ${description}`);
      passCount++;
    } catch (err) {
      console.error(`✗ [FAIL] ${description}:`, err.message);
      failCount++;
    }
  }

  // 1. Проверка связности Store -> Category
  test("Каждая страница магазина ссылается на родительскую категорию", () => {
    const storePage = fs.readFileSync(path.resolve("src/app/store/[slug]/page.tsx"), "utf-8");
    assert(storePage.includes("href={`/category/${store.categorySlug}`}"), "Store must link to its category");
  });

  // 2. Проверка связности Store -> Related Articles
  test("Каждая страница магазина ссылается на релевантные статьи базы знаний", () => {
    const storePage = fs.readFileSync(path.resolve("src/app/store/[slug]/page.tsx"), "utf-8");
    assert(storePage.includes("href={`/sovety/${a.slug}`}"), "Store must link to related articles");
  });

  // 3. Проверка связности Store -> Other Stores
  test("Каждая страница магазина ссылается на похожие магазины в той же категории", () => {
    const storePage = fs.readFileSync(path.resolve("src/app/store/[slug]/page.tsx"), "utf-8");
    assert(storePage.includes("<OtherStores"), "Store must render OtherStores component");
  });

  // 4. Проверка связности Article -> Coupons & Stores
  test("Каждая статья блога содержит входящие ссылки на купоны и магазины", () => {
    const articlePage = fs.readFileSync(path.resolve("src/app/sovety/[slug]/page.tsx"), "utf-8");
    assert(articlePage.includes("<CouponTicket"), "Article must embed active CouponTicket");
    assert(articlePage.includes("href={r.href}"), "Article must link to related store tags");
  });

  // 5. Проверка каноничности и связности Coupon details -> Store
  test("Страница отдельного купона /store/[slug]/[code] канонизирована на родительский магазин и noindex", () => {
    const couponPage = fs.readFileSync(path.resolve("src/app/store/[slug]/[code]/page.tsx"), "utf-8");
    assert(couponPage.includes("parentStoreUrl = `${SITE_URL}/store/${slug}`"), "Coupon canonical must point to parent store");
    assert(couponPage.includes("index: false"), "Coupon page must have robots.index = false");
    assert(couponPage.includes("follow: true"), "Coupon page must have robots.follow = true");
  });

  // 6. Проверка отсутствия статических внутренних ссылок на CATEGORY_ALIASES
  test("Ни одна статическая внутренняя ссылка в src/ не ведет на alias-категории", () => {
    const taxonomyFile = fs.readFileSync(path.resolve("src/lib/categoryTaxonomy.ts"), "utf-8");
    const m = taxonomyFile.match(/export const CATEGORY_ALIASES: Record<string, string> = \{([^}]+)\};/);
    assert(m, "CATEGORY_ALIASES should exist");
    const aliases = m[1]
      .split("\n")
      .map((line) => line.split(":")[0]?.trim().replace(/['"]/g, ""))
      .filter(Boolean);

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(tsx?|json)$/.test(entry.name)) {
          if (entry.name === "categoryTaxonomy.ts" || entry.name === "legacyRedirects.ts") continue;
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const alias of aliases) {
            assert(
              !content.includes(`/category/${alias}`),
              `Файл ${fullPath} содержит внутреннюю ссылку на alias-категорию /category/${alias}`
            );
          }
        }
      }
    }
    scanDir(path.resolve("src"));
  });

  // 7. Проверка HeaderSearch: ссылки на купоны ведут на страницу магазина с якорем
  test("HeaderSearch использует канонические URL магазинов с якорями #coupon-ID", () => {
    const searchFile = fs.readFileSync(path.resolve("src/components/HeaderSearch.tsx"), "utf-8");
    assert(searchFile.includes("href={`/store/${coupon.storeSlug}#coupon-${coupon.id}`}"), "HeaderSearch must link to store anchor");
    assert(!searchFile.includes("href={`/store/${coupon.storeSlug}/${encodeURIComponent(coupon.code)}`}"), "HeaderSearch must not link to coupon subpage");
    const ticketFile = fs.readFileSync(path.resolve("src/components/CouponTicket.tsx"), "utf-8");
    assert(ticketFile.includes('id={`coupon-${coupon.id}`}'), "CouponTicket must have id matching coupon-${coupon.id}");
  });

  // Crawl depth stays <=2: home -> /category -> canonical category.
  test("Crawl Depth: все категории доступны с главной через индекс за два клика", () => {
    const homePage = fs.readFileSync(path.resolve("src/app/page.tsx"), "utf-8");
    const preview = fs.readFileSync(path.resolve("src/components/CategoryPreview.tsx"), "utf-8");
    const hub = fs.readFileSync(path.resolve("src/app/category/page.tsx"), "utf-8");
    const tiles = fs.readFileSync(path.resolve("src/components/VisualCategoryTiles.tsx"), "utf-8");
    const sitemap = fs.readFileSync(path.resolve("src/app/sitemap.ts"), "utf-8");
    assert(homePage.includes("<PopularStores"), "Home must link to active stores");
    const fullCatalog = fs.readFileSync(path.resolve("src/app/catalog/page.tsx"), "utf-8");
    const offerPreview = fs.readFileSync(path.resolve("src/components/HomeOffersPreview.tsx"), "utf-8");
    assert(homePage.includes("<HomeOffersPreview"), "Home must link to a real offer preview");
    assert(offerPreview.includes('href="/catalog#catalog"'), "Preview must link to full catalogue");
    assert(fullCatalog.includes("<CouponGrid"), "Full catalogue must retain filters and real coupons");
    assert(homePage.includes("<LatestTips"), "Home must link to articles");
    assert(homePage.includes("<CategoryPreview />"), "Home must display compact category preview");
    assert(preview.includes('href="/category"'), "Preview must open the category index");
    assert(preview.includes('href={`/category/${category.slug}`}'), "Preview must link to live categories");
    assert(hub.includes("<VisualCategoryTiles />"), "Index must render full category taxonomy");
    assert(tiles.includes('href={`/category/${c.slug}`}'), "Index must render canonical category links");
    assert(sitemap.includes("url: `${SITE_URL}/category`"), "Category index must be discoverable in sitemap");
  });

  console.log("\n================================================================================");
  if (failCount === 0) {
    console.log(`🎉 ВСЕ ${passCount}/${passCount} ТЕСТОВ ГРАФА ПЕРЕЛИНКОВКИ УСПЕШНО ПРОЙДЕНЫ! (100% PASS)`);
  } else {
    console.error(`⚠️ НАЙДЕНО ${failCount} ОШИБОК ИЗ ${passCount + failCount} ТЕСТОВ`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runInternalGraphSuite().catch((err) => {
  console.error("Graph Suite error:", err);
  process.exit(1);
});
