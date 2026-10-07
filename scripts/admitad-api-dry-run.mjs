/**
 * Скрипт безопасного Dry-Run синка Admitad Publisher API (Read-only)
 *
 * Требования безопасности:
 * - НИКАКИХ записей в базу данных (Supabase).
 * - НИКАКИХ изменений производственного каталога getCoupons().
 * - Не логирует API токен и персональные данные.
 * - При отсутствии env-переменных останавливается с сообщением ADMITAD CREDENTIALS REQUIRED.
 * - Поддерживает загрузку .env.local без перезаписи существующих process.env.
 */

import fs from "node:fs";
import path from "node:path";
import {
  getAdmitadConfig,
  validateWebsite,
  getConnectedPrograms,
  getWebsiteCoupons,
  mapApiCouponToRaw,
  matchCanonicalStore,
  evaluateQualityGate,
  evaluateLegalGate,
  calculateCandidateScore,
} from "../src/lib/admitadApi.ts";
import { normalizeAdmitadCoupon, validateOffer } from "../src/lib/admitadNormalizer.ts";
import { getCoupons } from "../src/lib/perfluence.ts";
import { normalizeCode } from "../src/lib/dedupe.ts";

/**
 * Безопасная загрузка .env.local без сторонних зависимостей
 * Приоритет: already-set process.env > .env.local
 */
