import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getStores } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { currentMonthYear, getMaxDiscount } from "@/lib/seoArticles";

export const revalidate = 1800;

const monthYear = currentMonthYear();

export const metadata: Metadata = {
  title: `Промокоды всех магазинов на ${monthYear} — ${SITE_NAME}`,
  description: `Рабочие промокоды и купоны на ${monthYear}. Полный список магазинов с проверенными кодами скидок. Обновляется ежедневно.`,
  alternates: { canonical: `${SITE_URL}/promokody` },
  openGraph: {
    title: `Промокоды всех магазинов на ${monthYear}`,
    description: `Полный список магазинов с проверенными промокодами на ${monthYear}.`,
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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

      <h1 className="mt-6 max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
        Промокоды всех магазинов на {monthYear}
      </h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        {sorted.length} магазинов с проверенными промокодами. Выберите магазин
        — внутри таблица кодов, инструкция и FAQ.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((store) => {
          const n = store.coupons.length;
          const disc = getMaxDiscount(store.coupons);

          return (
            <Link
              key={store.slug}
              href={`/promokody/${store.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-[0_8px_0_rgba(11,16,43,0.08)]"
            >
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.name}
                  width={48}
                  height={48}
                  className="flex-none rounded-xl border border-line/50 object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-ink/5 font-display text-lg font-extrabold text-ink/30">
                  {store.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-base font-extrabold group-hover:text-red transition-colors">
                  {store.name}
                </h2>
                <p className="mt-1 text-xs text-ink/45">{store.category}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-yellow/80 px-2.5 py-1 text-xs font-bold">
                    {n} {n === 1 ? "код" : n >= 2 && n <= 4 ? "кода" : "кодов"}
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
  );
}
