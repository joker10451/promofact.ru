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
import { STABLE_STORES } from "@/lib/stableStores";
import {
  isAdmitadPublishable,
  evaluateSnapshotSafety,
  buildAdmitadOrdText,
  getEffectiveCampaignAllowlist,
  type SyncAggregates,
} from "@/lib/admitadAutopilot";
import {
  upsertAdmitadStaging,
  publishAdmitadSnapshot,
  getActiveSnapshotCount,
  getExistingActiveSnapshotRows,
  updateAdmitadSyncDiagnostics,
  recordAdmitadSyncFailure,
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
    await recordAdmitadSyncFailure({
      status: "FAILED",
      errorCode: "AUTH_CONFIG_MISSING",
      duration_ms: Date.now() - startTime,
    });
    return { success: false, status: "FAILED", error };
  }

  // 1b. Проверка явного allowlist кампаний (ADMITAD-4 Блокер 1)
  const effectiveAllowlist = getEffectiveCampaignAllowlist();
  if (effectiveAllowlist.length === 0) {
    const error = "ALLOWLIST_NOT_CONFIGURED: ADMITAD_APPROVED_CAMPAIGNS не настроен или пуст. Публикация заблокирована, синхронизация остановлена без изменения каталога.";
    console.warn(`[admitad/sync] 🚨 ${error}`);
    await recordAdmitadSyncFailure({
      status: "FAILED",
      errorCode: "ALLOWLIST_NOT_CONFIGURED",
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
      await recordAdmitadSyncFailure({
        status: "FAILED",
        errorCode: websiteResult.resolution,
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
    const existingActiveRows = await getExistingActiveSnapshotRows();
    const existingActiveMap = new Map<string, AdmitadRowInput>();
    for (const r of existingActiveRows) {
      existingActiveMap.set(r.id, r);
    }

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
      const isApprovedInCurrentSync = effectiveAllowlist.includes(String(campId));
      const program = programMap.get(campId);
      const raw = mapApiCouponToRaw(apiCoupon);

      const campaignStatus = program?.status || "CAMPAIGN_STATUS_UNKNOWN";
      const campaign: Partial<AdmitadApiCampaign> & {
        id: number;
        status?: string;
        connection_status?: string;
        advertiser_legal_info?: string;
        moderation?: boolean;
      } = {
        id: campId,
        name: program?.name || apiCoupon.campaign?.name || "Неизвестно",
        site_url: program?.site_url || apiCoupon.campaign?.site_url || "",
        status: campaignStatus,
        connection_status: program?.connection_status,
        advertiser_legal_info: program?.advertiser_legal_info || undefined,
        moderation: program?.moderation,
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
        allowlist: effectiveAllowlist,
      });

      const couponId = String(raw.id || apiCoupon.id);
      const rowId = `adm_${couponId}`;
      let isRowActive = false;
      let syncStatus = evalResult.status;

      if (isApprovedInCurrentSync) {
        if (evalResult.publishable) {
          isRowActive = true;
          publishableCount++;
        } else {
          quarantinedCount++;
        }
      } else {
        // ADMITAD-4 Блокер 2: Кампания вне текущего пилотного allowlist.
        // Сохраняем существующую активную запись из снимка (если она была активна).
        if (existingActiveMap.has(rowId)) {
          isRowActive = true;
          publishableCount++;
          syncStatus = "PUBLISHABLE";
        } else {
          readyNotApprovedCount++;
        }
      }

      // Формирование ОРД текста
      const { ordMarker, ordText } = buildAdmitadOrdText(
        program?.advertiser_legal_info || "",
        legal.eridValue || ""
      );

      const storeSlug = mapping.canonicalSlug || "unmapped";
      const storeName = mapping.storeName || campaign.name || "Магазин";

      const stableMeta = (STABLE_STORES as Record<string, { categorySlug?: string; category?: string }>)[storeSlug];
      const finalCategorySlug = stableMeta?.categorySlug || normalized?.store?.categorySlug || "drugie-magaziny";
      const finalCategoryName = stableMeta?.category || normalized?.store?.category || raw.categories?.[0] || "Другие магазины";

      rowsToUpsert.push({
        id: rowId,
        code: normalized?.promoCode || raw.promocode || null,
        store: storeName,
        store_slug: storeSlug,
        discount: normalized?.discount?.formatted || raw.discount || "Скидка",
        category: finalCategoryName,
        description: normalized?.fullDescription || raw.description || null,
        expires: (normalized?.dateEnd || raw.dateEnd) ? String(normalized?.dateEnd || raw.dateEnd).slice(0, 10) : null,
        affiliate_url: normalized?.affiliate?.url || raw.gotolink || null,
        is_active: isRowActive,
        uses_count: 0,
        bonus_name: normalized?.shortDescription || raw.name || null,
        terms: normalized?.fullDescription || raw.description || null,
        affiliate_link: normalized?.affiliate?.url || raw.gotolink || null,
        ord_marker: ordMarker || null,
        ord_text: ordText || null,
        logo: raw.logo || null,
        site: campaign.site_url || null,
        category_slug: finalCategorySlug,
        about: null,
        region: "RU",
        is_hit: Boolean(raw.exclusive),
        is_first_order_only: normalized ? normalized.customerType === "new_customers" : raw.customerType === "new_customers",
        source_campaign_id: String(campId),
        source_coupon_id: couponId,
        last_seen_at: nowIso,
        sync_run_id: syncRunId,
        sync_status: syncStatus,
        mapping_strategy: mapping.strategy,
        legal_status: legal.legalInfoStatus,
        erid_status: legal.eridStatus,
        updated_at: nowIso,
      });
    }

    // Сохранение активных офферов других проверенных кампаний, отсутствующих в текущем батче API.
    // ADMITAD-4 Safety: НЕ обновляем last_seen_at — сохраняем last-known-good без искусственного
    // продления валидности. Фильтруем просроченные, отозванные и лишённые маркировки записи.
    const processedIds = new Set(rowsToUpsert.map((r) => r.id));
    for (const [id, existingRow] of existingActiveMap.entries()) {
      const campId = String(existingRow.source_campaign_id || "");
      if (!effectiveAllowlist.includes(campId) && !processedIds.has(id)) {
        // Проверка: не продлевать просроченные предложения
        const expiresStr = existingRow.expires ? String(existingRow.expires).slice(0, 10) : null;
        if (expiresStr) {
          const expiresDate = new Date(expiresStr + "T23:59:59+03:00");
          if (expiresDate.getTime() < Date.now()) {
            // Просрочено — деактивировать, не переносить как активное
            rowsToUpsert.push({
              ...existingRow,
              is_active: false,
              sync_run_id: syncRunId,
              sync_status: "EXPIRED_RETAINED",
              updated_at: nowIso,
              // last_seen_at НЕ обновляется — сохраняем оригинальное значение
            });
            continue;
          }
        }

        // Проверка: не сохранять записи без обязательной ОРД-маркировки
        if (!existingRow.ord_marker && !existingRow.ord_text) {
          rowsToUpsert.push({
            ...existingRow,
            is_active: false,
            sync_run_id: syncRunId,
            sync_status: "MISSING_ORD_RETAINED",
            updated_at: nowIso,
          });
          continue;
        }

        // Валидная запись — сохраняем активной, но last_seen_at остаётся оригинальным
        rowsToUpsert.push({
          ...existingRow,
          sync_run_id: syncRunId,
          updated_at: nowIso,
          // last_seen_at НЕ обновляется — запись не была получена из API в этом цикле
        });
        publishableCount++;
      }
    }

    // 5. Защита от катастрофического падения количества офферов (Catastrophic Drop Protection)
    const previousCount = await getActiveSnapshotCount();
    const safetyCheck = evaluateSnapshotSafety(previousCount, publishableCount);

    if (!safetyCheck.safe) {
      console.warn(`[admitad/sync] 🚨 ${safetyCheck.reason}. Переход в режим SYNC_DEGRADED без изменения базы.`);
      await recordAdmitadSyncFailure({
        status: "DEGRADED",
        errorCode: "CATASTROPHIC_DROP",
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

    // 6. Запись нового поколения в Staging (если не включен режим skipDbWrite)
    let written = 0;
    let published = 0;

    if (!options.skipDbWrite) {
      // B6: Подготовка пишет ТОЛЬКО в admitad_coupons_staging. Боевая таблица не тронута.
      written = await upsertAdmitadStaging(rowsToUpsert, syncRunId);

      // 7. Транзакционная публикация нового поколения через PostgreSQL RPC (B3, Section 6)
      // Передаем rowsToUpsert.length (Total Count поколения в staging)
      const pubResult = await publishAdmitadSnapshot(syncRunId, rowsToUpsert.length);
      if (!pubResult.success) {
        throw new Error(`Atomic publish RPC failed: ${pubResult.error}`);
      }
      published = pubResult.publishedCount;
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
      deactivated: 0,
      quarantined: quarantinedCount,
      duration_ms: duration,
    };

    // 8. Обновление диагностических метаданных (authoritative last_success_* уже записаны RPC, Section 9)
    await updateAdmitadSyncDiagnostics({
      duration_ms: duration,
      details: aggregates as unknown as Record<string, unknown>,
    });

    console.log(
      `[admitad/sync] ✓ Успешно завершено (Atomic): программ ${programs.length}, купонов ${apiCoupons.length}, к публикации ${publishableCount}, staged ${written}, published ${published} (${duration}мс)`
    );

    return {
      success: true,
      status: "SUCCESS",
      aggregates,
    };
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error("[admitad/sync] 🚨 Ошибка выполнения синхронизации:", errorMsg);
    await recordAdmitadSyncFailure({
      status: "FAILED",
      errorCode: "SYNC_EXCEPTION",
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
