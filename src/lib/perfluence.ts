import "server-only";
import { translit } from "@/lib/translit";
import type { Affiliate, Coupon, Promocode, Store } from "@/lib/types";

const REVALIDATE_SECONDS = 10 * 60; // 600 — ISR: свежие купоны подтягиваются за 10 мин

const WIDGET_URL = process.env.PERFLUENCE_WIDGET_URL ?? "";
const RESULTS_URL = process.env.PERFLUENCE_RESULTS_URL ?? "";

export function isPerfluenceConfigured(): boolean {
  return Boolean(WIDGET_URL);
}

/* ---------- примитивы ---------- */

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function bool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

function isoDate(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  // widget-json отдаёт "31.08.2026"
  const ru = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s.slice(0, 10);
}

function stripHtml(v: unknown): string {
  return str(v)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dateTs(date: string | null): number {
  return date ? new Date(`${date}T23:59:59`).getTime() : Infinity;
}

/* ---------- трансформация ответа API → Coupon[] ---------- */

type Rec = Record<string, unknown>;

function asRec(v: unknown): Rec {
  return (v ?? {}) as Rec;
}

function regionStr(v: unknown): string | null {
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ") || null;
  const s = str(v).trim();
  return s || null;
}

/**
 * Собирает пары (промокод, группа) из ответа.
 * widget-json: data[].groups[].promocodes; legacy /json: data[].promocodes.
 */
function collectPromos(item: Rec): { promo: Rec; group: Rec }[] {
  const out: { promo: Rec; group: Rec }[] = [];
  const groups = Array.isArray(item.groups) ? (item.groups as Rec[]) : [item];
  for (const group of groups) {
    const promos = Array.isArray(group.promocodes)
      ? (group.promocodes as Rec[])
      : [];
    for (const promo of promos) out.push({ promo, group });
  }
  return out;
}

export function parsePayload(payloadJson: string): Coupon[] {
  const body: { data?: unknown } = JSON.parse(payloadJson);
  const items = Array.isArray(body.data) ? body.data : [];

  const coupons: Coupon[] = [];
  const seenSlugs = new Set<string>();
  let fallbackPromoId = 0;

  for (const raw of items as unknown[]) {
    const item = asRec(raw);
    const project = asRec(item.project ?? item.shop ?? item);

    const name = str(project.name || project.store_name).trim() || "Магазин";
    let slug = translit(name) || "magazin";
    let n = 1;
    while (seenSlugs.has(slug)) {
      n += 1;
      slug = `${translit(name) || "magazin"}-${n}`;
    }
    seenSlugs.add(slug);

    const categoryName =
      str(project.category_name || project.category).trim() || "Другое";
    const site = str(project.site || project.url);

    const store: Store = {
      id: num(project.id ?? project.project_id),
      name,
      slug,
      logo: str(project.logo || project.logo_url) || null,
      category: categoryName,
      categorySlug: translit(categoryName),
      about: stripHtml(project.product_info) || null,
      conditions: stripHtml(project.subscribers_condition) || null,
      site,
      activeBloggers: num(project.activeBloggers ?? project.active_bloggers),
    };

    for (const { promo: p, group } of collectPromos(item)) {
      const links = Array.isArray(group.links_for_subscribers)
        ? (group.links_for_subscribers as Rec[])
        : [];
      const landingArr = Array.isArray(group.landing)
        ? (group.landing as Rec[])
        : [];
      const landing = asRec(landingArr[0] ?? group.landing);

      const primaryLink = str(links[0]?.link);
      const landingLink = str(landing?.link);
      const ordMarker = str(p.ord_marker || landing?.ord_marker);
      const ordText = str(p.ord_custom_text || landing?.ord_custom_text);

      const affiliate: Affiliate = {
        link: primaryLink || landingLink || site,
        landingLink: landingLink || primaryLink || site,
        ordMarker,
        ordText,
      };

      const extraLinks = links
        .slice(1)
        .map((l) => ({ title: str(l.title) || "Ссылка", link: str(l.link) }))
        .filter((l) => l.link);

      const promoId = num(p.id ?? p.post_id ?? p.bonus_id);
      fallbackPromoId += 1;
      const promocode: Promocode = {
        id: promoId || fallbackPromoId,
        code: str(p.code).trim(),
        bonusName: str(p.name || p.comment).trim() || null,
        terms: stripHtml(p.promo_terms || p.terms) || null,
        expires: isoDate(p.date || p.expires),
        isHit: bool(p.is_hit),
        isUniversal: bool(p.is_universal),
        isFirstOrderOnly: !bool(p.repeat_order),
        region: regionStr(p.region_promo ?? p.region),
        isBarcode: bool(p.is_barcode),
        barcodeImage: str(p.image || p.barcode_image) || null,
        group: str(p.group) || null,
      };
      coupons.push({
        id: promocode.id,
        promocode,
        store,
        affiliate,
        extraLinks,
      });
    }
  }

  return coupons;
}

/* ---------- кэш со stale-while-revalidate ---------- */

let cache: Coupon[] | null = null;
let cacheFailed = false;

function topLevelCount(payload: string): number {
  try {
    const body = JSON.parse(payload) as { data?: unknown };
    return Array.isArray(body.data) ? body.data.length : 0;
  } catch {
    return -1; // невалидный JSON
  }
}

async function devMockFallback(reason: string): Promise<Coupon[]> {
  if (process.env.NODE_ENV === "production") return [];
  console.warn(`[perfluence] ${reason} — отдаю DEV-мок`);
  return (await import("@/lib/mockCoupons")).DEV_MOCK_COUPONS;
}

let pendingPromise: Promise<Coupon[]> | null = null;

async function fetchData(): Promise<Coupon[]> {
  if (cache && !cacheFailed) return cache;
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    if (!isPerfluenceConfigured())
      return devMockFallback("PERFLUENCE_WIDGET_URL не задан");

    try {
      const res = await fetch(WIDGET_URL, {
        headers: { Accept: "application/json" },
        next: { revalidate: REVALIDATE_SECONDS },
      });
      const text = await res.text();
      if (!res.ok)
        throw new Error(`Perfluence widget-json: ${res.status} ${res.statusText}`);

      const top = topLevelCount(text);
      const coupons = parsePayload(text);
      console.log(
        "[perfluence] status:",
        res.status,
        "| верхний уровень элементов:",
        top,
        "| купонов после трансформации:",
        coupons.length,
      );

      if (top > 0 && coupons.length === 0) {
        return devMockFallback("элементы есть, но трансформация дала 0");
      }

      if (coupons.length === 0)
        return devMockFallback("API вернул пустой список купонов");

      cache = coupons;
      cacheFailed = false;
      console.log(`[perfluence] реальные данные: ${coupons.length}`);
      return cache;
    } catch (e) {
      console.error("[perfluence] fetch failed, отдаём кэш:", e);
      cacheFailed = true;
      if (cache) return cache;
      return devMockFallback("запрос упал: " + (e as Error).message);
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

function isActive(c: Coupon): boolean {
  return dateTs(c.promocode.expires) >= Date.now();
}

const PRIORITY_STORES = [
  "pyaterochka",
  "otello",
  "kinopoisk",
  "yandeks-tsvety",
  "iv-roshe",
  "vazhnaya-ryba",
  "fix-price",
  "netprint",
  "pro32-com",
  "itab-ru",
  "sinergiya-angliyskiy",
  "patch-and-go",
  "polzaru",
  "plati-po-miru",
  "irnby",
];

function byScore(a: Coupon, b: Coupon): number {
  const aPri = PRIORITY_STORES.indexOf(a.store.slug);
  const bPri = PRIORITY_STORES.indexOf(b.store.slug);
  const aRank = aPri === -1 ? 999 : aPri;
  const bRank = bPri === -1 ? 999 : bPri;
  if (aRank !== bRank) return aRank - bRank;

  const ah = a.promocode.isHit ? 1 : 0;
  const bh = b.promocode.isHit ? 1 : 0;
  if (ah !== bh) return bh - ah;
  return (b.promocode.code ? 1 : 0) - (a.promocode.code ? 1 : 0);
}

/* ---------- публичное API ---------- */

/**
 * Полный, объединённый стек купонов из всех источников БЕЗ фильтра isActive.
 * Используется для построения полного каталога магазинов (включая те, у которых
 * сейчас нет активных купонов) — чтобы индексировать «промокод {магазин}» для
 * магазинов, чей код временно истёк.
 */
async function fetchMergedCoupons(): Promise<Coupon[]> {
  const [perfluenceCoupons, admitadCoupons, saleadsCoupons, supabaseCoupons] = await Promise.all([
    fetchData(),
    (await import("@/lib/admitad")).fetchAdmitadCoupons(),
    (await import("@/lib/saleads")).fetchSaleadsCoupons(),
    (await import("@/lib/supabaseCoupons")).fetchSupabaseCoupons(),
  ]);

  const customCoupons = (await import("@/lib/customCoupons")).CUSTOM_COUPONS;
  // Дубль Кинопоиска: кастомная версия с обновлённой ссылкой kp45.prfl.me имеет приоритет — глушим Perfluence-дубль с тем же кодом
  const customCodes = new Set([...customCoupons, ...supabaseCoupons].map((c) => c.promocode.code).filter(Boolean));
  const filteredPerfluence = perfluenceCoupons.filter((c) => !customCodes.has(c.promocode.code));

  return [...filteredPerfluence, ...admitadCoupons, ...saleadsCoupons, ...customCoupons, ...supabaseCoupons];
}

export async function getCoupons(): Promise<Coupon[]> {
  return (await fetchMergedCoupons()).filter(isActive).sort(byScore);
}

export interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
}

export async function getCategories(): Promise<CategoryInfo[]> {
  const list = await getCoupons();
  const map = new Map<string, CategoryInfo>();
  for (const c of list) {
    const slug = c.store.categorySlug;
    const cur = map.get(slug);
    if (cur) {
      cur.count += 1;
    } else {
      map.set(slug, { name: c.store.category, slug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export interface StoreInfo {
  id: number;
  slug: string;
  name: string;
  logo: string | null;
  category: string;
  categorySlug: string;
  about: string | null;
  conditions: string | null;
  site: string;
  activeBloggers: number;
  coupons: Coupon[];
}

export async function getStores(): Promise<StoreInfo[]> {
  const list = await getCoupons();
  const map = new Map<string, StoreInfo>();
  for (const c of list) {
    const key = c.store.slug;
    const cur = map.get(key);
    if (cur) {
      cur.coupons.push(c);
    } else {
      map.set(key, {
        id: c.store.id,
        slug: c.store.slug,
        name: c.store.name,
        logo: c.store.logo,
        category: c.store.category,
        categorySlug: c.store.categorySlug,
        about: c.store.about,
        conditions: c.store.conditions,
        site: c.store.site,
        activeBloggers: c.store.activeBloggers,
        coupons: [c],
      });
    }
  }
  for (const s of map.values()) s.coupons.sort(byScore);
  return [...map.values()];
}

/**
 * Полный каталог магазинов из всех источников, включая магазины, у которых
 * сейчас нет активных купонов (их код временно истёк). Нужно, чтобы страницы
 * «промокод {магазин}» индексировались даже когда промокод не действует в этот
 * момент. Каждый магазин несёт свои активные купоны (возможно, пустой список).
 */
export async function getAllStores(): Promise<StoreInfo[]> {
  const list = await fetchMergedCoupons();
  const map = new Map<string, StoreInfo>();
  for (const c of list) {
    const key = c.store.slug;
    const cur = map.get(key);
    if (cur) {
      cur.coupons.push(c);
    } else {
      map.set(key, {
        id: c.store.id,
        slug: c.store.slug,
        name: c.store.name,
        logo: c.store.logo,
        category: c.store.category,
        categorySlug: c.store.categorySlug,
        about: c.store.about,
        conditions: c.store.conditions,
        site: c.store.site,
        activeBloggers: c.store.activeBloggers,
        coupons: [c],
      });
    }
  }
  for (const s of map.values()) s.coupons = s.coupons.filter(isActive).sort(byScore);
  return [...map.values()];
}

export async function getStore(slug: string): Promise<StoreInfo | undefined> {
  const stores = await getStores();
  return stores.find((s) => s.slug === slug);
}

export async function getBestCoupons(): Promise<Coupon[]> {
  const list = await getCoupons();
  const best = new Map<string, Coupon>();
  for (const c of list) {
    const cur = best.get(c.store.slug);
    if (!cur || byScore(c, cur) < 0) best.set(c.store.slug, c);
  }
  return [...best.values()].sort(byScore);
}

/* ---------- статистика заказов (/results) ---------- */

export interface Result {
  datetime: string; // "YYYY-MM-DD HH:MM:SS"
  fee: number;
  stackedCount: number;
  promocode: string;
  comment: string | null;
  project: { id: number; name: string; logo: string | null };
}

const RESULTS_REVALIDATE = 5 * 60; // 300 — ISR

function feeNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const m = String(v).match(/\d+(?:[.,]\d+)?/);
  if (!m) return 0;
  return Number(m[0].replace(",", "."));
}

export function parseResults(payloadJson: string): Result[] {
  const body: { data?: unknown } = JSON.parse(payloadJson);
  const items = Array.isArray(body.data) ? body.data : [];

  const results: Result[] = [];
  for (const raw of items as unknown[]) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const project = (item.project ?? {}) as Record<string, unknown>;
    const datetime = str(item.datetime);
    const promo = str(item.promocode);
    if (!datetime || !promo) continue;

    results.push({
      datetime,
      fee: feeNum(item.fee),
      stackedCount: num(item.stacked_count),
      promocode: promo,
      comment: str(item.comment) || null,
      project: {
        id: num(project.id ?? project.project_id),
        name: str(project.name).trim() || "Магазин",
        logo: str(project.logo) || null,
      },
    });
  }

  return results.sort((a, b) => b.datetime.localeCompare(a.datetime));
}

async function devMockResultsFallback(reason: string): Promise<Result[]> {
  if (process.env.NODE_ENV === "production") return [];
  console.warn(`[perfluence/results] ${reason} — отдаю DEV-мок`);
  return (await import("@/lib/mockCoupons")).DEV_MOCK_RESULTS;
}

function isResultsConfigured(): boolean {
  return Boolean(RESULTS_URL);
}

export async function fetchResults(): Promise<Result[]> {
  if (!isResultsConfigured())
    return devMockResultsFallback("PERFLUENCE_RESULTS_URL не задан");

  try {
    const res = await fetch(RESULTS_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: RESULTS_REVALIDATE },
    });
    const text = await res.text();
    if (!res.ok)
      throw new Error(`Perfluence API /results: ${res.status} ${res.statusText}`);

    const results = parseResults(text);
    console.log(
      "[perfluence/results] status:",
      res.status,
      "| результатов:",
      results.length,
    );

    if (results.length === 0)
      return devMockResultsFallback("API вернул пустой список заказов");

    return results;
  } catch (e) {
    console.error("[perfluence/results] fetch failed:", e);
    return devMockResultsFallback("запрос упал: " + (e as Error).message);
  }
}

/* ---------- статистика сработавших промокодов (доказательства) ---------- */

export interface UsesStats {
  usesByCode: Map<string, number>;
  usesByStore: Map<number, number>;
}

export async function getUsesStats(): Promise<UsesStats> {
  const results = await fetchResults();
  const usesByCode = new Map<string, number>();
  const usesByStore = new Map<number, number>();
  for (const r of results) {
    const n = r.stackedCount > 0 ? r.stackedCount : 1;
    usesByCode.set(r.promocode, (usesByCode.get(r.promocode) ?? 0) + n);
    usesByStore.set(r.project.id, (usesByStore.get(r.project.id) ?? 0) + n);
  }
  return { usesByCode, usesByStore };
}
