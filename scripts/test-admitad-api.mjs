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
  getAdmitadAccessToken,
  getValidAccessToken,
  clearTokenCache,
  resolveWebsite,
} from "../src/lib/admitadApi.ts";
import { loadEnvLocalSafe } from "./admitad-api-dry-run.mjs";
import { normalizeAdmitadCoupon, validateOffer } from "../src/lib/admitadNormalizer.ts";

const fixturePath = path.resolve("scripts/fixtures/admitad-api-sample.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

console.log("================================================================================");
console.log("🚀 ЗАПУСК ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD API (ADMITAD-1.1)");
console.log("================================================================================\n");

let passed = 0;

// Настройка тестовых переменных для окружения токена
process.env.ADMITAD_CLIENT_ID = "test_client_id";
process.env.ADMITAD_CLIENT_SECRET = "test_client_secret";

// Тест 1: Network client - 401 Unauthorized ретраится ровно один раз и при повторном 401 выбрасывает ошибку
{
  clearTokenCache();
  let tokenCalls = 0;
  let apiCalls = 0;

  const mockFetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      tokenCalls++;
      return {
        status: 200,
        ok: true,
        json: async () => ({
          access_token: `token_${tokenCalls}`,
          expires_in: 3600,
          token_type: "bearer",
          scope: "websites",
        }),
      };
    }
    apiCalls++;
    return {
      status: 401,
      ok: false,
      statusText: "Unauthorized",
      json: async () => ({ error: "invalid_token" }),
    };
  };

  try {
    await admitadFetch("/test/", {
      customFetch: mockFetch,
      maxRetries: 3,
    });
    assert.fail("Запрос должен был завершиться ошибкой 401");
  } catch (err) {
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(apiCalls, 2, "При 401 должен быть ровно 1 повтор API запроса после refresh");
    assert.strictEqual(tokenCalls, 2, "Токен должен быть запрошен повторно");
  }
  console.log("✓ Тест 1: API 401 вызывает token refresh и ровно 1 retry, при повторном 401 -> fail (PASS)");
  passed++;
}

