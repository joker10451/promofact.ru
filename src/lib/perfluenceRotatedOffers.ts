import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/** Perfluence: account-approved PromoFact links copied from 14 October 2026. */
const MAGNIT_LINK = "https://mgntgm.prfl.me/sites/vjjrfu?erid=2RanynuJXUf";
const WINLAB_LINK = "https://winelab.prfl.me/sites/ujkqzr";
const magnit = STABLE_STORES["magnit-dostavka"];
const winlab = STABLE_STORES["winlab"];
const magnitAd = {
  link: MAGNIT_LINK,
  landingLink: MAGNIT_LINK,
  ordMarker: "2RanynuJXUf",
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanynuJXUf',
};
const winlabAd = {
  link: WINLAB_LINK,
  landingLink: WINLAB_LINK,
  ordMarker: "",
  ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+. Токен erid для новой ссылки не предоставлен.",
};

function offer(
  id: number, store: Coupon["store"], affiliate: Coupon["affiliate"],
  code: string, bonusName: string, expires: string,
  customerTypeLabel: string,
): Coupon {
  return {
    id,
    promocode: {
      id, code, bonusName,
      terms: "Срок, ассортимент и применимость уточняйте при оформлении в приложении или на сайте рекламодателя.",
      expires, isHit: false, isUniversal: false, isFirstOrderOnly: false,
      customerTypeLabel, region: "RU", isBarcode: false, barcodeImage: null,
      group: "perfluence",
    },
    store, affiliate, extraLinks: [],
  };
}

export const MAGNIT_ROTATED_OFFERS: Coupon[] = [
  offer(82580141, magnit, magnitAd, "25GFC1TL4", "Скидка 31% в приложении Магнит", "2026-10-31", "По условиям акции"),
  offer(82580142, magnit, magnitAd, "SGPFB7JJGY", "Скидка 26% в приложении Магнит", "2026-10-31", "По условиям акции"),
  offer(82580143, magnit, magnitAd, "Чай", "Промокод «Чай» в приложении Магнит", "2026-10-20", "По условиям акции"),
];

/**
 * The provided WinLab placement has no ERID. Keep codes in staging until a
 * current advertising token is confirmed; never silently reuse an old token.
 * WinLab is also prohibited from joint promotions with Ukids.
 */
export const WINLAB_ROTATED_OFFERS_PENDING_ERID: Coupon[] = [
  offer(81409141, winlab, winlabAd, "10PFNS5229", "Скидка 10% в ВинЛаб", "2026-10-31", "18+"),
  offer(81409142, winlab, winlabAd, "WCPFOKT4737", "Скидка 10% в ВинЛаб", "2026-10-21", "18+"),
  offer(81409143, winlab, winlabAd, "5OKTPF4737", "Скидка 5% в ВинЛаб", "2026-10-21", "18+"),
];
