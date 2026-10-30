import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getStores, getCategories } from "@/lib/perfluence";
import { getArticles } from "@/lib/articles";
import { ACTIONS } from "@/lib/actions";
import { COLLECTIONS } from "@/lib/collections";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { SITE_URL } from "@/lib/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: `Карта сайта — все магазины, акции и гиды`,
  description:
    "Полная карта сайта ПромоФакт: промокоды магазинов, тематические подборки 11.11 и Чёрной Пятницы, категории и советы по экономии.",
  alternates: { canonical: `${SITE_URL}/sitemap-html` },
  robots: { index: true, follow: true },
};

export default async function HtmlSitemap() {
  const [stores, categories] = await Promise.all([getStores(), getCategories()]);
  const articles = getArticles();

  return (
    <>
      <Header />

      <main className="min-h-screen bg-paper/30 pb-16">
        <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
          <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/50">
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span aria-current="page" className="text-ink">
              Карта сайта
            </span>
          </nav>

          <header className="mt-6">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-ink">
              Карта сайта
            </h1>
            <p className="mt-2 text-sm sm:text-base text-ink/70">
              Быстрая навигация по всем разделам, сезонным распродажам, подборкам и проверенным промокодам.
            </p>
          </header>

          {/* Основные разделы */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4">
              Основные разделы
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/promokody"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                Все промокоды
              </Link>
              <Link
                href="/catalog"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                Каталог магазинов
              </Link>
              <Link
                href="/collections"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                Тематические подборки
              </Link>
              <Link
                href="/sovety"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                Советы по экономии
              </Link>
              <Link
                href="/gorod"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                Скидки по городам
              </Link>
              <Link
                href="/calculator"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                Калькулятор выгоды
              </Link>
              <Link
                href="/guide"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                Как применять промокоды
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-line bg-paper/50 px-4 py-2 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all"
              >
                О проекте
              </Link>
            </div>
          </section>

          {/* Сезонные акции и распродажи */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4 flex items-center gap-2">
              <span>🔥</span>
              <span>Сезонные акции и распродажи</span>
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {ACTIONS.map((act) => (
                <Link
                  key={act.slug}
                  href={`/akcii/${act.slug}`}
                  className="block rounded-2xl border border-line/80 bg-paper/40 p-4 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all shadow-2xs"
                >
                  <div>{act.h1}</div>
                  <div className="mt-1 text-xs font-normal text-ink/60 line-clamp-2">
                    {act.description}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Тематические подборки */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4 flex items-center gap-2">
              <span>⭐</span>
              <span>Тематические подборки промокодов</span>
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {COLLECTIONS.map((col) => (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-paper/40 px-3.5 py-3 text-sm font-medium text-ink hover:border-red hover:text-red hover:bg-white transition-colors"
                >
                  <span className="text-base">{col.emoji}</span>
                  <span className="truncate">{col.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Категории */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4">
              Категории магазинов
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="inline-block rounded-full border border-line bg-paper/40 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-ink hover:border-red hover:text-red hover:bg-white transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Магазины */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4">
              Магазины с активными предложениями
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {stores.map((s) => (
                <Link
                  key={s.slug}
                  href={`/store/${s.slug}`}
                  className="flex items-center justify-between rounded-xl border border-line/70 bg-paper/40 px-3.5 py-2.5 text-sm font-medium text-ink hover:border-red hover:text-red hover:bg-white transition-colors"
                >
                  <span className="truncate font-medium">{s.name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs text-ink/60 font-mono">
                    {s.coupons.length}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Советы и статьи */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4">
              Советы и гиды по экономии ({articles.length})
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/sovety/${a.slug}`}
                  className="block rounded-xl border border-line/70 bg-paper/40 px-4 py-3 text-sm font-medium text-ink hover:border-red hover:text-red hover:bg-white transition-colors"
                >
                  <div className="font-medium">{a.title}</div>
                  <div className="mt-1 text-xs text-ink/50 line-clamp-1">
                    {a.description}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Города */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4">
              Промокоды по городам
            </h2>
            <div className="flex flex-wrap gap-2">
              {CITIES_SEO.map((city) => (
                <Link
                  key={city.slug}
                  href={`/gorod/${city.slug}`}
                  className="inline-block rounded-full border border-line bg-paper/40 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-ink hover:border-red hover:text-red hover:bg-white transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
