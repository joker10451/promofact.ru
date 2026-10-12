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
import { isRealPromoCode } from "@/lib/dedupe";

/** Catastrophic drop protection threshold (35%) */
export const CATASTROPHIC_DROP_THRESHOLD = 0.35;

/**
 * Safety allowlist проверенных кампаний (verified Admitad campaign IDs).
 * Включает только кандидатов «READY FOR FUTURE PUBLISH» из реального live dry-run площадки 2990501.
 *
 * 26110:  Pizza Sushi Wok (pizzasushiwok)
 * 25224:  Яндекс Путешествия (yandeks-puteshestviya)
 * 1667:   YVES ROCHER (iv-roshe)
 * 141770: Яндекс Плюс (yandex-plus)
 * 118265: Отели в Т-Банке (t-puteshestviya-oteli)
 */
export const VERIFIED_CAMPAIGN_ALLOWLIST: readonly string[] = [
  "26110",
  "25224",
  "1667",
  "141770",
  "118265",
];

/**
 * Получение активного allowlist кампаний.
 * Если задана переменная окружения ADMITAD_APPROVED_CAMPAIGNS (через запятую),
 * используется строго она для безопасного поэтапного включения (Section 12, 13).
 *
 * БЕЗОПАСНОСТЬ ПИЛОТА (ADMITAD-4):
 * При отсутствии явной переменной ADMITAD_APPROVED_CAMPAIGNS возвращается ПУСТОЙ allowlist ([]).
 * Никакого неявного отката к пяти кампаниям по умолчанию! Без явной конфигурации
 * публикация строго блокируется (fail-closed).
 */
/**
 * Batch publication is limited to independently verified program IDs. The
 * env var is additive, not a replacement of ADMITAD_APPROVED_CAMPAIGNS.
 * An unknown, duplicate, malformed or empty token invalidates the whole batch.
 * Expanding this register is a reviewed code change, never inferred from a name.
 */
export const BATCH_VERIFIED_CAMPAIGNS: Readonly<Record<string, string>> = Object.freeze({
  "28532": "befree-ru",
  "14647": "sportmaster",
  "22484": "randewoo",
  "93978": "internet-magazin-bilayn",
  "11738": "foxford",
  "26032": "aravia",
  "14725": "love-republic",
  "23485": "skysmart-ru",
});

const BATCH_VERIFIED_OFFICIAL_HOSTS: Readonly<Record<string,string>> = Object.freeze({
  "28532":"befree.ru",
  "14647":"sportmaster.ru",
  "22484":"randewoo.ru",
  "93978":"beeline.ru",
  "11738":"foxford.ru",
  "26032":"aravia.ru",
  "14725":"loverepublic.ru",
  "23485":"skysmart.ru",
});

/** Exact program ID + official hostname, never a substring/name guess. */
export function isVerifiedBatchCampaignOrigin(id: string, siteUrl: string): boolean {
  const expected = BATCH_VERIFIED_OFFICIAL_HOSTS[id];
  if (!expected || typeof siteUrl!=="string") return false;
  try {
    const url=new URL(siteUrl);
    const host=url.hostname.toLowerCase();
    return url.protocol==="https:" && (host===expected || host==="www."+expected) &&
      url.username==="" && url.password==="" && url.port==="";
  } catch { return false; }
}


/**
 * This is a candidate register, NOT proof of authorization to publish.
 * IDs are the exact Admitad coupon IDs from the 2026-10-12 snapshot.
 * Only explicitly reviewed coupon IDs may be added by the five-program batch.
 * Code-free Love Republic offers are deliberately absent pending permission,
 * freshness and duplicate checks.
 */
export const FIVE_REVIEW_CANDIDATES: Readonly<Record<string,string>> = Object.freeze({
  "938019": "11738", // Foxford REP50
  "896269": "11738", // Foxford FOXFORD5
  "942802": "26032", // Aravia НОЧЬ
  "938092": "23485", // Skysmart СМОГУ
  "943834": "93978", // Beeline ХАЛВА
});

export const FIVE_NEW_CAMPAIGN_IDS: readonly string[] =
  Object.freeze(["93978", "11738", "26032", "14725", "23485"]);

