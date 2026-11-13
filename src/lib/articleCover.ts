import type { ArticleLink } from "@/lib/articles";

export type ArticleCoverFacts = {
  /** Магазин, о котором статья: единственная ссылка на /store/<slug>, чьё имя — предмет заголовка. */
  store: { slug: string; name: string } | null;
  /** Главная выгода из заголовка («−50%», «до 30%», «10–20%», «1 500 ₽») или null. */
  benefit: string | null;
};

const STORE_HREF = /^\/store\/([a-z0-9-]+)\/?(?:[#?].*)?$/;
// Только из заголовка: в описаниях встречаются цены («стикер за 850 ₽»), а не скидки.
// Диапазон «10–20%» берётся целиком; ASCII-дефис — только разделитель диапазона, не минус.
const BENEFIT = /(?:до\s)?(?:\d[\d\s ]*[–-]\s?)?−?\d[\d\s ]*\s?(?:%|₽)/gi;
// Призовой фонд розыгрыша — не скидка читателю.
const NOT_A_DISCOUNT = /розыгрыш|приз/i;

const storeName = (r: ArticleLink) => r.text.replace(/^(все\s+)?(промокоды|скидки|акции)\s+/i, "").trim();
// Окончания отбрасываем, чтобы «Яндекс Лавка» нашлась в «Промокоды Яндекс Лавки».
const stems = (s: string) =>
  s.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter(Boolean).map((w) => (w.length > 4 ? w.slice(0, -2) : w));

function pickBenefit(title: string): string | null {
  if (NOT_A_DISCOUNT.test(title)) return null;
  for (const m of title.matchAll(BENEFIT)) {
    // «30 дней за 1 ₽» — цена, а не выгода.
    if (/за\s$/i.test(title.slice(0, m.index))) continue;
    return m[0].replace(/[\s ]+/g, " ").trim();
  }
  return null;
}

export function articleCoverFacts(title: string, related: ArticleLink[] = []): ArticleCoverFacts {
  // Предмет статьи — часть до двоеточия: «Лайфхаки на маркетплейсах: Ozon, WB, Мегамаркет»
  // не про Мегамаркет, а «Промокоды Туту: отели, туры…» — про Туту.
  const subject = title.split(":")[0].toLowerCase();
  const matches = related.filter((r) => {
    if (!STORE_HREF.test(r.href)) return false;
    const words = stems(storeName(r));
    return words.length > 0 && words.every((w) => subject.includes(w));
  });
  const slugs = new Set(matches.map((r) => r.href.match(STORE_HREF)?.[1]));
  // Статья про несколько магазинов — логотип одного из них ввёл бы в заблуждение.
  const link = slugs.size === 1 ? matches[0] : undefined;
  const slug = link?.href.match(STORE_HREF)?.[1];
  return {
    store: slug && link ? { slug, name: storeName(link) || slug } : null,
    benefit: pickBenefit(title),
  };
}
