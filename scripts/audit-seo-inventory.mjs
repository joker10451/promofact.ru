/**
 * scripts/audit-seo-inventory.mjs
 * Полный аудит технического SEO PromoFact.
 *
 * Поддерживаемые режимы:
 * 1. Локальный аудит сборки (.next/server/app):
 *    - Наличие скомпилированных SSG HTML файлов
 *    - Наличие и совпадение обязательного тега <link rel="canonical">
 *    - Соблюдение директив robots.txt
 *    - Достоверность и валидность lastmod в sitemap.xml
 *    - Уникальность Title и Description (дубли считаются ошибкой)
 *    - Анализ внутренней перелинковки и поиск битых ссылок
 *    - Поиск страниц-сирот (orphan pages)
 * 2. HTTP-аудит опубликованного сайта (активируется флагом --live или --url <url>):
 *    - Реальные сетевые HTTP-статусы (200, 301, 404)
 *
 * Результаты:
 * - Разделение на реальные Ошибки (Errors), Предупреждения (Warnings) и Ограничения проверки (Limitations)
 * - Сохранение машинно-читаемого JSON отчета (audit-seo-report.json)
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const APP_DIR = path.resolve(".next/server/app");
const SITE_URL = "https://promofact.ru";
const REPORT_PATH = path.resolve("audit-seo-report.json");

const args = process.argv.slice(2);
const isLiveMode = args.includes("--live") || args.some((a) => a.startsWith("--url="));
const isJsonOutput = args.includes("--json");
const customUrlArg = args.find((a) => a.startsWith("--url="));
const targetBaseUrl = customUrlArg ? customUrlArg.split("=")[1] : SITE_URL;

function normalizeUrlPath(urlOrPath) {
  let p = urlOrPath.replace(SITE_URL, "").replace(targetBaseUrl, "");
  p = p.split("?")[0].split("#")[0];
  if (p === "") p = "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function probeHttp(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.request(
      url,
      {
        method: "HEAD",
        headers: { "User-Agent": "PromoFactSeoAuditor/1.0" },
        timeout: 5000,
      },
      (res) => {
        resolve({ url, status: res.statusCode, error: null });
      }
    );
    req.on("error", (err) => resolve({ url, status: null, error: err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ url, status: null, error: "Timeout (5000ms)" });
    });
    req.end();
  });
}

function scanDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
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

async function runAudit() {
  if (!isJsonOutput) {
    console.log("================================================================================");
    console.log(`🚀 ЗАПУСК ТЕХНИЧЕСКОГО SEO-АУДИТА PROMOFACT [${isLiveMode ? "LIVE HTTP + LOCAL" : "LOCAL BUILD"}]`);
    console.log("================================================================================\n");
  }

  const errors = [];
  const warnings = [];
  const limitations = [];

  if (!fs.existsSync(APP_DIR)) {
    console.error("❌ Директория сборки .next/server/app не найдена! Сначала выполните `npm run build`.");
    process.exit(1);
  }

  // 1. Чтение и валидация sitemap.xml.body
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
  const invalidLastmods = [];
  const lastmodMap = new Map();

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

    // Проверка корректности и достоверности lastmod
    if (lastmod) {
      const ts = new Date(lastmod).getTime();
      if (isNaN(ts)) {
        invalidLastmods.push({ url: loc, lastmod, reason: "Невалидный ISO формат даты" });
      } else if (ts > now + ONE_DAY_MS) {
        invalidLastmods.push({ url: loc, lastmod, reason: "Дата lastmod находится в будущем" });
      } else if (ts < new Date("2020-01-01").getTime()) {
        invalidLastmods.push({ url: loc, lastmod, reason: "Дата lastmod слишком старая (ранее 2020 года)" });
      }
      lastmodMap.set(loc, lastmod);
    }

    sitemapUrls.push({ loc, lastmod });
  }

  if (duplicateSitemapUrls.length > 0) {
    errors.push({
      category: "sitemap_duplicates",
      message: `В sitemap.xml обнаружены дублирующиеся URL (${duplicateSitemapUrls.length})`,
      details: duplicateSitemapUrls,
    });
  }

  if (invalidLastmods.length > 0) {
    errors.push({
      category: "invalid_lastmod",
      message: `В sitemap.xml обнаружены некорректные даты lastmod (${invalidLastmods.length})`,
      details: invalidLastmods,
    });
  }

  // 2. Чтение robots.txt правил
  const robotsTsPath = path.resolve("src/app/robots.ts");
  let disallowedPrefixes = ["/admin", "/api/", "/stats/"];
  if (fs.existsSync(robotsTsPath)) {
    const robotsCode = fs.readFileSync(robotsTsPath, "utf-8");
    const m = robotsCode.match(/disallow:\s*\[([\s\S]*?)\]/);
    if (m) {
      disallowedPrefixes = [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
    }
  }

  // 3. Индексация HTML страниц сборки
  const allHtmlFiles = scanDir(APP_DIR);
  const buildRouteMap = new Map();

  for (const filePath of allHtmlFiles) {
    const rel = path.relative(APP_DIR, filePath).replace(/\\/g, "/");
    let route = "/" + rel.replace(/\.html$/, "").replace(/\/index$/, "");
    if (route === "/index") route = "/";

    const html = fs.readFileSync(filePath, "utf-8");

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "";

    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;

    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const robotsContent = robotsMatch ? robotsMatch[1].trim() : "";

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
      } else if (href.startsWith(SITE_URL) || href.startsWith(targetBaseUrl)) {
        links.push(normalizeUrlPath(href));
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

  // 4. Проверка sitemap URL против артефактов сборки и каноничности
  const missingHtmlPages = [];
  const missingCanonicals = [];
  const canonicalMismatches = [];
  const robotsViolations = [];

  for (const item of sitemapUrls) {
    const route = normalizeUrlPath(item.loc);

    // Проверка против robots.txt
    for (const dis of disallowedPrefixes) {
      if (dis.endsWith("/") ? route.startsWith(dis) : route === dis || route.startsWith(dis + "/")) {
        robotsViolations.push({ url: item.loc, disallow: dis });
      }
    }

    // Проверка наличия SSG артефакта
    const pageData = buildRouteMap.get(route);
    if (!pageData) {
      missingHtmlPages.push({ url: item.loc, error: "SSG HTML артефакт не найден в .next/server/app" });
    } else {
      // Проверка обязательного Canonical
      if (!pageData.canonical) {
        missingCanonicals.push({ url: item.loc, error: "Отсутствует обязательный тег <link rel='canonical'>" });
      } else {
        const normCanonical = normalizeUrlPath(pageData.canonical);
        if (normCanonical !== route) {
          canonicalMismatches.push({
            url: item.loc,
            canonical: pageData.canonical,
            expected: route,
          });
        }
      }
    }
  }

  if (missingHtmlPages.length > 0) {
    errors.push({
      category: "missing_build_artifacts",
      message: `Страницы из sitemap.xml отсутствуют в скомпилированном билде (${missingHtmlPages.length})`,
      details: missingHtmlPages,
    });
  }

  if (missingCanonicals.length > 0) {
    errors.push({
      category: "missing_canonical",
      message: `Обнаружены страницы sitemap без обязательного тега canonical (${missingCanonicals.length})`,
      details: missingCanonicals,
    });
  }

  if (canonicalMismatches.length > 0) {
    errors.push({
      category: "canonical_mismatch",
      message: `Несоответствие canonical и адреса страницы (${canonicalMismatches.length})`,
      details: canonicalMismatches,
    });
  }

  if (robotsViolations.length > 0) {
    errors.push({
      category: "robots_violations",
      message: `Страницы из sitemap.xml закрыты в robots.txt (${robotsViolations.length})`,
      details: robotsViolations,
    });
  }

  // 5. Проверка уникальности Title и Description (только для страниц sitemap)
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

  if (duplicateTitles.length > 0) {
    errors.push({
      category: "duplicate_titles",
      message: `Обнаружены дублирующиеся теги Title (${duplicateTitles.length} групп)`,
      details: duplicateTitles.map(([title, routes]) => ({ title, routes })),
    });
  }

  if (duplicateDescriptions.length > 0) {
    errors.push({
      category: "duplicate_descriptions",
      message: `Обнаружены дублирующиеся теги Description (${duplicateDescriptions.length} групп)`,
      details: duplicateDescriptions.map(([description, routes]) => ({ description, routes })),
    });
  }

  // 6. Проверка графа внутренних ссылок и битых ссылок
  const brokenLinks = [];
  const incomingLinks = new Map();

  for (const [sourceRoute, pageData] of buildRouteMap.entries()) {
    for (const target of pageData.links) {
      if (!incomingLinks.has(target)) incomingLinks.set(target, new Set());
      incomingLinks.get(target).add(sourceRoute);

      if (!buildRouteMap.has(target)) {
        brokenLinks.push({ source: sourceRoute, target });
      }
    }
  }

  if (brokenLinks.length > 0) {
    errors.push({
      category: "broken_internal_links",
      message: `Обнаружены битые внутренние ссылки (${brokenLinks.length})`,
      details: brokenLinks.slice(0, 50),
    });
  }

  // 7. Поиск изолированных страниц (Orphan Pages)
  const orphanPages = [];
  for (const item of sitemapUrls) {
    const route = normalizeUrlPath(item.loc);
    if (route === "/") continue;
    const sources = incomingLinks.get(route);
    if (!sources || sources.size === 0) {
      orphanPages.push(route);
    }
  }

  if (orphanPages.length > 0) {
    warnings.push({
      category: "orphan_pages",
      message: `Страницы в sitemap без входящих внутренних ссылок (${orphanPages.length})`,
      details: orphanPages,
    });
  }

  // 8. Сетевой HTTP-аудит опубликованного сайта (если включён режим --live)
  let liveHttpResults = null;
  if (isLiveMode) {
    if (!isJsonOutput) console.log(`🌐 Выполняется сетевой HTTP-опрос опубликованного сайта (${targetBaseUrl})...`);
    const sampleUrls = sitemapUrls.slice(0, 25).map((u) => u.loc.replace(SITE_URL, targetBaseUrl));
    const probeResponses = await Promise.all(sampleUrls.map((u) => probeHttp(u)));
    const httpFailures = probeResponses.filter((r) => r.status !== 200);

    liveHttpResults = {
      probedCount: sampleUrls.length,
      sampleScopeNote: "Сетевой аудит --live проверяет репрезентативную выборку из 25 URL, а не весь сайт целиком.",
      successCount: sampleUrls.length - httpFailures.length,
      failureCount: httpFailures.length,
      failures: httpFailures,
    };

    if (httpFailures.length > 0) {
      errors.push({
        category: "live_http_failures",
        message: `Сетевой HTTP-аудит выявил сбои ответа (статус != 200) для ${httpFailures.length} страниц`,
        details: httpFailures,
      });
    }
  } else {
    limitations.push({
      category: "network_probe_skipped",
      message: "Сетевой HTTP-аудит опубликованного сайта пропущен в локальном режиме сборки. Используйте флаг --live для сетевой проверки.",
    });
  }

  // ================= ФОРМИРОВАНИЕ МАШИННО-ЧИТАЕМОГО ОТЧЕТА =================
  const isFailed = errors.length > 0;
  const report = {
    timestamp: new Date().toISOString(),
    auditMode: isLiveMode ? "live_http_and_local" : "local_build_only",
    status: isFailed ? "FAILED" : "PASSED",
    summary: {
      sitemapUrlsCount: sitemapUrls.length,
      prerenderedHtmlCount: allHtmlFiles.length,
      uniqueLastmodCount: lastmodMap.size,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      limitationsCount: limitations.length,
    },
    checks: {
      buildArtifacts: { status: missingHtmlPages.length === 0 ? "PASS" : "FAIL", count: missingHtmlPages.length },
      canonicalTags: {
        status: missingCanonicals.length === 0 && canonicalMismatches.length === 0 ? "PASS" : "FAIL",
        missing: missingCanonicals.length,
        mismatches: canonicalMismatches.length,
      },
      robotsCompliance: { status: robotsViolations.length === 0 ? "PASS" : "FAIL", violations: robotsViolations.length },
      lastmodValidation: { status: invalidLastmods.length === 0 ? "PASS" : "FAIL", invalid: invalidLastmods.length },
      duplicateTitles: { status: duplicateTitles.length === 0 ? "PASS" : "FAIL", count: duplicateTitles.length },
      duplicateDescriptions: { status: duplicateDescriptions.length === 0 ? "PASS" : "FAIL", count: duplicateDescriptions.length },
      brokenInternalLinks: { status: brokenLinks.length === 0 ? "PASS" : "FAIL", count: brokenLinks.length },
      orphanPages: { status: orphanPages.length === 0 ? "PASS" : "WARN", count: orphanPages.length },
      liveHttp: liveHttpResults,
    },
    errors,
    warnings,
    limitations,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");

  if (isJsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(isFailed ? 1 : 0);
  }

  console.log("\n==================== РЕЗУЛЬТАТЫ АУДИТА ====================");
  console.log(`1. Build Artifact Existence:  ${missingHtmlPages.length === 0 ? "✅ PASS" : "❌ FAIL (" + missingHtmlPages.length + " missing)"}`);
  console.log(`2. Canonical Matching:        ${missingCanonicals.length === 0 && canonicalMismatches.length === 0 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`3. Robots.txt Compliance:     ${robotsViolations.length === 0 ? "✅ PASS" : "❌ FAIL (" + robotsViolations.length + ")"}`);
  console.log(`4. Lastmod Validation:        ${invalidLastmods.length === 0 ? "✅ PASS" : "❌ FAIL (" + invalidLastmods.length + " invalid)"}`);
  console.log(`5. Duplicate Titles:          ${duplicateTitles.length === 0 ? "✅ PASS" : "❌ FAIL (" + duplicateTitles.length + " groups)"}`);
  console.log(`6. Duplicate Descriptions:    ${duplicateDescriptions.length === 0 ? "✅ PASS" : "❌ FAIL (" + duplicateDescriptions.length + " groups)"}`);
  console.log(`7. Broken Internal Links:     ${brokenLinks.length === 0 ? "✅ PASS" : "❌ FAIL (" + brokenLinks.length + " broken)"}`);
  console.log(`8. Orphan Pages in Sitemap:   ${orphanPages.length === 0 ? "✅ PASS" : "⚠️ WARN (" + orphanPages.length + " orphans)"}`);
  if (isLiveMode) {
    console.log(`9. Live HTTP Probe:           ${liveHttpResults.failureCount === 0 ? "✅ PASS" : "❌ FAIL (" + liveHttpResults.failureCount + " errors)"}`);
  }
  console.log("===========================================================\n");

  if (errors.length > 0) {
    console.error("❌ ОБНАРУЖЕНЫ КРИТИЧЕСКИЕ ОШИБКИ:");
    for (const err of errors) {
      console.error(` - [${err.category}]: ${err.message}`);
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️ ПРЕДУПРЕЖДЕНИЯ (WARNINGS):");
    for (const w of warnings) {
      console.warn(` - [${w.category}]: ${w.message}`);
    }
  }

  if (limitations.length > 0) {
    console.log("ℹ️ ОГРАНИЧЕНИЯ ПРОВЕРКИ (LIMITATIONS):");
    for (const l of limitations) {
      console.log(` - [${l.category}]: ${l.message}`);
    }
  }

  console.log(`\n📄 Машинно-читаемый отчет сохранён в ${REPORT_PATH}`);

  if (isFailed) {
    console.error("\n❌ АУДИТ ЗАВЕРШИЛСЯ С КРИТИЧЕСКИМИ ОШИБКАМИ!");
    process.exit(1);
  } else {
    console.log("\n🎉 ПОЛНЫЙ SEO-АУДИТ УСПЕШНО ПРОЙДЕН! 100% КРИТЕРИЕВ В НОРМЕ.");
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error("Критический сбой аудита:", err);
  process.exit(1);
});
