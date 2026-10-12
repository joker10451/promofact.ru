import { isRealPromoCode } from "./dedupe";

export type OfferSchemaInput = {
  code?: string | null;
  bonusName?: string | null;
  expires?: string | null;
};

export function getOfferDisplayName(storeName: string, offer: OfferSchemaInput): string {
  if (offer.bonusName?.trim()) return offer.bonusName.trim();
  const code = offer.code?.trim() || "";
  return isRealPromoCode(code) ? `Промокод ${code}` : `Акция ${storeName}`;
}

export function getOfferSchema(storeName: string, href: string, offer: OfferSchemaInput): Record<string, unknown> {
  const code = offer.code?.trim() || "";
  const valid = isRealPromoCode(code);
  const expires = offer.expires?.trim() || "";
  const base = {
    "@context": "https://schema.org",
    "@type": valid ? "Coupon" : "Offer",
    name: getOfferDisplayName(storeName, offer),
    description: offer.bonusName?.trim() || storeName,
    url: href,
    seller: { "@type": "Organization", name: storeName },
  };
  if (!valid) return {
    ...base,
    category: "Акция",
    availability: "https://schema.org/InStock",
    ...(expires ? { priceValidUntil: expires } : {}),
  };
  return {
    ...base,
    discountCode: code,
    category: "Промокод",
    ...(expires ? { validThrough: expires } : {}),
    offers: {
      "@type": "Offer",
      url: href,
      ...(expires ? { priceValidUntil: expires } : {}),
      availability: "https://schema.org/InStock",
    },
  };
}
