import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponGrid from "@/components/CouponGrid";
import { getCoupons, getUsesStats } from "@/lib/perfluence";
import { toCatalogCoupon } from "@/lib/catalogCoupon";
import { SITE_URL } from "@/lib/site";

// Always share the same live active offers with the homepage and store pages.
export const revalidate = 900; // SSR обновляется каждые 15 минут; карточки проверяют срок на клиенте.

export const metadata: Metadata = {
  title: "Все промокоды и купоны — каталог скидок",
  description: "Полный каталог действующих промокодов: поиск по магазинам, фильтры по заказам, регионам и размеру скидки. Актуальные условия на ПромоФакте.",
  alternates: { canonical: `${SITE_URL}/catalog` },
  openGraph: {
    title: "Все купоны и промокоды — ПромоФакт",
    description: "Найдите скидку среди актуальных предложений в полном каталоге с удобными фильтрами.",
    url: `${SITE_URL}/catalog`,
    type: "website",
    locale: "ru_RU",
    siteName: "ПромоФакт",
  },
};

export default async function CatalogPage() {
  const [coupons, uses] = await Promise.all([getCoupons(), getUsesStats()]);
  const proofsByCode = Object.fromEntries(uses.usesByCode);
  const proofsByStore = Object.fromEntries(uses.usesByStore);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="border-b border-line bg-white/80">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11">
            <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/55">
              <Link href="/" className="hover:text-red">Главная</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink">Все купоны</span>
            </nav>
            <h1 className="mt-5 max-w-3xl font-display text-2xl font-extrabold text-ink sm:text-4xl">
              Каталог купонов и промокодов
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
              Ищите действующие предложения по магазину, категории, региону и условиям заказа. Точное количество обновляется в каталоге ниже.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold">
              <Link href="/promokody" className="text-red hover:underline">Список магазинов →</Link>
              <Link href="/category" className="text-red hover:underline">Категории скидок →</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
          <CouponGrid
            coupons={coupons.map(toCatalogCoupon)}
            proofsByCode={proofsByCode}
            proofsByStore={proofsByStore}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
