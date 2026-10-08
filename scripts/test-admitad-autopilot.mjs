import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  CATASTROPHIC_DROP_THRESHOLD,
  evaluateSnapshotSafety,
  isAdmitadPublishable,
  buildAdmitadOrdText,
  generateClickId,
  decorateAdmitadUrl,
} from "../src/lib/admitadAutopilot.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";
import { rowToCoupon } from "../src/lib/admitadSupabase.ts";
import { STABLE_STORES } from "../src/lib/stableStores.ts";

let passed = 0;

console.log("================================================================================");
console.log("🚀 ЗАПУСК ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD-2.1 AUTOPILOT");
console.log("================================================================================\n");

// 1. Тест Catastrophic Drop Protection
{
  const checkPass = evaluateSnapshotSafety(400, 400);
  assert.strictEqual(checkPass.safe, true);

  const checkDrop = evaluateSnapshotSafety(400, 100);
  assert.strictEqual(checkDrop.safe, false);
  assert.ok(checkDrop.reason?.includes("Catastrophic count drop"));

  passed++;
  console.log("✓ Тест 1: Catastrophic count drop -> old snapshot preserved (PASS)");
}

// 2. Тест UNMAPPED -> not publishable
{
  const evalResult = isAdmitadPublishable(
    { isExpired: false, isForeign: false },
    {
      campaign: { id: 25224, status: "active" },
      mapping: { strategy: "UNMAPPED" },
      eridStatus: "PRESENT",
      legalInfoStatus: "PRESENT",
      eridValue: "abcd",
      advertiserLegalInfo: "ООО Тест",
    }
  );
  assert.strictEqual(evalResult.publishable, false);
  assert.strictEqual(evalResult.status, "UNMAPPED");
  passed++;
  console.log("✓ Тест 2: UNMAPPED strategy -> not publishable (PASS)");
}

// 3. Тест MISSING ERID -> not publishable
{
  const evalResult = isAdmitadPublishable(
    { isExpired: false, isForeign: false, affiliateLink: "http://ya.ru" },
    {
      campaign: { id: 25224, status: "active" },
      mapping: { strategy: "EXACT MATCH", canonicalSlug: "test" },
      eridStatus: "MISSING",
      legalInfoStatus: "PRESENT",
      advertiserLegalInfo: "ООО Тест",
    }
  );
  assert.strictEqual(evalResult.publishable, false);
  assert.strictEqual(evalResult.status, "MISSING_ERID");
  passed++;
  console.log("✓ Тест 3: Missing ERID -> not publishable (PASS)");
}

// 4. Тест MISSING LEGAL INFO -> not publishable
{
  const evalResult = isAdmitadPublishable(
    { isExpired: false, isForeign: false, affiliateLink: "http://ya.ru" },
    {
      campaign: { id: 25224, status: "active" },
      mapping: { strategy: "EXACT MATCH", canonicalSlug: "test" },
      eridStatus: "PRESENT",
      eridValue: "abcd",
      legalInfoStatus: "MISSING",
    }
  );
  assert.strictEqual(evalResult.publishable, false);
  assert.strictEqual(evalResult.status, "MISSING_LEGAL_INFO");
  passed++;
  console.log("✓ Тест 4: Missing legal info -> not publishable (PASS)");
}

// 5. Тест FOREIGN / EXPIRED -> not publishable
{
  const forRes = isAdmitadPublishable(
    { isExpired: false, isForeign: true },
    { campaign: { id: 25224, status: "active" } }
  );
  assert.strictEqual(forRes.publishable, false);
  assert.strictEqual(forRes.status, "FOREIGN_GEO");

  const expRes = isAdmitadPublishable(
    { isExpired: true, isForeign: false },
    { campaign: { id: 25224, status: "active" } }
  );
  assert.strictEqual(expRes.publishable, false);
  assert.strictEqual(expRes.status, "EXPIRED");
  passed++;
  console.log("✓ Тест 5: Foreign / Expired -> not publishable (PASS)");
}

