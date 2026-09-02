import {
  stripHtml,
  normalizeAdmitadCoupon,
  validateOffer,
  deduplicateOffers,
  toCoupon,
} from "@/lib/admitadNormalizer";
import type { RawAdmitadCoupon, NormalizedOffer } from "@/lib/admitadTypes";
import type { Coupon } from "@/lib/types";
import { fetchAdmitadCouponsCached } from "@/lib/admitadSupabase";

/**
 * URL выгрузки задаётся только переменной окружения.
 *
 * Раньше здесь лежал рабочий адрес с параметром `code` и логином аккаунта —
 * в публичном репозитории это выдача доступа к фиду кому угодно. Значения
 * по умолчанию нет намеренно: без переменной источник просто отключается.
 */
const ADMITAD_FEED_URL = process.env.ADMITAD_FEED_URL ?? "";

export function isAdmitadConfigured(): boolean {
  return Boolean(ADMITAD_FEED_URL);
}

/**
 * 1. Парсинг XML выгрузки Admitad в список RAW-купонов без потерь
 * Поддерживает как компактный формат атрибутов (<coupon id="123">), так и полный теговый (<coupon><id>123</id>)
 */
export function parseRawAdmitadXml(xml: string): RawAdmitadCoupon[] {
  try {
    const campaigns = new Map<
      string,
      {
        id: number;
        name: string;
        site: string;
        categories: string[];
      }
    >();

    // Парсинг рекламодателей (поддерживает оба формата)
    const advRegex = /<advcampaign(?:\s+id="(\d+)")?>([\s\S]*?)<\/advcampaign>/g;
    let advMatch;
    while ((advMatch = advRegex.exec(xml)) !== null) {
      const body = advMatch[2];
      const idTag = (body.match(/<id>(\d+)<\/id>/) || [])[1];
      const campIdStr = advMatch[1] || idTag;
      if (!campIdStr) continue;

      const campId = parseInt(campIdStr, 10);
      const name = (body.match(/<name>(.*?)<\/name>/) || [])[1] || "";
      const site = (body.match(/<site>(.*?)<\/site>/) || [])[1] || "";

      const cats: string[] = [];
      const catRegex = /<category(?:\s+id="\d+")?>(.*?)<\/category>/g;
      let cMatch;
      while ((cMatch = catRegex.exec(body)) !== null) {
        cats.push(cMatch[1]);
      }

      campaigns.set(campIdStr, {
        id: campId,
        name: stripHtml(name),
        site: stripHtml(site),
        categories: cats,
      });
    }

    const rawCoupons: RawAdmitadCoupon[] = [];
    const couponRegex = /<coupon(?:\s+id="(\d+)")?>([\s\S]*?)<\/coupon>/g;
    let cMatch;

    while ((cMatch = couponRegex.exec(xml)) !== null) {
      const body = cMatch[2];
      const idTag = (body.match(/<id>(\d+)<\/id>/) || [])[1];
      const couponIdStr = cMatch[1] || idTag;
      if (!couponIdStr) continue;

      const id = parseInt(couponIdStr, 10);
      const campIdTag = (body.match(/<campaign_id>(\d+)<\/campaign_id>/) || [])[1];
      const advcampIdTag = (body.match(/<advcampaign_id>(\d+)<\/advcampaign_id>/) || [])[1];
      const campId = campIdTag || advcampIdTag || "";
      const camp = campaigns.get(campId);

      const promocode = (body.match(/<promocode>(.*?)<\/promocode>/) || [])[1] || null;
      const name = (body.match(/<name>(.*?)<\/name>/) || [])[1] || "";
      const shortDesc = (body.match(/<short_name>(.*?)<\/short_name>/) || [])[1] || "";
      const desc = (body.match(/<description>(.*?)<\/description>/) || [])[1] || "";
      const discount = (body.match(/<discount>(.*?)<\/discount>/) || [])[1] || null;
      const species = (body.match(/<species>(.*?)<\/species>/) || [])[1] || "promocode";
      const status = (body.match(/<status>(.*?)<\/status>/) || [])[1] || "active";
      const dateStart = (body.match(/<date_start>(.*?)<\/date_start>/) || [])[1] || null;
      const dateEnd = (body.match(/<date_end>(.*?)<\/date_end>/) || [])[1] || null;
      const gotoLink = (body.match(/<goto_link>(.*?)<\/goto_link>/) || [])[1] || "";
      const logo = (body.match(/<logo>(.*?)<\/logo>/) || [])[1] || null;
      const customerType = (body.match(/<customer_type>(.*?)<\/customer_type>/) || [])[1] || "all";

      const cats: string[] = [];
      const catRegex = /<category(?:\s+id="\d+")?>(.*?)<\/category>/g;
      let catMatch;
      while ((catMatch = catRegex.exec(body)) !== null) {
        cats.push(catMatch[1]);
      }

      rawCoupons.push({
        id,
        advcampaignId: campId,
        name: stripHtml(name),
        promocode: promocode ? promocode.trim() : "",
        gotolink: gotoLink ? gotoLink.trim() : "",
        logo: logo ? logo.trim() : "",
        dateStart,
        dateEnd,
        discount: discount ? stripHtml(discount) : "",
        customerType,
        description: stripHtml(desc),
        speciesId: species,
        types: [],
        categories: cats.length > 0 ? cats : camp?.categories || [],
        exclusive: false,
        isTakeadsCoupon: false,
        trackingPromocode: false,
        hasAffiliateLink: Boolean(gotoLink),
        rawCampaignName: camp?.name || "Магазин",
        rawCampaignSite: camp?.site || "",
      });
    }

    return rawCoupons;
  } catch (e) {
    console.error("[admitad] Ошибка парсинга XML:", e);
    return [];
  }
}