/** Fail closed: no automatic approval from simply knowing an advertiser ID. */
export function parseReviewedFiveCouponIds(value: string): readonly string[] {
  if (!value.trim()) return [];
  const ids = value.split(",").map((id) => id.trim());
  if (new Set(ids).size !== ids.length ||
      ids.some((id) => !/^[0-9]+$/.test(id) || !FIVE_REVIEW_CANDIDATES[id])) {
    throw new Error("FIVE_COUPON_IDS_NOT_REVIEWED");
  }
  return ids;
}

export function isFiveCouponExplicitlyReviewed(
  campaignId: string, couponId: string, reviewedIds: readonly string[]
): boolean {
  return FIVE_REVIEW_CANDIDATES[couponId] === campaignId && reviewedIds.includes(couponId);
}

export function getBatchCampaignAllowlist(): readonly string[] {
  const value = process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS?.trim();
  if (!value) return [];
  const entries = value.split(",").map((id) => id.trim());
  if (entries.some((id) => !/^[0-9]{1,12}$/.test(id) || !BATCH_VERIFIED_CAMPAIGNS[id])) return [];
  if (new Set(entries).size !== entries.length) return [];
  return entries;
}

export function getEffectiveCampaignAllowlist(): readonly string[] {
  const envVal = process.env.ADMITAD_APPROVED_CAMPAIGNS?.trim();
  // Keep the historical fail-closed invariant: the pilot cannot enable a
  // completely unconfigured production publisher.
  if (!envVal || envVal === "undefined") return [];

  const approved = new Set(
    envVal.split(",").map((s) => s.trim()).filter(Boolean),
  );
  // Additional reversible publisher approval. We cannot safely rewrite the
  // existing sensitive campaign allowlist (Vercel masks its value), so preserve
  // every approved campaign and append only the verified Tasty Coffee pilot.
  // Only one coupon may publish under this campaign, enforced separately by
  // checkTastyCoffeePilot() and normal quality/legal/ERID checks.
  if (process.env.ADMITAD_TASTY_PILOT_ENABLED?.trim() === "true") {
    approved.add("17220");
  }
  // One verified Befree coupon only. Preserve every existing approval;
  // never substitute a new list for the masked production configuration.
  if (process.env.ADMITAD_BEFREE_PILOT_ENABLED?.trim() === "true") {
    approved.add("28532");
  }
  for (const campaignId of getBatchCampaignAllowlist()) {
    approved.add(campaignId);
  }
  return [...approved];
}

/**
 * Single-coupon, fail-closed pilot for Tasty Coffee.
 * Facts verified against the publisher's connected Admitad account.
 * Prevents an entire historical campaign (including 'Not required' placeholders)
 * from being published when campaign 17220 is approved.
 *
 * This does not approve the campaign by itself: the environment allowlist,
 * current API status, quality, expiry, ERID and legal gates still apply.
 */
export function checkTastyCoffeePilot(input: {
  campaignId: string;
  couponId: string;
  promocode: string;
  affiliateLink: string;
  erid: string;
}): { passed: boolean; reason?: string } {
  if (input.campaignId !== "17220") return { passed: true };

  if (input.couponId !== "942125" || input.promocode.trim() !== "TKPRDM-UYVG1GJO") {
    return { passed: false, reason: "TASTY_PILOT_UNVERIFIED_COUPON" };
  }
  // Coupon-specific token comes from the currently connected publisher coupon
  // API, which matches "Coupons and Promo Codes -> Get Code" in the account.
  // The separate "Promo Code Programs" listing can expose a different creative
  // ERID for the same offer; never hardcode that listing token into this gate.
  if (!/^[a-zA-Z0-9_-]{12,80}$/.test(input.erid)) {
    return { passed: false, reason: "TASTY_PILOT_MISSING_OR_INVALID_ERID" };
  }
  try {
    const url = new URL(input.affiliateLink);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "dkfrh.com" ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/g/va69o33134c7dde8999c9ebcee8c5e/" ||
      url.searchParams.get("i") !== "31" ||
      url.searchParams.get("erid") !== input.erid
    ) {
      return { passed: false, reason: "TASTY_PILOT_AFFILIATE_LINK_MISMATCH" };
    }
  } catch {
    return { passed: false, reason: "TASTY_PILOT_INVALID_AFFILIATE_URL" };
  }
  return { passed: true };
}

