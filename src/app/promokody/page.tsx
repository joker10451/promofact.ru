import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import StoreLogo from "@/components/StoreLogo";
import { getStores } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { currentMonthYear, getMaxDiscount } from "@/lib/seoArticles";

export const revalidate = false;

const monthYear = currentMonthYear();

export const metadata: Metadata = {
  // Бренд добавит шаблон в layout — здесь его быть не должно.
  title: `Промокоды всех магазинов на ${monthYear}`,
  description: `Рабочие промокоды и купоны на ${monthYear}. Полный список магазинов с актуальными кодами скидок. Обновляется ежедневно.`,
  alternates: { canonical: `${SITE_URL}/promokody` },
  openGraph: {
    title: `Промокоды всех магазинов на ${monthYear}`,
    description: `Полный список магазинов с актуальными промокодами на ${monthYear}.`,
    url: `${SITE_URL}/promokody`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
  },
};

export default async function PromokodyIndexPage() {
  const stores = await getStores();

  const sorted = [...stores].sort(
    (a, b) => b.coupons.length - a.coupons.length
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Промокоды",
        item: `${SITE_URL}/promokody`,
      },
    ],
  };

  return (
    <div className="pf3-detail">
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={breadcrumbJsonLd} />

      <nav
        aria-label="Хлебные крошки"
        className="text-xs font-semibold text-ink/45"
      >
        <Link href="/" className="hover:text-ink transition-colors">
          Главная
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Промокоды</span>
      </nav>

      <div className="pf3-detail-hero mt-6 px-5 py-7 sm:px-8 sm:py-9">
        <p className="pf3-kicker text-[11px] font-bold text-red">Каталог магазинов</p>
        <h1 className="pf3-serif mt-3 max-w-4xl text-[clamp(1.8rem,3.2vw,2.8rem)] font-bold leading-tight">
        Промокоды всех магазинов на {monthYear}
      </h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        {sorted.length} магазинов с актуальными промокодами. Выберите магазин
        — внутри действующие купоны, условия и инструкции.
      </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((store) => {
          const n = store.coupons.length;
          const disc = getMaxDiscount(store.coupons);

          return (
            <Link
              key={store.slug}
              href={`/store/${store.slug}`}
              className="pf3-store-card group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-red/30"
            >
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-line/50 bg-white p-1 shadow-2xs">
                <StoreLogo
                  slug={store.slug}
                  name={store.name}
                  logo={store.logo}
                  site={store.site}
                  size={40}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold group-hover:text-red transition-colors">
                  {store.name}
                </h2>
                <p className="mt-1 text-xs text-ink/45">{store.category}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[#fff0f3] px-2.5 py-1 text-xs font-semibold text-red">
                    {n} {n === 1 ? "предложение" : n >= 2 && n <= 4 ? "предложения" : "предложений"}
                  </span>
                  <span className="text-xs font-semibold text-ink/50">
                    {disc}
                  </span>
                </div>
              </div>
              <span className="mt-1 text-sm font-bold text-ink/30 group-hover:text-red transition-colors">
                →
              </span>
            </Link>
          );
        })}
      </div>
      </main>
      <Footer />
    </div>
  );
}
