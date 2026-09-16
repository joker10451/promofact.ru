import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PopularStores from "@/components/PopularStores";
import VisualCategoryTiles from "@/components/VisualCategoryTiles";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
};

/**
 * Раньше здесь была стандартная английская заглушка Next без шапки и
 * навигации: человек, пришедший по устаревшей ссылке на купон, просто уходил.
 * Теперь сразу предлагаем, куда пойти дальше.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="border-b border-line bg-gradient-to-b from-white to-paper px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="font-display text-6xl font-black text-red sm:text-7xl">404</div>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-ink sm:text-3xl">
              Такой страницы нет — но скидки есть
            </h1>
            <p className="mt-3 text-base text-ink/70">
              Возможно, акция закончилась или ссылка устарела. Загляните в каталог — там только
              действующие промокоды.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/#catalog"
                className="rounded-xl bg-red px-6 py-3.5 text-sm font-bold text-white shadow-offset transition-transform hover:-translate-y-0.5"
              >
                Смотреть все промокоды →
              </Link>
              <Link
                href="/promokody"
                className="rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-bold text-ink transition-colors hover:border-ink"
              >
                Магазины от А до Я
              </Link>
            </div>
          </div>
        </section>
        <PopularStores />
        <VisualCategoryTiles />
      </main>
      <Footer />
    </>
  );
}
