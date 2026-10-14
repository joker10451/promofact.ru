import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/** Perfluence: account-approved PromoFact links copied from 14 October 2026. */
const MAGNIT_LINK = "https://mgntgm.prfl.me/sites/vjjrfu?erid=2RanynuJXUf";
const WINLAB_LINK = "https://winelab.prfl.me/sites/ujkqzr";
const M_KOSMETIK_LINK = "https://mgntksm1.prfl.me/sites/1sq4qx?erid=2Ranymz3211";
const CITYDRIVE_FIRST_LINK = "https://citydrive.prfl.me/sites/tnp7jq?erid=2Ranykexfns";
const CITYDRIVE_APP_LINK = "https://citydrive.prfl.me/sites/pqng58?erid=2RanykbzhEB";
const magnit: Coupon["store"] = { ...STABLE_STORES["magnit-dostavka"], activeBloggers: STABLE_STORES["magnit-dostavka"].activeBloggers ?? 0 };
const mKosmetik: Coupon["store"] = { ...STABLE_STORES["m-kosmetik"], activeBloggers: STABLE_STORES["m-kosmetik"].activeBloggers ?? 0 };
const winlab: Coupon["store"] = { ...STABLE_STORES["winlab"], activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0 };
const citydrive: Coupon["store"] = { ...STABLE_STORES.citydrive, activeBloggers: STABLE_STORES.citydrive.activeBloggers ?? 0 };
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
const citydriveLegal = "Реклама. Рекламодатель: ООО «НТС», Москва, вн. тер. г. м. о. Филевский парк, пр-д Береговой, д. 5А, к. 1, помещ. 1/13. ИНН 7704314221, ОГРН 1157746368999, citydrive.ru — «Ситидрайв» сервис аренды автомобилей. 0+";
const citydriveFirstAd: Coupon["affiliate"] = {
  link: CITYDRIVE_FIRST_LINK,
  landingLink: CITYDRIVE_FIRST_LINK,
  ordMarker: "2Ranykexfns",
  ordText: `${citydriveLegal} erid: 2Ranykexfns`,
};
const citydriveAppAd: Coupon["affiliate"] = {
  link: CITYDRIVE_APP_LINK,
  landingLink: CITYDRIVE_APP_LINK,
  ordMarker: "2RanykbzhEB",
  ordText: `${citydriveLegal} erid: 2RanykbzhEB`,
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
  terms = "Срок, ассортимент и применимость уточняйте при оформлении в приложении или на сайте рекламодателя.",
  firstOrderOnly = false,
): Coupon {
  return {
    id,
    promocode: {
      id, code, bonusName,
      terms,
      expires, isHit: false, isUniversal: false, isFirstOrderOnly: firstOrderOnly,
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
 * Two distinct publisher-approved Citydrive placements, Perfluence account
 * for promofact.ru (October 2026). Do not swap their ERIDs or tracking URLs.
 * PERFCITY107 is the approved FIRST RIDE + OZON certificate placement.
 * The other 3 belong to the separate "Citydrive app" placement.
 * Exact limitations for SAVE1480 / 1500DRIVE202 / BACK163 were not supplied.
 */
export const CITYDRIVE_APPROVED_OFFERS: Coupon[] = [
  offer(81483071, citydrive, citydriveFirstAd, "PERFCITY107",
    "Первая поездка в Ситидрайв с сертификатом OZON", "2026-10-31",
    "Только первая поездка",
    "Оформите первую поездку в Ситидрайв по условиям согласованной акции, чтобы получить сертификат OZON. Размер сертификата, допустимые тарифы и порядок выдачи уточняйте у рекламодателя. Промокод действует до 31 октября 2026 года.",
    true),
  offer(81483072, citydrive, citydriveAppAd, "SAVE1480",
    "Скидка 50% в приложении Ситидрайв", "2026-10-31",
    "По условиям акции",
    "Промокод SAVE1480: заявлена скидка 50%. Тарифы, максимальную скидку и применимость проверяйте в приложении Ситидрайв перед поездкой. Действует до 31 октября 2026 года."),
  offer(81483073, citydrive, citydriveAppAd, "1500DRIVE202",
    "Скидка 1 500 ₽ в приложении Ситидрайв", "2026-10-31",
    "По условиям акции",
    "Промокод 1500DRIVE202: заявлена скидка 1 500 ₽. Неизвестны минимальная стоимость, подходящие поездки и иные ограничения — уточняйте условия в приложении. Действует до 31 октября 2026 года."),
  offer(81483074, citydrive, citydriveAppAd, "BACK163",
    "Промокод BACK163 для Ситидрайв", "2026-10-31",
    "По условиям акции",
    "Промокод BACK163 указан в согласованном размещении Ситидрайв. Размер бонуса не предоставлен. Проверьте доступный бонус и ограничения в приложении до поездки. Действует до 31 октября 2026 года."),
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
