import "server-only";
import { translit } from "@/lib/translit";
import type { Affiliate, Coupon, Promocode, Store } from "@/lib/types";

const REVALIDATE_SECONDS = 30 * 60; // 1800 — ISR

const API_BASE = process.env.PERFLUENCE_API_URL ?? "https://dash.perfluence.net/blogger/promocode-api";
const API_KEY = process.env.PERFLUENCE_API_KEY ?? "";

export function isPerfluenceConfigured(): boolean {
  return Boolean(API_BASE && API_KEY);
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
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s.slice(0, 10);
}

function dateTs(date: string | null): number {
  return date ? new Date(`${date}T23:59:59`).getTime() : Infinity;
}

/* ---------- трансформация ответа API → Coupon[] ---------- */

export function parsePayload(payloadJson: string): Coupon[] {
  const body: { data?: unknown } = JSON.parse(payloadJson);
  const items = Array.isArray(body.data) ? body.data : [];

  const coupons: Coupon[] = [];
  const seenSlugs = new Set<string>();
  let fallbackPromoId = 0;

  for (const raw of items as unknown[]) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const project = (item.project ?? item.shop ?? item) as Record<string, unknown>;
    const promocodes = Array.isArray(item.promocodes)
      ? (item.promocodes as Record<string, unknown>[])
      : [];

    const name = str(project.name || project.store_name).trim() || "Магазин";
    let slug = translit(name) || "magazin";
    let n = 1;
    while (seenSlugs.has(slug)) {
      n += 1;
      slug = `${translit(name) || "magazin"}-${n}`;
    }
    seenSlugs.add(slug);

    const categoryName = str(project.category_name || project.category).trim() || "Другое";
    const landing = item.landing as Record<string, unknown> | undefined;
    const links = Array.isArray(item.links_for_subscribers)
      ? (item.links_for_subscribers as Record<string, unknown>[])
      : [];

    const primaryLink = str(links[0]?.link);
    const landingLink = str(landing?.link);
    const site = str(project.site || project.url);

    const affiliate: Affiliate = {
      link: primaryLink || landingLink || site,
      landingLink: landingLink || primaryLink || site,
      ordMarker: str(landing?.ord_marker),
      ordText: str(landing?.ord_custom_text),
    };

    const extraLinks = links
      .slice(1)
      .map((l) => ({ title: str(l.title) || "Ссылка", link: str(l.link) }))
      .filter((l) => l.link);

    const store: Store = {
      id: num(project.id ?? project.project_id),
      name,
      slug,
      logo: str(project.logo || project.logo_url) || null,
      category: categoryName,
      categorySlug: translit(categoryName),
      about: str(project.product_info) || null,
      conditions: str(project.subscribers_condition) || null,
      site,
      activeBloggers: num(project.activeBloggers ?? project.active_bloggers),
    };

    promocodes.forEach((p) => {
      const promoId = num(p.id);
      fallbackPromoId += 1;
      const promocode: Promocode = {
        id: promoId || fallbackPromoId,
        code: str(p.code).trim(),
        bonusName: str(p.name) || null,
        terms: str(p.promo_terms || p.terms) || null,
        expires: isoDate(p.date || p.expires),
        isHit: bool(p.is_hit),
        isUniversal: bool(p.is_universal),
        isFirstOrderOnly: !bool(p.repeat_order),
        region: str(p.region_promo || p.region) || null,
        isBarcode: bool(p.is_barcode),
        barcodeImage: str(p.image || p.barcode_image) || null,
        group: str(p.group) || null,
      };
      coupons.push({ id: promocode.id, promocode, store, affiliate, extraLinks });
    });
  }

  return coupons;
}

/* ---------- кэш со stale-while-revalidate ---------- */

let cache: Coupon[] | null = null;
let cacheFailed = false;

async function fetchData(): Promise<Coupon[]> {
  if (!isPerfluenceConfigured()) return [];

  try {
    const url = `${API_BASE}/json?key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`Perfluence API: ${res.status} ${res.statusText}`);
    cache = parsePayload(await res.text());
    cacheFailed = false;
    return cache;
  } catch (e) {
    console.error("[perfluence] fetch failed, отдаём кэш:", e);
    cacheFailed = true;
    if (cache) return cache;
    return [];
  }
}

function isActive(c: Coupon): boolean {
  return dateTs(c.promocode.expires) >= Date.now();
}

function byScore(a: Coupon, b: Coupon): number {
  const ah = a.promocode.isHit ? 1 : 0;
  const bh = b.promocode.isHit ? 1 : 0;
  if (ah !== bh) return ah - bh;
  return dateTs(a.promocode.expires) - dateTs(b.promocode.expires);
}

/* ---------- публичное API ---------- */

export async function getCoupons(): Promise<Coupon[]> {
  const all = await fetchData();
  return all.filter(isActive).sort(byScore);
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