import "server-only";
import { translit } from "@/lib/translit";
import type { Coupon, Store, Promocode, Affiliate } from "@/lib/types";

const ADMITAD_FEED_URL = process.env.ADMITAD_FEED_URL ?? "";

export function isAdmitadConfigured(): boolean {
  return Boolean(ADMITAD_FEED_URL);
}

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

function stripHtml(v: unknown): string {
  return str(v)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Парсинг выгрузки Admitad Coupons & Deals (JSON / Export Feed)
 */
export function parseAdmitadPayload(jsonText: string): Coupon[] {
  try {
    const data = JSON.parse(jsonText);
    const results = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : Array.isArray(data.coupons) ? data.coupons : [];

    const coupons: Coupon[] = [];
    const seenSlugs = new Set<string>();

    for (const item of results) {
      const promoCode = str(item.promocode || item.code).trim();
      // Берём только офферы с конкретным промокодом
      if (!promoCode) continue;

      const storeName = str(item.advcampaign_name || item.campaign_name || item.shop_name || item.name).trim() || "Магазин";
      let slug = translit(storeName) || "magazin";
      let n = 1;
      while (seenSlugs.has(slug)) {
        n += 1;
        slug = `${translit(storeName) || "magazin"}-${n}`;
      }
      seenSlugs.add(slug);

      const categoryName = str(item.category_name || (Array.isArray(item.categories) ? item.categories[0]?.name : "")).trim() || "Маркетплейсы";
      const logo = str(item.logo || item.image || item.advcampaign_logo);
      const site = str(item.site || item.site_url || item.goto_link);

      const store: Store = {
        id: num(item.advcampaign_id || item.campaign_id || item.id || 90000),
        name: storeName,
        slug,
        logo: logo || null,
        category: categoryName,
        categorySlug: translit(categoryName),
        about: stripHtml(item.advcampaign_description || item.description) || null,
        conditions: stripHtml(item.terms || item.limitations) || null,
        site,
        activeBloggers: 100,
      };

      const promoId = num(item.id || item.coupon_id) || Math.floor(Math.random() * 1000000);
      const bonusName = str(item.short_name || item.name || item.discount).trim();
      const terms = stripHtml(item.description || item.terms || item.limitations);
      const rawDate = str(item.date_end || item.expires || item.end_date);
      const expires = rawDate ? rawDate.slice(0, 10) : null;

      const affiliateLink = str(item.goto_link || item.url || item.link);
      const ordMarker = str(item.erid || item.ord_marker || item.token);
      const ordText = str(item.advcampaign_name ? `Реклама. ${item.advcampaign_name}` : "Реклама.");

      const affiliate: Affiliate = {
        link: affiliateLink || site,
        landingLink: affiliateLink || site,
        ordMarker,
        ordText,
      };

      const promocode: Promocode = {
        id: promoId,
        code: promoCode,
        bonusName: bonusName || null,
        terms: terms || null,
        expires,
        isHit: Boolean(item.is_hit || item.promoted),
        isUniversal: true,
        isFirstOrderOnly: /перв/i.test(bonusName) || /перв/i.test(terms),
        region: str(item.regions || item.region) || null,
        isBarcode: false,
        barcodeImage: null,
        group: null,
      };

      coupons.push({
        id: promoId,
        promocode,
        store,
        affiliate,
        extraLinks: [],
      });
    }

    return coupons;
  } catch (e) {
    console.error("[admitad] Ошибка парсинга фида Admitad:", e);
    return [];
  }
}

export async function fetchAdmitadCoupons(): Promise<Coupon[]> {
  if (!isAdmitadConfigured()) return [];

  try {
    const res = await fetch(ADMITAD_FEED_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[admitad] Не удалось загрузить фид: ${res.status} ${res.statusText}`);
      return [];
    }
    const text = await res.text();
    const list = parseAdmitadPayload(text);
    console.log(`[admitad] Загружено купонов: ${list.length}`);
    return list;
  } catch (e) {
    console.error("[admitad] Ошибка запроса к фиду Admitad:", e);
    return [];
  }
}
