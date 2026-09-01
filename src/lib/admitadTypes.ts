/**
 * Типы данных для многослойного конвейера Admitad:
 * RAW Import → Normalizer → Validator → Deduplicator → UI
 */

/**
 * 1. RAW-структура купона напрямую из XML/API Admitad
 */
export interface RawAdmitadCoupon {
  id: number;
  advcampaignId: string;
  name: string;
  promocode: string;
  gotolink: string;
  logo: string;
  dateStart: string | null;
  dateEnd: string | null;
  discount: string;
  customerType: string;
  description: string;
  speciesId: string;
  types: string[];
  categories: string[];
  exclusive: boolean;
  isTakeadsCoupon: boolean;
  trackingPromocode: boolean;
  hasAffiliateLink: boolean;
  rawCampaignName?: string;
  rawCampaignSite?: string;
  rawCategoryId?: string;
}

/**
 * 2. Типы предложений и единицы скидки
 */
export type OfferType =
  | "promo" // С промокодом
  | "action" // Без промокода (прямая скидка)
  | "gift" // Подарок к заказу
  | "free_shipping" // Бесплатная доставка
  | "subscription" // Пробный период / подписка
  | "cashback" // Кэшбэк / бонусы
  | "unknown";

export type DiscountUnit = "percent" | "rub" | "bonus" | "gift" | "shipping" | "subscription" | "none";

export type CustomerType = "all_customers" | "new_customers" | "repeat_customers";

export interface MinimumOrder {
  value: number;
  currency: string;
}

export interface NormalizedDiscount {
  value: number | null;
  unit: DiscountUnit;
  formatted: string; // e.g. "−55%", "−1 050 ₽"
}

/**
 * 3. Нормализованная структура оффера для каталога и БД
 */
export interface NormalizedOffer {
  id: number;
  admitadId: string;
  campaignId: string;
  store: {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    category: string;
    categorySlug: string;
    site: string;
  };
  type: OfferType;
  discount: NormalizedDiscount | null;
  gift?: string | null;
  minimumOrder?: MinimumOrder | null;
  title: string;
  shortDescription: string;
  fullDescription: string;
  promoCode: string | null;
  ctaText: string;
  customerType: CustomerType;
  customerTypeLabel: string; // "Первый заказ" | "Для всех" | "Первый и повторный заказ" | "Условия заказа"
  dateStart: string | null;
  dateEnd: string | null;
  isHit: boolean;
  isUniversal: boolean;
  isPersonal: boolean;
  affiliate: {
    url: string;
    ordMarker: string;
    ordText: string;
  };
  status: "active" | "expired";
}
