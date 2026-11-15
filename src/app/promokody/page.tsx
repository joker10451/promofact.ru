import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import StoreLogo from "@/components/StoreLogo";
import { plural } from "@/lib/format";
import { getStores } from "@/lib/perfluence";
import { withoutLegacyTwins } from "@/lib/storeDisplayName";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { currentMonthYear, getMaxDiscount } from "@/lib/seoArticles";

export const revalidate = 3600; // Обновление раз в час: актуальные акции не ждут следующего деплоя.

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
  const stores = withoutLegacyTwins(await getStores());

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
        {sorted.length} магазинов с актуальными промокодами. Выберите магазин
        — внутри таблица кодов, инструкция и FAQ.
      </p>

      <div className="mt-8 grid grid-cols-1 pl-px pt-px sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((store) => {
          const n = store.coupons.length;
          const disc = getMaxDiscount(store.coupons);

          return (
            <Link
              key={store.slug}
              href={`/store/${store.slug}`}
              className="group -ml-px -mt-px flex items-start gap-4 border border-line bg-white p-5 transition-colors hover:bg-paper"
            >
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-line/50 bg-white p-1">
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
                <h2 className="truncate font-display text-base font-extrabold group-hover:text-red transition-colors">
                  {store.name}
                </h2>
                <p className="mt-1 text-xs text-ink/45">{store.category}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold tabular-nums text-ink">
                    {n} {plural(n, "код", "кода", "кодов")}
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
