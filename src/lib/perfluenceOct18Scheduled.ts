import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Only publisher-approved, platform-specific links may be advertised on
 * promofact.ru. The Perfluence public widget currently retains an older
 * smart_zakupka URL for VkusVill, and Flor2u is not approved for this site.
 * Source: approved website placement supplied October 18, 2026.
 */
export const VKUSVILL_OCT18_SITE_LINK = "https://vksvl.prfl.me/sites/ni6chn?erid=2RanyncweGj";
export const VKUSVILL_OCT18_ERID = "2RanyncweGj";
export const VKUSVILL_OCT18_LEGAL = "Реклама. АО ВкусВилл, ОГРН 1217700253671. Подробности на сайте vkusvill.ru erid: 2RanyncweGj";
export const VKUSVILL_OCT18_VALID_CODES = [
  "VSTCLCZ", "30V8RX3X", "VSYGG5G", "VSDJR76", "35VEM5EY",
] as const;

const conditions = [
  ["VSTCLCZ", 600, 3000],
  ["30V8RX3X", 300, 1500],
  ["VSYGG5G", 250, 1250],
  ["VSDJR76", 200, 1000],
  ["35VEM5EY", 350, 2500],
] as const;

export const VKUSVILL_OCT18_SITE_OFFERS: Coupon[] = conditions.map(([code, discount, minimum], index) => {
  const id = 827134100 + index;
  const money = (value: number) => value.toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  return {
    id,
    promocode: {
      id,
      code,
      bonusName: `Скидка ${money(discount)} ₽ на первую покупку во ВкусВилле`,
      terms: `Для первой покупки. В сохранённом фиде Perfluence указан минимальный заказ от ${money(minimum)} ₽. Участвующие товары, совместимость с акциями и итоговую скидку проверяйте перед оплатой.`,
      expires: "2026-10-31T23:59:59+03:00",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vkusvill-dostavka"],
      activeBloggers: STABLE_STORES["vkusvill-dostavka"].activeBloggers ?? 0,
    },
    affiliate: {
      link: VKUSVILL_OCT18_SITE_LINK,
      landingLink: VKUSVILL_OCT18_SITE_LINK,
      ordMarker: VKUSVILL_OCT18_ERID,
      ordText: VKUSVILL_OCT18_LEGAL,
    },
    extraLinks: [],
  };
});

/** Fail-closed for stale widget links or coupons published to another platform. */
export function isApprovedOct18WebsitePlacement(c: Coupon): boolean {
  if (c.store.slug === "flor2u") {
    // Flor2u: smart_zakupka approved, promofact.ru still under review.
    return false;
  }
  if (c.store.slug !== "vkusvill-dostavka") return true;
  return VKUSVILL_OCT18_VALID_CODES.includes(c.promocode.code.trim() as typeof VKUSVILL_OCT18_VALID_CODES[number]) &&
    c.affiliate.link === VKUSVILL_OCT18_SITE_LINK &&
    c.affiliate.ordMarker === VKUSVILL_OCT18_ERID &&
    c.affiliate.ordText.includes("erid: " + VKUSVILL_OCT18_ERID);
}