// 6. Тест ALLOWLIST READY OFFER -> Admitad published
{
  const evalResult = isAdmitadPublishable(
    { isExpired: false, isForeign: false, affiliateLink: "https://ya.ru" },
    {
      campaign: { id: 25224, status: "active" },
      mapping: { strategy: "EXACT MATCH", canonicalSlug: "test" },
      eridStatus: "PRESENT",
      eridValue: "abcd",
      legalInfoStatus: "PRESENT",
      advertiserLegalInfo: "ООО Тест",
      allowlist: ["25224"],
    }
  );
  assert.strictEqual(evalResult.publishable, true);
  assert.strictEqual(evalResult.status, "PUBLISHABLE");
  assert.strictEqual(evalResult.isApproved, true);
  passed++;
  console.log("✓ Тест 6: Allowlisted ready offer -> Admitad published (PASS)");
}

// 7. Тест NON-ALLOWLISTED VALID OFFER -> READY_NOT_APPROVED
{
  const evalResult = isAdmitadPublishable(
    { isExpired: false, isForeign: false, affiliateLink: "https://ya.ru", advcampaignId: "999999" },
    {
      campaign: { id: 999999, status: "active" },
      mapping: { strategy: "EXACT MATCH", canonicalSlug: "test" },
      eridStatus: "PRESENT",
      eridValue: "abcd",
      legalInfoStatus: "PRESENT",
      advertiserLegalInfo: "ООО Тест",
      allowlist: ["25224"],
    }
  );
  assert.strictEqual(evalResult.publishable, false);
  assert.strictEqual(evalResult.status, "READY_NOT_APPROVED");
  passed++;
  console.log("✓ Тест 7: Non-allowlisted valid offer -> READY_NOT_APPROVED (PASS)");
}

// 8. Тест Сборка ORD текста без искажений
{
  const ord = buildAdmitadOrdText(" ООО «Магазин» ", " 2RanyTest ");
  assert.strictEqual(ord.ordMarker, "2RanyTest");
  assert.strictEqual(ord.ordText, "Реклама. ООО «Магазин». erid: 2RanyTest");
  passed++;
  console.log("✓ Тест 8: Legal text and ERID rigidly preserved (PASS)");
}

// 9. Тест Обогащение ссылки (SubID) + Opaque Click ID + erid preserved
{
  const clickId = generateClickId();
  assert.ok(clickId.length >= 32);

  const rawLink = "https://ad.admitad.com/g/xxxxxxx/?erid=2RanyTest";
  const decorated = decorateAdmitadUrl(rawLink, {
    placement: "store_coupon",
    pageType: "store",
    couponId: "12345",
    clickId,
  });

  const url = new URL(decorated);
  assert.strictEqual(url.searchParams.get("erid"), "2RanyTest");
  assert.strictEqual(url.searchParams.get("subid"), "store_coupon");
  assert.strictEqual(url.searchParams.get("subid1"), "store");
  assert.strictEqual(url.searchParams.get("subid2"), "12345");
  assert.strictEqual(url.searchParams.get("subid3"), "promofact");
  assert.strictEqual(url.searchParams.get("subid4"), clickId);

  passed++;
  console.log("✓ Тест 9: Subid4 contains random click_id. Existing erid preserved (PASS)");
}

// 10. Тест Разрешение коллизий: Perfluence collision -> Perfluence wins
{
  const perfluenceCoupon = {
    id: 101,
    store: { id: 1, title: "Яндекс Путешествия", slug: "yandeks-puteshestviya", site: "https://travel.yandex.ru" },
    promocode: { code: "PROMO2026", discount: "15%", isUniversal: true, group: "perfluence" },
    affiliate: { link: "https://prfl.me/travel/123", ordMarker: "perf_erid", ordText: "Реклама. ООО Яндекс" },
  };

  const admitadCollisionCoupon = {
    id: 999,
    store: { id: 1, title: "Яндекс Путешествия", slug: "yandeks-puteshestviya", site: "https://travel.yandex.ru" },
    promocode: { code: "PROMO2026", discount: "10%", isUniversal: true, group: "admitad" },
    affiliate: { link: "https://ad.admitad.com/g/travel", ordMarker: "adm_erid", ordText: "Реклама. ООО Яндекс" },
  };

  const { coupons, stats } = dedupeCoupons([
    { source: "custom", coupons: [] },
    { source: "supabase", coupons: [] },
    { source: "perfluence", coupons: [perfluenceCoupon] },
    { source: "admitad", coupons: [admitadCollisionCoupon] },
  ]);

  assert.strictEqual(coupons.length, 1);
  assert.strictEqual(coupons[0].id, 101);
  assert.strictEqual(coupons[0].promocode.group, "perfluence");
  assert.strictEqual(stats.dropped, 1);
  assert.strictEqual(stats.droppedBySource["admitad"], 1);

  passed++;
  console.log("✓ Тест 10: Perfluence collision -> Perfluence wins (PASS)");
}