/**
 * 2. Полный цикл трансформации: RAW XML -> Normalized -> Validated -> Deduped -> Coupon[]
 */
export function parseAdmitadXml(xml: string): Coupon[] {
  const rawCoupons = parseRawAdmitadXml(xml);
  const normalized: NormalizedOffer[] = [];

  for (const raw of rawCoupons) {
    const offer = normalizeAdmitadCoupon(raw);
    if (offer && validateOffer(offer)) {
      normalized.push(offer);
    }
  }

  const deduped = deduplicateOffers(normalized);
  return deduped.map(toCoupon);
}

let admitadCache: Coupon[] | null = null;
let lastFetchTime = 0;
let pendingFetch: Promise<Coupon[]> | null = null;
// Фид Admitad ~65 МБ (52k купонов). Next.js Data Cache не хранит элементы >2 МБ,
// поэтому next.revalidate фактически не работает — реальный кэш это модульный
// admitadCache. TTL 15 мин: фид меняется разы в день, а докачка 65 МБ дорогая.
const CACHE_TTL_MS = 15 * 60 * 1000;

/** Фетч сырого фида Admitad + парсинг. Без Next-кэша: фид 65МБ не кэшируется (>2МБ), а модульный admitadCache — реальный кэш. */
export async function fetchAndParseAdmitadFeed(): Promise<Coupon[]> {
  // next.revalidate (а не no-store): держит статический пререндер /store, /category.
  // Даже если Next не закэширует 65МБ (>2МБ), роут остаётся SSG+ISR.
  const res = await fetch(ADMITAD_FEED_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "application/xml,text/xml,*/*",
    },
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`Admitad feed ${res.status} ${res.statusText}`);
  }

  const list = parseAdmitadXml(await res.text());
  console.log(`[admitad] Загружено купонов после нормализации: ${list.length}`);
  return list;
}

export async function fetchAdmitadCoupons(): Promise<Coupon[]> {
  if (!isAdmitadConfigured()) {
    // Громко, а не молча: без переменной купоны Admitad пропадут с витрины,
    // и по тихому пустому массиву причину не найти.
    console.warn(
      "[admitad] ADMITAD_FEED_URL не задан — источник отключён, купоны Admitad не загружаются",
    );
    return [];
  }

  const now = Date.now();
  if (admitadCache && now - lastFetchTime < CACHE_TTL_MS) {
    return admitadCache;
  }

  if (pendingFetch) {
    return pendingFetch;
  }

  pendingFetch = (async () => {
    try {
      // Сначала маленький РУ-кэш из Supabase — холодный старт не качает 65МБ.
      const cached = await fetchAdmitadCouponsCached();
      if (cached.length > 0) {
        console.log(`[admitad] Используем Supabase-кэш (${cached.length} купонов)`);
        admitadCache = cached;
        lastFetchTime = Date.now();
        return cached;
      }

      const list = await fetchAndParseAdmitadFeed();
      admitadCache = list;
      lastFetchTime = Date.now();
      return list;
    } catch (e) {
      console.error("[admitad] Ошибка загрузки фида/кэша:", e);
      return admitadCache || [];
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}
