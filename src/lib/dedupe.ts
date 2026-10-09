import type { Coupon } from "@/lib/types";

/**
 * Слияние купонов из нескольких источников с устранением дублей.
 *
 * Раньше дедуп был только между ручными купонами и Perfluence — по коду.
 * Между сетями (Perfluence / Admitad / Saleads) дедупа не было вовсе: один и
 * тот же оффер из двух сетей давал две карточки с разными партнёрскими
 * ссылками, и по какой из них идёт комиссия — неизвестно.
 */

export type CouponSource =
  | "custom"
  | "supabase"
  | "perfluence"
  | "admitad";

/**
 * Приоритет при коллизии — от старшего к младшему.
 * Ручные купоны выше всех (в них выверенные ссылки и erid), Perfluence выше
 * сетей: там наша история заказов и статистика подтверждений.
 */
export const SOURCE_PRIORITY: readonly CouponSource[] = [
  "custom",
  "supabase",
  "perfluence",
  "admitad",
];

/** Ручные источники: их коды глушат дубли из фидов независимо от магазина. */
const MANUAL_SOURCES: readonly CouponSource[] = ["custom", "supabase"];

export interface SourceBucket {
  source: CouponSource;
  coupons: Coupon[];
}

export interface DedupeStats {
  total: number;
  kept: number;
  dropped: number;
  droppedBySource: Partial<Record<CouponSource, number>>;
}

/** Коды промокодов регистронезависимы — сравниваем в верхнем регистре. */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Маркеры отсутствия реального промокода (скидка по ссылке, акции, условия перехода) */
const NO_CODE_MARKERS = new Set([
  "",
  "НЕ НУЖЕН",
  "НЕ_НУЖЕН",
  "НЕ ТРЕБУЕТСЯ",
  "НЕ_ТРЕБУЕТСЯ",
  "БЕЗ ПРОМОКОДА",
  "БЕЗ_ПРОМОКОДА",
  "БЕЗ КОДА",
  "БЕЗ_КОДА",
  "NO_CODE",
  "NOCODE",
  "НЕТ",
  "АКЦИЯ",
]);

/** Проверяет, является ли значение реальным промокодом или плейсхолдером отсутствия кода */
export function isRealPromoCode(code: string | null | undefined): boolean {
  if (!code) return false;
  const normalized = normalizeCode(code);
  return normalized !== "" && !NO_CODE_MARKERS.has(normalized);
}

/**
 * Ключ купона. Для купонов с реальным промокодом — «магазин + код».
 * Для самостоятельных акций без кода (скидка по ссылке, промокод не требуется) —
 * уникальная идентичность формируется из магазина, ссылки/лендинга, erid и ID оффера,
 * чтобы разные акции одного рекламодателя (например, 3 разных предложения Яндекс Путешествий)
 * не схлопывались в одну карточку.
 */
function couponKey(c: Coupon): string {
  const rawCode = c.promocode?.code;
  if (isRealPromoCode(rawCode)) {
    return `${c.store.slug}::code::${normalizeCode(rawCode)}`;
  }
  const link = (c.affiliate?.link || c.affiliate?.landingLink || c.store?.site || "").trim();
  const erid = (c.affiliate?.ordMarker || "").trim();
  const offerId = c.promocode?.id || c.id || "";
  const bonus = (c.promocode?.bonusName || "").trim().toLowerCase();
  return `${c.store.slug}::deal::${link}::${erid}::${offerId}::${bonus}`;
}

/**
 * Возвращает купоны без дублей: при коллизии остаётся версия из источника
 * с более высоким приоритетом. Порядок внутри источника сохраняется.
 */
export function dedupeCoupons(buckets: SourceBucket[]): {
  coupons: Coupon[];
  stats: DedupeStats;
} {
  const bySource = new Map<CouponSource, Coupon[]>();
  let total = 0;
  for (const bucket of buckets) {
    const acc = bySource.get(bucket.source) ?? [];
    acc.push(...bucket.coupons);
    bySource.set(bucket.source, acc);
    total += bucket.coupons.length;
  }

  // Коды из ручных источников: перебивают тот же код в любом фиде,
  // даже если магазин там назван иначе (случай Кинопоиска).
  const manualCodes = new Set<string>();
  for (const source of MANUAL_SOURCES) {
    for (const c of bySource.get(source) ?? []) {
      const code = normalizeCode(c.promocode.code);
      if (code) manualCodes.add(code);
    }
  }

  const seen = new Set<string>();
  const coupons: Coupon[] = [];
  const droppedBySource: Partial<Record<CouponSource, number>> = {};

  for (const source of SOURCE_PRIORITY) {
    const isManual = MANUAL_SOURCES.includes(source);
    for (const c of bySource.get(source) ?? []) {
      const code = normalizeCode(c.promocode.code);
      const shadowedByManual = !isManual && code !== "" && manualCodes.has(code);
      const key = couponKey(c);

      if (shadowedByManual || seen.has(key)) {
        droppedBySource[source] = (droppedBySource[source] ?? 0) + 1;
        continue;
      }

      seen.add(key);
      coupons.push(c);
    }
  }

  return {
    coupons,
    stats: {
      total,
      kept: coupons.length,
      dropped: total - coupons.length,
      droppedBySource,
    },
  };
}
