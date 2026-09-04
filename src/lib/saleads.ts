import "server-only";
import { translit } from "@/lib/translit";
import { normalizeStore } from "@/lib/storeNormalizer";
import { normalizeCode } from "@/lib/dedupe";
import { ID_BANDS, bandedId } from "@/lib/stableId";
import type { Coupon, Store, Promocode, Affiliate } from "@/lib/types";

const SALEADS_FEED_URL = process.env.SALEADS_FEED_URL ?? "";

export function isSaleadsConfigured(): boolean {
  return Boolean(SALEADS_FEED_URL);
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
 * Парсинг фида скидок и купонов российской CPA-сети Saleads.pro (JSON / Export Feed)
 */
export function parseSaleadsPayload(jsonText: string): Coupon[] {
  try {
    const data = JSON.parse(jsonText);
    const items = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : Array.isArray(data.coupons) ? data.coupons : [];

    const coupons: Coupon[] = [];

    for (const item of items) {
      const promoCode = str(item.promocode || item.code || item.voucher).trim();
      if (!promoCode) continue;

      const rawStoreName = str(item.campaign_name || item.shop_name || item.name || item.store).trim() || "Магазин";
      const rawSlug = translit(rawStoreName) || "magazin";
      const norm = normalizeStore(rawStoreName, rawSlug, str(item.category || item.category_name));

      const storeName = norm.name;
      // Слаг зависит только от имени магазина: все купоны одного магазина
      // должны попасть на одну страницу /store/[slug]. Раньше здесь был
      // счётчик уникальности, который дробил магазин на ozon, ozon-2, ozon-3
      // (по одному на каждый купон) и разносил их по разным страницам.
      const slug = norm.categorySlug ? translit(storeName) || rawSlug : rawSlug;

      const categoryName = norm.category;
      const categorySlug = norm.categorySlug;
      const logo = str(item.logo || item.logo_url || item.image);
      const site = str(item.site || item.url || item.link);

      const store: Store = {
        // id детерминирован слагом: стабилен между рендерами и одинаков для
        // всех купонов магазина (по нему CouponGrid группирует карточки).
        // Раньше здесь была константа 80000 — все безымянные схлопывались в один.
        id: bandedId(ID_BANDS.saleadsStore, slug),
        name: storeName,
        slug,
        logo: logo || null,
        category: categoryName,
        categorySlug: categorySlug,
        about: stripHtml(item.description || item.about) || null,
        conditions: stripHtml(item.conditions || item.terms) || null,
        site,
        activeBloggers: 150,
      };

      // Детерминированный id: раньше Math.random() менял его на каждом рендере
      // (React key прыгал, статистика по купону не сходилась).
      const promoId = bandedId(
        ID_BANDS.saleadsCoupon,
        slug,
        normalizeCode(promoCode),
        num(item.id || item.promo_id),
      );
      const bonusName = str(item.title || item.name || item.discount || item.bonus).trim();
      const terms = stripHtml(item.terms || item.description || item.limitations);
      const rawDate = str(item.date_end || item.expires || item.expire_date);
      const expires = rawDate ? rawDate.slice(0, 10) : null;

      const affiliateLink = str(item.affiliate_link || item.url || item.link || item.goto_link);
      const ordMarker = str(item.erid || item.ord_marker || item.token);
      const ordText = str(item.ord_text || (item.campaign_name ? `Реклама. ${item.campaign_name}` : "Реклама."));

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
        isHit: Boolean(item.is_hit || item.hot || item.top),
        isUniversal: true,
        isFirstOrderOnly: /перв/i.test(bonusName) || /перв/i.test(terms),
        region: str(item.region || item.regions) || "RU",
        isBarcode: false,
        barcodeImage: null,
        group: "saleads",
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
    console.error("[saleads] Ошибка парсинга фида Saleads.pro:", e);
    return [];
  }
}

export async function fetchSaleadsCoupons(): Promise<Coupon[]> {
  if (!isSaleadsConfigured()) return [];

  try {
    const res = await fetch(SALEADS_FEED_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[saleads] Не удалось загрузить фид: ${res.status} ${res.statusText}`);
      return [];
    }
    const text = await res.text();
    const list = parseSaleadsPayload(text);
    console.log(`[saleads] Загружено купонов: ${list.length}`);
    return list;
  } catch (e) {
    console.error("[saleads] Ошибка запроса к фиду Saleads.pro:", e);
    return [];
  }
}
