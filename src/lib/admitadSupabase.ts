import "server-only";
import type { Coupon } from "@/lib/types";
import { translit } from "@/lib/translit";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

/**
 * Кэш-слой Admitad в Supabase (таблица admitad_coupons).
 *
 * Импорт по расписанию пишет сюда только отфильтрованный РУ-релевантный список
 * вместо того, чтобы runtime каждый раз качал 65МБ фид. Здесь:
 *  - чтение кэша для запросного пути (anon, только активные и не протухшие);
 *  - запись импорта (service role, батчами).
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

/** Растёт ли срок действия: null — не знаем, считаем активным. */
function isNotExpired(expires: string | null): boolean {
  if (!expires) return true;
  const d = new Date(`${expires.slice(0, 10)}T23:59:59`);
  return !isNaN(d.getTime()) && d.getTime() >= Date.now();
}

/* ------------------------- чтение (запросный путь) ------------------------- */

function rowToCoupon(row: Record<string, unknown>): Coupon | null {
  const code = str(row.code);
  const storeName = str(row.store) || "Магазин";
  const storeSlug = str(row.store_slug) ? translit(str(row.store_slug)) : translit(storeName) || "magazin";
  const category = str(row.category) || "Другое";
  const categorySlug = str(row.category_slug) ? translit(str(row.category_slug)) : translit(category) || "drugoe";
  const expires = str(row.expires) ? str(row.expires).slice(0, 10) : null;
  const site = str(row.site) || str(row.affiliate_link) || str(row.affiliate_url);
  const bonusName = str(row.bonus_name || row.discount) || null;
  const terms = str(row.terms || row.description) || null;
  const id = num(row.id) || hash(String(row.code || storeSlug));

  return {
    id,
    promocode: {
      id,
      code,
      bonusName,
      terms,
      expires,
      isHit: bool(row.is_hit),
      isUniversal: true,
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
      logo: str(row.logo) || null,
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
      ordMarker: str(row.ord_marker) || "",
      ordText: str(row.ord_text) || (str(row.ord_marker) ? `Реклама. erid: ${str(row.ord_marker)}` : `Реклама. ${storeName}`),
    },
    extraLinks: [],
  };
}

export async function fetchAdmitadCouponsCached(): Promise<Coupon[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("admitad_coupons")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error || !data || data.length === 0) return [];
    const out: Coupon[] = [];
    for (const row of data as Record<string, unknown>[]) {
      const c = rowToCoupon(row);
      if (c && isNotExpired(c.promocode.expires)) out.push(c);
    }
    if (out.length > 0) console.log(`[admitad/supabase] loaded ${out.length} cached coupons`);
    return out;
  } catch (e) {
    console.error("[admitad/supabase] read failed:", e);
    return [];
  }
}

/* ------------------------- запись (импорт) ------------------------- */

function couponToRow(c: Coupon, todayIso: string): Record<string, unknown> {
  const expires = c.promocode.expires ? c.promocode.expires.slice(0, 10) : null;
  const isActive = !(expires && expires < todayIso);
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
    is_active: isActive,
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
  };
}

/**
 * Батч-апсорт купонов в admitad_coupons (service role, обходит RLS).
 * Пишет только подтверждённые по сроку (протухшие — is_active=false, остаются в БД
 * ради истории, но не показываются). Возвращает число записанных строк.
 */
export async function upsertAdmitadCoupons(coupons: Coupon[]): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase service role не настроен (SUPABASE_SERVICE_ROLE_KEY)");
  const todayIso = new Date().toISOString().slice(0, 10);
  // Дедуп по id внутри пакета
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const c of coupons) {
    const key = String(c.id);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(couponToRow(c, todayIso));
  }
  if (rows.length === 0) return 0;

  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("admitad_coupons").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error("[admitad/supabase] upsert chunk failed:", error.message);
      throw error;
    }
    written += chunk.length;
    // setTimeout между чанками, чтобы не упереться в лимит RPS Supabase
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`[admitad/supabase] upserted ${written} coupons`);
  return written;
}