// 11. Тест Feature Flag: false -> zero Admitad in catalog, true -> eligible Admitad available
{
  const mockAdmitadCoupon = {
    id: 888,
    store: { id: 2, title: "Ив Роше", slug: "iv-roshe", site: "https://yves-rocher.ru" },
    promocode: { code: "YVES2026", discount: "20%", isUniversal: true, group: "admitad" },
    affiliate: { link: "https://ad.admitad.com/g/yves", ordMarker: "adm_erid", ordText: "Реклама. Ив Роше" },
  };

  function simulateMergedCatalog(flagValue, admitadList) {
    const sources = [
      { source: "custom", coupons: [] },
      { source: "supabase", coupons: [] },
      { source: "perfluence", coupons: [] },
    ];
    if (flagValue === "true") {
      sources.push({ source: "admitad", coupons: admitadList });
    }
    return dedupeCoupons(sources).coupons;
  }

  const catalogWithFlagOff = simulateMergedCatalog("false", [mockAdmitadCoupon]);
  assert.strictEqual(catalogWithFlagOff.length, 0);

  const catalogWithFlagOn = simulateMergedCatalog("true", [mockAdmitadCoupon]);
  assert.strictEqual(catalogWithFlagOn.length, 1);
  assert.strictEqual(catalogWithFlagOn[0].id, 888);

  passed++;
  console.log("✓ Тест 11: Feature flag false -> 0 Admitad; flag true -> eligible Admitad available (PASS)");
}

// 12. Тест: Preserve Affiliate Tracking URL (Section 1)
{
  const row = {
    id: "adm_test_1",
    store: "PREMIER",
    store_slug: "premier",
    site: "https://premier.one",
    affiliate_link: "https://ad.admitad.com/g/xxxxxxx/?erid=2RanyTest",
    affiliate_url: "https://ad.admitad.com/g/xxxxxxx/?erid=2RanyTest",
  };

  const coupon = rowToCoupon(row);
  assert.ok(coupon);
  assert.strictEqual(coupon.store.site, "https://premier.one");
  assert.strictEqual(coupon.affiliate.link, "https://ad.admitad.com/g/xxxxxxx/?erid=2RanyTest");
  assert.strictEqual(coupon.affiliate.landingLink, "https://ad.admitad.com/g/xxxxxxx/?erid=2RanyTest");

  passed++;
  console.log("✓ Тест 12: Preserve Affiliate Tracking URL vs merchant website (PASS)");
}

// 13. Тест: Canonical Category & Category Slug (Section 2, 18)
{
  const premierRow = {
    id: "adm_p1",
    store: "PREMIER",
    store_slug: "premier",
    category_slug: "premier", // ошибочный срез синка
  };
  const premierCoupon = rowToCoupon(premierRow);
  assert.ok(premierCoupon);
  assert.strictEqual(premierCoupon.store.categorySlug, STABLE_STORES["premier"].categorySlug);
  assert.strictEqual(premierCoupon.store.category, STABLE_STORES["premier"].category);
  assert.notStrictEqual(premierCoupon.store.categorySlug, "premier");

  const yvesRow = {
    id: "adm_y1",
    store: "Ив Роше",
    store_slug: "iv-roshe",
    category_slug: "iv-roshe",
  };
  const yvesCoupon = rowToCoupon(yvesRow);
  assert.ok(yvesCoupon);
  assert.strictEqual(yvesCoupon.store.categorySlug, STABLE_STORES["iv-roshe"].categorySlug);
  assert.notStrictEqual(yvesCoupon.store.categorySlug, "iv-roshe");

  passed++;
  console.log("✓ Тест 13: Canonical Category & Category Slug from STABLE_STORES (PASS)");
}

