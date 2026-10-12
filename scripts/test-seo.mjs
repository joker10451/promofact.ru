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

  // 3b. Config redirect takes precedence over SSG/ISR dynamicParams=false.
  // Indexed historical URLs such as /promokody/farfor must never return a build-time 404.
  test("Legacy /promokody/:slug routes to canonical store before dynamic route matching", () => {
    const config = fs.readFileSync(path.resolve("next.config.ts"), "utf-8");
    assert(config.includes('source: "/promokody/:slug"'));
    assert(config.includes('destination: "/store/:slug"'));
    assert.match(config, /source: "\/promokody\/:slug",[\s\S]*?permanent: true/);
  });

  // 3c. Search-intent title for verified, active Tasty Coffee offer only.
  test("Tasty Coffee title improves intent match only when active coupons exist", () => {
    const page = fs.readFileSync(path.resolve("src/app/store/[slug]/page.tsx"), "utf-8");
    assert(page.includes('n > 0 && slug === "tasty-coffee"'));
    assert(page.includes('Промокод Tasty Coffee на'));
    assert(page.includes("index: n > 0"), "Empty offers must remain noindex");
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

  // SEO-GROWTH-2: targeted search-intent articles must not promise unverified deals.
  test("Search-led guides avoid unverified subscription and grocery discounts", () => {
    const articles = fs.readFileSync(path.resolve("src/lib/articles.ts"), "utf-8");
    const grocery = articles.split('slug: "kak-vygodno-zakazyvat-v-pyaterochke"')[1]?.split('slug: "sekrety-ekonomii-v-otello"')[0] ?? "";
    const streaming = articles.split('slug: "promokody-kinopoisk-yandex-plus"')[1]?.split('slug: "kak-vygodno-zakazyvat-v-pyaterochke"')[0] ?? "";
    const travel = articles.split('slug: "sekrety-ekonomii-v-otello"')[1]?.split('slug: "kak-poluchit-skidku-na-tsvety"')[0] ?? "";
    assert(grocery.includes("## Где получить промокод Пятёрочки Доставка"));
    assert(grocery.includes("faq: ["));
    assert(grocery.includes('href: "/store/pyaterochka"'));
    assert(!grocery.includes("50–55%"));
    assert(!grocery.includes("30–45 минут"));
    assert(streaming.includes("## Бесплатный период и скидка"));
    assert(!streaming.includes("60 дней бесплатно"));
    assert(!streaming.includes("скидки 50%"));
    assert(travel.includes('href: "/store/yandeks-puteshestviya"'));
    assert(travel.includes("Сравнивайте конечную цену"));
  });

  test("Store FAQs and links use actual offers and on-topic guides", () => {
    const page = fs.readFileSync(path.resolve("src/app/store/[slug]/page.tsx"), "utf-8");
    assert(page.includes('slug === "tasty-coffee"'));
    assert(page.includes('slug === "pyaterochka"'));
    assert(page.includes('slug === "yandeks-puteshestviya"'));
    assert(page.includes('a.related.some((link) => link.href === `/store/${store.slug}`)'));
    assert(page.includes("if (storeArticles.length === 0) return null"));
    assert(!page.includes("getArticles().slice(0, 2)"));
    assert(page.includes("Сейчас для ${store.name} нет опубликованных действующих промокодов"));
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
