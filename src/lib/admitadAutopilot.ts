/**
 * src/lib/admitadAutopilot.ts
 *
 * Безопасный автопилот синхронизации и публикации Admitad Publisher API (ADMITAD-2).
 *
 * ПРАВИЛА БЕЗОПАСНОСТИ:
 * 1. Strict Eligibility: публикация ТОЛЬКО при прохождении всех гейтов (Active, RU, Mapped, Valid Link, ERID, Legal Info).
 * 2. First Rollout Safety Allowlist: в первой версии публикуются только проверенные кампании из live dry-run.
 *    Все остальные валидные кампании получают статус READY_NOT_APPROVED.
 * 3. Catastrophic Drop Protection: порог падения 35% (CATASTROPHIC_DROP_THRESHOLD = 0.35).
 * 4. Stale Deactivation: деактивация старых строк ТОЛЬКО после 100% успешного завершения синка.
 * 5. Никаких утечек секретов в логи и метаданные.
 */

import type { NormalizedOffer, RawAdmitadCoupon } from "@/lib/admitadTypes";
import type { AdmitadApiCampaign, StoreMappingResult } from "@/lib/admitadApi";

/** Catastrophic drop protection threshold (35%) */
export const CATASTROPHIC_DROP_THRESHOLD = 0.35;

/**
 * Safety allowlist проверенных кампаний (verified Admitad campaign IDs).
 * Включает только кандидатов «READY FOR FUTURE PUBLISH» из реального live dry-run площадки 2990501.
 *
 * 25224:  Яндекс Путешествия (yandeks-puteshestviya)
 * 1667:   YVES ROCHER (iv-roshe)
 * 141770: Яндекс Плюс (yandex-plus)
 * 118265: Отели в Т-Банке (t-puteshestviya-oteli)
 * 45863:  PREMIER (premier)
 */
export const VERIFIED_CAMPAIGN_ALLOWLIST: readonly string[] = [
  "25224",
  "1667",
  "141770",
  "118265",
  "45863",
];

/**
 * Получение активного allowlist кампаний.
 * Если задана переменная окружения ADMITAD_APPROVED_CAMPAIGNS (через запятую),
 * используется строго она для безопасного поэтапного включения (Section 12, 13).
 */