// Тест 2: Network client - 429 Rate Limit и 500 успешно ретраятся с бэкоффом
{
  clearTokenCache();
  let callCount = 0;
  const mockFetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          access_token: "test_token_ok",
          expires_in: 3600,
          token_type: "bearer",
          scope: "websites",
        }),
      };
    }
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

  const res = await admitadFetch("/retry-test/", {
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
  clearTokenCache();
  let pageRequests = 0;
  const mockFetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          access_token: "test_token_ok",
          expires_in: 3600,
          token_type: "bearer",
          scope: "websites",
        }),
      };
    }
    pageRequests++;
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
    "/paginated-test/",
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
  const camp = { id: 3, name: "Shop", site_url: "https://shop.com", connection_status: "active" };

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
  const camp = { id: 4, name: "US Shop", site_url: "https://us-shop.com", connection_status: "active" };

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
    connection_status: "active",
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
    connection_status: "active",
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
    connection_status: "active",
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
    'ADMITAD_CLIENT_ID="id_from_file"\nNEW_TEST_VAR="hello_local"\n',
    "utf-8"
  );

  process.env.ADMITAD_CLIENT_ID = "already_set_id";
  loadEnvLocalSafe(tempEnvPath);

  assert.strictEqual(process.env.ADMITAD_CLIENT_ID, "already_set_id");
  assert.strictEqual(process.env.NEW_TEST_VAR, "hello_local");

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
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          access_token: "test_token_ok",
          expires_in: 3600,
          token_type: "bearer",
          scope: "websites",
        }),
      };
    }
    requestedUrls.push(urlStr);
    return {
      status: 404,
      ok: false,
      statusText: "Not Found",
      json: async () => ({ error: "website_not_found" }),
    };
  };

  try {
    await validateWebsite("9999", {
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

// Тест 16: client credentials form body & Basic Authorization формируются корректно
{
  let interceptedBody = "";
  let interceptedAuth = "";
  const mockFetch = async (url, opts) => {
    interceptedBody = String(opts.body);
    interceptedAuth = String(opts.headers?.Authorization || "");
    return {
      status: 200,
      ok: true,
      json: async () => ({
        access_token: "token_abc_123",
        expires_in: 3600,
        token_type: "bearer",
        scope: "websites advcampaigns_for_website coupons_for_website",
      }),
    };
  };

  const res = await getAdmitadAccessToken("my_cid", "my_secret", {
    customFetch: mockFetch,
  });

  assert.strictEqual(res.accessToken, "token_abc_123");
  assert.ok(interceptedBody.includes("grant_type=client_credentials"));
  assert.ok(interceptedBody.includes("client_id=my_cid"));
  assert.ok(interceptedBody.includes("scope=websites+advcampaigns_for_website+coupons_for_website"));
  assert.ok(interceptedAuth.startsWith("Basic "));
  // Проверяем, что base64 декодируется в my_cid:my_secret
  const decoded = Buffer.from(interceptedAuth.replace("Basic ", ""), "base64").toString("utf-8");
  assert.strictEqual(decoded, "my_cid:my_secret");
  console.log("✓ Тест 16: client credentials form body и Basic Authorization формируются корректно (PASS)");
  passed++;
}

// Тест 17: Token caching & reuse (>60s)
{
  clearTokenCache();
  let tokenCallCount = 0;
  const mockFetch = async () => {
    tokenCallCount++;
    return {
      status: 200,
      ok: true,
      json: async () => ({
        access_token: "cached_tok",
        expires_in: 3600,
        token_type: "bearer",
        scope: "websites",
      }),
    };
  };

  const t1 = await getValidAccessToken({ customFetch: mockFetch });
  const t2 = await getValidAccessToken({ customFetch: mockFetch });
  assert.strictEqual(t1, "cached_tok");
  assert.strictEqual(t2, "cached_tok");
  assert.strictEqual(tokenCallCount, 1, "Второй вызов должен вернуть токен из кэша без сетевого запроса");
  console.log("✓ Тест 17: In-memory кэш токена успешно переиспользуется без лишних запросов (PASS)");
  passed++;
}

// Тест 18: Expired token (<60s) запрашивает новый токен
{
  clearTokenCache();
  let tokenCallCount = 0;
  const mockFetch = async () => {
    tokenCallCount++;
    return {
      status: 200,
      ok: true,
      json: async () => ({
        access_token: `token_ver_${tokenCallCount}`,
        expires_in: 30, // < 60 секунд (считается истекшим)
        token_type: "bearer",
        scope: "websites",
      }),
    };
  };

  const t1 = await getValidAccessToken({ customFetch: mockFetch });
  const t2 = await getValidAccessToken({ customFetch: mockFetch });
  assert.strictEqual(t1, "token_ver_1");
  assert.strictEqual(t2, "token_ver_2");
  assert.strictEqual(tokenCallCount, 2, "Истекший токен должен приводить к получению нового");
  console.log("✓ Тест 18: Истекший токен (< 60s) автоматически обновляется (PASS)");
  passed++;
}

// Тест 19: Token endpoint 401 не делает дальнейших API вызовов
{
  clearTokenCache();
  let tokenCalls = 0;
  const mockFetch = async () => {
    tokenCalls++;
    return {
      status: 401,
      ok: false,
      statusText: "Unauthorized",
      json: async () => ({ error: "invalid_client" }),
    };
  };

  try {
    await getAdmitadAccessToken("bad_cid", "bad_sec", { customFetch: mockFetch });
    assert.fail("Должен был выбросить ошибку");
  } catch (err) {
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(tokenCalls, 1);
  }
  console.log("✓ Тест 19: Ошибка на эндпоинте токена 401 не делает лишних запросов (PASS)");
  passed++;
}

// Тест 20: Auto Website Discovery: explicit ID vs auto host vs www vs ambiguous vs not found
{
  clearTokenCache();
  const mockWebsites = [
    { id: 101, name: "PromoFact Official", site_url: "https://promofact.ru", status: "active" },
    { id: 102, name: "Another Project", site_url: "https://another.com", status: "active" },
  ];

  const mockFetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      return {
        status: 200,
        ok: true,
        json: async () => ({ access_token: "site_tok", expires_in: 3600, token_type: "bearer", scope: "websites" }),
      };
    }
    if (urlStr.includes("/websites/v2/101/")) {
      return { status: 200, ok: true, json: async () => mockWebsites[0] };
    }
    if (urlStr.includes("/websites/v2/")) {
      return { status: 200, ok: true, json: async () => mockWebsites };
    }
    return { status: 404, ok: false, statusText: "Not Found", json: async () => ({ error: "not_found" }) };
  };

  // A. Explicit websiteId
  const explicitRes = await resolveWebsite(
    { clientId: "c", clientSecret: "s", websiteId: "101" },
    { customFetch: mockFetch }
  );
  assert.strictEqual(explicitRes.resolution, "EXPLICIT");
  assert.strictEqual(explicitRes.website?.id, 101);

  // B. Auto host promofact.ru
  const autoRes = await resolveWebsite(
    { clientId: "c", clientSecret: "s", websiteHost: "promofact.ru" },
    { customFetch: mockFetch }
  );
  assert.strictEqual(autoRes.resolution, "AUTO_HOST");
  assert.strictEqual(autoRes.website?.id, 101);

  // C. Auto host with www
  const autoWwwRes = await resolveWebsite(
    { clientId: "c", clientSecret: "s", websiteHost: "www.promofact.ru" },
    { customFetch: mockFetch }
  );
  assert.strictEqual(autoWwwRes.resolution, "AUTO_HOST");
  assert.strictEqual(autoWwwRes.website?.id, 101);

  // D. Multiple matching -> AMBIGUOUS
  const mockMultiSites = [
    { id: 201, name: "PromoFact 1", site_url: "https://promofact.ru", status: "active" },
    { id: 202, name: "PromoFact 2", site_url: "https://promofact.ru", status: "active" },
  ];
  const mockMultiFetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      return { status: 200, ok: true, json: async () => ({ access_token: "t", expires_in: 3600, token_type: "bearer", scope: "websites" }) };
    }
    return { status: 200, ok: true, json: async () => mockMultiSites };
  };
  const ambigRes = await resolveWebsite(
    { clientId: "c", clientSecret: "s", websiteHost: "promofact.ru" },
    { customFetch: mockMultiFetch }
  );
  assert.strictEqual(ambigRes.resolution, "AMBIGUOUS");

  // E. No match -> NOT_FOUND
  const notFoundRes = await resolveWebsite(
    { clientId: "c", clientSecret: "s", websiteHost: "non-existent-site.org" },
    { customFetch: mockFetch }
  );
  assert.strictEqual(notFoundRes.resolution, "NOT_FOUND");

  console.log("✓ Тест 20: Auto Website Discovery c реальным форматом массива (PASS)");
  passed++;
}