export function loadEnvLocalSafe(filePath = ".env.local") {
  const envLocalPath = path.resolve(filePath);
  if (!fs.existsSync(envLocalPath)) return;
  try {
    const content = fs.readFileSync(envLocalPath, "utf-8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  } catch {}
}

async function main() {
  console.log("================================================================================");
  console.log("🚀 ЗАПУСК ADMITAD PUBLISHER API DRY-RUN (READ-ONLY FOUNDATION)");
  console.log("================================================================================\n");

  // Загружаем .env.local, если существует (не перезаписывая установленные env)
  loadEnvLocalSafe();

  const config = getAdmitadConfig();

  if (!config) {
    console.log("🚨 ADMITAD CREDENTIALS REQUIRED");
    console.log("Для выполнения live dry-run необходимо настроить переменные окружения:");
    console.log("  - ADMITAD_API_TOKEN (Bearer токен Publisher API)");
    console.log("  - ADMITAD_WEBSITE_ID (ID площадки в Admitad)");
    console.log("\nLive validation остановлена в соответствии с политикой безопасности.");
    console.log("================================================================================");
    process.exit(0);
  }

  console.log("✓ Конфигурация API: НАЙДЕНА (ADMITAD_API_TOKEN configured: YES)");
  console.log(`✓ Проверка площадки (Website ID: ${config.websiteId})...`);

  let website;
  try {
    website = await validateWebsite(config.websiteId, config.apiToken);
    console.log(`✓ Площадка подтверждена: «${website.name}» (status: ${website.status})`);
  } catch (err) {
    console.error(`❌ Ошибка проверки площадки ID ${config.websiteId}:`, err.message);
    process.exit(1);
  }

  console.log("\n[1/4] Загрузка подключенных программ площадки...");
  let campaigns = [];
  try {
    campaigns = await getConnectedPrograms(config.websiteId, config.apiToken);
    console.log(`✓ Загружено партнерских программ: ${campaigns.length}`);
  } catch (err) {
    console.error("❌ Ошибка загрузки программ:", err.message);
    process.exit(1);
  }

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  console.log("\n[2/4] Загрузка доступных купонов и акций площадки...");
  let rawCoupons = [];
  try {
    rawCoupons = await getWebsiteCoupons(config.websiteId, config.apiToken);
    console.log(`✓ Загружено купонов из API: ${rawCoupons.length}`);
  } catch (err) {
    console.error("❌ Ошибка загрузки купонов:", err.message);
    process.exit(1);
  }

  console.log("\n[3/4] Нормализация, Quality Gates, ERID и сравнение с каталогом PromoFact...");

  // Загружаем текущий каталог PromoFact для проверки коллизий
  const currentCatalog = await getCoupons();
  const currentKeys = new Set(
    currentCatalog.map((c) => {
      const code = normalizeCode(c.promocode.code);
      if (code) return `${c.store.slug}::code::${code}`;
      return `${c.store.slug}::link::${c.affiliate.link || c.store.site}`;
    })
  );

  let validNormalized = 0;
  let expiredCount = 0;
  let foreignCount = 0;
  let invalidCount = 0;
  let unmappedStores = 0;
  let missingLinks = 0;
  let missingLegal = 0;
  let missingErid = 0;
  let duplicatesWithPerfluence = 0;
  let uniqueOffers = 0;
  let readyFuturePublish = 0;

  const processedOffers = [];
  const unmappedStoreNames = new Set();
  const needsMarkingOffers = [];
  const duplicatesList = [];

  for (const apiCoupon of rawCoupons) {
    const camp = campaignMap.get(apiCoupon.campaign?.id) || apiCoupon.campaign;
    const storeMapping = matchCanonicalStore(camp);

    if (storeMapping.strategy === "UNMAPPED") {
      unmappedStores++;
      unmappedStoreNames.add(camp.name);
    }

    const qualityGate = evaluateQualityGate(apiCoupon, camp);
    const legalGate = evaluateLegalGate(apiCoupon, camp);

    if (legalGate.eridStatus !== "PRESENT") missingErid++;
    if (legalGate.legalInfoStatus !== "PRESENT") missingLegal++;
    if (!apiCoupon.goto_link && !apiCoupon.frameset_link) missingLinks++;

    if (!qualityGate.passed) {
      if (qualityGate.reasons.some((r) => r.includes("истёк"))) expiredCount++;
      if (qualityGate.reasons.some((r) => r.includes("Foreign") || r.includes("не таргетирован"))) foreignCount++;
      invalidCount++;
    }

    const rawCoupon = mapApiCouponToRaw(apiCoupon);
    const normalized = normalizeAdmitadCoupon(rawCoupon);
    const isValid = normalized ? validateOffer(normalized) : false;

    if (isValid && qualityGate.passed) {
      validNormalized++;

      // Проверка на дубликат против Perfluence
      const code = normalizeCode(apiCoupon.promocode || "");
      const slug = storeMapping.canonicalSlug || normalized.store.slug;
      const key = code ? `${slug}::code::${code}` : `${slug}::link::${apiCoupon.goto_link}`;
      const isDuplicate = currentKeys.has(key);

      if (isDuplicate) {
        duplicatesWithPerfluence++;
        duplicatesList.push({
          store: slug,
          code: code || "direct_deal",
          title: apiCoupon.name,
          winner: "perfluence",
          reason: "Priority: Perfluence > Admitad",
        });
      } else {
        uniqueOffers++;
      }

      if (legalGate.needsMarking) {
        needsMarkingOffers.push({
          id: apiCoupon.id,
          store: slug,
          title: apiCoupon.name,
          missing: [
            legalGate.eridStatus !== "PRESENT" ? "erid" : null,
            legalGate.legalInfoStatus !== "PRESENT" ? "legal_info" : null,
          ].filter(Boolean),
        });
      } else if (!isDuplicate && storeMapping.strategy !== "UNMAPPED") {
        readyFuturePublish++;
      }

      const score = calculateCandidateScore(
        apiCoupon,
        storeMapping,
        qualityGate,
        legalGate,
        isDuplicate
      );

      processedOffers.push({
        id: apiCoupon.id,
        score,
        store: slug,
        storeName: storeMapping.storeName,
        mappingStrategy: storeMapping.strategy,
        title: apiCoupon.name,
        code: apiCoupon.promocode || null,
        discount: apiCoupon.discount || null,
        erid: legalGate.eridValue,
        needsMarking: legalGate.needsMarking,
        isDuplicate,
        expires: apiCoupon.date_end,
      });
    }
  }

  processedOffers.sort((a, b) => b.score - a.score);

  console.log("\n================================================================================");
  console.log("📊 СВОДНЫЕ АГРЕГАТЫ ADMITAD API DRY-RUN");
  console.log("================================================================================");
  console.log(`API campaigns total:        ${campaigns.length}`);
  console.log(`API coupons total:          ${rawCoupons.length}`);
  console.log(`Valid normalized:           ${validNormalized}`);
  console.log(`Expired:                    ${expiredCount}`);
  console.log(`Foreign / Irrelevant:       ${foreignCount}`);
  console.log(`Invalid / Rejected:         ${invalidCount}`);
  console.log(`Unmapped stores:            ${unmappedStores}`);
  console.log(`Missing affiliate links:    ${missingLinks}`);
  console.log(`Missing legal info:         ${missingLegal}`);
  console.log(`Missing ERID:               ${missingErid}`);
  console.log(`NEEDS_MARKING count:        ${needsMarkingOffers.length}`);
  console.log(`Duplicates vs Perfluence:   ${duplicatesWithPerfluence}`);
  console.log(`Unique Admitad offers:      ${uniqueOffers}`);
  console.log(`Ready for future publish:   ${readyFuturePublish}`);
  console.log("================================================================================\n");

  // Генерация локального отчета ADMITAD_API_DRY_RUN_REPORT.md
  const reportLines = [
    "# ADMITAD PUBLISHER API DRY-RUN REPORT",
    `*Дата генерации: ${new Date().toISOString()}*`,
    "",
    "## A. API Summary",
    `- **Website ID**: ${config.websiteId} («${website.name}», ${website.status})`,
    `- **API Endpoint**: https://api.admitad.com`,
    `- **Auth**: Bearer Token (ADMITAD_API_TOKEN)`,
    `- **Read-only Mode**: Активен (Supabase и catalog не затрагивались)`,
    "",
    "## B. Campaigns",
    `Всего подключено программ: **${campaigns.length}**`,
    "",
    "| ID | Кампания | Статус | Валюта | EPC | CR | Deeplink | Юр. данные | RU Eligible |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...campaigns.map((c) => {
      const hasLegal = Boolean(c.advertiser_legal_info?.trim() || c.legal_info?.trim());
      const ruEligible = Boolean(
        c.action_countries?.some((co) => ["RU", "RUS", "99"].includes(co.toUpperCase())) ||
        c.regions?.some((r) => ["RU", "RUS", "99"].includes(r.region.toUpperCase())) ||
        c.allow_actions_all_countries
      );
      return `| ${c.id} | ${c.name} | ${c.connection_status || c.status || "active"} | ${c.currency || "RUB"} | ${c.epc ?? "—"} | ${c.cr ?? "—"} | ${c.allow_deeplink ? "YES" : "NO"} | ${hasLegal ? "PRESENT" : "MISSING"} | ${ruEligible ? "YES" : "NO"} |`;
    }),
    "",
    "## C. Coupon Counts",
    `- Загружено из API: **${rawCoupons.length}**`,
    `- Валидно нормализовано: **${validNormalized}**`,
    `- Истёкших: **${expiredCount}**`,
    `- Иностранных / нерелевантных: **${foreignCount}**`,
    "",
    "## D. Quality Gate Breakdown",
    `- Отклонено Quality Gate: **${invalidCount}**`,
    `- Отсутствует ERID: **${missingErid}**`,
    `- Отсутствуют реквизиты рекламодателя: **${missingLegal}**`,
    "",
    "## E. Canonical Store Matching",
    `- Точных совпадений / доменов: **${rawCoupons.length - unmappedStores}**`,
    `- Несопоставленных (UNMAPPED): **${unmappedStores}**`,
    "",
    "## F. Top 30 Candidate Offers",
    "| Скор | Магазин | Заголовок | Промокод | Скидка | ERID | Статус |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...processedOffers.slice(0, 30).map((o) =>
      `| ${o.score} | ${o.storeName} | ${o.title.replace(/\|/g, "/")} | ${o.code || "—"} | ${o.discount || "—"} | ${o.erid || "—"} | ${o.needsMarking ? "⚠️ Требует ОРД" : "✅ Готов"} |`
    ),
    "",
    "## G. Duplicate Offers with Perfluence",
    `Всего коллизий: **${duplicatesList.length}** (приоритет: Perfluence > Admitad).`,
    "",
    "## H. NEEDS_MARKING Offers",
    `Офферов, требующих токена ОРД перед публикацией: **${needsMarkingOffers.length}**.`,
    "",
    "## I. UNMAPPED Stores",
    ...Array.from(unmappedStoreNames).map((s) => `- ${s}`),
    "",
    "## J. Recommended ADMITAD-2 Plan",
    "1. Создать официальный мост с ОРД Admitad или фильтровать офферы без `erid`.",
    "2. Настроить автоматический маппинг UNMAPPED магазинов в каноническую таксономию PromoFact.",
    "3. Реализовать управляемый флаг включения Admitad в getCoupons() с кэшированием.",
  ];

  const reportPath = path.resolve("ADMITAD_API_DRY_RUN_REPORT.md");
  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf-8");
  console.log(`✓ Локальный отчет сформирован: ${reportPath} (локально, не отслеживается в git)`);
}

// Запуск main только если скрипт вызывается напрямую
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("admitad-api-dry-run.mjs") ||
    process.argv[1].endsWith("admitad-api-dry-run"));

if (isDirectRun) {
  main().catch((err) => {
    console.error("Фатальная ошибка dry-run:", err);
    process.exit(1);
  });
}