/**
 * CATALOG-GROWTH-2: Single-coupon Befree pilot. Publisher-confirmed program
 * 28532; offer 942686 is a real code ending 2026-10-31.
 * A live upstream validation of availability, personal status, country, legal
 * metadata and expiration still applies in the sync worker.
 */
export function checkBefreePilot(input: {
  campaignId: string;
  couponId: string;
  promocode: string;
  affiliateLink: string;
  erid: string;
}): { passed: boolean; reason?: string } {
  if (input.campaignId !== "28532") return { passed: true };
  // The strict one-coupon pilot remains the default. Program-level approval
  // becomes possible only through the validated additive batch allowlist.
  if (getBatchCampaignAllowlist().includes("28532")) return { passed: true };
  if (input.couponId !== "942686" || !isRealPromoCode(input.promocode)) {
    return { passed: false, reason: "BEFREE_PILOT_UNAPPROVED_COUPON" };
  }
  if (!/^[a-zA-Z0-9_-]{12,80}$/.test(input.erid)) {
    return { passed: false, reason: "BEFREE_PILOT_ERID_INVALID" };
  }
  try {
    const u = new URL(input.affiliateLink);
    const parts = u.pathname.split("/");
    const validTrackingPath = parts.length === 4 && parts[0] === "" &&
      parts[1] === "g" && parts[3] === "" &&
      /^[a-zA-Z0-9_-]+$/.test(parts[2]);
    const publisherId = u.searchParams.get("i") || "";
    const validPublisherId = publisherId.length > 0 &&
      [...publisherId].every((c) => c >= "0" && c <= "9");
    if (u.protocol !== "https:" || u.hostname !== "bednari.com" ||
        u.port || u.username || u.password || !validTrackingPath ||
        !validPublisherId || u.searchParams.get("erid") !== input.erid) {
      return { passed: false, reason: "BEFREE_PILOT_TRACKING_LINK_MISMATCH" };
    }
  } catch {
    return { passed: false, reason: "BEFREE_PILOT_TRACKING_LINK_INVALID" };
  }
  return { passed: true };
}

export type AdmitadPublicationStatus =
  | "PUBLISHABLE"
  | "READY_NOT_APPROVED"
  | "UNMAPPED"
  | "MISSING_ERID"
  | "ERID_MISMATCH"
  | "MISSING_LEGAL_INFO"
  | "INVALID_AFFILIATE_URL"
  | "EXPIRED"
  | "FOREIGN_GEO"
  | "QUALITY_GATE_FAILED"
  | "CAMPAIGN_INACTIVE"
  | "CAMPAIGN_MODERATION"
  | "UNAUTHORIZED_PROMOCODE";

export interface PublicationEvaluationResult {
  publishable: boolean;
  status: AdmitadPublicationStatus;
  reason?: string;
  isApproved: boolean;
}

export interface PublicationEvaluationContext {
  campaign: Partial<AdmitadApiCampaign> & {
    id: number;
    status?: string;
    connection_status?: string;
    advertiser_legal_info?: string;
    moderation?: boolean;
  };
  mapping?: StoreMappingResult;
  eridStatus?: string;
  legalInfoStatus?: string;
  eridValue?: string;
  advertiserLegalInfo?: string;
  allowlist?: readonly string[];
  qualityGatePassed?: boolean;
  qualityGateReasons?: string[];
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
      is_personal?: boolean;
      is_unique?: boolean;
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

  // 0. Проверка результата Quality Gate (если передан)
  if (ctx.qualityGatePassed === false) {
    const qgReasons = ctx.qualityGateReasons || [];
    const isPersonal = qgReasons.some((r) => r.includes("UNAUTHORIZED_PROMOCODE"));
    const isConn = qgReasons.some((r) => r.includes("CONNECTION_INACTIVE") || r.includes("CAMPAIGN_MODERATION"));
    return {
      publishable: false,
      status: isPersonal ? "UNAUTHORIZED_PROMOCODE" : isConn ? "CAMPAIGN_MODERATION" : "QUALITY_GATE_FAILED",
      reason: qgReasons.join("; ") || "Quality Gate не пройден",
      isApproved: false,
    };
  }

