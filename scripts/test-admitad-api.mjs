/**
 * Детерминированные тесты для фундамента Admitad API (Foundation / Read-only)
 * Не делают сетевых запросов в реальный API, используют изолированные фикстуры и моки.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  admitadFetch,
  fetchAllPages,
  validateWebsite,
  mapApiCouponToRaw,
  matchCanonicalStore,
  evaluateQualityGate,
  evaluateLegalGate,
  calculateCandidateScore,
  EXPLICIT_STORE_MAPPINGS,
} from "../src/lib/admitadApi.ts";
import { loadEnvLocalSafe } from "./admitad-api-dry-run.mjs";
import { normalizeAdmitadCoupon, validateOffer } from "../src/lib/admitadNormalizer.ts";

const fixturePath = path.resolve("scripts/fixtures/admitad-api-sample.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

console.log("================================================================================");
console.log("🚀 ЗАПУСК ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD API (ADMITAD-1.1)");
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

  assert.deepStrictEqual(res, { success: true });
  assert.strictEqual(callCount, 3, "Должно быть 3 запроса (2 ретрая)");
  console.log("✓ Тест 2: 429 и 500 корректно повторены через экспоненциальный бэкофф (PASS)");
  passed++;
}

// Тест 3: Generic Pagination загружает все страницы
{
  let pageRequests = 0;
  const mockFetch = async (url) => {
    pageRequests++;
    const urlStr = String(url);
    if (urlStr.includes("offset=0")) {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          results: [{ id: 1 }, { id: 2 }],
          _meta: { count: 3, limit: 2, offset: 0 },
        }),
      };
    }
    return {
      status: 200,
      ok: true,
      json: async () => ({
        results: [{ id: 3 }],
        _meta: { count: 3, limit: 2, offset: 2 },
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

  assert.strictEqual(results.length, 3);
  assert.strictEqual(pageRequests, 2);
  console.log("✓ Тест 3: Generic Pagination загружает все страницы без потерь (PASS)");
  passed++;
}

// Тест 4: advertiser_legal_info PRESENT
{
  const campWithLegal = {
    id: 1,
    name: "Тест",
    site_url: "https://test.ru",
    advertiser_legal_info: "ООО «Тест» ИНН 1234567890",
  };
  const coupon = {
    id: 10,
    name: "Тест",
    goto_link: "https://ad.admitad.com/g/test/?erid=2RanyTest",
    description: "",
    status: "active",
    species: "promocode",
    promocode: "T1",
    discount: "10%",
    date_start: null,
    date_end: null,
    campaign: { id: 1, name: "Тест" },
  };

  const gate = evaluateLegalGate(coupon, campWithLegal);
  assert.strictEqual(gate.legalInfoStatus, "PRESENT");
  assert.strictEqual(gate.eridStatus, "PRESENT");
  assert.strictEqual(gate.needsMarking, false);
  console.log("✓ Тест 4: advertiser_legal_info PRESENT распознан (PASS)");
  passed++;
}

// Тест 5: advertiser_legal_info empty -> MISSING и needsMarking
{
  const campWithoutLegal = {
    id: 2,
    name: "Без реквизитов",
    site_url: "https://nolegal.ru",
    advertiser_legal_info: "",
  };
  const coupon = {
    id: 11,
    name: "Тест",
    goto_link: "https://ad.admitad.com/g/test/?erid=2RanyTest",
    description: "",
    status: "active",
    species: "promocode",
    promocode: "T2",
    discount: "10%",
    date_start: null,
    date_end: null,
    campaign: { id: 2, name: "Без реквизитов" },
  };

  const gate = evaluateLegalGate(coupon, campWithoutLegal);
  assert.strictEqual(gate.legalInfoStatus, "MISSING");
  assert.strictEqual(gate.needsMarking, true);
  console.log("✓ Тест 5: advertiser_legal_info empty -> MISSING и needsMarking (PASS)");
  passed++;
}

// Тест 6: coupon regions ["RU"] -> pass
{
  const coupon = {
    id: 12,
    name: "RU Coupon",
    goto_link: "https://ad.admitad.com/g/test/",
    description: "Тест",
    status: "active",
    species: "promocode",
    promocode: "RU1",
    discount: "10%",
    date_start: null,
    date_end: "2026-12-31T23:59:59",
    regions: ["RU"],
    language: "ru",
    campaign: { id: 3, name: "Shop" },
  };
  const camp = { id: 3, name: "Shop", site_url: "https://shop.com" };

  const qGate = evaluateQualityGate(coupon, camp);
  assert.strictEqual(qGate.passed, true);
  console.log("✓ Тест 6: coupon regions ['RU'] -> pass Quality Gate (PASS)");
  passed++;
}

// Тест 7: coupon regions ["US"] + language missing -> reject foreign
{
  const coupon = {
    id: 13,
    name: "US Coupon",
    goto_link: "https://ad.admitad.com/g/test/",
    description: "Тест",
    status: "active",
    species: "promocode",
    promocode: "US1",
    discount: "10%",
    date_start: null,
    date_end: "2026-12-31T23:59:59",
    regions: ["US"],
    campaign: { id: 4, name: "US Shop" },
  };
  const camp = { id: 4, name: "US Shop", site_url: "https://us-shop.com" };

  const qGate = evaluateQualityGate(coupon, camp);
  assert.strictEqual(qGate.passed, false);
  assert.ok(qGate.reasons.some((r) => r.includes("Foreign") || r.includes("не таргетирован")));
  console.log("✓ Тест 7: coupon regions ['US'] + language missing -> reject foreign (PASS)");
  passed++;
}

// Тест 8: coupon regions [] + campaign action_countries ["RU"] -> pass
{
  const coupon = {
    id: 14,
    name: "Country Coupon",
    goto_link: "https://ad.admitad.com/g/test/",
    description: "Тест",
    status: "active",
    species: "promocode",
    promocode: "C1",
    discount: "10%",
    date_start: null,
    date_end: "2026-12-31T23:59:59",
    regions: [],
    language: "ru",
    campaign: { id: 5, name: "Camp" },
  };
  const camp = {
    id: 5,
    name: "Camp",
    site_url: "https://camp.com",
    action_countries: ["RU"],
  };

  const qGate = evaluateQualityGate(coupon, camp);
  assert.strictEqual(qGate.passed, true);
  console.log("✓ Тест 8: coupon regions [] + campaign action_countries ['RU'] -> pass (PASS)");
  passed++;
}

// Тест 9: coupon regions [] + allow_actions_all_countries true -> pass
{
  const coupon = {
    id: 15,
    name: "Global Coupon",
    goto_link: "https://ad.admitad.com/g/test/",
    description: "Тест",
    status: "active",
    species: "promocode",
    promocode: "G1",
    discount: "10%",
    date_start: null,
    date_end: "2026-12-31T23:59:59",
    regions: [],
    language: "ru",
    campaign: { id: 6, name: "Global" },
  };
  const camp = {
    id: 6,
    name: "Global",
    site_url: "https://global.com",
    allow_actions_all_countries: true,
  };

  const qGate = evaluateQualityGate(coupon, camp);
  assert.strictEqual(qGate.passed, true);
  console.log("✓ Тест 9: coupon regions [] + allow_actions_all_countries true -> pass (PASS)");
  passed++;
}

// Тест 10: Geo unknown -> reject / UNKNOWN_GEO
{
  const coupon = {
    id: 16,
    name: "Unknown Geo Coupon",
    goto_link: "https://ad.admitad.com/g/test/",
    description: "Тест",
    status: "active",
    species: "promocode",
    promocode: "UNK1",
    discount: "10%",
    date_start: null,
    date_end: "2026-12-31T23:59:59",
    regions: [],
    campaign: { id: 7, name: "NoGeo" },
  };
  const camp = {
    id: 7,
    name: "NoGeo",
    site_url: "https://nogeo.org",
    action_countries: ["FR"],
  };

  const qGate = evaluateQualityGate(coupon, camp);
  assert.strictEqual(qGate.passed, false);
  assert.ok(qGate.reasons.some((r) => r.includes("UNKNOWN_GEO")));
  console.log("✓ Тест 10: geo unknown -> reject с причиной UNKNOWN_GEO (PASS)");
  passed++;
}

// Тест 11: unverified numeric campaign mapping absent
{
  assert.strictEqual(EXPLICIT_STORE_MAPPINGS["812"], undefined);
  assert.strictEqual(EXPLICIT_STORE_MAPPINGS["3000"], undefined);
  assert.ok(EXPLICIT_STORE_MAPPINGS["premier"] !== undefined);
  console.log("✓ Тест 11: неподтвержденные числовые campaign IDs 812 и 3000 удалены (PASS)");
  passed++;
}

// Тест 12: .env.local loader does not overwrite existing process.env
{
  const tempEnvPath = path.join(os.tmpdir(), `test-env-local-${Date.now()}.env`);
  fs.writeFileSync(
    tempEnvPath,
    'ADMITAD_API_TOKEN="token_from_file"\nNEW_TEST_VAR="hello_local"\n',
    "utf-8"
  );

  process.env.ADMITAD_API_TOKEN = "already_set_token";
  loadEnvLocalSafe(tempEnvPath);

  assert.strictEqual(process.env.ADMITAD_API_TOKEN, "already_set_token");
  assert.strictEqual(process.env.NEW_TEST_VAR, "hello_local");

  delete process.env.ADMITAD_API_TOKEN;
  delete process.env.NEW_TEST_VAR;
  try {
    fs.unlinkSync(tempEnvPath);
  } catch {}

  console.log("✓ Тест 12: loadEnvLocalSafe() не перезаписывает существующие process.env (PASS)");
  passed++;
}

// Тест 13: website 404 does NOT fall back to legacy endpoint
{
  let requestedUrls = [];
  const mockFetch = async (url) => {
    requestedUrls.push(String(url));
    return {
      status: 404,
      ok: false,
      statusText: "Not Found",
      json: async () => ({ error: "website_not_found" }),
    };
  };

  try {
    await validateWebsite("9999", "test_token", {
      customFetch: mockFetch,
    });
    assert.fail("validateWebsite должен выбросить ошибку при 404");
  } catch (err) {
    assert.strictEqual(err.statusCode, 404);
    assert.strictEqual(requestedUrls.length, 1);
    assert.ok(requestedUrls[0].includes("/websites/v2/9999/"));
    assert.ok(!requestedUrls.some((u) => u === "https://api.admitad.com/websites/9999/"));
  }
  console.log("✓ Тест 13: website 404 не делает fallback на legacy v1 endpoint (PASS)");
  passed++;
}

// Тест 14: Преобразование API JSON в модель PromoFact и валидация нормализатора
{
  const raw = mapApiCouponToRaw(fixture.coupons[0]);
  const norm = normalizeAdmitadCoupon(raw);
  assert.ok(norm !== null);
  assert.strictEqual(norm.store.slug, "tutu");
  assert.strictEqual(validateOffer(norm), true);
  console.log("✓ Тест 14: Преобразование API JSON в модель PromoFact и нормализатор (PASS)");
  passed++;
}

// Тест 15: Калькулятор скоринга кандидатов
{
  const camp = fixture.campaigns[1];
  const mapping = matchCanonicalStore(camp);
  const qGate = evaluateQualityGate(fixture.coupons[0], camp);
  const lGate = evaluateLegalGate(fixture.coupons[0], camp);

  const scoreUnique = calculateCandidateScore(
    fixture.coupons[0],
    mapping,
    qGate,
    lGate,
    false
  );
  const scoreDup = calculateCandidateScore(
    fixture.coupons[0],
    mapping,
    qGate,
    lGate,
    true
  );

  assert.ok(scoreUnique > scoreDup);
  assert.ok(scoreUnique > 50);
  console.log("✓ Тест 15: Калькулятор скоринга кандидатов корректно ранжирует уникальные офферы (PASS)");
  passed++;
}

console.log("\n================================================================================");
console.log(`🎉 ВСЕ ${passed}/${passed} ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD-1.1 УСПЕШНО ПРОЙДЕНЫ!`);
console.log("================================================================================\n");