import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Site-specific, approved promofact.ru placements copied from Perfluence on
 * 16 October 2026; FMART placement rotated on 18 October 2026.
 * These override the older public widget URL/ERID.
 * The stated amounts are campaign labels, NOT unconditional savings on a cart.
 */
export const PERFLUENCE_OCT16_PLACEMENTS = {
  librederm: {
    slug: "librederm",
    link: "https://librederm2.prfl.me/sites/c3odgh?erid=2Ranykbrdpf",
    erid: "2Ranykbrdpf",
    legal: 'Реклама. ООО "БИОФАРМРУС" ИНН 5036098060 erid: 2Ranykbrdpf',
  },
  fmart: {
    slug: "fmart",
    link: "https://fmart-flowers.prfl.me/sites/283ede?erid=2Ranynyf7r3",
    erid: "2Ranynyf7r3",
    legal: 'Реклама. ООО "ФМАРТ" ОГРН 1237700524060 г. Москва erid: 2Ranynyf7r3',
  },
  letual: {
    slug: "letual",
    link: "https://letu.prfl.me/sites/939ser?erid=2RanykoiY5R",
    erid: "2RanykoiY5R",
    legal: "Реклама. Рекламодатель ООО «Алькор и Ко», ИНН 7729265128 erid: 2RanykoiY5R",
  },
  sberdevaysy: {
    slug: "sberdevaysy",
    link: "https://sberdevaysy1.prfl.me/sites/fq4aly?erid=2RanymNsVkw",
    erid: "2RanymNsVkw",
    legal: "Реклама. Рекламодатель — ООО «САЛЮТДЕВАЙСЫ», ИНН: 7730253720. erid: 2RanymNsVkw",
  },
} as const;

const oct16Store = (slug: keyof typeof PERFLUENCE_OCT16_PLACEMENTS): Coupon["store"] => {
  const meta = STABLE_STORES[slug];
  return { ...meta, activeBloggers: meta.activeBloggers ?? 0 };
};

function offer(
  id: number,
  placement: "librederm" | "fmart" | "letual",
  code: string,
  bonusName: string,
  terms: string,
  expires: string,
): Coupon {
  const ref = PERFLUENCE_OCT16_PLACEMENTS[placement];
  return {
    id,
    promocode: {
      id,
      code,
      bonusName,
      terms,
      expires,
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "По условиям акции",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: oct16Store(placement),
    affiliate: {
      link: ref.link,
      landingLink: ref.link,
      ordMarker: ref.erid,
      ordText: ref.legal,
    },
    extraLinks: [],
  };
}

/**
 * No new order minimums, qualifying product lists or coupon stacking rules
 * were supplied on 16 Oct. Never inherit such details from a stale widget
 * where programme conditions or campaign dates may have rotated.
 */
export const PERFLUENCE_OCT16_APPROVED_OFFERS: Coupon[] = [
  offer(
    82638071, "librederm", "PC078BC488BA",
    "Скидка 20% на Librederm на Ozon",
    "Промокод PC078BC488BA — скидка 20% на Librederm на Ozon по условиям проекта. Участвующие товары, сочетание с другими скидками и итоговую стоимость уточняйте перед оплатой.",
    "2026-10-31T23:59:59+03:00",
  ),
    offer(
    82645795, "fmart", "FMART30",
    "Флеш-акция: скидка 30% на цветы и подарки в FMART",
    "Скидка 30% на первый или один повторный заказ в FMART by flowwow (максимальная сумма скидки 700 ₽). Не суммируется с другими промокодами и сертификатами. Действует только с 23 по 26 октября 2026 года до 23:59.",
    "2026-10-26T23:59:59+03:00",
  ),
  offer(
    82645791, "fmart", "FMARTPE23khl6x",
    "Скидка 23% на букеты в FMART by flowwow",
    "Промокод FMARTPE23khl6x: скидка 23% на первый или один повторный заказ букетов от 3 000 ₽ в FMART by flowwow. Действует до 31 октября 2026 года до 23:59.",
    "2026-10-31T23:59:59+03:00",
  ),
  offer(
    82645792, "fmart", "FMARTPE900btr9u",
    "Скидка 900 ₽ от 4 000 ₽ в FMART by flowwow",
    "Промокод FMARTPE900btr9u: скидка 900 ₽ на первый или один повторный заказ от 4 000 ₽ в FMART by flowwow. Действует до 31 октября 2026 года до 23:59.",
    "2026-10-31T23:59:59+03:00",
  ),
  offer(
    82645794, "fmart", "fmartpe2063dcr",
    "Скидка 20% в FMART by flowwow",
    "Промокод fmartpe2063dcr: скидка 20% по условиям акции. Ограничения, минимальный чек и возможность повторного применения уточняйте при заказе.",
    "2026-10-31T23:59:59+03:00",
  ),
  offer(
    82602661, "letual", "НАБЕРИ",
    "Промокод «НАБЕРИ» — предложение до 20 000 ₽ в ЛЭТУАЛЬ",
    "Для кода НАБЕРИ в одобренной публикации указано предложение на 20 000 ₽. Это не скидка 20 000 ₽ на любой заказ: пороги корзины, размер фактической выгоды и исключения необходимо проверить на сайте ЛЭТУАЛЬ.",
    "2026-10-31T23:59:59+03:00",
  ),
  offer(
    82602662, "letual", "ШАНС",
    "Промокод «ШАНС» — скидка 3 000 ₽ от 7 000 ₽ в ЛЭТУАЛЬ",
    "Промокод ШАНС: скидка 3 000 ₽ при заказе от 7 000 ₽ на первый и все повторные заказы в ЛЭТУАЛЬ. Промокод УДАЧА отключен и заменён на ШАНС с 27 октября 2026 года.",
    "2026-11-30T23:59:59+03:00",
  ),
  offer(
    82602663, "letual", "ОКТЯБРЬ",
    "Промокод «ОКТЯБРЬ» в ЛЭТУАЛЬ",
    "Промокод ОКТЯБРЬ подтверждён для одобренной публикации до 31 октября. Размер скидки/бонуса и другие ограничения не указаны — проверьте результат применения перед оплатой.",
    "2026-10-31T23:59:59+03:00",
  ),
];

/** Approved placement for all four brands, including the two existing SberDevices codes. */
export const PERFLUENCE_OCT16_CODES: Record<keyof typeof PERFLUENCE_OCT16_PLACEMENTS, readonly string[]> = {
  librederm: ["PC078BC488BA"],
  fmart: ["FMART30", "FMARTPE23khl6x", "FMARTPE900btr9u", "fmartpe2063dcr"],
  letual: ["НАБЕРИ", "ШАНС", "ОКТЯБРЬ"],
  sberdevaysy: ["Sberdv171", "Sberdv71"],
};

/**
 * Fail closed: stale Perfluence snapshots, old ERIDs or even new undescribed
 * codes cannot override the user's CURRENT approved publisher placement.
 */
export function isApprovedOct16PublisherOffer(c: Coupon): boolean {
  const slug = c.store.slug as keyof typeof PERFLUENCE_OCT16_PLACEMENTS;
  const ref = PERFLUENCE_OCT16_PLACEMENTS[slug];
  if (!ref) return true;
  const codes: readonly string[] = PERFLUENCE_OCT16_CODES[slug];
  return codes.includes(c.promocode.code.trim()) &&
    c.affiliate.link === ref.link &&
    c.affiliate.ordMarker === ref.erid &&
    c.affiliate.ordText.includes("erid: " + ref.erid);
}
