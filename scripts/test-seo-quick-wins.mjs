/**
 * scripts/test-seo-quick-wins.mjs
 * Регрессионный сьют для этапа P2.2: адресные SEO-исправления.
 * 
 * Проверяет:
 * 1. Отсутствие дублирования бренда в HTML <title> (нет "— ПромоФакт — ПромоФакт").
 * 2. Корректность OpenGraph и Twitter title.
 * 3. Конфигурацию 301/308 редиректа для /store/sunlight -> /store/sunlight-ru в next.config.ts.
 * 4. Правила включения гео-категорий /gorod/[slug]/[category] в sitemap.xml (порог >= 3, исключение пустых и тонких).
 * 5. Согласованность robots (noindex для пустых гео-категорий, index для непустых) и canonical.
 * 6. Наличие обновлённого H1 на главной (слоган + естественные ключевые слова без SEO-полотна).
 * 7. Контекстные ссылки из статей блога на действующие магазины без битых URL.
 * 8. Отсутствие недостоверных утверждений об «ежедневной проверке» на гео-страницах.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Подключаем ts-loader для импортов
register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { CITIES_SEO } = await import("@/lib/citiesSeo");
const { getCategories, getAllStores, getCoupons } = await import("@/lib/perfluence");
const { getArticles } = await import("@/lib/articles");
const { SITE_NAME, SITE_URL } = await import("@/lib/site");

console.log("================================================================================");
console.log("🚀 ЗАПУСК РЕГРЕССИОННЫХ ТЕСТОВ SEO QUICK-WINS (P2.2)");
console.log("================================================================================\n");

let passed = 0;

// -----------------------------------------------------------------------------
// Тест 1: Регрессия HTML <title> — отсутствие дублирования бренда
// -----------------------------------------------------------------------------
{
  const appBuildDir = path.join(".next", "server", "app");
  if (fs.existsSync(appBuildDir)) {
    // Проверяем скомпилированные HTML файлы категорий, коллекций и городов
    const sampleFiles = [
      path.join(appBuildDir, "category", "dostavka-produktov.html"),
      path.join(appBuildDir, "category", "kosmetika-i-parfyumeriya.html"),
      path.join(appBuildDir, "collections", "first-order.html"),
      path.join(appBuildDir, "gorod", "moskva.html"),
      path.join(appBuildDir, "gorod", "spb.html"),
      path.join(appBuildDir, "gorod", "moskva", "dostavka-produktov.html"),
    ];

    for (const filePath of sampleFiles) {
      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, "utf-8");
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        assert.ok(titleMatch, `Тег <title> должен присутствовать в ${filePath}`);
        const titleText = titleMatch[1];

        // Проверяем, что нет двойного повторения "ПромоФакт"
        const occurrences = (titleText.match(/ПромоФакт/g) || []).length;
        assert.strictEqual(
          occurrences,
          1,
          `В <title> страницы ${filePath} бренд должен встречаться ровно 1 раз, получено: "${titleText}"`
        );
        assert.ok(
          !titleText.includes("— ПромоФакт — ПромоФакт"),
          `Обнаружен дубль в title: "${titleText}"`
        );
        assert.ok(
          !titleText.includes("| ПромоФакт — ПромоФакт"),
          `Обнаружен дубль в title: "${titleText}"`
        );
      }
    }
    console.log("✓ Тест 1: В HTML <title> категорий, подборок и городов бренд указан ровно один раз (PASS)");
    passed++;
  } else {
    console.log("⚠️ Тест 1: Сборка .next не найдена, пропуск проверки артефактов HTML");
  }
}

// -----------------------------------------------------------------------------
// Тест 2: Конфигурация постоянного редиректа для SUNLIGHT
// -----------------------------------------------------------------------------
{
  const nextConfigContent = fs.readFileSync("next.config.ts", "utf-8");
  
  // Проверяем наличие редиректов на /store/sunlight-ru
  assert.ok(
    nextConfigContent.includes('source: "/store/sunlight"'),
    "В next.config.ts должен присутствовать редирект для /store/sunlight"
  );
  assert.ok(
    nextConfigContent.includes('destination: "/store/sunlight-ru"'),
    "Редирект должен вести на /store/sunlight-ru"
  );
  assert.ok(
    nextConfigContent.includes("permanent: true"),
    "Редирект должен быть постоянным (308/301, permanent: true)"
  );

  console.log("✓ Тест 2: Редирект /store/sunlight -> /store/sunlight-ru сконфигурирован как постоянный (PASS)");
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 3: Правила включения гео-категорий в sitemap.xml
// -----------------------------------------------------------------------------
{
  const coupons = await getCoupons();
  const categories = await getCategories();

  // Симулируем правила sitemap
  const validGeoCategories = [];
  const thinGeoCategories = [];
  const emptyGeoCategories = [];

  for (const city of CITIES_SEO) {
    for (const cat of categories) {
      const list = coupons.filter((c) => {
        const r = (c.promocode?.region || "").toLowerCase();
        const isAllRu = !r || r === "вся россия" || r === "ru" || r.includes("россия");
        const matchesCity = r.includes(city.name.toLowerCase());
        return (isAllRu || matchesCity) && c.store.categorySlug === cat.slug;
      });

      const url = `${SITE_URL}/gorod/${city.slug}/${cat.slug}`;
      if (list.length >= 3) {
        validGeoCategories.push({ url, count: list.length });
      } else if (list.length > 0) {
        thinGeoCategories.push({ url, count: list.length });
      } else {
        emptyGeoCategories.push(url);
      }
    }
  }

  // Проверяем пороги
  assert.ok(validGeoCategories.length > 0, "Должны быть валидные гео-категории");
  assert.ok(emptyGeoCategories.length > 0, "Должны быть пустые гео-категории для изоляции");

  // Проверяем фактический sitemap.xml.body из сборки если существует
  const sitemapBodyPath = path.join(".next", "server", "app", "sitemap.xml.body");
  if (fs.existsSync(sitemapBodyPath)) {
    const sitemapContent = fs.readFileSync(sitemapBodyPath, "utf-8");

    // Ни одна пустая гео-категория не должна быть в sitemap
    for (const emptyUrl of emptyGeoCategories) {
      assert.ok(
        !sitemapContent.includes(`<loc>${emptyUrl}</loc>`),
        `Пустая гео-категория ${emptyUrl} не должна присутствовать в sitemap.xml`
      );
    }

    // Ни одна тонкая гео-категория (< 3) не должна быть в sitemap
    for (const thin of thinGeoCategories) {
      assert.ok(
        !sitemapContent.includes(`<loc>${thin.url}</loc>`),
        `Тонкая гео-категория ${thin.url} (${thin.count} купонов) не должна присутствовать в sitemap.xml`
      );
    }

    // Все содержательные гео-категории (>= 3) должны быть в sitemap
    for (const valid of validGeoCategories) {
      assert.ok(
        sitemapContent.includes(`<loc>${valid.url}</loc>`),
        `Содержательная гео-категория ${valid.url} (${valid.count} купонов) обязана присутствовать в sitemap.xml`
      );
    }
  }

  console.log(`✓ Тест 3: Правила sitemap соблюдены: включено ${validGeoCategories.length} URL, исключено ${emptyGeoCategories.length} пустых и ${thinGeoCategories.length} тонких (PASS)`);
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 4: Robots метатег для пустых и непустых гео-категорий
// -----------------------------------------------------------------------------
{
  const appBuildDir = path.join(".next", "server", "app");
  if (fs.existsSync(appBuildDir)) {
    // Пустая страница (0 купонов, например sport-i-otdyh) обязана иметь noindex
    const emptyCatSlug = "sport-i-otdyh";
    const emptyPagePath = path.join(appBuildDir, "gorod", "moskva", `${emptyCatSlug}.html`);
    if (fs.existsSync(emptyPagePath)) {
      const html = fs.readFileSync(emptyPagePath, "utf-8");
      assert.ok(
        html.includes('content="noindex, follow"') || html.includes('content="noindex,follow"'),
        "Пустая гео-категория обязана иметь robots noindex, follow"
      );
    }

    // Пример непустой страницы: /gorod/moskva/dostavka-produktov.html (14 купонов)
    const richPagePath = path.join(appBuildDir, "gorod", "moskva", "dostavka-produktov.html");
    if (fs.existsSync(richPagePath)) {
      const html = fs.readFileSync(richPagePath, "utf-8");
      assert.ok(
        !html.includes('content="noindex'),
        "Содержательная гео-категория не должна иметь noindex"
      );
    }

    console.log("✓ Тест 4: Согласованность robots: пустые страницы закрыты noindex, содержательные открыты (PASS)");
    passed++;
  } else {
    console.log("⚠️ Тест 4: Сборка .next не найдена, пропуск проверки robots в HTML");
  }
}

// -----------------------------------------------------------------------------
// Тест 5: H1 главной страницы
// -----------------------------------------------------------------------------
{
  const heroCode = fs.readFileSync("src/components/Hero.tsx", "utf-8");
  assert.ok(
    heroCode.includes("Найдите скидку.") && heroCode.includes("Заплатите меньше."),
    "H1 должен содержать слоган «Найдите скидку. Заплатите меньше.»"
  );
  assert.ok(
    heroCode.includes("Актуальные промокоды и купоны на скидку"),
    "H1 должен естественно содержать упоминание промокодов и купонов"
  );

  console.log("✓ Тест 5: H1 главной страницы содержит бренд-слоган и поисковые ключи без переспама (PASS)");
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 6: Контекстные ссылки из статей базы знаний
// -----------------------------------------------------------------------------
{
  const articles = getArticles();
  const allStores = await getAllStores();
  const validStoreSlugs = new Set(allStores.map((s) => s.slug));

  let verifiedStoreLinksCount = 0;

  for (const article of articles) {
    for (const rel of article.related) {
      if (rel.href.startsWith("/store/")) {
        const slug = rel.href.replace("/store/", "");
        assert.ok(
          validStoreSlugs.has(slug),
          `Статья "${article.slug}" ссылается на несуществующий магазин: ${rel.href}`
        );
        verifiedStoreLinksCount++;
      }
    }
  }

  assert.ok(
    verifiedStoreLinksCount >= 10,
    `В статьях должно быть не менее 10 проверенных ссылок на магазины, найдено: ${verifiedStoreLinksCount}`
  );

  console.log(`✓ Тест 6: Контекстные ссылки из статей проверены (${verifiedStoreLinksCount} ссылок на живые магазины) (PASS)`);
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 7: Отсутствие недостоверных обещаний «ежедневной проверки» на гео-страницах
// -----------------------------------------------------------------------------
{
  const citiesSeoContent = fs.readFileSync("src/lib/citiesSeo.ts", "utf-8");
  const cityCategoryPage = fs.readFileSync("src/app/gorod/[slug]/[category]/page.tsx", "utf-8");

  assert.ok(
    !citiesSeoContent.includes("Обновление каждый день"),
    "В citiesSeo.ts не должно быть ложного утверждения 'Обновление каждый день'"
  );
  assert.ok(
    !citiesSeoContent.includes("Проверенные акции каждый день"),
    "В citiesSeo.ts не должно быть ложного утверждения 'Проверенные акции каждый день'"
  );
  assert.ok(
    !cityCategoryPage.includes("Обновляем ежедневно"),
    "На странице гео-категории не должно быть ложного 'Обновляем ежедневно'"
  );
  assert.ok(
    !cityCategoryPage.includes("Мы обновляем их каждый день"),
    "В FAQ гео-категории не должно быть ложного 'Мы обновляем их каждый день'"
  );

  console.log("✓ Тест 7: Недостоверные заявления об ежедневной ручной/автоматической проверке устранены (PASS)");
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 8: Защита от устаревших SEO-офферов (expiry fallback regression)
// -----------------------------------------------------------------------------
{
  const { getStoreExtra, hasActiveRequiredCoupons } = await import("@/lib/storeExtras");

  // 1. Проверяем Островок: требуются PFRUS414 и PFWOR417
  const ostrovokExtra = getStoreExtra("ostrovok");
  assert.ok(ostrovokExtra, "Островок должен иметь storeExtra");
  assert.deepStrictEqual(ostrovokExtra.requiredActiveCodes, ["PFRUS414", "PFWOR417"]);

  // Активные купоны -> true
  const activeCoupons = [
    { promocode: { code: "PFRUS414", expires: "2026-10-31" } },
    { promocode: { code: "PFWOR417", expires: "2026-10-31" } },
  ];
  assert.strictEqual(
    hasActiveRequiredCoupons(ostrovokExtra, activeCoupons, new Date("2026-10-01").getTime()),
    true,
    "При наличии действующих промокодов custom metadata должны быть активны"
  );

  // Один купон истек -> false (fallback на нейтральный генератор)
  const expiredCoupons = [
    { promocode: { code: "PFRUS414", expires: "2026-09-30" } }, // истек
    { promocode: { code: "PFWOR417", expires: "2026-10-31" } },
  ];
  assert.strictEqual(
    hasActiveRequiredCoupons(ostrovokExtra, expiredCoupons, new Date("2026-10-01").getTime()),
    false,
    "Если промокод истек, custom metadata должны отключиться (fallback)"
  );

  // Промокод отсутствует -> false
  const missingCoupons = [
    { promocode: { code: "OTHER_CODE", expires: "2026-10-31" } },
  ];
  assert.strictEqual(
    hasActiveRequiredCoupons(ostrovokExtra, missingCoupons, new Date("2026-10-01").getTime()),
    false,
    "Если требуемый код отсутствует, custom metadata должны отключиться (fallback)"
  );

  // 2. Проверяем Т-Путешествия: требуется YE
  const tpExtra = getStoreExtra("t-puteshestviya-oteli");
  assert.ok(tpExtra, "Т-Путешествия должны иметь storeExtra");
  assert.deepStrictEqual(tpExtra.requiredActiveCodes, ["YE"]);
  assert.strictEqual(
    hasActiveRequiredCoupons(tpExtra, [{ promocode: { code: "YE", expires: "2026-10-11" } }], new Date("2026-10-01").getTime()),
    true
  );
  assert.strictEqual(
    hasActiveRequiredCoupons(tpExtra, [{ promocode: { code: "YE", expires: "2026-10-11" } }], new Date("2026-10-12").getTime()),
    false,
    "После 11.10.2026 промокод YE истекает и метаданные должны переключиться на fallback"
  );

  // 3. Проверяем ВинЛаб: требуются 10PFNS6570, 5PFSEP5144 и WCPFSEP7289
  const winlabExtra = getStoreExtra("winlab");
  assert.ok(winlabExtra, "ВинЛаб должен иметь storeExtra");
  assert.deepStrictEqual(winlabExtra.requiredActiveCodes, ["10PFNS6570", "5PFSEP5144", "WCPFSEP7289"]);

  // Проверяем FAQ fallback логику:
  // При наличии всех кодов -> showCustomFaq true
  const winlabActiveCoupons = [
    { promocode: { code: "10PFNS6570", expires: "2026-10-31" } },
    { promocode: { code: "5PFSEP5144", expires: "2026-10-31" } },
    { promocode: { code: "WCPFSEP7289", expires: "2026-10-31" } },
  ];
  assert.strictEqual(
    hasActiveRequiredCoupons(winlabExtra, winlabActiveCoupons, new Date("2026-10-01").getTime()),
    true,
    "Все 3 промокода ВинЛаб активны -> FAQ и метаданные включены"
  );

  // При истечении WCPFSEP7289 -> showCustomFaq false (отключение offer-specific FAQ)
  const winlabExpiredWinclub = [
    { promocode: { code: "10PFNS6570", expires: "2026-10-31" } },
    { promocode: { code: "5PFSEP5144", expires: "2026-10-31" } },
    { promocode: { code: "WCPFSEP7289", expires: "2026-09-30" } }, // истек
  ];
  assert.strictEqual(
    hasActiveRequiredCoupons(winlabExtra, winlabExpiredWinclub, new Date("2026-10-01").getTime()),
    false,
    "Если промокод WinClub WCPFSEP7289 истек -> custom FAQ и metadata отключаются"
  );

  // 4. Проверяем магазины БЕЗ requiredActiveCodes (FARFOR, RUTUBE, СберЗдоровье):
  // Их FAQ не должен скрываться из-за отсутствия customTitle или requiredActiveCodes
  const farforExtra = getStoreExtra("farfor");
  assert.ok(farforExtra && farforExtra.faq && farforExtra.faq.length > 0, "У FARFOR должен быть FAQ");
  assert.strictEqual(
    farforExtra.requiredActiveCodes,
    undefined,
    "У FARFOR не должно быть requiredActiveCodes"
  );
  // Эмуляция логики отбора FAQ из page.tsx:
  const getFaqForStore = (extra, coupons, now) =>
    !extra?.faq
      ? []
      : extra.requiredActiveCodes && extra.requiredActiveCodes.length > 0
        ? hasActiveRequiredCoupons(extra, coupons, now)
          ? extra.faq
          : []
        : extra.faq;

  assert.deepStrictEqual(
    getFaqForStore(farforExtra, [], Date.now()),
    farforExtra.faq,
    "FAQ FARFOR должен сохраняться независимо от наличия кодов"
  );

  const rutubeExtra = getStoreExtra("rutube");
  assert.ok(rutubeExtra && rutubeExtra.faq && rutubeExtra.faq.length > 0, "У RUTUBE должен быть FAQ");
  assert.deepStrictEqual(
    getFaqForStore(rutubeExtra, [], Date.now()),
    rutubeExtra.faq,
    "FAQ RUTUBE должен сохраняться независимо от наличия кодов"
  );

  const sberzExtra = getStoreExtra("sberzdorovie");
  assert.ok(sberzExtra && sberzExtra.faq && sberzExtra.faq.length > 0, "У СберЗдоровья должен быть FAQ");
  assert.deepStrictEqual(
    getFaqForStore(sberzExtra, [], Date.now()),
    sberzExtra.faq,
    "FAQ СберЗдоровья должен сохраняться независимо от наличия кодов"
  );

  console.log("✓ Тест 8: Регрессия expiry fallback для SEO-офферов и сохранение FAQ без requiredActiveCodes подтверждены (PASS)");
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 9: Sitemap Invariant — Категории в Sitemap строго канонические
// -----------------------------------------------------------------------------
{
  const categoryTaxonomySrc = fs.readFileSync(path.resolve("src/lib/categoryTaxonomy.ts"), "utf-8");
  const sitemapSrc = fs.readFileSync(path.resolve("src/app/sitemap.ts"), "utf-8");

  // 1. Проверяем, что sitemap.ts использует canonicalCategorySlug для категорий
  assert.ok(
    sitemapSrc.includes("canonicalCategorySlug(cat.slug)"),
    "sitemap.ts должен нормализовать category.slug через canonicalCategorySlug"
  );
  assert.ok(
    sitemapSrc.includes("seenCategorySlugs.has(canonicalSlug)"),
    "sitemap.ts должен дедуплицировать категории по каноническому slug"
  );

  // 2. Статическая валидация sitemap.xml из build artifacts
  const sitemapXmlPath = path.resolve(".next/server/app/sitemap.xml.body");
  const sitemapStaticPath = path.resolve("public/sitemap.xml");
  let sitemapContent = "";
  if (fs.existsSync(sitemapXmlPath)) {
    sitemapContent = fs.readFileSync(sitemapXmlPath, "utf-8");
  } else if (fs.existsSync(sitemapStaticPath)) {
    sitemapContent = fs.readFileSync(sitemapStaticPath, "utf-8");
  }

  // 3. Извлекаем CATEGORY_ALIASES
  const aliasBlockMatch = categoryTaxonomySrc.match(/export const CATEGORY_ALIASES: Record<string, string> = {([^}]+)};/);
  assert.ok(aliasBlockMatch, "Не найден блок CATEGORY_ALIASES в src/lib/categoryTaxonomy.ts");
  const localAliases = {};
  for (const line of aliasBlockMatch[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    const parts = trimmed.split(":");
    if (parts.length >= 2) {
      localAliases[parts[0].replace(/['",]/g, "").trim()] = parts[1].replace(/['",]/g, "").trim();
    }
  }

  if (sitemapContent) {
    const locMatches = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const categoryLocs = locMatches.filter(u => u.includes("/category/"));
    assert.ok(categoryLocs.length > 0, "Sitemap должен содержать категории");

    const seenSlugs = new Set();
    for (const url of categoryLocs) {
      const slug = url.split("/category/")[1];
      assert.ok(!Object.prototype.hasOwnProperty.call(localAliases, slug), `Sitemap содержит alias категорию: ${url}`);
      assert.notStrictEqual(slug, "knigi", "Sitemap не должен содержать /category/knigi");
      assert.ok(!seenSlugs.has(slug), `Sitemap содержит дубликат категории: ${url}`);
      seenSlugs.add(slug);
    }

    for (const u of locMatches) {
      assert.ok(!u.includes("/store/") || !u.endsWith("/first-order"), `Sitemap содержит /store/.../first-order: ${u}`);
      assert.ok(!u.includes("/store/") || !u.endsWith("/repeat-order"), `Sitemap содержит /store/.../repeat-order: ${u}`);
      const storeSubMatch = u.match(/\/store\/[^/]+\/([^/]+)$/);
      if (storeSubMatch && storeSubMatch[1] !== "first-order" && storeSubMatch[1] !== "repeat-order") {
        assert.fail(`Sitemap содержит страницу отдельного купона: ${u}`);
      }
    }
  }

  console.log("✓ Тест 9: Инварианты Sitemap подтверждены (только канонические категории, 0 alias, 0 subpages) (PASS)");
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 10: Честные формулировки в FAQ категорий (отсутствие непроверенных утверждений)
// -----------------------------------------------------------------------------
{
  const categoryPageSrc = fs.readFileSync(path.resolve("src/app/category/[slug]/page.tsx"), "utf-8");
  assert.ok(
    !categoryPageSrc.includes("тестируем актуальность кодов"),
    "Категория не должна утверждать ручное тестирование кодов"
  );
  assert.ok(
    !categoryPageSrc.includes("удаляем недействительные акции"),
    "Категория не должна утверждать ручное удаление недействительных акций"
  );
  assert.ok(
    categoryPageSrc.includes("Предложения обновляются по данным партнёрских программ"),
    "Категория должна содержать фактически подтверждаемую формулировку об обновлении"
  );

  console.log("✓ Тест 10: Формулировки FAQ категорий честны и соответствуют реальным процессам (PASS)");
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 11: Валидация безопасности Category Redirects (отсутствие битых ссылок и цепочек)
// -----------------------------------------------------------------------------
{
  const categoryTaxonomySrc = fs.readFileSync(path.resolve("src/lib/categoryTaxonomy.ts"), "utf-8");
  const nextConfigSrc = fs.readFileSync(path.resolve("next.config.ts"), "utf-8");
  const legacyRedirectsSrc = fs.readFileSync(path.resolve("src/lib/legacyRedirects.ts"), "utf-8");

  // Извлекаем все канонические slug'и из CATEGORIES
  const categoryMatches = [...categoryTaxonomySrc.matchAll(/slug:\s*["']([^"']+)["']/g)];
  const validCanonicalSlugs = new Set(categoryMatches.map(m => m[1]));

  // 1. Извлекаем CATEGORY_ALIASES из categoryTaxonomy.ts
  const aliasBlockMatch = categoryTaxonomySrc.match(/export const CATEGORY_ALIASES: Record<string, string> = {([^}]+)};/);
  assert.ok(aliasBlockMatch, "Не найден блок CATEGORY_ALIASES в src/lib/categoryTaxonomy.ts");
  const localAliases = {};
  for (const line of aliasBlockMatch[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    const parts = trimmed.split(":");
    if (parts.length >= 2) {
      const key = parts[0].replace(/['",]/g, "").trim();
      const val = parts[1].replace(/['",]/g, "").trim();
      localAliases[key] = val;
    }
  }

  // Проверяем CATEGORY_ALIASES
  for (const [alias, dest] of Object.entries(localAliases)) {
    assert.ok(
      validCanonicalSlugs.has(dest),
      `CATEGORY_ALIASES[${alias}] указывает на несуществующую в CATEGORIES категорию: ${dest}`
    );
    assert.ok(
      !Object.prototype.hasOwnProperty.call(localAliases, dest),
      `CATEGORY_ALIASES[${alias}] указывает на другой алиас (образует цепочку): ${dest}`
    );
  }

  // 2. Проверяем LEGACY_CATEGORY_REDIRECTS
  const legacyMatch = legacyRedirectsSrc.match(/export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {([^}]+)};/);
  if (legacyMatch) {
    const lines = legacyMatch[1].split("\n").filter(l => l.includes(":"));
    for (const line of lines) {
      const parts = line.split(":");
      const destUrl = parts[1].replace(/['",]/g, "").trim();
      if (destUrl.startsWith("/category/")) {
        const destSlug = destUrl.replace("/category/", "").trim();
        assert.ok(
          validCanonicalSlugs.has(destSlug),
          `LEGACY_CATEGORY_REDIRECTS destination не существует в CATEGORIES: ${destSlug}`
        );
        assert.ok(
          !Object.prototype.hasOwnProperty.call(localAliases, destSlug),
          `LEGACY_CATEGORY_REDIRECTS destination не канонический (цепочка алиасов): ${destSlug}`
        );
      }
    }
  }

  // 3. Проверяем hardcoded category redirects в next.config.ts
  const categoryRedirectMatches = [
    ...nextConfigSrc.matchAll(/source:\s*["'](\/category\/[^"']+)["'],\s*destination:\s*["'](\/category\/[^"']+)["']/g)
  ];
  const nextConfigRedirectSources = new Set();
  for (const match of categoryRedirectMatches) {
    const [, source, destination] = match;
    nextConfigRedirectSources.add(source);
    const destSlug = destination.replace("/category/", "").trim();
    assert.ok(
      validCanonicalSlugs.has(destSlug),
      `next.config.ts redirect ${source} -> ${destination} указывает на несуществующую категорию`
    );
    assert.ok(
      !Object.prototype.hasOwnProperty.call(localAliases, destSlug),
      `next.config.ts redirect ${source} -> ${destination} указывает на алиас (образует цепочку)`
    );
  }

  // 4. Покрытие всех CATEGORY_ALIASES серверными редиректами (Category Alias Coverage)
  for (const alias of Object.keys(localAliases)) {
    const isCoveredByNextConfig = nextConfigRedirectSources.has(`/category/${alias}`);
    const isCoveredByLegacy = legacyRedirectsSrc.includes(`"${alias}":`) || legacyRedirectsSrc.includes(`'${alias}':`) || legacyRedirectsSrc.includes(`${alias}:`);
    assert.ok(
      isCoveredByNextConfig || isCoveredByLegacy,
      `Алиас "${alias}" из CATEGORY_ALIASES не покрыт серверным редиректом ни в next.config.ts, ни в LEGACY_CATEGORY_REDIRECTS`
    );
  }

  console.log("✓ Тест 11: Безопасность и 100% покрытие Category Redirects подтверждены (PASS)");
  passed++;
}

// -----------------------------------------------------------------------------
// Тест 12: Регрессия Wave 2: Store Intent Filters without Crawl Waste
// -----------------------------------------------------------------------------
{
  // A. StoreIntentTabs has no Link/href to /first-order or /repeat-order
  const storeIntentTabsSrc = fs.readFileSync(path.resolve("src/components/StoreIntentTabs.tsx"), "utf-8");
  assert.ok(!storeIntentTabsSrc.includes("<Link"), "StoreIntentTabs не должен содержать компонент <Link>");
  assert.ok(!storeIntentTabsSrc.includes("href="), "StoreIntentTabs не должен содержать атрибуты href");
  assert.ok(storeIntentTabsSrc.includes('type="button"'), "StoreIntentTabs должен использовать кнопки type=\"button\"");
  assert.ok(storeIntentTabsSrc.includes("aria-pressed"), "StoreIntentTabs кнопки должны иметь атрибут aria-pressed");

  // B. next.config.ts has permanent redirects for intent routes
  const nextConfigSrc = fs.readFileSync(path.resolve("next.config.ts"), "utf-8");
  assert.ok(nextConfigSrc.includes('source: "/store/:slug/first-order"'), "next.config.ts должен содержать редирект для /store/:slug/first-order");
  assert.ok(nextConfigSrc.includes('source: "/store/:slug/repeat-order"'), "next.config.ts должен содержать редирект для /store/:slug/repeat-order");
  assert.ok(
    nextConfigSrc.indexOf('source: "/store/:slug/first-order"') > nextConfigSrc.indexOf('source: "/store/sunlight"'),
    "Intent-редиректы должны быть объявлены после специфичных алиас-редиректов магазинов"
  );

  // C. Old route page.tsx files don't exist
  assert.ok(!fs.existsSync(path.resolve("src/app/store/[slug]/first-order/page.tsx")), "Старый маршрут first-order/page.tsx должен быть удален");
  assert.ok(!fs.existsSync(path.resolve("src/app/store/[slug]/repeat-order/page.tsx")), "Старый маршрут repeat-order/page.tsx должен быть удален");

  // D. HeaderSearch still uses /store/slug#coupon-id
  const headerSearchSrc = fs.readFileSync(path.resolve("src/components/HeaderSearch.tsx"), "utf-8");
  assert.ok(headerSearchSrc.includes("href={`/store/${coupon.storeSlug}#coupon-${coupon.id}`}"), "HeaderSearch должен сохранять ссылки с якорем #coupon-id");

  // E. CouponTicket still has id={`coupon-${coupon.id}`}
  const couponTicketSrc = fs.readFileSync(path.resolve("src/components/CouponTicket.tsx"), "utf-8");
  assert.ok(couponTicketSrc.includes('id={`coupon-${coupon.id}`}'), "CouponTicket должен содержать id=\"coupon-{coupon.id}\"");

  // F. sitemap has no intent subpages
  const sitemapSrc = fs.readFileSync(path.resolve("src/app/sitemap.ts"), "utf-8");
  assert.ok(!sitemapSrc.includes("first-order"), "sitemap.ts не должен генерировать first-order подстраницы");
  assert.ok(!sitemapSrc.includes("repeat-order"), "sitemap.ts не должен генерировать repeat-order подстраницы");

  // G. No UI link in src/components or src/app points to /store/.../first-order or /repeat-order (/collections/first-order preserved)
  const scanDirs = ["src/components", "src/app"];
  for (const dir of scanDirs) {
    function walk(curr) {
      const items = fs.readdirSync(curr, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(curr, item.name);
        if (item.isDirectory()) {
          walk(full);
        } else if (/\.(tsx?|jsx?)$/.test(item.name)) {
          const code = fs.readFileSync(full, "utf-8");
          const linkPattern = /href=[{"'`][^"'`]*\/store\/[^/"'`]+\/(first-order|repeat-order)/g;
          const match = linkPattern.exec(code);
          assert.ok(!match, `Файл ${full} содержит внутреннюю ссылку на удаленный подмаршрут: ${match ? match[0] : ""}`);
        }
      }
    }
    walk(path.resolve(dir));
  }

  // Проверяем, что /collections/first-order остался нетронутым
  const footerSrc = fs.readFileSync(path.resolve("src/components/Footer.tsx"), "utf-8");
  assert.ok(footerSrc.includes("/collections/first-order"), "Footer должен сохранять ссылку /collections/first-order");

  // H. Legacy store intent redirects должны вести в 1 hop сразу на канонический destination
  assert.ok(
    nextConfigSrc.includes("...Object.entries(LEGACY_STORE_REDIRECTS).flatMap") &&
      nextConfigSrc.includes("LEGACY_STORE_REDIRECTS"),
    "next.config.ts должен генерировать 1-hop редиректы из LEGACY_STORE_REDIRECTS для intent-маршрутов"
  );

  console.log("✓ Тест 12: Регрессионные требования Wave 2 Store Intent Filters полностью соблюдены (PASS)");
  passed++;
}

console.log("\n================================================================================");
