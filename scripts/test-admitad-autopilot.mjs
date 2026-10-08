import assert from "node:assert";
import {
  CATASTROPHIC_DROP_THRESHOLD,
  evaluateSnapshotSafety,
  isAdmitadPublishable,
  buildAdmitadOrdText,
  generateClickId,
  decorateAdmitadUrl,
} from "../src/lib/admitadAutopilot.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";

let passed = 0;

console.log("================================================================================");
console.log("🚀 ЗАПУСК ДЕТЕРМИНИРОВАННЫХ ТЕСТОВ ADMITAD-2 AUTOPILOT");
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
      campaign: { id: 25224, status: "active" }, // 25224 is in VERIFIED_CAMPAIGN_ALLOWLIST
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
      campaign: { id: 999999, status: "active" }, // Not in allowlist
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

  // Симуляция логики fetchMergedCoupons
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

console.log("\n================================================================================");
console.log(`🎉 ВСЕ ${passed}/11 ТЕСТОВ ADMITAD AUTOPILOT УСПЕШНО ПРОЙДЕНЫ!`);
console.log("================================================================================");
