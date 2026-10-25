import type { Coupon } from "@/lib/types";
import { canonicalCategorySlug } from "@/lib/categoryTaxonomy";

function regionMatchesCity(region: string, city: string): boolean {
  const escaped = city.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "u").test(region);
}

export function selectGeoOffers(
  coupons: Coupon[],
  city: string,
  category?: string,
  cityNames?: { slug: string; name: string }[],
) {
  const local: Coupon[] = [];
  const offers = coupons.filter((coupon) => {
    if (category && canonicalCategorySlug(coupon.store.categorySlug) !== canonicalCategorySlug(category)) return false;
    const region = (coupon.promocode.region || "").trim().toLowerCase();
    const nationwide = !region || /^(ru|россия|вся россия|рф|вся рф)$/.test(region);
    const citySpecific = !nationwide && regionMatchesCity(region, city);
    // Регион в фиде пуст или «RU», а ограничение прописано текстом в условиях.
    const mentionedInTerms = cityNames
      ? citiesMentionedInText(coupon.promocode.terms, cityNames).includes(
          cityNames.find((c) => c.name.toLowerCase() === city.toLowerCase())?.slug ?? "",
        )
      : false;
    const localToCity = citySpecific || mentionedInTerms;
    if (localToCity) local.push(coupon);
    return nationwide || localToCity;
  });
  // Nationwide offers alone do not distinguish one city's page from another.
  return { offers, local, indexable: offers.length >= 3 && local.length > 0 };
}

/**
 * Регион означает «вся страна» (или не задан вовсе).
 * Такие акции не стоит подписывать в карточке как «· Россия»: ограничения по
 * региону у них нет, и метка только шумит. Регион печатаем лишь тогда, когда
 * предложение действительно привязано к городу/области.
 */
export function isNationwideRegion(region?: string | null): boolean {
  const normalized = (region || "").trim().toLowerCase();
  return !normalized || /^(ru|rus|россия|вся россия|рф|вся рф|russia)$/.test(normalized);
}

/**
 * Города, названные в условиях акции.
 *
 * Фид Perfluence/Admitad региональность почти не отдаёт: `region` либо пустой,
 * либо «RU», а реальное ограничение партнёр пишет текстом в условиях —
 * «Города действия по опубликованному фиду: Москва, Казань, Уфа и …».
 * Без этого разбора городские страницы выглядят клонами всероссийских,
 * и в индекс попадает только Санкт-Петербург (единственный магазин с
 * заполненным `region`).
 *
 * Возвращает только те города из `cities`, которые действительно упомянуты.
 * Совпадение по границам слова: «Уфа» не должна ловиться внутри «Уфанет».
 */
export function citiesMentionedInText(
  text: string | null | undefined,
  cities: { slug: string; name: string }[],
): string[] {
  if (!text) return [];
  const haystack = text.toLowerCase();
  const found: string[] = [];
  for (const city of cities) {
    // Дефис в названии («Ростов-на-Дону») в текстах пишут и через дефис, и через пробел.
    const pattern = city.name
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/-/g, "[-\\s]?");
    if (new RegExp(`(^|[^\\p{L}])${pattern}($|[^\\p{L}])`, "u").test(haystack)) {
      found.push(city.slug);
    }
  }
  return found;
}
