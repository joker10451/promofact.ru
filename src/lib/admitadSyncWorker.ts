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
import { verifiedPublisherWebsite, resolvePublisherStore, validPublisherAffiliateLink } from "@/lib/admitadPublisherCatalog";
import {
  isAdmitadPublishable,
  evaluateSnapshotSafety,
  buildAdmitadOrdText,
  getEffectiveCampaignAllowlist,
  checkTastyCoffeePilot,
  checkBefreePilot,
  getBatchCampaignAllowlist,
  isVerifiedBatchCampaignOrigin,
  FIVE_NEW_CAMPAIGN_IDS,
  isFiveCouponExplicitlyReviewed,
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
  /** For safe batch rollout, no NEW active rows outside the given campaigns. */
  onlyNewCampaignIds?: readonly string[];
  /** Permit new five-program rows only if explicitly reviewed by coupon ID. */
  reviewedFiveCouponIds?: readonly string[];
  /** Upper bound on added active offers; exceeded => abort before any staging/write. */
  maxNewOffers?: number;
  /** Abort before writes if any baseline active ID would be lost. */
  requireActiveRetention?: boolean;
} = {}): Promise<SyncWorkerResult> {
  const startTime = Date.now();
  const syncRunId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 1. Проверка конфигурации OAuth
  const config = getAdmitadConfig();
  if (!config) {
    const error = "ADMITAD_CLIENT_ID или ADMITAD_CLIENT_SECRET не настроены";
    if (!options.skipDbWrite) await recordAdmitadSyncFailure({
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
    if (!options.skipDbWrite) await recordAdmitadSyncFailure({
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
      if (!options.skipDbWrite) await recordAdmitadSyncFailure({
        status: "FAILED",
        errorCode: websiteResult.resolution,
        duration_ms: Date.now() - startTime,
      });
      return { success: false, status: "FAILED", error };
    }

    const website = websiteResult.website;
    const publisherRequested = process.env.ADMITAD_PUBLISH_WEBSITE_COUPONS === "true";
    const publisherScoped = publisherRequested && verifiedPublisherWebsite(website);
    if (publisherRequested && !publisherScoped) throw new Error("WEBSITE_SCOPE_MISMATCH");

    // 3. Загрузка партнерских программ и купонов площадки
    const [programs, apiCoupons] = await Promise.all([
      getConnectedPrograms(String(website.id), { customFetch: options.customFetch }),
      getWebsiteCoupons(String(website.id), {}, { customFetch: options.customFetch }),
    ]);

    const programMap = new Map<number, AdmitadApiCampaign>();
    for (const p of programs) {
      programMap.set(p.id, p);
    }
    // Explicit opt-in: all active programs returned for THIS website, never
    // all publisher programs or an unrelated product feed.
    const publisherAllowlist = publisherScoped
      ? [...new Set([...effectiveAllowlist, ...programs
        .filter(p => p.status === "active" && p.connection_status === "active" && p.id !== 45863)
        .map(p => String(p.id))])]
      : effectiveAllowlist;

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
      const isApprovedInCurrentSync = publisherAllowlist.includes(String(campId));
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

      const qg = evaluateQualityGate(apiCoupon, program, {verifiedPublisherScope: publisherScoped});
      if (qg.passed) qualityPassCount++;

      const fallbackTarget = program || (apiCoupon.campaign ? { ...apiCoupon.campaign, site_url: apiCoupon.campaign.site_url || "" } : { id: campId, name: raw.name, site_url: "" });
      const existingMapping = matchCanonicalStore(fallbackTarget);
      const mapping = publisherScoped && program ? resolvePublisherStore(program, existingMapping) : existingMapping;
      if (mapping.strategy !== "UNMAPPED") mappedCount++;

      const legal = evaluateLegalGate(apiCoupon, program);
      const hasLegalInfo = legal.legalInfoStatus === "PRESENT";
      const hasErid = legal.eridStatus === "PRESENT";
      if (hasLegalInfo && hasErid) legalReadyCount++;

      // Admitad 17220 is an explicitly scoped single-coupon pilot; never publish
      // unrelated/placeholder coupons or a stale ERID from a previous snapshot.
      const couponId = String(raw.id || apiCoupon.id);
      const pilotInput = {
        campaignId: String(campId),
        couponId,
        promocode: raw.promocode || "",
        affiliateLink: normalized?.affiliate?.url || raw.gotolink || "",
        erid: legal.eridValue || "",
      };
      const tastyGate = checkTastyCoffeePilot(pilotInput);
      const befreeGate = checkBefreePilot(pilotInput);
      const isInApprovedBatch = getBatchCampaignAllowlist().includes(String(campId));
      const batchOriginValid = !isInApprovedBatch ||
        isVerifiedBatchCampaignOrigin(String(campId), campaign.site_url || "");
      const publisherLinkValid = !publisherScoped ||
        validPublisherAffiliateLink(normalized?.affiliate?.url || raw.gotolink || "", legal.eridValue);
      const pilotGate = {
        passed: (publisherScoped || (tastyGate.passed && befreeGate.passed && batchOriginValid)) &&
          publisherLinkValid && !(publisherScoped && campId === 45863),
        reason: !publisherLinkValid ? "PUBLISHER_AFFILIATE_ERID_MISMATCH" :
          publisherScoped && campId === 45863 ? "PREMIER_REVIEW_REQUIRED" :
          tastyGate.reason || befreeGate.reason ||
          (batchOriginValid ? undefined : "BATCH_CAMPAIGN_ORIGIN_MISMATCH"),
      };

      // Проверка публикации через Publication Eligibility Gate
      const isPersonal = Boolean(apiCoupon.is_personal || raw.is_personal || (normalized && normalized.isPersonal));
      const evalResult = isAdmitadPublishable(normalized || raw, {
        campaign,
        mapping,
        eridStatus: legal.eridStatus,
        legalInfoStatus: legal.legalInfoStatus,
        eridValue: legal.eridValue || undefined,
        advertiserLegalInfo: program?.advertiser_legal_info || undefined,
        allowlist: publisherAllowlist,
        verifiedPublisherScope: publisherScoped,
        qualityGatePassed: qg.passed && (!isPersonal || publisherScoped) && pilotGate.passed,
        qualityGateReasons: isPersonal && !publisherScoped
          ? ["UNAUTHORIZED_PROMOCODE: персональный промокод"]
          : [...qg.reasons, ...(pilotGate.passed ? [] : [pilotGate.reason || "PILOT_GATE_FAILED"])],
      });

      // Обязательный гейт: Quality Gate обязан быть пройден, а персональные промокоды строго отклонены
      if (!qg.passed || (isPersonal && !publisherScoped) || !pilotGate.passed) {
        evalResult.publishable = false;
        if (isPersonal && !publisherScoped) {
          evalResult.status = "UNAUTHORIZED_PROMOCODE";
        } else if (!pilotGate.passed) {
          evalResult.status = "QUALITY_GATE_FAILED";
        } else if (evalResult.status === "PUBLISHABLE") {
          evalResult.status = qg.reasons.some(r => r.includes("CAMPAIGN_MODERATION") || r.includes("CONNECTION_INACTIVE"))
            ? "CAMPAIGN_MODERATION"
            : "QUALITY_GATE_FAILED";
        }
      }

      const rowId = `adm_${couponId}`;
      const newOfferOutsideBatch = Boolean(
        options.onlyNewCampaignIds &&
        !existingActiveMap.has(rowId) &&
        !options.onlyNewCampaignIds.includes(String(campId))
      );
      // Unlike a campaign allowlist, this is an explicit coupon-level review.
      // Scoped to the five NEW campaigns so existing active offers and normal
      // recurring updates of the original three remain unchanged.
      // This guard MUST run even on ordinary cron/API synchronization.
      // The batch runner is not the only caller of runAdmitadSafeSync.
      // No explicit reviewed IDs => no new five-program coupons, regardless
      // of environment allowlists or workflow mode.
      const newFiveOfferNotReviewed = Boolean(
        !publisherScoped && FIVE_NEW_CAMPAIGN_IDS.includes(String(campId)) &&
        !existingActiveMap.has(rowId) &&
        !isFiveCouponExplicitlyReviewed(String(campId), couponId, options.reviewedFiveCouponIds ?? [])
      );
      const newOfferBlocked = newOfferOutsideBatch || newFiveOfferNotReviewed;
      let isRowActive = false;
      let syncStatus = newOfferBlocked && evalResult.publishable ? "READY_NOT_APPROVED" : evalResult.status;

      if (isApprovedInCurrentSync) {
        if (evalResult.publishable && !newOfferBlocked) {
          isRowActive = true;
          publishableCount++;
        } else {
          quarantinedCount++;
        }
      } else {
        // ADMITAD-4 Блокер 2 & ADMITAD-5/6 Safety:
        // Кампания вне текущего пилотного allowlist.
        // Сохраняем ранее активную запись ТОЛЬКО если:
        // 1) Она уже была активной в снимке;
        // 2) Текущий API подтверждает её валидность (evalResult.status === "READY_NOT_APPROVED"
        //    означает, что оффер проходит ВСЕ проверки качества, ERID, legal info, гео,
        //    и не публикуется СТРОГО из-за отсутствия кампании в allowlist).
        // Если же оффер стал недействительным в API (CAMPAIGN_INACTIVE, EXPIRED, MISSING_ERID,
        // MISSING_LEGAL_INFO, FOREIGN_GEO, UNMAPPED, INVALID_AFFILIATE_URL),
        // он НЕ должен оставаться активным!
        const passesAllQualityGates = evalResult.status === "READY_NOT_APPROVED";
        if (existingActiveMap.has(rowId) && passesAllQualityGates && String(campId) !== "45863") {
          isRowActive = true;
          publishableCount++;
          syncStatus = "PUBLISHABLE";
        } else {
          readyNotApprovedCount++;
          isRowActive = false;
          syncStatus = evalResult.status;
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
        created_at: existingActiveMap.get(rowId)?.created_at || nowIso,
        updated_at: nowIso,
      });
    }

    // Сохранение активных офферов других проверенных кампаний, отсутствующих в текущем батче API.
    // ADMITAD-4 Safety: НЕ обновляем last_seen_at — сохраняем last-known-good без искусственного
    // продления валидности. Фильтруем просроченные, отозванные и лишённые маркировки записи.
    const processedIds = new Set(rowsToUpsert.map((r) => r.id));
    for (const [id, existingRow] of existingActiveMap.entries()) {
      // Защита от дублей в staging: если id уже обработан в батче API, не добавляем его повторно
      if (processedIds.has(id)) {
        continue;
      }
      processedIds.add(id);

      const campId = String(existingRow.source_campaign_id || "");
      const storeSlug = String(existingRow.store_slug || "");

      // Дефект 3: Исключение устаревшего оффера PREMIER (45863) с неподтверждённым ERID/модерацией
      if (campId === "45863" || storeSlug === "premier") {
        rowsToUpsert.push({
          ...existingRow,
          is_active: false,
          sync_run_id: syncRunId,
          sync_status: "CAMPAIGN_MODERATION",
          updated_at: nowIso,
        });
        continue;
      }

      if (!effectiveAllowlist.includes(campId)) {
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

    // Batch mode may not accidentally introduce new offers from other
    // already-approved programs or exceed its capped growth envelope.
    const proposedActiveIds = new Set(rowsToUpsert.filter((r) => r.is_active).map((r) => r.id));
    const missingBaselineRows = [...existingActiveMap.entries()]
      .filter(([id]) => !proposedActiveIds.has(id))
      .map(([, row]) => row);
    if (publisherScoped) {
      const lossByCampaign: Record<string, number> = {};
      for (const row of missingBaselineRows) {
        const id = String(row.source_campaign_id || "UNKNOWN");
        lossByCampaign[id] = (lossByCampaign[id] || 0) + 1;
      }
      // Diagnostic includes aggregate campaign IDs only; never coupon codes,
      // affiliate URLs, ERIDs or raw offer data.
      console.log("[publisher/retention] baseline=" + existingActiveMap.size +
        " proposed_active=" + proposedActiveIds.size +
        " baseline_missing=" + missingBaselineRows.length +
        " missing_by_campaign=" + JSON.stringify(lossByCampaign));
    }
    if (options.requireActiveRetention && missingBaselineRows.length > 0) {
      throw new Error("BATCH_ACTIVE_COUPON_RETENTION_FAILED");
    }
    if (options.maxNewOffers !== undefined) {
      if (!Number.isSafeInteger(options.maxNewOffers) || options.maxNewOffers < 0) {
        throw new Error("BATCH_INVALID_NEW_OFFER_CAP");
      }
      const newActive = rowsToUpsert.filter((r) => r.is_active && !existingActiveMap.has(r.id));
      if (newActive.length > options.maxNewOffers) {
        throw new Error("BATCH_NEW_OFFER_CAP_EXCEEDED");
      }
    }

    // 5. Защита от катастрофического падения количества офферов (Catastrophic Drop Protection)
    const previousCount = await getActiveSnapshotCount();
    const safetyCheck = evaluateSnapshotSafety(previousCount, publishableCount);

    if (!safetyCheck.safe) {
      console.warn(`[admitad/sync] 🚨 ${safetyCheck.reason}. Переход в режим SYNC_DEGRADED без изменения базы.`);
      if (!options.skipDbWrite) await recordAdmitadSyncFailure({
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
      // No Perfluence comparison occurs in this worker. Report unknown, not 0.
      duplicates_vs_perfluence: null,
      written,
      updated: written,
      deactivated: 0,
      quarantined: quarantinedCount,
      duration_ms: duration,
    };

    // 8. Обновление диагностических метаданных (authoritative last_success_* уже записаны RPC, Section 9)
    if (!options.skipDbWrite) await updateAdmitadSyncDiagnostics({
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
    if (!options.skipDbWrite) await recordAdmitadSyncFailure({
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
