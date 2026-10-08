import "server-only";
import type { Coupon } from "@/lib/types";
import { translit } from "@/lib/translit";
import { proxiedLogo } from "@/lib/logoProxy";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import { STABLE_STORES } from "@/lib/stableStores";
import fs from "node:fs";
import path from "node:path";

/**
 * Кэш-слой Admitad в Supabase (таблица admitad_coupons).
 *
 * Безопасный snapshot-based sync автопилота (ADMITAD-2.1):
 *  - Чтение кэша для runtime (только is_active=true и не протухшие);
 *  - Приоритет партнерских ссылок (affiliate_link всегда для клика, site только для merchant site);
 *  - Канонические category_slug и стабильные store ID из STABLE_STORES;
 *  - Stale deactivation fail-closed при ошибках БД;
 *  - Локальный fallback изолирован и исключен из production рендера.
 */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Проверка срока действия: null — бессрочный, считается активным до 23:59:59 МСК. */
export function isNotExpired(expires: string | null): boolean {
  if (!expires) return true;
  const d = new Date(`${expires.slice(0, 10)}T23:59:59+03:00`);
  return !isNaN(d.getTime()) && d.getTime() >= Date.now();
}

/* ------------------------- чтение (runtime) ------------------------- */

export function rowToCoupon(row: Record<string, unknown>): Coupon | null {
  const code = str(row.code);
  const storeName = str(row.store).replace(/[\u200B-\u200D\uFEFF]/g, "").trim() || "Магазин";
  const storeSlug = str(row.store_slug) ? translit(str(row.store_slug)) : translit(storeName) || "magazin";

  // Разделение сайтов и трекинговых ссылок (ADMITAD-2.1 Section 1)
  const merchantSite = str(row.site);
  const affiliateLink = str(row.affiliate_link) || str(row.affiliate_url);
  const storeSite = merchantSite || affiliateLink;
  const finalAffiliateLink = affiliateLink || merchantSite;

  // Канонические метаданные магазина из реестра STABLE_STORES (Section 2, 3)
  const stableMeta = (STABLE_STORES as Record<string, { id?: number; name?: string; categorySlug?: string; category?: string }>)[storeSlug];
  const storeId = stableMeta?.id ?? (900000 + Math.abs(hash(str(row.source_campaign_id) || storeSlug) % 99999));
  const category = stableMeta?.category || str(row.category) || "Другое";
  const categorySlug = stableMeta?.categorySlug || (str(row.category_slug) ? translit(str(row.category_slug)) : translit(category) || "drugoe");

  const expires = str(row.expires) ? str(row.expires).slice(0, 10) : null;
  const bonusName = str(row.bonus_name || row.discount) || null;
  const terms = str(row.terms || row.description) || null;
  const id = num(row.id) || hash(String(row.code || storeSlug));
  const ordMarker = str(row.ord_marker);
  const ordText = str(row.ord_text) || (ordMarker ? `Реклама. erid: ${ordMarker}` : `Реклама. ${storeName}`);

  return {
    id,
    promocode: {
      id,
      code,
      bonusName,
      terms,
      expires,
      isHit: bool(row.is_hit),
      isUniversal: !bool(row.is_first_order_only),
      isFirstOrderOnly: bool(row.is_first_order_only),
      customerTypeLabel: bool(row.is_first_order_only) ? "Первый заказ" : "Для всех",
      minimumOrder: null,
      region: str(row.region) || "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: {
      id: storeId,
      name: storeName,
      slug: storeSlug,
      logo: proxiedLogo(str(row.logo)),
      category,
      categorySlug,
      about: str(row.about) || null,
      conditions: terms,
      site: storeSite,
      activeBloggers: 0,
    },
    affiliate: {
      link: finalAffiliateLink,
      landingLink: finalAffiliateLink,
      ordMarker,
      ordText,
    },
    extraLinks: [],
  };
}

