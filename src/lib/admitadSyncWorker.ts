/**
 * src/lib/admitadSyncWorker.ts
 *
 * Полный пайплайн безопасного автопилота Admitad Publisher API (ADMITAD-2).
 *
 * Инварианты:
 * 1. Ошибки сети / авторизации / схемы НЕ повреждают текущий снимок в Supabase.
 * 2. Резкое падение предложений (< 35% от прошлого) переводит статус в DEGRADED без изменения БД.
 * 3. Деактивация устаревших предложений выполняется ТОЛЬКО после 100% подтверждения записи нового снимка.
 * 4. Никаких секретов в логах и метаданных.
 */

import {
  getAdmitadConfig,
  resolveWebsite,
  getConnectedPrograms,
  getWebsiteCoupons,
  matchCanonicalStore,
  evaluateQualityGate,
  evaluateLegalGate,
  mapApiCouponToRaw,
} from "@/lib/admitadApi";
import {
  normalizeAdmitadCoupon,
} from "@/lib/admitadNormalizer";
import {
  isAdmitadPublishable,
  evaluateSnapshotSafety,
  buildAdmitadOrdText,
  type SyncAggregates,
} from "@/lib/admitadAutopilot";
import {
  upsertAdmitadSnapshot,
  deactivateStaleSnapshots,
  getActiveSnapshotCount,
  saveAdmitadSyncMeta,
  type AdmitadRowInput,
} from "@/lib/admitadSupabase";
import type { AdmitadApiCampaign } from "@/lib/admitadApi";

export interface SyncWorkerResult {
  success: boolean;
  status: "SUCCESS" | "DEGRADED" | "FAILED";
  aggregates?: SyncAggregates;
  error?: string;
}

