import "server-only";
import type { Coupon } from "@/lib/types";
import { translit } from "@/lib/translit";
import { proxiedLogo } from "@/lib/logoProxy";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import fs from "node:fs";
import path from "node:path";

/**
 * Кэш-слой Admitad в Supabase (таблица admitad_coupons).
 *
 * Безопасный snapshot-based sync автопилота:
 *  - Чтение кэша для runtime (только is_active=true и не протухшие);
 *  - Запись снапшота батчами с техническими полями (sync_run_id, erid_status, mapping_strategy и т.д.);
 *  - Деактивация устаревших строк ТОЛЬКО после 100% успешного прогона синка;
 *  - Хранение метаданных и агрегатов синка для Observability / Healthcheck.
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
  const category = str(row.category) || "Другое";
  const categorySlug = str(row.category_slug) ? translit(str(row.category_slug)) : translit(category) || "drugoe";
  const expires = str(row.expires) ? str(row.expires).slice(0, 10) : null;
  const site = str(row.site) || str(row.affiliate_link) || str(row.affiliate_url);
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
      id: num(row.id) || 90000,
      name: storeName,
      slug: storeSlug,
      logo: proxiedLogo(str(row.logo)),
      category,
      categorySlug,
      about: str(row.about) || null,
      conditions: terms,
      site,
      activeBloggers: 0,
    },
    affiliate: {
      link: site || str(row.affiliate_link) || str(row.affiliate_url),
      landingLink: site || str(row.affiliate_link) || str(row.affiliate_url),
      ordMarker,
      ordText,
    },
    extraLinks: [],
  };
}

/**
 * Чтение активных и валидных купонов Admitad из снимка Supabase.
 * Runtime путь: читает ТОЛЬКО Supabase, никогда не делает прямых запросов к Admitad API.
 */
export async function fetchAdmitadCouponsCached(): Promise<Coupon[]> {
  const supabase = getSupabase();
  if (!supabase) {
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
  // Технические поля snapshot sync
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

const LOCAL_SNAPSHOT_PATH = path.join(process.cwd(), "src/data/admitad-snapshot.json");

/**
 * Батч-апсорт снапшота в admitad_coupons (service role с локальным snapshot-fallback).
 */
export async function upsertAdmitadSnapshot(rows: AdmitadRowInput[]): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (rows.length === 0) return 0;

  // Дедуп по id внутри пакета
  const seen = new Set<string>();
  const uniqueRows: AdmitadRowInput[] = [];
  for (const r of rows) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      uniqueRows.push(r);
    }
  }

  // Если Supabase service role не настроен локально — сохраняем снимок в локальный JSON кэш
  if (!supabase) {
    console.info(`[admitad/snapshot] Supabase не настроен, сохранение локального снимка (${uniqueRows.length} записей)`);
    try {
      fs.mkdirSync(path.dirname(LOCAL_SNAPSHOT_PATH), { recursive: true });
      fs.writeFileSync(LOCAL_SNAPSHOT_PATH, JSON.stringify(uniqueRows, null, 2), "utf8");
    } catch (e) {
      console.warn("[admitad/snapshot] ошибка записи локального снимка:", e);
    }
    return uniqueRows.length;
  }

  const CHUNK = 300;
  let written = 0;
  for (let i = 0; i < uniqueRows.length; i += CHUNK) {
    const chunk = uniqueRows.slice(i, i + CHUNK);
    const { error } = await supabase.from("admitad_coupons").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error("[admitad/supabase] upsert chunk failed:", error.message);
      throw error;
    }
    written += chunk.length;
    await new Promise((r) => setTimeout(r, 60));
  }
  return written;
}

/**
 * Деактивация устаревших строк (Stale Deactivation).
 * Выполняется ТОЛЬКО после 100% успешного завершения записи текущего снимка.
 */
export async function deactivateStaleSnapshots(currentSyncRunId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    try {
      if (fs.existsSync(LOCAL_SNAPSHOT_PATH)) {
        const raw = JSON.parse(fs.readFileSync(LOCAL_SNAPSHOT_PATH, "utf8")) as AdmitadRowInput[];
        let deactivated = 0;
        for (const row of raw) {
          if (row.sync_run_id !== currentSyncRunId && row.is_active) {
            row.is_active = false;
            row.sync_status = "stale_deactivated";
            deactivated++;
          }
        }
        fs.writeFileSync(LOCAL_SNAPSHOT_PATH, JSON.stringify(raw, null, 2), "utf8");
        return deactivated;
      }
    } catch {}
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from("admitad_coupons")
      .update({
        is_active: false,
        sync_status: "stale_deactivated",
        updated_at: new Date().toISOString(),
      })
      .neq("sync_run_id", currentSyncRunId)
      .eq("is_active", true)
      .select("id");

    if (error) {
      console.error("[admitad/supabase] deactivate stale failed:", error.message);
      return 0;
    }
    return data ? data.length : 0;
  } catch (e) {
    console.error("[admitad/supabase] deactivate stale exception:", e);
    return 0;
  }
}

/**
 * Получение текущего количества активных записей снимка (для защиты от падения).
 */
export async function getActiveSnapshotCount(): Promise<number> {
  const supabase = getSupabaseAdmin() || getSupabase();
  if (!supabase) {
    try {
      if (fs.existsSync(LOCAL_SNAPSHOT_PATH)) {
        const raw = JSON.parse(fs.readFileSync(LOCAL_SNAPSHOT_PATH, "utf8")) as AdmitadRowInput[];
        return raw.filter((r) => r.is_active).length;
      }
    } catch {}
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
  last_status: "SUCCESS" | "DEGRADED" | "FAILED";
  last_error_code: string | null;
  duration_ms: number;
  details?: Record<string, unknown>;
}

const LOCAL_META_PATH = path.join(process.cwd(), "src/data/admitad-sync-meta.json");

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

  // Fallback на локальный JSON файл
  try {
    if (fs.existsSync(LOCAL_META_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_META_PATH, "utf8"));
    }
  } catch {}
  return null;
}

export async function saveAdmitadSyncMeta(meta: AdmitadSyncMeta): Promise<void> {
  // 1. Запись в Supabase
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from("admitad_sync_meta").upsert({
        id: "admitad_main",
        ...meta,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[admitad/supabase] save sync meta failed:", e);
    }
  }

  // 2. Локальный fallback JSON
  try {
    fs.mkdirSync(path.dirname(LOCAL_META_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_META_PATH, JSON.stringify(meta, null, 2), "utf8");
  } catch {}
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