// Тест 21: Suspended / Inactive site reports status truthfully
{
  const mockSuspended = { id: 301, name: "Suspended PromoFact", site_url: "https://promofact.ru", status: "suspended" };
  const mockSuspendedFetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      return { status: 200, ok: true, json: async () => ({ access_token: "t", expires_in: 3600, token_type: "bearer", scope: "websites" }) };
    }
    return { status: 200, ok: true, json: async () => [mockSuspended] };
  };

  const res = await resolveWebsite(
    { clientId: "c", clientSecret: "s", websiteHost: "promofact.ru" },
    { customFetch: mockSuspendedFetch }
  );
  assert.strictEqual(res.resolution, "AUTO_HOST");
  assert.strictEqual(res.website?.status, "suspended");
  console.log("✓ Тест 21: Приостановленная площадка честно сохраняет статус suspended (PASS)");
  passed++;
}

// Тест 22: GET /websites/v2/ возвращает неожиданный объект (schema error)
{
  const mockMalformedFetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("/token/")) {
      return { status: 200, ok: true, json: async () => ({ access_token: "t", expires_in: 3600, token_type: "bearer", scope: "websites" }) };
    }
    // Ошибочно возвращает объект вместо массива
    return { status: 200, ok: true, json: async () => ({ results: [], _meta: { count: 0 } }) };
  };

  let threwExpected = false;
  try {
    await resolveWebsite(
      { clientId: "c", clientSecret: "s", websiteHost: "promofact.ru" },
      { customFetch: mockMalformedFetch }
    );
  } catch (err) {
    threwExpected = true;
    assert.strictEqual(err.code, "API_SCHEMA_ERROR");
  }
  assert.strictEqual(threwExpected, true, "Ожидалась ошибка API_SCHEMA_ERROR при возврате объекта вместо массива");
  console.log("✓ Тест 22: Некорректный формат ответа /websites/v2/ выбрасывает API_SCHEMA_ERROR (PASS)");
  passed++;
}

console.log("\n================================================================================");
console.log(`🎉 ВСЕ ${passed}/${passed} ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD-1.2 УСПЕШНО ПРОЙДЕНЫ!`);
console.log("================================================================================\n");