const LOCAL_SNAPSHOT_PATH = path.join(process.cwd(), "src/data/admitad-snapshot.json");
const LOCAL_STAGING_PATH = path.join(process.cwd(), ".next/cache/admitad_staging.json");
const LOCAL_META_PATH = path.join(process.cwd(), "src/data/admitad-sync-meta.json");

/**
 * Чтение активных и валидных купонов Admitad из снимка Supabase.
 * Runtime путь: читает ТОЛЬКО Supabase, никогда не делает прямых запросов к Admitad API.
 */
export async function fetchAdmitadCouponsCached(): Promise<Coupon[]> {
  const supabase = getSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[admitad] snapshot unavailable (supabase not configured in production)");
      return [];
    }
    try {
      if (fs.existsSync(LOCAL_SNAPSHOT_PATH)) {
        const raw = JSON.parse(fs.readFileSync(LOCAL_SNAPSHOT_PATH, "utf8")) as Record<string, unknown>[];
        const out: Coupon[] = [];
        for (const row of raw) {
          if (row.is_active) {
            const c = rowToCoupon(row);
            if (c && isNotExpired(c.promocode.expires)) {
              out.push(c);
            }
          }
        }
        return out;
      }
    } catch {}
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("admitad_coupons")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") return [];
      console.error("[admitad/supabase] read failed:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    const out: Coupon[] = [];
    for (const row of data as Record<string, unknown>[]) {
      const c = rowToCoupon(row);
      if (c && isNotExpired(c.promocode.expires)) {
        out.push(c);
      }
    }
    return out;
  } catch (e) {
    console.error("[admitad/supabase] read failed:", e);
    return [];
  }
}

/* ------------------------- запись (snapshot sync) ------------------------- */

export interface AdmitadRowInput {
  id: string;
  code: string | null;
  store: string;
  store_slug: string;
  discount: string;
  category: string;
  description: string | null;
  expires: string | null;
  affiliate_url: string | null;
  is_active: boolean;
  uses_count?: number;
  bonus_name?: string | null;
  terms?: string | null;
  affiliate_link?: string | null;
  ord_marker?: string | null;
  ord_text?: string | null;
  logo?: string | null;
  site?: string | null;
  category_slug?: string;
  about?: string | null;
  region?: string;
  is_hit?: boolean;
  is_first_order_only?: boolean;
  source_campaign_id?: string | null;
  source_coupon_id?: string | null;
  last_seen_at?: string;
  sync_run_id?: string;
  sync_status?: string;
  mapping_strategy?: string;
  legal_status?: string;
  erid_status?: string;
  updated_at?: string;
}

/**
 * Запись строк нового поколения в изолированную таблицу admitad_coupons_staging.
 * НЕ ТРОГАЕТ боевую admitad_coupons (ADMITAD-2.3 Section B6).
 */
export async function upsertAdmitadStaging(rows: AdmitadRowInput[], syncRunId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (rows.length === 0) return 0;

  const seen = new Set<string>();
  const stagingRows: AdmitadRowInput[] = [];
  for (const r of rows) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      stagingRows.push({
        ...r,
        sync_run_id: syncRunId,
      });
    }
  }

  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      try {
        fs.mkdirSync(path.dirname(LOCAL_STAGING_PATH), { recursive: true });
        let existing: Record<string, AdmitadRowInput[]> = {};
        if (fs.existsSync(LOCAL_STAGING_PATH)) {
          existing = JSON.parse(fs.readFileSync(LOCAL_STAGING_PATH, "utf8"));
        }
        existing[syncRunId] = stagingRows;
        fs.writeFileSync(LOCAL_STAGING_PATH, JSON.stringify(existing, null, 2), "utf8");
      } catch (e) {
        console.warn("[admitad/staging] ошибка записи локального staging:", e);
      }
    }
    return stagingRows.length;
  }

  const CHUNK = 300;
  let written = 0;
  for (let i = 0; i < stagingRows.length; i += CHUNK) {
    const chunk = stagingRows.slice(i, i + CHUNK);
    const { error } = await supabase.from("admitad_coupons_staging").upsert(chunk, {
      onConflict: "sync_run_id,id",
    });
    if (error) {
      console.error("[admitad/supabase] staging upsert chunk failed:", error.message);
      throw error;
    }
    written += chunk.length;
    await new Promise((r) => setTimeout(r, 60));
  }
  return written;
}