export function getEffectiveCampaignAllowlist(): readonly string[] {
  const envVal = process.env.ADMITAD_APPROVED_CAMPAIGNS?.trim();
  if (envVal) {
    return envVal
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return VERIFIED_CAMPAIGN_ALLOWLIST;
}

export type AdmitadPublicationStatus =
  | "PUBLISHABLE"
  | "READY_NOT_APPROVED"
  | "UNMAPPED"
  | "MISSING_ERID"
  | "MISSING_LEGAL_INFO"
  | "INVALID_AFFILIATE_URL"
  | "EXPIRED"
  | "FOREIGN_GEO"
  | "QUALITY_GATE_FAILED"
  | "CAMPAIGN_INACTIVE";

export interface PublicationEvaluationResult {
  publishable: boolean;
  status: AdmitadPublicationStatus;
  reason?: string;
  isApproved: boolean;
}

export interface PublicationEvaluationContext {
  campaign: Partial<AdmitadApiCampaign> & { id: number; status?: string; advertiser_legal_info?: string };
  mapping?: StoreMappingResult;
  eridStatus?: string;
  legalInfoStatus?: string;
  eridValue?: string;
  advertiserLegalInfo?: string;
  allowlist?: readonly string[];
}

export type CandidateLike =
  | NormalizedOffer
  | RawAdmitadCoupon
  | {
      isExpired?: boolean;
      isForeign?: boolean;
      affiliateLink?: string;
      gotolink?: string;
      advcampaignId?: string;
      status?: string;
      affiliate?: { url?: string };
    };

/**
 * Оценивает пригодность оффера к публикации в продакшене PromoFact (Section 7).
 */
export function isAdmitadPublishable(
  coupon: CandidateLike,
  ctx: PublicationEvaluationContext
): PublicationEvaluationResult {
  const allowlist = ctx.allowlist ?? getEffectiveCampaignAllowlist();
  const campId = String(ctx.campaign.id || ("advcampaignId" in coupon ? coupon.advcampaignId : "") || "");

  // 1. Проверка активности кампании
  if (ctx.campaign.status && ctx.campaign.status !== "active") {
    return {
      publishable: false,
      status: "CAMPAIGN_INACTIVE",
      reason: `Кампания имеет статус ${ctx.campaign.status}`,
      isApproved: false,
    };
  }

  // 2. Проверка истечения срока действия
  const isExpired =
    ("isExpired" in coupon && Boolean(coupon.isExpired)) ||
    ("status" in coupon && coupon.status === "expired");
  if (isExpired) {
    return {
      publishable: false,
      status: "EXPIRED",
      reason: "Срок действия предложения истёк",
      isApproved: false,
    };
  }

  // 3. Проверка географии (RU)
  if ("isForeign" in coupon && Boolean(coupon.isForeign)) {
    return {
      publishable: false,
      status: "FOREIGN_GEO",
      reason: "География оффера не включает РФ",
      isApproved: false,
    };
  }

  // 4. Проверка канонического сопоставления магазина PromoFact
  if (!ctx.mapping || ctx.mapping.strategy === "UNMAPPED" || !ctx.mapping.canonicalSlug) {
    return {
      publishable: false,
      status: "UNMAPPED",
      reason: "Магазин не сопоставлен с каноническим каталогом PromoFact",
      isApproved: false,
    };
  }

  // 5. Проверка партнерской ссылки
  let link = "";
  if ("affiliate" in coupon && coupon.affiliate?.url) {
    link = coupon.affiliate.url;
  } else if ("affiliateLink" in coupon && coupon.affiliateLink) {
    link = coupon.affiliateLink;
  } else if ("gotolink" in coupon && coupon.gotolink) {
    link = coupon.gotolink;
  }

  if (!link || (!link.startsWith("http://") && !link.startsWith("https://"))) {
    return {
      publishable: false,
      status: "INVALID_AFFILIATE_URL",
      reason: "Отсутствует валидная партнерская ссылка",
      isApproved: false,
    };
  }

  // 6. Проверка ОРД (ERID)
  if (ctx.eridStatus !== "PRESENT" || !ctx.eridValue) {
    return {
      publishable: false,
      status: "MISSING_ERID",
      reason: "Отсутствует маркировочный токен erid в партнерской ссылке или тексте",
      isApproved: false,
    };
  }

  // 7. Проверка реквизитов рекламодателя (Legal Info)
  if (ctx.legalInfoStatus !== "PRESENT" || !ctx.advertiserLegalInfo?.trim()) {
    return {
      publishable: false,
      status: "MISSING_LEGAL_INFO",
      reason: "Отсутствуют реквизиты рекламодателя (advertiser_legal_info)",
      isApproved: false,
    };
  }

  // 8. Safety Allowlist (Section 12, 13)
  const isApproved = allowlist.includes(campId);
  if (!isApproved) {
    return {
      publishable: false,
      status: "READY_NOT_APPROVED",
      reason: `Кампания ${campId} проходит все гейты качества, но не входит в первоначальный rollout allowlist`,
      isApproved: false,
    };
  }

  return {
    publishable: true,
    status: "PUBLISHABLE",
    isApproved: true,
  };
}

/**
 * Проверка катастрофического падения количества доступных предложений (Section 6).
 */
export function evaluateSnapshotSafety(
  previousCount: number,
  newCount: number,
  threshold: number = CATASTROPHIC_DROP_THRESHOLD
): { safe: boolean; reason?: string } {
  if (previousCount <= 0) {
    return { safe: true };
  }

  const dropRatio = newCount / previousCount;
  if (dropRatio < threshold) {
    return {
      safe: false,
      reason: `Catastrophic count drop: получено ${newCount} офферов (${Math.round(dropRatio * 100)}% от предыдущих ${previousCount}), порог защиты ${Math.round(threshold * 100)}%`,
    };
  }

  return { safe: true };
}

/**
 * Формирование канонического текста ОРД для карточки купона (Section 8).
 */
export function buildAdmitadOrdText(
  advertiserLegalInfo: string,
  erid: string
): { ordMarker: string; ordText: string } {
  const cleanLegal = (advertiserLegalInfo || "").trim();
  const cleanErid = (erid || "").trim();

  if (!cleanLegal && !cleanErid) {
    return { ordMarker: "", ordText: "" };
  }

  const ordMarker = cleanErid;
  const ordText = cleanLegal && cleanErid
    ? `Реклама. ${cleanLegal}. erid: ${cleanErid}`
    : cleanLegal
      ? `Реклама. ${cleanLegal}`
      : `erid: ${cleanErid}`;

  return { ordMarker, ordText };
}

/**
 * Декорирование партнерской ссылки Admitad с SubID и Opaque Click ID (Section 19, 20, 21).
 */
export function decorateAdmitadUrl(
  rawUrl: string,
  options: {
    placement?: string;
    pageType?: string;
    couponId?: string | number;
    clickId?: string;
  }
): string {
  try {
    const url = new URL(rawUrl);

    if (options.placement) {
      url.searchParams.set("subid", options.placement);
    }
    if (options.pageType) {
      url.searchParams.set("subid1", options.pageType);
    }
    if (options.couponId !== undefined) {
      url.searchParams.set("subid2", String(options.couponId));
    }
    url.searchParams.set("subid3", "promofact");
    if (options.clickId) {
      url.searchParams.set("subid4", options.clickId);
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Генерация безопасного Opaque Click ID без PII (Section 7, 20).
 * Основной механизм: crypto.randomUUID(), fallback: crypto.getRandomValues().
 * Никаких Math.random(), email, телефонов или cookie id.
 */
export function generateClickId(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }
  throw new Error("Web Crypto API is required for generating secure click IDs");
}

export interface SyncAggregates {
  sync_run_id: string;
  campaigns_total: number;
  coupons_total: number;
  normalized: number;
  quality_pass: number;
  mapped: number;
  legal_ready: number;
  publishable: number;
  ready_not_approved: number;
  duplicates_vs_perfluence: number;
  written: number;
  updated: number;
  deactivated: number;
  quarantined: number;
  duration_ms: number;
}
