/**
 * scripts/test-seo.mjs
 * Автоматический SEO-регрессионный тестовый пакет ПромоФакт:
 * 1. Sitemap Canonical & Uniqueness Check (0 duplicate /promokody/ URLs)
 * 2. 301 Permanent Redirects for legacy /promokody/[slug] -> /store/[slug]
 * 3. Title & Meta Quality Standards
 * 4. Robots.txt crawl parameter safety
 * 5. Structured Data JSON-LD coverage
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const SITE_URL = "https://promofact.ru";

async function runSeoRegressionSuite() {
  console.log("================================================================================");
  console.log("            SEO REGRESSION & INDEXATION AUDIT SUITE (PROMOFACT)                 ");
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

  // 1. Проверка robots.txt
  test("Robots.txt закрывает поисковые и фильтровые дубли (*?*q=, *?*search=)", () => {
    const robotsPath = path.resolve("src/app/robots.ts");
    const content = fs.readFileSync(robotsPath, "utf-8");
    assert(content.includes("/*?*q="), "robots.ts must disallow ?q=");
    assert(content.includes("/*?*search="), "robots.ts must disallow ?search=");
    assert(content.includes("/*?*sort="), "robots.ts must disallow ?sort=");
    assert(content.includes("/*?*filter="), "robots.ts must disallow ?filter=");
    assert(content.includes("sitemap.xml"), "robots.ts must link to sitemap.xml");
  });

  // 2. Проверка Sitemap.ts на отсутствие дублирующихся /promokody/[slug]
  test("Sitemap.ts исключает каннибализирующие /promokody/[slug] URLs", () => {
    const sitemapPath = path.resolve("src/app/sitemap.ts");
    const content = fs.readFileSync(sitemapPath, "utf-8");
    assert(!content.includes("/promokody/${store.slug}"), "sitemap.ts must not contain /promokody/[slug]");
    assert(content.includes("/store/${store.slug}"), "sitemap.ts must contain /store/[slug]");
  });

  // 3. Проверка постоянного 301-редиректа в /promokody/[slug]/page.tsx
  test("Страница /promokody/[slug] отдаёт permanentRedirect на /store/[slug]", () => {
    const redirectPath = path.resolve("src/app/promokody/[slug]/page.tsx");
    const content = fs.readFileSync(redirectPath, "utf-8");
    assert(content.includes("permanentRedirect"), "Must use permanentRedirect");
    assert(content.includes("`/store/${slug}`"), "Must redirect to /store/[slug]");
  });

  // 4. Проверка канонических ссылок в каталоге /promokody
  test("Каталог /promokody ссылается напрямую на канонические /store/[slug]", () => {
    const promokodyPath = path.resolve("src/app/promokody/page.tsx");
    const content = fs.readFileSync(promokodyPath, "utf-8");
    assert(content.includes("href={`/store/${store.slug}`}"), "Must link to /store/[slug]");
  });

  // 5. Проверка страниц магазинов: наличие JSON-LD, Trust Score, Breadcrumbs
  test("Шаблон /store/[slug] содержит BreadcrumbList, ItemList и Trust Score", () => {
    const storePagePath = path.resolve("src/app/store/[slug]/page.tsx");
    const content = fs.readFileSync(storePagePath, "utf-8");
    assert(content.includes("BreadcrumbList"), "Must contain BreadcrumbList schema");
    assert(content.includes("ItemList"), "Must contain ItemList schema");
    assert(content.includes("PromoFact Trust Score"), "Must contain First-Party Trust Score");
    assert(content.includes("StoreLogo"), "Must contain StoreLogo");
    assert(content.includes("href={`/category/${store.categorySlug}`}"), "Must link to category");
  });

  // 6. Проверка SEO-воронки в статьях блога (/sovety/[slug])
  test("Статьи блога /sovety/[slug] встраивают активные купоны (SEO-to-CPA воронка)", () => {
    const sovetyPath = path.resolve("src/app/sovety/[slug]/page.tsx");
    const content = fs.readFileSync(sovetyPath, "utf-8");
    assert(content.includes("CouponTicket"), "Must embed CouponTicket cards in articles");
    assert(content.includes("relevantCoupons"), "Must match relevant coupons by topic");
  });

  // 7. Проверка интерактивного калькулятора скидок
  test("Калькулятор экономии персонализирован по магазинам с реальными промокодами", () => {
    const calcPath = path.resolve("src/components/SavingsCalculator.tsx");
    const content = fs.readFileSync(calcPath, "utf-8");
    assert(content.includes("FEATURED_CALC_STORES"), "Must define real featured stores");
    assert(content.includes("handleCopyAndRedirect"), "Must provide direct copy & affiliate redirect");
  });

  console.log("\n================================================================================");
  if (failCount === 0) {
    console.log(`🎉 ВСЕ ${passCount}/${passCount} SEO-ТЕСТОВ УСПЕШНО ПРОЙДЕНЫ! (100% PASS)`);
  } else {
    console.error(`⚠️ НАЙДЕНО ${failCount} ОШИБОК ИЗ ${passCount + failCount} ТЕСТОВ`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runSeoRegressionSuite().catch((err) => {
  console.error("SEO Suite error:", err);
  process.exit(1);
});
