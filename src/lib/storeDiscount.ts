/**
 * Strictly derive an advertised discount from coupon titles.
 * An order minimum ("при заказе от 2 449 ₽") is NOT a saving.
 * Do not infer a monetary saving from gifts, cashback or an unlabeled sum.
 */
type DiscountCoupon = { promocode: { bonusName: string | null; terms?: string | null } };

const AMOUNT = String.raw`(\d[\d\s\u00a0\u202f]*(?:[.,]\d+)?)`;
const CURRENCY = String.raw`(?:₽|руб(?:л[еяй]*)?\.?)`;
const DISCOUNT_FIRST = new RegExp(
  String.raw`скидк[а-яё]*\s*(?:(?:до|на|в\s+размере|в)\s*)?(?:[-−]\s*)?${AMOUNT}\s*(%|${CURRENCY})`,
  "iu",
);
const DISCOUNT_LAST = new RegExp(
  String.raw`${AMOUNT}\s*(%|${CURRENCY})\s*скидк[а-яё]*`,
  "iu",
);
const PERCENT = /(?:^|[^\d])(?:[-−]\s*)?(\d{1,3}(?:[.,]\d+)?)\s*%/u;
const NON_DISCOUNT_BONUS = /подар|кэшбэк|кешбэк|балл[а-яё]*|бонусн[а-яё]*/iu;

function parseAmount(value: string): number {
  return Number(value.replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
}

export function getMaxVerifiedDiscount(coupons: readonly DiscountCoupon[]): string | null {
  let percent = 0;
  let rubles = 0;

  for (const coupon of coupons) {
    const title = coupon.promocode.bonusName || "";
    const explicit = title.match(DISCOUNT_FIRST);
    const reversed = title.match(DISCOUNT_LAST);
    // "при заказе от 2 449 ₽ скидка" describes a minimum, not 2 449 ₽ saved.
    const safeReversed =
      reversed && !/\bот\s*$/iu.test(title.slice(0, reversed.index));

    let match = explicit || (safeReversed ? reversed : null);
    // A simple "-15%" or "до 15%" is a discount if not presented as a gift/cashback.
    if (!match && !NON_DISCOUNT_BONUS.test(title)) {
      match = title.match(PERCENT);
    }

    if (!match) continue;
    const value = parseAmount(match[1]);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (match[2] === "%" || (!match[2] && match[0].includes("%"))) {
      if (value <= 100) percent = Math.max(percent, value);
    } else {
      rubles = Math.max(rubles, value);
    }
  }

  if (percent > 0) return `до ${percent.toLocaleString("ru-RU")}%`;
  if (rubles > 0) return `до ${rubles.toLocaleString("ru-RU")} ₽`;
  return null;
}

export function hasGiftOffer(coupons: readonly DiscountCoupon[]): boolean {
  return coupons.some((c) =>
    /подар|бесплатн[а-яё]*\s+(?:товар|блюдо|ролл|десерт)/iu.test(
      `${c.promocode.bonusName || ""} ${c.promocode.terms || ""}`,
    ),
  );
}
