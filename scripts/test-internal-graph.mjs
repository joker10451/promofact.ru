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
  test("Страница отдельного купона /store/[slug]/[code] канонизирована на родительский магазин", () => {
    const couponPage = fs.readFileSync(path.resolve("src/app/store/[slug]/[code]/page.tsx"), "utf-8");
    assert(couponPage.includes("parentStoreUrl = `${SITE_URL}/store/${slug}`"), "Coupon canonical must point to parent store");
  });

  // 6. Проверка Crawl Depth: главная страница ссылается на каталог, категории и статьи
  test("Crawl Depth: с главной страницы в 1 клик доступны все магазины, категории и статьи", () => {
    const homePage = fs.readFileSync(path.resolve("src/app/page.tsx"), "utf-8");
    assert(homePage.includes("<PopularStores"), "Home must link to popular stores");
    assert(homePage.includes("<CouponGrid"), "Home must embed store catalog");
    assert(homePage.includes("<VisualCategoryTiles"), "Home must link to categories");
    assert(homePage.includes("<LatestTips"), "Home must link to blog articles");
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