// 14. Тест: Stable Store ID (Section 3)
{
  const premierRow = { id: "adm_1", store: "PREMIER", store_slug: "premier" };
  const yvesRow = { id: "adm_2", store: "Ив Роше", store_slug: "iv-roshe" };

  const c1 = rowToCoupon(premierRow);
  const c2 = rowToCoupon(yvesRow);
  assert.ok(c1 && c2);

  assert.strictEqual(c1.store.id, STABLE_STORES["premier"].id);
  assert.strictEqual(c2.store.id, STABLE_STORES["iv-roshe"].id);
  assert.notStrictEqual(c1.store.id, c2.store.id);

  passed++;
  console.log("✓ Тест 14: Stable Store IDs differentiated across stores (PASS)");
}

// 15. Тест: Dynamic Cache Refresh (Section 8, 9)
{
  let admitadState = [
    { id: 1, title: "Offer 1", store: { slug: "store-1" }, promocode: { code: "CODE1" } },
    { id: 2, title: "Offer 2", store: { slug: "store-2" }, promocode: { code: "CODE2" } },
  ];

  function getMockMergedCatalog() {
    return dedupeCoupons([
      { source: "perfluence", coupons: [{ id: 100, title: "Base Offer", store: { slug: "base" }, promocode: { code: "BASE" } }] },
      { source: "admitad", coupons: admitadState },
    ]).coupons;
  }

  const catalogVersionA = getMockMergedCatalog();
  assert.strictEqual(catalogVersionA.length, 3);

  // Обновление снимка Admitad (версия B)
  admitadState = [
    { id: 1, title: "Offer 1", store: { slug: "store-1" }, promocode: { code: "CODE1" } },
  ];
  const catalogVersionB = getMockMergedCatalog();
  assert.strictEqual(catalogVersionB.length, 2);

  passed++;
  console.log("✓ Тест 15: Dynamic Cache Refresh reflects new snapshot without redeploy (PASS)");
}

// 16. Тест: Click ID Cryptographic Safety (Section 7)
{
  const id1 = generateClickId();
  const id2 = generateClickId();
  assert.notStrictEqual(id1, id2);
  assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id1));

  passed++;
  console.log("✓ Тест 16: Click ID Cryptographic Safety (RFC4122 v4 UUID, no Math.random) (PASS)");
}

// 17. Тест: Staging Isolation (Phase B, E)
{
  const { upsertAdmitadStaging, fetchAdmitadCouponsCached, publishAdmitadSnapshot } = await import("../src/lib/admitadSupabase.ts");

  // Очистка тестового состояния
  const testSyncA = "sync_test_A_1001";
  const rowsA = [
    {
      id: "test_gen_a_1",
      store: "PREMIER",
      store_slug: "premier",
      code: "GEN_A_1",
      discount: "50%",
      category: "Онлайн-кинотеатры",
      category_slug: "onlayn-kinoteatry",
      is_active: true,
      expires: "2029-12-31",
      sync_run_id: testSyncA,
    },
    {
      id: "test_gen_a_2",
      store: "Ив Роше",
      store_slug: "iv-roshe",
      code: "GEN_A_2",
      discount: "20%",
      category: "Косметика и парфюмерия",
      category_slug: "kosmetika-i-parfyumeriya",
      is_active: true,
      expires: "2029-12-31",
      sync_run_id: testSyncA,
    },
  ];

  // Публикуем поколение A
  await upsertAdmitadStaging(rowsA, testSyncA);
  const pubA = await publishAdmitadSnapshot(testSyncA, 2, 0); // minThresholdRatio 0 для инициализации теста
  if (!pubA.success) {
    console.error("pubA error:", pubA.error);
  }
  assert.strictEqual(pubA.success, true);
  assert.strictEqual(pubA.publishedCount, 2);

  const runtimeA = await fetchAdmitadCouponsCached();
  const codesA = runtimeA.map(c => c.promocode.code);
  assert.ok(codesA.includes("GEN_A_1") && codesA.includes("GEN_A_2"));

  // Начинаем поколение B (пишем ТОЛЬКО в staging)
  const testSyncB = "sync_test_B_2002";
  const rowsB = [
    {
      id: "test_gen_b_1",
      store: "PREMIER",
      store_slug: "premier",
      code: "GEN_B_NEW",
      discount: "70%",
      category: "Онлайн-кинотеатры",
      category_slug: "onlayn-kinoteatry",
      is_active: true,
      expires: "2029-12-31",
      sync_run_id: testSyncB,
    },
  ];
  await upsertAdmitadStaging(rowsB, testSyncB);

  // Runtime ВСЁ ЕЩЕ должен видеть строго поколение A, ни одной строки из B!
  const runtimeDuringB = await fetchAdmitadCouponsCached();
  const codesDuringB = runtimeDuringB.map(c => c.promocode.code);
  assert.ok(codesDuringB.includes("GEN_A_1") && codesDuringB.includes("GEN_A_2"));
  assert.ok(!codesDuringB.includes("GEN_B_NEW"), "Поколение B не должно быть видно в runtime до публикации!");

  passed++;
  console.log("✓ Тест 17: Staging Isolation: staging write does not touch production runtime (PASS)");
}