export async function runAdmitadSafeSync(options: {
  customFetch?: typeof fetch;
  skipDbWrite?: boolean;
} = {}): Promise<SyncWorkerResult> {
  const startTime = Date.now();
  const syncRunId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 1. Проверка конфигурации OAuth
  const config = getAdmitadConfig();
  if (!config) {
    const error = "ADMITAD_CLIENT_ID или ADMITAD_CLIENT_SECRET не настроены";
    await saveAdmitadSyncMeta({
      last_attempt_at: new Date().toISOString(),
      last_success_at: null,
      last_success_count: 0,
      last_status: "FAILED",
      last_error_code: "AUTH_CONFIG_MISSING",
      duration_ms: Date.now() - startTime,
    });
    return { success: false, status: "FAILED", error };
  }

  try {
    // 2. Определение площадки PromoFact
    const websiteResult = await resolveWebsite(config, {
      customFetch: options.customFetch,
    });

    if (!websiteResult.website) {
      const error = websiteResult.error || "Площадка не найдена";
      await saveAdmitadSyncMeta({
        last_attempt_at: new Date().toISOString(),
        last_success_at: null,
        last_success_count: 0,
        last_status: "FAILED",
        last_error_code: websiteResult.resolution,
        duration_ms: Date.now() - startTime,
      });
      return { success: false, status: "FAILED", error };
    }

    const website = websiteResult.website;

    // 3. Загрузка партнерских программ и купонов площадки
    const [programs, apiCoupons] = await Promise.all([
      getConnectedPrograms(String(website.id), { customFetch: options.customFetch }),
      getWebsiteCoupons(String(website.id), {}, { customFetch: options.customFetch }),
    ]);

    const programMap = new Map<number, AdmitadApiCampaign>();
    for (const p of programs) {
      programMap.set(p.id, p);
    }

    // 4. Нормализация, Quality Gates, ОРД и классификация пригодности к публикации
    const rowsToUpsert: AdmitadRowInput[] = [];
    let normalizedCount = 0;
    let qualityPassCount = 0;
    let mappedCount = 0;
    let legalReadyCount = 0;
    let publishableCount = 0;
    let readyNotApprovedCount = 0;
    let quarantinedCount = 0;

    const nowIso = new Date().toISOString();

    for (const apiCoupon of apiCoupons) {
      const campId = apiCoupon.campaign?.id || 0;
      const program = programMap.get(campId);
      const raw = mapApiCouponToRaw(apiCoupon);

      const campaign: Partial<AdmitadApiCampaign> & { id: number; status?: string; advertiser_legal_info?: string } = {
        id: campId,
        name: program?.name || apiCoupon.campaign?.name || "Неизвестно",
        site_url: program?.site_url || apiCoupon.campaign?.site_url || "",
        status: program?.status || "active",
        advertiser_legal_info: program?.advertiser_legal_info || undefined,
      };

      const normalized = normalizeAdmitadCoupon(raw);
      if (normalized) normalizedCount++;

      const qg = evaluateQualityGate(apiCoupon, program);
      if (qg.passed) qualityPassCount++;

      const fallbackTarget = program || (apiCoupon.campaign ? { ...apiCoupon.campaign, site_url: apiCoupon.campaign.site_url || "" } : { id: campId, name: raw.name, site_url: "" });
      const mapping = matchCanonicalStore(fallbackTarget);
      if (mapping.strategy !== "UNMAPPED") mappedCount++;

      const legal = evaluateLegalGate(apiCoupon, program);
      const hasLegalInfo = legal.legalInfoStatus === "PRESENT";
      const hasErid = legal.eridStatus === "PRESENT";
      if (hasLegalInfo && hasErid) legalReadyCount++;

      // Проверка публикации через Publication Eligibility Gate
      const evalResult = isAdmitadPublishable(normalized || raw, {
        campaign,
        mapping,
        eridStatus: legal.eridStatus,
        legalInfoStatus: legal.legalInfoStatus,
        eridValue: legal.eridValue || undefined,
        advertiserLegalInfo: program?.advertiser_legal_info || undefined,
      });

      if (evalResult.publishable) {
        publishableCount++;
      } else if (evalResult.status === "READY_NOT_APPROVED") {
        readyNotApprovedCount++;
      } else {
        quarantinedCount++;
      }

      // Формирование ОРД текста
      const { ordMarker, ordText } = buildAdmitadOrdText(
        program?.advertiser_legal_info || "",
        legal.eridValue || ""
      );

      const storeSlug = mapping.canonicalSlug || "unmapped";
      const storeName = mapping.storeName || campaign.name || "Магазин";
      const couponId = String(raw.id || apiCoupon.id);

      rowsToUpsert.push({
        id: `adm_${couponId}`,
        code: normalized?.promoCode || raw.promocode || null,
        store: storeName,
        store_slug: storeSlug,
        discount: normalized?.discount?.formatted || raw.discount || "Скидка",
        category: normalized?.store?.category || raw.categories?.[0] || "Другое",
        description: normalized?.fullDescription || raw.description || null,
        expires: (normalized?.dateEnd || raw.dateEnd) ? String(normalized?.dateEnd || raw.dateEnd).slice(0, 10) : null,
        affiliate_url: normalized?.affiliate?.url || raw.gotolink || null,
        is_active: evalResult.publishable,
        uses_count: 0,
        bonus_name: normalized?.shortDescription || raw.name || null,
        terms: normalized?.fullDescription || raw.description || null,
        affiliate_link: normalized?.affiliate?.url || raw.gotolink || null,
        ord_marker: ordMarker || null,
        ord_text: ordText || null,
        logo: raw.logo || null,
        site: campaign.site_url || null,
        category_slug: storeSlug,
        about: null,
        region: "RU",
        is_hit: Boolean(raw.exclusive),
        is_first_order_only: normalized ? normalized.customerType === "new_customers" : raw.customerType === "new_customers",
        source_campaign_id: String(campId),
        source_coupon_id: couponId,
        last_seen_at: nowIso,
        sync_run_id: syncRunId,
        sync_status: evalResult.status,
        mapping_strategy: mapping.strategy,
        legal_status: legal.legalInfoStatus,
        erid_status: legal.eridStatus,
        updated_at: nowIso,
      });
    }

    // 5. Защита от катастрофического падения количества офферов (Catastrophic Drop Protection)
    const previousCount = await getActiveSnapshotCount();
    const safetyCheck = evaluateSnapshotSafety(previousCount, publishableCount);

    if (!safetyCheck.safe) {
      console.warn(`[admitad/sync] 🚨 ${safetyCheck.reason}. Переход в режим SYNC_DEGRADED без изменения базы.`);
      await saveAdmitadSyncMeta({
        last_attempt_at: nowIso,
        last_success_at: null,
        last_success_count: previousCount,
        last_status: "DEGRADED",
        last_error_code: "CATASTROPHIC_DROP",
        duration_ms: Date.now() - startTime,
        details: {
          previousCount,
          newPublishableCount: publishableCount,
          reason: safetyCheck.reason,
        },
      });
      return {
        success: false,
        status: "DEGRADED",
        error: safetyCheck.reason,
      };
    }

    // 6. Запись нового снимка в Supabase (если не включен режим skipDbWrite)
    let written = 0;
    let deactivated = 0;

    if (!options.skipDbWrite) {
      written = await upsertAdmitadSnapshot(rowsToUpsert);

      // 7. Деактивация устаревших записей (Stale Deactivation)
      // Выполняется ТОЛЬКО после успешной записи текущего снимка
      deactivated = await deactivateStaleSnapshots(syncRunId);
    }

    const duration = Date.now() - startTime;
    const aggregates: SyncAggregates = {
      sync_run_id: syncRunId,
      campaigns_total: programs.length,
      coupons_total: apiCoupons.length,
      normalized: normalizedCount,
      quality_pass: qualityPassCount,
      mapped: mappedCount,
      legal_ready: legalReadyCount,
      publishable: publishableCount,
      ready_not_approved: readyNotApprovedCount,
      duplicates_vs_perfluence: 0,
      written,
      updated: written,
      deactivated,
      quarantined: quarantinedCount,
      duration_ms: duration,
    };

    // 8. Сохранение метаданных успешной синхронизации
    await saveAdmitadSyncMeta({
      last_attempt_at: nowIso,
      last_success_at: nowIso,
      last_success_count: publishableCount,
      last_status: "SUCCESS",
      last_error_code: null,
      duration_ms: duration,
      details: aggregates as unknown as Record<string, unknown>,
    });

    console.log(
      `[admitad/sync] ✓ Успешно завершено: программ ${programs.length}, купонов ${apiCoupons.length}, к публикации ${publishableCount}, записано ${written}, деактивировано ${deactivated} (${duration}мс)`
    );

    return {
      success: true,
      status: "SUCCESS",
      aggregates,
    };
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error("[admitad/sync] 🚨 Ошибка выполнения синхронизации:", errorMsg);
    await saveAdmitadSyncMeta({
      last_attempt_at: new Date().toISOString(),
      last_success_at: null,
      last_success_count: 0,
      last_status: "FAILED",
      last_error_code: "SYNC_EXCEPTION",
      duration_ms: Date.now() - startTime,
      details: { error: errorMsg },
    });
    return {
      success: false,
      status: "FAILED",
      error: errorMsg,
    };
  }
}