  // 1. Проверка активности кампании рекламодателя в сети Admitad
  if (ctx.campaign.status && ctx.campaign.status !== "active") {
    return {
      publishable: false,
      status: "CAMPAIGN_INACTIVE",
      reason: `Кампания имеет статус ${ctx.campaign.status}`,
      isApproved: false,
    };
  }

  // 2. Проверка статуса подключения площадки (модерация рекламодателя)
  // Fail-closed: требуем строго connection_status === "active"
  const connStatus = ctx.campaign?.connection_status;
  if (!connStatus || connStatus !== "active") {
    return {
      publishable: false,
      status: "CAMPAIGN_MODERATION",
      reason: connStatus === "pending"
        ? "Площадка находится на модерации рекламодателя (connection_status: pending)"
        : `Подключение площадки к программе не активно (connection_status: ${connStatus || "missing"})`,
      isApproved: false,
    };
  }

  // 3. Проверка истечения срока действия
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

  // 4. Проверка географии (RU)
  if ("isForeign" in coupon && Boolean(coupon.isForeign)) {
    return {
      publishable: false,
      status: "FOREIGN_GEO",
      reason: "География оффера не включает РФ",
      isApproved: false,
    };
  }

  // 5. Проверка прав на использование промокода (персональные промокоды без согласования блокируются)
  const isPersonalPromo =
    ("is_personal" in coupon && Boolean(coupon.is_personal)) ||
    ("isPersonal" in coupon && Boolean(coupon.isPersonal));
  if (isPersonalPromo) {
    return {
      publishable: false,
      status: "UNAUTHORIZED_PROMOCODE",
      reason: "Персональный промокод требует отдельного согласования рекламодателя (is_personal: true)",
      isApproved: false,
    };
  }

  // 6. Проверка канонического сопоставления магазина PromoFact
  if (!ctx.mapping || ctx.mapping.strategy === "UNMAPPED" || !ctx.mapping.canonicalSlug) {
    return {
      publishable: false,
      status: "UNMAPPED",
      reason: "Магазин не сопоставлен с каноническим каталогом PromoFact",
      isApproved: false,
    };
  }

  // 7. Проверка партнерской ссылки
  let link = "";
  if ("affiliate" in coupon && coupon.affiliate?.url) {
    link = coupon.affiliate.url;
  } else if ("affiliateLink" in coupon && coupon.affiliateLink) {
    link = coupon.affiliateLink;
  } else if ("gotolink" in coupon && coupon.gotolink) {
    link = coupon.gotolink;
  } else if ("goto_link" in coupon && coupon.goto_link) {
    link = coupon.goto_link as string;
  }

  if (!link || (!link.startsWith("http://") && !link.startsWith("https://"))) {
    return {
      publishable: false,
      status: "INVALID_AFFILIATE_URL",
      reason: "Отсутствует валидная партнерская ссылка",
      isApproved: false,
    };
  }

  // 8. Проверка ОРД (ERID)
  if (ctx.eridStatus !== "PRESENT" || !ctx.eridValue) {
    return {
      publishable: false,
      status: "MISSING_ERID",
      reason: "Отсутствует маркировочный токен erid в партнерской ссылке или тексте",
      isApproved: false,
    };
  }

  // 8b. Проверка целостности ERID: токен в ссылке перехода обязан строго совпадать с метаданными
  const linkEridMatch = link.match(/[?&]erid=([a-zA-Z0-9_-]+)/i) || link.match(/erid=([a-zA-Z0-9_-]+)/i);
  if (linkEridMatch && linkEridMatch[1] !== ctx.eridValue) {
    return {
      publishable: false,
      status: "ERID_MISMATCH",
      reason: `Расхождение ERID: в ссылке перехода (${linkEridMatch[1]}), в метаданных (${ctx.eridValue})`,
      isApproved: false,
    };
  }

  // 9. Проверка реквизитов рекламодателя (Legal Info)
  if (ctx.legalInfoStatus !== "PRESENT" || !ctx.advertiserLegalInfo?.trim()) {
    return {
      publishable: false,
      status: "MISSING_LEGAL_INFO",
      reason: "Отсутствуют реквизиты рекламодателя (advertiser_legal_info)",
      isApproved: false,
    };
  }

  // 10. Safety Allowlist (Section 12, 13)
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
