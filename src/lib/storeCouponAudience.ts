import type { Promocode } from "@/lib/types";

/**
 * A coupon usable by everyone is not an offer exclusively for repeat customers.
 * Keep the three buckets mutually exclusive for UI counts and filters.
 */
export type CouponAudience = "first-order" | "repeat-order" | "universal" | "unknown";

export function getCouponAudience(
  promo: Pick<Promocode, "isFirstOrderOnly" | "customerTypeLabel">,
): CouponAudience {
  if (promo.isFirstOrderOnly) return "first-order";

  const label = (promo.customerTypeLabel || "").toLocaleLowerCase("ru-RU");
  // Explicit "повторный" / "постоянным клиентам" is required for this tab.
  // Mixed "первый и повторный" offers also qualify for repeat purchases.
  if (/повтор|постоянн/u.test(label)) return "repeat-order";

  // Missing eligibility is not proof the coupon is valid for everyone.
  if (/для всех|всем пользователям|любым покупателям|без ограничений на тип заказа/u.test(label)) return "universal";
  return "unknown";
}