/**
 * Атомарная публикация поколения из admitad_coupons_staging в admitad_coupons.
 * Выполняется через транзакционную PostgreSQL RPC publish_admitad_snapshot (ADMITAD-2.3 Section B3).
 */
export async function publishAdmitadSnapshot(
  syncRunId: string,
  expectedCount?: number,
  minThresholdRatio = 0.35
): Promise<{ success: boolean; publishedCount: number; error?: string }> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      try {
        if (!fs.existsSync(LOCAL_STAGING_PATH)) {
          throw new Error("STAGING_EMPTY: No staging data file found");
        }
        const stagingData: Record<string, AdmitadRowInput[]> = JSON.parse(
          fs.readFileSync(LOCAL_STAGING_PATH, "utf8")
        );
        const generationRows = stagingData[syncRunId];
        if (!generationRows || generationRows.length === 0) {
          throw new Error(`STAGING_EMPTY: No rows found for sync_run_id ${syncRunId}`);
        }

        // Проверка ожидаемого количества
        if (expectedCount !== undefined && generationRows.length < expectedCount) {
          throw new Error(`STAGING_COUNT_MISMATCH: Expected ${expectedCount}, got ${generationRows.length}`);
        }

        // Проверка катастрофического падения
        const prevCount = await getActiveSnapshotCount();
        if (prevCount > 0 && generationRows.length < prevCount * minThresholdRatio) {
          throw new Error(`CATASTROPHIC_DROP: Count ${generationRows.length} dropped below threshold of ${prevCount}`);
        }

        // Атомарная замена в локальный боевой файл
        fs.mkdirSync(path.dirname(LOCAL_SNAPSHOT_PATH), { recursive: true });
        const tempPath = `${LOCAL_SNAPSHOT_PATH}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(generationRows, null, 2), "utf8");
        fs.renameSync(tempPath, LOCAL_SNAPSHOT_PATH);

        // Очистка старых поколений в staging
        delete stagingData[syncRunId];
        fs.writeFileSync(LOCAL_STAGING_PATH, JSON.stringify(stagingData, null, 2), "utf8");

        return {
          success: true,
          publishedCount: generationRows.length,
        };
      } catch (e) {
        return {
          success: false,
          publishedCount: 0,
          error: (e as Error).message,
        };
      }
    }
    return { success: false, publishedCount: 0, error: "Supabase admin client unavailable" };
  }

  try {
    const { data, error } = await supabase.rpc("publish_admitad_snapshot", {
      p_sync_run_id: syncRunId,
      p_expected_count: expectedCount ?? null,
      p_min_threshold_ratio: minThresholdRatio,
    });

    if (error) {
      console.error("[admitad/supabase] atomic publish RPC failed:", error.message);
      return { success: false, publishedCount: 0, error: error.message };
    }

    const res = data as { success?: boolean; published_count?: number };
    return {
      success: Boolean(res?.success),
      publishedCount: Number(res?.published_count || 0),
    };
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[admitad/supabase] atomic publish RPC threw:", msg);
    return { success: false, publishedCount: 0, error: msg };
  }
}

/**
 * Батч-апсорт снапшота в admitad_coupons (legacy compatibility alias, направляет в staging).
 */
export async function upsertAdmitadSnapshot(rows: AdmitadRowInput[]): Promise<number> {
  const syncRunId = rows[0]?.sync_run_id || `compat_${Date.now()}`;
  return upsertAdmitadStaging(rows, syncRunId);
}

/**
 * Деактивация устаревших строк (legacy alias, в ADMITAD-2.3 выполняется атомарно внутри RPC).
 */
export async function deactivateStaleSnapshots(currentSyncRunId?: string): Promise<number> {
  void currentSyncRunId;
  return 0;
}

/**
 * Получение текущего количества активных записей снимка.
 */
export async function getActiveSnapshotCount(): Promise<number> {
  const supabase = getSupabaseAdmin() || getSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      try {
        if (fs.existsSync(LOCAL_SNAPSHOT_PATH)) {
          const raw = JSON.parse(fs.readFileSync(LOCAL_SNAPSHOT_PATH, "utf8")) as AdmitadRowInput[];
          return raw.filter((r) => r.is_active).length;
        }
      } catch {}
    }
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("admitad_coupons")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/* ------------------------- Observability / Health ------------------------- */

export interface AdmitadSyncMeta {
  last_attempt_at: string;
  last_success_at: string | null;
  last_success_count: number;
  last_success_sync_run_id?: string | null;
  last_status: "SUCCESS" | "DEGRADED" | "FAILED";
  last_error_code: string | null;
  duration_ms: number;
  details?: Record<string, unknown>;
}

export async function getAdmitadSyncMeta(): Promise<AdmitadSyncMeta | null> {
  const supabase = getSupabaseAdmin() || getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("admitad_sync_meta")
        .select("*")
        .eq("id", "admitad_main")
        .maybeSingle();
      if (!error && data) {
        return {
          last_attempt_at: data.last_attempt_at,
          last_success_at: data.last_success_at,
          last_success_count: Number(data.last_success_count || 0),
          last_status: data.last_status,
          last_error_code: data.last_error_code,
          duration_ms: Number(data.duration_ms || 0),
          details: data.details,
        };
      }
    } catch {}
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      if (fs.existsSync(LOCAL_META_PATH)) {
        return JSON.parse(fs.readFileSync(LOCAL_META_PATH, "utf8"));
      }
    } catch {}
  }
  return null;
}

export async function saveAdmitadSyncMeta(meta: AdmitadSyncMeta): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from("admitad_sync_meta").upsert({
        id: "admitad_main",
        ...meta,
        updated_at: new Date().toISOString(),
      });
      return; // При успешной записи в Supabase локальный файл не пишем (Section 12)
    } catch (e) {
      console.error("[admitad/supabase] save sync meta failed:", e);
      if (process.env.NODE_ENV === "production") throw e;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      fs.mkdirSync(path.dirname(LOCAL_META_PATH), { recursive: true });
      fs.writeFileSync(LOCAL_META_PATH, JSON.stringify(meta, null, 2), "utf8");
    } catch {}
  }
}

/** Совместимость с legacy import */
export async function upsertAdmitadCoupons(coupons: Coupon[]): Promise<number> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const rows: AdmitadRowInput[] = coupons.map((c) => {
    const expires = c.promocode.expires ? c.promocode.expires.slice(0, 10) : null;
    return {
      id: String(c.id),
      code: c.promocode.code || null,
      store: c.store.name,
      store_slug: c.store.slug,
      discount: c.promocode.bonusName || c.store.category || "Скидка по промокоду",
      category: c.store.category,
      description: c.promocode.terms || null,
      expires,
      affiliate_url: c.affiliate.link || null,
      is_active: !(expires && expires < todayIso),
      uses_count: 0,
      bonus_name: c.promocode.bonusName || null,
      terms: c.promocode.terms || null,
      affiliate_link: c.affiliate.link || null,
      ord_marker: c.affiliate.ordMarker || null,
      ord_text: c.affiliate.ordText || null,
      logo: c.store.logo || null,
      site: c.store.site || null,
      category_slug: c.store.categorySlug,
      about: c.store.about || null,
      region: c.promocode.region || "RU",
      is_hit: c.promocode.isHit,
      is_first_order_only: c.promocode.isFirstOrderOnly,
      sync_status: "active",
      updated_at: new Date().toISOString(),
    };
  });
  return upsertAdmitadSnapshot(rows);
}
