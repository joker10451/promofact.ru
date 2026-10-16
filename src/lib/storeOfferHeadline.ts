import { isRealPromoCode } from "@/lib/dedupe";

/** Search metadata distinguishes online codes, checkout barcodes and code-free deals. */
export function getStoreHeadlineOfferCounts(coupons: readonly { promocode: { code: string | null | undefined; isBarcode?: boolean } }[]) {
  const offers = coupons.length;
  const barcodes = coupons.filter((coupon) => coupon.promocode.isBarcode && isRealPromoCode(coupon.promocode.code)).length;
  const codes = coupons.filter((coupon) => !coupon.promocode.isBarcode && isRealPromoCode(coupon.promocode.code)).length;
  const codeFree = offers - codes - barcodes;
  return { offers, codes, codeFree, barcodes };
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const lastTwo = Math.abs(n) % 100;
  const last = lastTwo % 10;
  return lastTwo >= 11 && lastTwo <= 14
    ? many
    : last === 1 ? one : last >= 2 && last <= 4 ? few : many;
}

export function formatStoreOfferCounts(codes: number, codeFree: number, barcodes = 0): string {
  const codeText = codes > 0 ? `${codes} ${pluralRu(codes, "промокод", "промокода", "промокодов")}` : "";
  const dealText = codeFree > 0 ? `${codeFree} ${pluralRu(codeFree, "акция", "акции", "акций")}` : "";
  const barcodeText = barcodes > 0 ? `${barcodes} ${pluralRu(barcodes, "штрихкод", "штрихкода", "штрихкодов")}` : "";
  return [codeText, barcodeText, dealText].filter(Boolean).join(" и ");
}

export function formatStoreOfferTitle(options: {
  name: string;
  month: string;
  codes: number;
  codeFree: number;
  barcodes?: number;
  maxDiscount?: string | null;
  searchBrandPromo?: boolean;
}): string {
  const { name, month, codes, codeFree, barcodes = 0, maxDiscount, searchBrandPromo } = options;
  const total = codes + codeFree + barcodes;
  if(total <= 0) return `Скидки и акции ${name} на ${month}`;
  const counts = formatStoreOfferCounts(codes,codeFree,barcodes);
  if (barcodes > 0) return `Промокоды и штрихкоды ${name} на ${month}: ${counts}`;
  if(codeFree === 0) {
    if(searchBrandPromo) return `Промокод ${name} на ${month}: ${counts}`;
    return maxDiscount
      ? `Промокоды ${name} на ${month}: ${maxDiscount}, ${counts}`
      : `Промокоды ${name} на ${month}: ${counts}`;
  }
  if(codes === 0) return `Акции ${name} на ${month}: ${counts}`;
  return `Промокоды и акции ${name} на ${month}: ${counts}`;
}

/**
 * High-intent store titles avoid truncation and only count actually entered
 * promo codes. No claim of first-order eligibility, savings or free delivery
 * is inferred from the search query alone.
 */
export function formatPriorityStoreTitle({
  slug, month, codes, codeFree,
}: {
  slug: string; month: string; codes: number; codeFree: number;
}): string | null {
  if (codes + codeFree <= 0) return null;
  const counts = formatStoreOfferCounts(codes, codeFree);
  switch (slug) {
    case "tasty-coffee": return `Tasty Coffee: ${counts} — ${month}`;
    case "randewoo": return `Randewoo: ${counts}`;
    case "yandeks-puteshestviya": return `Яндекс Путешествия: ${counts}`;
    case "pyaterochka": return codes > 0
      ? `Промокоды Пятёрочки Доставка: ${counts}`
      : `Акции Пятёрочки Доставка: ${counts}`;
    case "yandex-eda": return codes > 0
      ? `Промокоды Яндекс Еда: ${counts}`
      : `Акции Яндекс Еда: ${counts}`;
    default: return null;
  }
}
