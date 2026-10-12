import { isRealPromoCode } from "@/lib/dedupe";

/** Search metadata must distinguish entered codes from code-free deals. */
export function getStoreHeadlineOfferCounts(coupons: readonly { promocode: { code: string | null | undefined } }[]) {
  const offers = coupons.length;
  const codes = coupons.filter((coupon) => isRealPromoCode(coupon.promocode.code)).length;
  const codeFree = offers - codes;
  return { offers, codes, codeFree };
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const lastTwo = Math.abs(n) % 100;
  const last = lastTwo % 10;
  return lastTwo >= 11 && lastTwo <= 14
    ? many
    : last === 1 ? one : last >= 2 && last <= 4 ? few : many;
}

export function formatStoreOfferCounts(codes: number, codeFree: number): string {
  const codeText = codes > 0 ? `${codes} ${pluralRu(codes, "промокод", "промокода", "промокодов")}` : "";
  const dealText = codeFree > 0 ? `${codeFree} ${pluralRu(codeFree, "акция", "акции", "акций")}` : "";
  return [codeText, dealText].filter(Boolean).join(" и ");
}

export function formatStoreOfferTitle(options: {
  name: string;
  month: string;
  codes: number;
  codeFree: number;
  maxDiscount?: string | null;
  searchBrandPromo?: boolean;
}): string {
  const { name, month, codes, codeFree, maxDiscount, searchBrandPromo } = options;
  const total = codes + codeFree;
  if(total <= 0) return `Скидки и акции ${name} на ${month}`;
  const counts = formatStoreOfferCounts(codes,codeFree);
  if(codeFree === 0) {
    if(searchBrandPromo) return `Промокод ${name} на ${month}: ${counts}`;
    return maxDiscount
      ? `Промокоды ${name} на ${month}: ${maxDiscount}, ${counts}`
      : `Промокоды ${name} на ${month}: ${counts}`;
  }
  if(codes === 0) return `Акции ${name} на ${month}: ${counts}`;
  return `Промокоды и акции ${name} на ${month}: ${counts}`;
}
