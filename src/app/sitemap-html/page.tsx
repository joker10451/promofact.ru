import type { Metadata } from "next";
import Link from "next/link";
import { getStores, getCategories } from "@/lib/perfluence";
import { ARTICLES } from "@/lib/articles";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 600;

export const metadata: Metadata = {
  title: `Карта сайта — ${SITE_NAME}`,
  description:
    "Все магазины, категории и советы по экономии на одной странице. Удобная навигация по промокодам.",
  alternates: { canonical: "https://promofact.ru/sitemap-html" },
  robots: { index: true, follow: true },
};

export default async function HtmlSitemap() {
  const [stores, categories] = await Promise.all([getStores(), getCategories()]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
        Карта сайта
      </h1>
      <p className="mt-3 text-ink/60">
        Все актуальные промокоды, категории и статьи по экономии в одном месте.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-extrabold">Категории</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/category/${c.slug}`}
                className="inline-block rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-red hover:text-red transition-colors"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-extrabold">Магазины</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {stores.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/store/${s.slug}`}
                className="block rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink hover:border-red hover:text-red transition-colors"
              >
                {s.name}
                <span className="ml-2 text-ink/40">{s.coupons.length} код(ов)</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-extrabold">Советы по экономии</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ARTICLES.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/sovety/${a.slug}`}
                className="block rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink hover:border-red hover:text-red transition-colors"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
