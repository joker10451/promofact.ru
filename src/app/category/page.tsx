import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VisualCategoryTiles from "@/components/VisualCategoryTiles";
import { SITE_URL } from "@/lib/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Категории скидок и промокодов",
  description: "Каталог скидок по темам: доставка продуктов, одежда, косметика, техника, подписки и другие категории с актуальными предложениями.",
  alternates: { canonical: `${SITE_URL}/category` },
  openGraph: {
    title: "Все категории скидок — ПромоФакт",
    description: "Найдите промокоды в нужной категории: от продуктов и косметики до техники и подписок.",
    url: `${SITE_URL}/category`,
    siteName: "ПромоФакт",
    type: "website",
    locale: "ru_RU",
  },
};

export default function CategoryIndexPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="border-b border-line bg-white/80">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/55">
              <Link href="/" className="hover:text-red">Главная</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink">Категории</span>
            </nav>
            <h1 className="mt-5 max-w-3xl font-display text-2xl font-extrabold text-ink sm:text-4xl">
              Каталог скидок по категориям
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
              Выберите интересующую тему: здесь собраны только разделы, в которых есть предложения. На страницах категорий — магазины, условия акций и действующие купоны.
            </p>
            <Link href="/promokody" className="mt-5 inline-flex rounded-xl bg-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-dark">
              Посмотреть все магазины <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <VisualCategoryTiles />
      </main>
      <Footer />
    </>
  );
}
