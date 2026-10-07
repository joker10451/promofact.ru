/**
 * Детерминированные тесты для фундамента Admitad API (Foundation / Read-only)
 * Не делают сетевых запросов в реальный API, используют изолированные фикстуры и моки.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  admitadFetch,
  fetchAllPages,
  mapApiCouponToRaw,
  matchCanonicalStore,
  evaluateQualityGate,
  evaluateLegalGate,
  calculateCandidateScore,
  AdmitadApiError,
} from "../src/lib/admitadApi.ts";
import { normalizeAdmitadCoupon, validateOffer } from "../src/lib/admitadNormalizer.ts";

const fixturePath = path.resolve("scripts/fixtures/admitad-api-sample.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

console.log("================================================================================");
console.log("🚀 ЗАПУСК ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD API FOUNDATION (scripts/test-admitad-api.mjs)");
console.log("================================================================================\n");

let passed = 0;

// Тест 1: Network client - 401 Unauthorized не ретраится и выбрасывает понятную ошибку
{
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      status: 401,
      ok: false,
      statusText: "Unauthorized",
      json: async () => ({ error: "invalid_token" }),
    };
  };

  try {
    await admitadFetch("/test/", "bad_token", {
      customFetch: mockFetch,
      maxRetries: 3,
    });
    assert.fail("Запрос должен был завершиться ошибкой 401");
  } catch (err) {
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(callCount, 1, "401 не должен повторно ретраиться");
    assert.ok(err.message.includes("ADMITAD_API_TOKEN"));
  }
  console.log("✓ Тест 1: 401 Unauthorized безопасно перехвачен без ретраев (PASS)");
  passed++;
}

// Тест 2: Network client - 429 Rate Limit и 500 успешно ретраятся с бэкоффом
{
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount === 1) {
      return { status: 429, ok: false, statusText: "Too Many Requests" };
    }
    if (callCount === 2) {
      return { status: 500, ok: false, statusText: "Internal Error" };
    }
    return {
      status: 200,
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  const res = await admitadFetch("/test-retry/", "valid_token", {
    customFetch: mockFetch,
    maxRetries: 3,
    timeoutMs: 5000,
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(callCount, 3, "Должно быть ровно 3 вызова (429 -> 500 -> 200 OK)");
  console.log("✓ Тест 2: 429 и 500 корректно повторены через экспоненциальный бэкофф (PASS)");
  passed++;
}

// Тест 3: Pagination helper с лимитом безопасности MAX_PAGES
{
  let pageRequests = 0;
  const mockFetch = async (url) => {
    pageRequests++;
    const urlObj = new URL(url);
    const offset = parseInt(urlObj.searchParams.get("offset") || "0", 10);
    const limit = parseInt(urlObj.searchParams.get("limit") || "2", 10);

    const items = [
      { id: offset + 1, name: `Item ${offset + 1}` },
      { id: offset + 2, name: `Item ${offset + 2}` },
    ];

    return {
      status: 200,
      ok: true,
      json: async () => ({
        results: offset >= 6 ? [] : items,
        _meta: { count: 6, limit, offset },
      }),
    };
  };

  const results = await fetchAllPages(
    "/paginated/",
    "token",
    {},
    { customFetch: mockFetch },
    2,
    10
  );

  assert.strictEqual(results.length, 6, "Должно быть загружено 6 элементов со всех страниц");
  assert.strictEqual(pageRequests, 3, "Пагинатор должен был запросить 3 страницы по 2 элемента");
  console.log("✓ Тест 3: Generic Pagination загружает все страницы без потерь (PASS)");
  passed++;
}

// Тест 4: Каноническое сопоставление магазинов (STABLE_STORES vs Unmapped)
{
  const tutuMatch = matchCanonicalStore(fixture.campaigns[1]); // Туту
  assert.strictEqual(tutuMatch.strategy, "EXACT MATCH");
  assert.strictEqual(tutuMatch.canonicalSlug, "tutu");

  const premierMatch = matchCanonicalStore(fixture.campaigns[0]); // PREMIER
  assert.strictEqual(premierMatch.strategy, "EXACT MATCH");
  assert.strictEqual(premierMatch.canonicalSlug, "premier");

  const unknownMatch = matchCanonicalStore(fixture.campaigns[2]); // Unknown
  assert.strictEqual(unknownMatch.strategy, "UNMAPPED");
  assert.strictEqual(unknownMatch.canonicalSlug, "");

  console.log("✓ Тест 4: Сопоставление магазинов по канонической иерархии STABLE_STORES (PASS)");
  passed++;
}

// Тест 5: RU Quality Gate - фильтрация по географии, срокам и ссылкам
{
  const tutuCoupon = fixture.coupons[0];
  const qgTutu = evaluateQualityGate(tutuCoupon, { strategy: "EXACT MATCH", canonicalSlug: "tutu", storeName: "Туту", confidence: "high" });
  assert.strictEqual(qgTutu.passed, true, "Купон Туту должен успешно пройти Quality Gate");

  const expiredCoupon = fixture.coupons[1];
  const qgExpired = evaluateQualityGate(expiredCoupon, { strategy: "EXACT MATCH", canonicalSlug: "premier", storeName: "PREMIER", confidence: "high" });
  assert.strictEqual(qgExpired.passed, false, "Истёкший купон обязан быть отклонён");
  assert.ok(qgExpired.reasons.some((r) => r.includes("истёк")));

  const foreignCoupon = fixture.coupons[2];
  const qgForeign = evaluateQualityGate(foreignCoupon, { strategy: "UNMAPPED", canonicalSlug: "", storeName: "Unknown", confidence: "none" });
  assert.strictEqual(qgForeign.passed, false, "Иностранный магазин без RU-таргета обязан быть отклонён");
  assert.ok(qgForeign.reasons.some((r) => r.includes("не таргетирован на РФ")));

  console.log("✓ Тест 5: RU Quality Gate корректно отсеивает истёкшие и нерелевантные офферы (PASS)");
  passed++;
}

// Тест 6: Legal / ERID Gate
{
  const tutuCoupon = fixture.coupons[0];
  const tutuCampaign = fixture.campaigns[1];
  const legalTutu = evaluateLegalGate(tutuCoupon, tutuCampaign);
  assert.strictEqual(legalTutu.eridStatus, "PRESENT");
  assert.strictEqual(legalTutu.eridValue, "2RanyTestEridTutu");
  assert.strictEqual(legalTutu.legalInfoStatus, "PRESENT");
  assert.strictEqual(legalTutu.needsMarking, false);

  const noEridCoupon = fixture.coupons[2];
  const noEridCampaign = fixture.campaigns[2];
  const legalNoErid = evaluateLegalGate(noEridCoupon, noEridCampaign);
  assert.strictEqual(legalNoErid.eridStatus, "MISSING");
  assert.strictEqual(legalNoErid.needsMarking, true);

  console.log("✓ Тест 6: Legal & ERID Gate корректно идентифицирует маркировку и статус NEEDS_MARKING (PASS)");
  passed++;
}

// Тест 7: JSON -> Internal Model mapping & Normalization
{
  const raw = mapApiCouponToRaw(fixture.coupons[0]);
  const norm = normalizeAdmitadCoupon(raw);
  assert.ok(norm, "Нормализация купона должна быть успешной");
  assert.strictEqual(norm?.promoCode, "TUTU20");
  assert.strictEqual(norm?.discount?.formatted, "−20%");
  assert.strictEqual(validateOffer(norm), true);

  console.log("✓ Тест 7: Преобразование API JSON в модель PromoFact и валидация нормализатора (PASS)");
  passed++;
}

// Тест 8: Scoring candidates
{
  const tutuCoupon = fixture.coupons[0];
  const scoreValid = calculateCandidateScore(
    tutuCoupon,
    { strategy: "EXACT MATCH", canonicalSlug: "tutu", storeName: "Туту", confidence: "high" },
    { passed: true, reasons: [] },
    { eridStatus: "PRESENT", eridValue: "abc", legalInfoStatus: "PRESENT", legalInfoText: "ООО", needsMarking: false },
    false
  );
  assert.ok(scoreValid > 50, `Скор валидного уникального купона должен быть высоким (${scoreValid})`);

  const scoreDuplicate = calculateCandidateScore(
    tutuCoupon,
    { strategy: "EXACT MATCH", canonicalSlug: "tutu", storeName: "Туту", confidence: "high" },
    { passed: true, reasons: [] },
    { eridStatus: "PRESENT", eridValue: "abc", legalInfoStatus: "PRESENT", legalInfoText: "ООО", needsMarking: false },
    true
  );
  assert.ok(scoreDuplicate < scoreValid, "Дубликат с Perfluence должен получать штрафной скор");

  console.log("✓ Тест 8: Калькулятор скоринга кандидатов отражает приоритеты каталога (PASS)");
  passed++;
}

console.log("\n================================================================================");
console.log(`🎉 ВСЕ ${passed}/8 ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD API FOUNDATION УСПЕШНО ПРОЙДЕНЫ!`);
console.log("================================================================================\n");
