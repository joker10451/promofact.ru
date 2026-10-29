import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * New publisher-approved Perfluence website placements for promofact.ru,
 * supplied by the publisher on 29 Oct 2026 (project: SberZdorovie / Analizy).
 * These supersede the historical PERPREGA309361 link, not the Oct24
 * telemedicine placement. Do not revive old creatives or fabricate minimum
 * order amounts not present in the new approval.
 */
const legal = 'Реклама. ООО Инновационная медицина, 115432, г.Москва, вн.тер.г. муниципальный округ Даниловский, пр-кт Андропова, д. 10, помещ. 115, ОГРН 1197746310618';
const medicalWarning = 'ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ, НЕОБХОДИМА КОНСУЛЬТАЦИЯ СПЕЦИАЛИСТА';
const expiry = "2026-11-30T23:59:59+03:00";

type Placement = {
  id: number;
  code: string;
  title: string;
  terms: string;
  audience: string;
  link: string;
  erid: string;
};

export const SBER_ANALIZY_OCT29_PLACEMENTS: readonly Placement[] = [
  {
    id: 826233201,
    code: "PERPREGA309361",
    title: "Скидка 30% на первые и все повторные анализы для беременных",
    terms: "Скидка 30% на первые и все повторные анализы для беременных по промокоду PERPREGA309361 в проекте «СберЗдоровье (Анализы)». Минимальная сумма заказа в новом согласованном размещении не указана; проверяйте условия перед оплатой. До 30 ноября 2026 года, 23:59 МСК.",
    audience: "Первые и повторные анализы для беременных",
    link: "https://sberanalizy.prfl.me/sites/t3zwt2?erid=2RanymUSyoZ",
    erid: "2RanymUSyoZ",
  },
  {
    id: 826233202,
    code: "SHD56E28",
    title: "Скидка 20% на медицинские анализы",
    terms: "Промокод SHD56E28 даёт скидку 20% на анализы в проекте «СберЗдоровье (Анализы)». Ограничения и минимальная сумма заказа не указаны в предоставленном согласованном размещении; проверяйте их перед оплатой. До 30 ноября 2026 года, 23:59 МСК.",
    audience: "Анализы · ограничения уточняются",
    link: "https://sberanalizy.prfl.me/sites/n9dpk3?erid=2RanymSxzXD",
    erid: "2RanymSxzXD",
  },
];

const store = STABLE_STORES["sberzdorovie"];

export const SBER_ANALIZY_OCT29_OFFERS: Coupon[] = SBER_ANALIZY_OCT29_PLACEMENTS.map(p => ({
  id: p.id,
  promocode: {
    id: p.id,
    code: p.code,
    bonusName: p.title,
    terms: p.terms,
    expires: expiry,
    isHit: false,
    isUniversal: false,
    isFirstOrderOnly: false,
    customerTypeLabel: p.audience,
    region: "RU",
    isBarcode: false,
    barcodeImage: null,
    group: "perfluence",
  },
  store: { ...store, activeBloggers: store.activeBloggers ?? 0 },
  affiliate: {
    link: p.link,
    landingLink: p.link,
    ordMarker: p.erid,
    ordText: `${legal} erid: ${p.erid}. ${medicalWarning}`,
  },
  extraLinks: [],
}));

/** Fail closed for stale widget/Supabase offers with the same code but old links. */
export function isApprovedOct29SberAnalizyPlacement(c: Coupon): boolean {
  if (c.store.slug !== "sberzdorovie" || c.promocode.group !== "perfluence") return false;
  const approved = SBER_ANALIZY_OCT29_OFFERS.find(x =>
    x.promocode.code.toUpperCase() === c.promocode.code.trim().toUpperCase());
  return Boolean(approved &&
    c.promocode.expires === approved.promocode.expires &&
    c.affiliate.link === approved.affiliate.link &&
    c.affiliate.landingLink === approved.affiliate.landingLink &&
    c.affiliate.ordMarker === approved.affiliate.ordMarker &&
    c.affiliate.ordText.includes(legal) &&
    c.affiliate.ordText.includes("erid: " + approved.affiliate.ordMarker) &&
    c.affiliate.ordText.includes(medicalWarning));
}