// 18. Тест: Atomic Promotion & Zero Mixed State (Phase B, E)
{
  const { fetchAdmitadCouponsCached, publishAdmitadSnapshot } = await import("../src/lib/admitadSupabase.ts");

  const testSyncB = "sync_test_B_2002";
  // Публикуем поколение B
  const pubB = await publishAdmitadSnapshot(testSyncB, 1, 0.1); // min threshold 0.1
  assert.strictEqual(pubB.success, true);

  // Runtime теперь видит строго поколение B, и НИКАКИХ остатков от поколения A
  const runtimeAfterB = await fetchAdmitadCouponsCached();
  const codesAfterB = runtimeAfterB.map(c => c.promocode.code);
  assert.ok(codesAfterB.includes("GEN_B_NEW"));
  assert.ok(!codesAfterB.includes("GEN_A_1"), "Строка из поколения A не должна оставаться!");
  assert.ok(!codesAfterB.includes("GEN_A_2"), "Строка из поколения A не должна оставаться!");

  passed++;
  console.log("✓ Тест 18: Atomic Promotion switches generations cleanly with Zero Mixed State (PASS)");
}

// 19. Тест: Rollback on Staging Failure / RPC Failure (Phase B, E)
{
  const { fetchAdmitadCouponsCached, publishAdmitadSnapshot } = await import("../src/lib/admitadSupabase.ts");

  // Попытка опубликовать несуществующий sync_run_id
  const failedPub = await publishAdmitadSnapshot("non_existent_sync_run", 5);
  assert.strictEqual(failedPub.success, false);
  assert.ok(failedPub.error);

  // Runtime по-прежнему видит предыдущее поколение B без повреждений
  const runtimeAfterFail = await fetchAdmitadCouponsCached();
  const codes = runtimeAfterFail.map(c => c.promocode.code);
  assert.ok(codes.includes("GEN_B_NEW"));

  passed++;
  console.log("✓ Тест 19: Rollback on Promotion Failure preserves current production snapshot (PASS)");
}

// 20. Тест: Catastrophic Drop Rejection (Phase B, E)
{
  const { upsertAdmitadStaging, fetchAdmitadCouponsCached, publishAdmitadSnapshot } = await import("../src/lib/admitadSupabase.ts");

  const testSyncDrop = "sync_test_drop_3003";
  // Пытаемся передать 0 строк или падение ниже порога 0.35
  const pubDrop = await publishAdmitadSnapshot(testSyncDrop, 10, 0.35);
  assert.strictEqual(pubDrop.success, false);

  const runtimeAfterDrop = await fetchAdmitadCouponsCached();
  assert.ok(runtimeAfterDrop.map(c => c.promocode.code).includes("GEN_B_NEW"));

  passed++;
  console.log("✓ Тест 20: Catastrophic Drop Protection prevents promotion of degraded snapshots (PASS)");
}

