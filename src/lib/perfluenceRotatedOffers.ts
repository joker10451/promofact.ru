import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/** Perfluence: account-approved PromoFact links copied from 14 October 2026. */
const MAGNIT_LINK = "https://mgntgm.prfl.me/sites/vjjrfu?erid=2RanynuJXUf";
const WINLAB_LINK = "https://winelab.prfl.me/sites/ujkqzr";
const M_KOSMETIK_LINK = "https://mgntksm1.prfl.me/sites/1sq4qx?erid=2Ranymz3211";
const magnit: Coupon["store"] = { ...STABLE_STORES["magnit-dostavka"], activeBloggers: STABLE_STORES["magnit-dostavka"].activeBloggers ?? 0 };
const mKosmetik: Coupon["store"] = { ...STABLE_STORES["m-kosmetik"], activeBloggers: STABLE_STORES["m-kosmetik"].activeBloggers ?? 0 };
const winlab: Coupon["store"] = { ...STABLE_STORES["winlab"], activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0 };
const magnitAd = {
  link: MAGNIT_LINK,
  landingLink: MAGNIT_LINK,
  ordMarker: "2RanynuJXUf",
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2RanynuJXUf',
};
const mKosmetikAd: Coupon["affiliate"] = {
  link: M_KOSMETIK_LINK,
  landingLink: M_KOSMETIK_LINK,
  ordMarker: "2Ranymz3211",
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2Ranymz3211',
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
 * Perfluence publisher dashboard for promofact.ru, 14 October 2026:
 * three current M.Kosmetik vouchers with a refreshed tracking URL and ERID.
 * This newer project-specific evidence supersedes the October 11 pause notice.
 * Do not imply these codes work for every user or on every product.
 */
export const M_KOSMETIK_ROTATED_OFFERS: Coupon[] = [
  offer(82548041, mKosmetik, mKosmetikAd, "Чай", "Скидка 41% по промокоду «Чай» в М.Косметик", "2026-10-22", "По условиям предложения"),
  offer(82548042, mKosmetik, mKosmetikAd, "PK4GMWJUK", "Скидка 36% по промокоду PK4GMWJUK в М.Косметик", "2026-10-31", "По условиям предложения"),
  offer(82548043, mKosmetik, mKosmetikAd, "PF21K0T5LF", "Скидка 21% по промокоду PF21K0T5LF в М.Косметик", "2026-10-31", "По условиям предложения"),
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
