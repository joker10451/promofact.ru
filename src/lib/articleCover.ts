import type { ArticleLink } from "@/lib/articles";

export type ArticleCoverFacts = {
  /** Магазин, о котором статья: ссылка на /store/<slug>, чьё имя есть в заголовке. */
  store: { slug: string; name: string } | null;
  /** Главная выгода из заголовка («−50%», «до 30%», «1 500 ₽») или null. */
  benefit: string | null;
};

const STORE_HREF = /^\/store\/([a-z0-9-]+)\/?(?:[#?].*)?$/;
// Только из заголовка: в описаниях встречаются цены («стикер за 850 ₽»), а не скидки.
const BENEFIT = /(?:до\s)?[−-]?\d[\d\s ]*\s?(?:%|₽)/i;

const storeName = (r: ArticleLink) => r.text.replace(/^(все\s+)?(промокоды|скидки|акции)\s+/i, "").trim();
// Окончания отбрасываем, чтобы «Яндекс Лавка» нашлась в «Промокоды Яндекс Лавки».
const stems = (s: string) =>
  s.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter(Boolean).map((w) => (w.length > 4 ? w.slice(0, -2) : w));

export function articleCoverFacts(title: string, related: ArticleLink[] = []): ArticleCoverFacts {
  const t = title.toLowerCase();
  // Логотип — только если магазин назван в заголовке: иначе первая ссылка
  // из перелинковки выдавала бы подборку за статью про один магазин.
  const link = related.find((r) => {
    if (!STORE_HREF.test(r.href)) return false;
    const words = stems(storeName(r));
    return words.length > 0 && words.every((w) => t.includes(w));
  });
  const slug = link?.href.match(STORE_HREF)?.[1];
  const benefit = title.match(BENEFIT)?.[0].replace(/[\s ]+/g, " ").trim() ?? null;
  return {
    store: slug && link ? { slug, name: storeName(link) || slug } : null,
    benefit,
  };
}