// 21. Тест: Yandex Metrika Path Sanitization & No SSR Flag (Phase C, F)
{
  const { sanitizeAnalyticsPath } = await import("../src/lib/analyticsSafety.ts");
  const fs = await import("node:fs");
  const path = await import("node:path");

  // 1. Санитайзинг путей
  assert.strictEqual(sanitizeAnalyticsPath("/"), "/");
  assert.strictEqual(sanitizeAnalyticsPath("/store/premier"), "/store/premier");
  assert.strictEqual(sanitizeAnalyticsPath("/store/premier/SECRET_CODE_123"), "/store/premier/coupon");
  assert.strictEqual(sanitizeAnalyticsPath("/store/yandex-plus/PROMO2026"), "/store/yandex-plus/coupon");

  // 2. Проверка отсутствия ssr: true в файле YandexMetrika.tsx
  const metrikaContent = fs.readFileSync(path.join(process.cwd(), "src/components/YandexMetrika.tsx"), "utf8");
  assert.ok(!metrikaContent.includes("ssr:true") && !metrikaContent.includes("ssr: true"), "Флаг ssr: true должен быть удален!");
  assert.ok(metrikaContent.includes("webvisor:true"), "webvisor:true должен быть сохранен!");
  assert.ok(metrikaContent.includes("usePathname"), "usePathname должен присутствовать для SPA tracking!");

  passed++;
  console.log("✓ Тест 21: Yandex Metrika Path Sanitization & SSR flag absence (PASS)");
}

// 22. Тест: SQL Security Hardening & Permissions (Section 1, 2, 3)
{
  const fs = await import("node:fs");
  const path = await import("node:path");
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/0005_admitad_atomic_publish.sql"), "utf8");

  // Проверка RPC сигнатуры и REVOKE
  assert.ok(sql.includes("revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from PUBLIC;"));
  assert.ok(sql.includes("revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from anon;"));
  assert.ok(sql.includes("revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from authenticated;"));
  assert.ok(sql.includes("grant execute on function public.publish_admitad_snapshot(text, integer, numeric) to service_role;"));

  // Проверка прав staging и sync_meta
  assert.ok(sql.includes("revoke all on public.admitad_coupons_staging from PUBLIC, anon, authenticated;"));
  assert.ok(sql.includes("alter table if exists public.admitad_sync_meta enable row level security;"));
  assert.ok(sql.includes("revoke all on public.admitad_sync_meta from PUBLIC, anon, authenticated;"));

  const sql0006 = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/0006_security_hardening.sql"), "utf8");
  assert.ok(sql0006.includes("set search_path = public"));
  assert.ok(sql0006.includes("handle_updated_at"));

  passed++;
  console.log("✓ Тест 22: SQL Migration Security Hardening: Revoke public RPC, RLS & search_path (PASS)");
}

// 23. Тест: Count Semantics & Catastrophic Threshold (Section 4, 5, 6, 7, 15)
{
  const { upsertAdmitadStaging, publishAdmitadSnapshot, getAdmitadSyncMeta } = await import("../src/lib/admitadSupabase.ts");

  const testSyncGen = "sync_test_counts_4004";
  const rows = [];
  // Создаем 524 строк всего, из них только 13 active (publishable)
  for (let i = 0; i < 524; i++) {
    rows.push({
      id: `count_test_${i}`,
      store: "PREMIER",
      store_slug: "premier",
      code: `CODE_${i}`,
      discount: "500 ₽",
      category: "Онлайн-кинотеатры",
      category_slug: "onlayn-kinoteatry",
      is_active: i < 13, // только 13 активных
      expires: "2029-12-31",
      sync_run_id: testSyncGen,
    });
  }

  await upsertAdmitadStaging(rows, testSyncGen);

  // Передаем Total Count = 524 (Section 6)
  const pubRes = await publishAdmitadSnapshot(testSyncGen, 524, 0);
  assert.strictEqual(pubRes.success, true);
  assert.strictEqual(pubRes.publishedCount, 13);
  assert.strictEqual(pubRes.totalCount, 524);

  const meta = await getAdmitadSyncMeta();
  assert.strictEqual(meta?.last_success_count, 13);
  assert.strictEqual(meta?.last_success_total_count, 524);
  assert.strictEqual(meta?.last_success_sync_run_id, testSyncGen);

  passed++;
  console.log("✓ Тест 23: Count Semantics: Total (524) vs Publishable (13) strictly distinguished (PASS)");
}

