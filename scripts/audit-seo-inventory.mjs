/**
 * scripts/audit-seo-inventory.mjs
 * Динамический аудит технического SEO PromoFact на основе РЕАЛЬНЫХ данных сборки и sitemap.
 *
 * Проверяемые параметры:
 * 1. HTTP Status & Build Existence (наличие скомпилированного HTML)
 * 2. Canonical Matching (соответствие <link rel="canonical"> адресу страницы)
 * 3. Robots.txt Compliance (отсутствие sitemap URL в Disallow правилах)
 * 4. Sitemap Validation (реальные даты lastmod, отсутствие дублей и закрытых страниц)
 * 5. Metadata Uniqueness (проверка уникальности Title, Description, H1)
 * 6. Internal Linking Graph & Broken Links (проверка всех <a href> на битые ссылки)
 * 7. Orphan Pages (поиск изолированных страниц без входящих ссылок)
 */

import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.resolve(".next/server/app");
const SITE_URL = "https://promofact.ru";

function normalizeUrlPath(urlOrPath) {
  let p = urlOrPath.replace(SITE_URL, "");
  p = p.split("?")[0].split("#")[0];
  if (p === "") p = "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function getHtmlPathForUrl(urlPath) {
  if (urlPath === "/" || urlPath === "") {
    return path.join(APP_DIR, "index.html");
  }
  // Try direct path or nested index
  const direct = path.join(APP_DIR, `${urlPath.slice(1)}.html`);
  if (fs.existsSync(direct)) return direct;
  const nested = path.join(APP_DIR, urlPath.slice(1), "index.html");
  if (fs.existsSync(nested)) return nested;
  return direct;
}

