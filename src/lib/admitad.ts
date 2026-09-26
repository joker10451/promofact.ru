import {
  stripHtml,
  normalizeAdmitadCoupon,
  validateOffer,
  deduplicateOffers,
  toCoupon,
} from "@/lib/admitadNormalizer";
import type { RawAdmitadCoupon, NormalizedOffer } from "@/lib/admitadTypes";
import type { Coupon } from "@/lib/types";

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
      const desc = (body.match(/<description>(.*?)<\/description>/) || [])[1] || "";
      const discount = (body.match(/<discount>(.*?)<\/discount>/) || [])[1] || null;
      const species = (body.match(/<species>(.*?)<\/species>/) || [])[1] || "promocode";
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

export async function fetchAndParseAdmitadFeed(): Promise<Coupon[]> {
  // Admitad отключён
  return [];
}

export async function fetchAdmitadCoupons(): Promise<Coupon[]> {
  // Источник Admitad отключён — используется только Perfluence
  return [];
}