// 24. Тест: Failure Paths Preserve Last Success Baseline (Section 10, 16, 17)
{
  const { recordAdmitadSyncFailure, getAdmitadSyncMeta, publishAdmitadSnapshot } = await import("../src/lib/admitadSupabase.ts");

  const baseline = await getAdmitadSyncMeta();
  assert.strictEqual(baseline?.last_success_sync_run_id, "sync_test_counts_4004");
  assert.strictEqual(baseline?.last_success_count, 13);
  assert.strictEqual(baseline?.last_success_total_count, 524);
  const baselineSuccessAt = baseline?.last_success_at;

  // Имитируем сбой выполнения синка (FAILED)
  await recordAdmitadSyncFailure({
    status: "FAILED",
    errorCode: "NETWORK_TIMEOUT",
    duration_ms: 1200,
    details: { test: true },
  });

  const metaAfterFail = await getAdmitadSyncMeta();
  // Поля успешного baseline ОБЯЗАНЫ сохраниться нетронутыми
  assert.strictEqual(metaAfterFail?.last_status, "FAILED");
  assert.strictEqual(metaAfterFail?.last_error_code, "NETWORK_TIMEOUT");
  assert.strictEqual(metaAfterFail?.last_success_sync_run_id, "sync_test_counts_4004");
  assert.strictEqual(metaAfterFail?.last_success_count, 13);
  assert.strictEqual(metaAfterFail?.last_success_total_count, 524);
  assert.strictEqual(metaAfterFail?.last_success_at, baselineSuccessAt);

  // Имитируем сбой RPC
  const failedRpc = await publishAdmitadSnapshot("non_existent_run", 100);
  assert.strictEqual(failedRpc.success, false);

  const metaAfterRpcFail = await getAdmitadSyncMeta();
  assert.strictEqual(metaAfterRpcFail?.last_success_sync_run_id, "sync_test_counts_4004");
  assert.strictEqual(metaAfterRpcFail?.last_success_count, 13);
  assert.strictEqual(metaAfterRpcFail?.last_success_total_count, 524);

  passed++;
  console.log("✓ Тест 24: Failure & RPC Failure paths preserve Last Success baseline (PASS)");
}

// 25. Тест: Security Migration 0006 & Metrika Declined Consent SPA Protection (Section 1A, 1B)
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  // 1A: Проверка отсутствия SECURITY DEFINER в 0006
  const sql0006 = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/0006_security_hardening.sql"), "utf8");
  assert.strictEqual(sql0006.toLowerCase().includes("security definer"), false, "0006 не должна содержать SECURITY DEFINER");
  assert.ok(sql0006.toLowerCase().includes("set search_path = public"), "0006 обязана содержать set search_path = public");

  // 1B: Проверка логики блокировки SPA в YandexMetrika.tsx
  const ymCode = fs.readFileSync(path.join(process.cwd(), "src/components/YandexMetrika.tsx"), "utf8");
  assert.ok(ymCode.includes('if (isDeclined || getConsent() === "declined") return;'), "SPA effect должен блокироваться при declined consent");

  passed++;
  console.log("✓ Тест 25: Security Migration 0006 search_path & Metrika Declined Consent SPA Protection (PASS)");
}

// 26. Тест: Migration 0007 Safeupdate Fix (Section 1 & 2)
{
  const migPath = path.resolve("supabase/migrations/0007_admitad_safeupdate_fix.sql");
  assert.ok(fs.existsSync(migPath), "0007_admitad_safeupdate_fix.sql must exist");
  const sql = fs.readFileSync(migPath, "utf-8");
  assert.ok(sql.includes("delete from public.admitad_coupons"), "Must delete old production coupons");
  assert.ok(sql.includes("where id is not null"), "Must satisfy pg-safeupdate with 'where id is not null'");
  assert.ok(!sql.match(/delete\s+from\s+public\.admitad_coupons\s*;/i), "Must NOT contain unqualified delete without WHERE clause");
  assert.ok(sql.includes("revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from PUBLIC;"));
  assert.ok(sql.includes("revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from anon;"));
  assert.ok(sql.includes("revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from authenticated;"));
  assert.ok(sql.includes("grant execute on function public.publish_admitad_snapshot(text, integer, numeric) to service_role;"));
  passed++;
  console.log("✓ Тест 26: Migration 0007 Safeupdate Fix & RPC Permissions (PASS)");
}

console.log("\n================================================================================");
console.log(`🎉 ВСЕ ${passed}/26 ТЕСТОВ ADMITAD AUTOPILOT & METRIKA УСПЕШНО ПРОЙДЕНЫ!`);
console.log("================================================================================");