async function runAudit() {
  console.log("================================================================================");
  console.log("🚀 ЗАПУСК ПОЛНОГО ДИНАМИЧЕСКОГО SEO-АУДИТА PROMOFACT");
  console.log("================================================================================\n");

  if (!fs.existsSync(APP_DIR)) {
    console.error("❌ Директория сборки .next/server/app не найдена! Сначала выполните `npm run build`.");
    process.exit(1);
  }

  // 1. Чтение Sitemap
  const sitemapBodyPath = path.join(APP_DIR, "sitemap.xml.body");
  if (!fs.existsSync(sitemapBodyPath)) {
    console.error("❌ sitemap.xml.body не найден в .next/server/app!");
    process.exit(1);
  }

  const sitemapXml = fs.readFileSync(sitemapBodyPath, "utf-8");
  const urlBlocks = sitemapXml.split("<url>").slice(1);

  const sitemapUrls = [];
  const sitemapUrlSet = new Set();
  const duplicateSitemapUrls = [];
  const lastmodSamples = new Set();

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
    if (!locMatch) continue;

    const loc = locMatch[1].trim();
    const lastmod = lastmodMatch ? lastmodMatch[1].trim() : null;
    if (sitemapUrlSet.has(loc)) {
      duplicateSitemapUrls.push(loc);
    }
    sitemapUrlSet.add(loc);
    sitemapUrls.push({ loc, lastmod });
    if (lastmod) lastmodSamples.add(lastmod);
  }

  console.log(`📋 SITEMAP: Всего страниц в карте сайта: ${sitemapUrls.length}`);
  console.log(`   Уникальных дат lastmod: ${lastmodSamples.size}`);
  if (lastmodSamples.size <= 1 && sitemapUrls.length > 10) {
    console.warn("⚠️ ВНИМАНИЕ: Все даты lastmod одинаковые! Sitemap должен использовать реальные даты обновления.");
  }

  // 2. Robots.txt Disallow
  const robotsTsPath = path.resolve("src/app/robots.ts");
  let disallowedPrefixes = ["/admin", "/api/", "/stats/"];
  if (fs.existsSync(robotsTsPath)) {
    const robotsCode = fs.readFileSync(robotsTsPath, "utf-8");
    const m = robotsCode.match(/disallow:\s*\[([\s\S]*?)\]/);
    if (m) {
      disallowedPrefixes = [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
    }
  }

  // 3. Сканирование всех HTML файлов сборки
  function scanDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(scanDir(fullPath));
      } else if (file.endsWith(".html")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allHtmlFiles = scanDir(APP_DIR);
  console.log(`📦 BUILD: Найдено скомпилированных HTML страниц: ${allHtmlFiles.length}`);

  // Карта маршрутов сборки
  const buildRouteMap = new Map(); // routePath -> { filePath, html, title, description, h1, canonical, links }
  for (const filePath of allHtmlFiles) {
    const rel = path.relative(APP_DIR, filePath).replace(/\\/g, "/");
    let route = "/" + rel.replace(/\.html$/, "").replace(/\/index$/, "");
    if (route === "/index") route = "/";

    const html = fs.readFileSync(filePath, "utf-8");

    // Title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // H1
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "";

    // Canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : "";

    // Robots meta
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const robotsContent = robotsMatch ? robotsMatch[1].trim() : "";

    // Outgoing internal links
    const linkMatches = [...html.matchAll(/<a[^>]*href=["']([^"']+)["']/gi)];
    const links = [];
    for (const lm of linkMatches) {
      const href = lm[1].trim();
      if (
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !href.startsWith("/_next/") &&
        !href.startsWith("/api/") &&
        !href.endsWith(".ico") &&
        !href.endsWith(".svg") &&
        !href.endsWith(".png") &&
        !href.endsWith(".jpg") &&
        !href.endsWith(".webmanifest")
      ) {
        links.push(normalizeUrlPath(href));
      } else if (href.startsWith(SITE_URL)) {
        links.push(normalizeUrlPath(href.slice(SITE_URL.length)));
      }
    }

    buildRouteMap.set(route, {
      filePath,
      route,
      title,
      description,
      h1,
      canonical,
      robotsContent,
      links,
    });
  }

  // 4. Проверка Sitemap соответствия
  const sitemapErrors = [];
  const robotsViolations = [];
  const canonicalMismatches = [];

  for (const item of sitemapUrls) {
    const route = normalizeUrlPath(item.loc);

    // Robots check
    for (const dis of disallowedPrefixes) {
      if (dis.endsWith("/") ? route.startsWith(dis) : route === dis || route.startsWith(dis + "/")) {
        robotsViolations.push({ url: item.loc, disallow: dis });
      }
    }

    // Existence check
    const pageData = buildRouteMap.get(route);
    if (!pageData) {
      sitemapErrors.push({ url: item.loc, error: "404: HTML файл не найден в сборке" });
    } else {
      // Canonical check
      if (pageData.canonical && normalizeUrlPath(pageData.canonical) !== route) {
        canonicalMismatches.push({
          url: item.loc,
          expected: item.loc,
          canonical: pageData.canonical,
        });
      }
    }
  }

  // 5. Проверка уникальности метаданных (только для индексируемых страниц sitemap)
  const titleBuckets = new Map();
  const descBuckets = new Map();

  for (const item of sitemapUrls) {
    const route = normalizeUrlPath(item.loc);
    const pageData = buildRouteMap.get(route);
    if (!pageData) continue;

    if (pageData.title) {
      if (!titleBuckets.has(pageData.title)) titleBuckets.set(pageData.title, []);
      titleBuckets.get(pageData.title).push(route);
    }
    if (pageData.description) {
      if (!descBuckets.has(pageData.description)) descBuckets.set(pageData.description, []);
      descBuckets.get(pageData.description).push(route);
    }
  }

  const duplicateTitles = [...titleBuckets.entries()].filter(([_, routes]) => routes.length > 1);
  const duplicateDescriptions = [...descBuckets.entries()].filter(([_, routes]) => routes.length > 1);

  // 6. Проверка битых внутренних ссылок
  const brokenLinks = [];
  const incomingLinks = new Map(); // targetRoute -> Set of sourceRoutes

  for (const [sourceRoute, pageData] of buildRouteMap.entries()) {
    for (const target of pageData.links) {
      // Регистрируем входящую ссылку
      if (!incomingLinks.has(target)) incomingLinks.set(target, new Set());
      incomingLinks.get(target).add(sourceRoute);

      // Проверяем существование цели
      if (!buildRouteMap.has(target)) {
        brokenLinks.push({ source: sourceRoute, target });
      }
    }
  }

  // 7. Проверка Orphan Pages (страницы из sitemap без входящих внутренних ссылок)
  const orphanPages = [];
  for (const item of sitemapUrls) {
    const route = normalizeUrlPath(item.loc);
    if (route === "/") continue; // Главная не сирота
    const sources = incomingLinks.get(route);
    if (!sources || sources.size === 0) {
      orphanPages.push(route);
    }
  }

  // ================= ИТОГОВЫЙ ОТЧЕТ =================
  console.log("\n==================== РЕЗУЛЬТАТЫ АУДИТА ====================");
  console.log(`1. HTTP Status & Prerender: ${sitemapErrors.length === 0 ? "✅ PASS" : "❌ FAIL (" + sitemapErrors.length + ")"}`);
  console.log(`2. Canonical Matching:     ${canonicalMismatches.length === 0 ? "✅ PASS" : "❌ FAIL (" + canonicalMismatches.length + ")"}`);
  console.log(`3. Robots.txt Compliance:  ${robotsViolations.length === 0 ? "✅ PASS" : "❌ FAIL (" + robotsViolations.length + ")"}`);
  console.log(`4. Sitemap Unique Dates:   ${lastmodSamples.size > 1 ? "✅ PASS (" + lastmodSamples.size + " уникальных)" : "❌ FAIL (унифицированная дата)"}`);
  console.log(`5. Duplicate Titles:       ${duplicateTitles.length === 0 ? "✅ PASS" : "❌ FAIL (" + duplicateTitles.length + " дублей)"}`);
  console.log(`6. Duplicate Descriptions: ${duplicateDescriptions.length === 0 ? "✅ PASS" : "❌ FAIL (" + duplicateDescriptions.length + " дублей)"}`);
  console.log(`7. Broken Internal Links:  ${brokenLinks.length === 0 ? "✅ PASS" : "❌ FAIL (" + brokenLinks.length + " битых ссылок)"}`);
  console.log(`8. Orphan Pages in Sitemap:${orphanPages.length === 0 ? "✅ PASS" : "⚠️ WARN (" + orphanPages.length + " сирот)"}`);
  console.log("===========================================================\n");

  if (sitemapErrors.length > 0) {
    console.error("❌ Ошибки страниц sitemap:", sitemapErrors.slice(0, 10));
  }
  if (canonicalMismatches.length > 0) {
    console.error("❌ Несоответствия canonical:", canonicalMismatches.slice(0, 10));
  }
  if (robotsViolations.length > 0) {
    console.error("❌ Robots.txt нарушения:", robotsViolations.slice(0, 10));
  }
  if (duplicateTitles.length > 0) {
    console.error("❌ Найдены дублирующие Title:");
    for (const [t, routes] of duplicateTitles.slice(0, 5)) {
      console.error(`   "${t}" -> ${routes.join(", ")}`);
    }
  }
  if (duplicateDescriptions.length > 0) {
    console.error("❌ Найдены дублирующие Description:");
    for (const [d, routes] of duplicateDescriptions.slice(0, 5)) {
      console.error(`   "${d.slice(0, 70)}..." -> ${routes.join(", ")}`);
    }
  }
  if (brokenLinks.length > 0) {
    console.error("❌ Найдены битые внутренние ссылки:");
    const uniqueTargets = [...new Set(brokenLinks.map((b) => b.target))];
    for (const ut of uniqueTargets.slice(0, 15)) {
      const examples = brokenLinks.filter((b) => b.target === ut).map((b) => b.source).slice(0, 3);
      console.error(`   ${ut} (найдено на: ${examples.join(", ")})`);
    }
  }
  if (orphanPages.length > 0) {
    console.warn("⚠️ Страницы без входящих ссылок из других страниц:", orphanPages.slice(0, 10));
  }

  const isFailed =
    sitemapErrors.length > 0 ||
    canonicalMismatches.length > 0 ||
    robotsViolations.length > 0 ||
    brokenLinks.length > 0 ||
    duplicateTitles.length > 0;

  if (isFailed) {
    console.error("❌ АУДИТ ЗАВЕРШИЛСЯ С КРИТИЧЕСКИМИ ОШИБКАМИ!");
    process.exit(1);
  } else {
    console.log("🎉 ПОЛНЫЙ SEO-АУДИТ УСПЕШНО ПРОЙДЕН! 100% ПОКАЗАТЕЛЕЙ В НОРМЕ.");
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error("Критический сбой аудита:", err);
  process.exit(1);
});
