import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getCollections, getCollectionCoupons } from "@/lib/collections";
import { getCoupons } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Тематические подборки промокодов и акций",
  description:
    "Каталог актуальных тематических подборок: первый заказ, доставка продуктов, кино и подписки, отели, косметика, карты и сезонные распродажи.",
  alternates: { canonical: `${SITE_URL}/collections` },
  openGraph: {
    title: `Тематические подборки промокодов — ${SITE_NAME}`,
    description:
      "Лучшие подборки промокодов и купонов: скидки на первый заказ, еду, путешествия, подписки и распродажи года.",
    url: `${SITE_URL}/collections`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `Тематические подборки промокодов — ${SITE_NAME}`,
    description:
      "Лучшие подборки промокодов и купонов: скидки на первый заказ, еду, путешествия, подписки и распродажи года.",
  },
};

const plural = (n: number, one: string, few: string, many: string): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

export default async function CollectionsIndexPage() {
  const [collections, allCoupons] = await Promise.all([
    getCollections(),
    getCoupons(),
  ]);

  const items = collections.map((col) => {
    const coupons = getCollectionCoupons(col, allCoupons);
    const storeNames = Array.from(new Set(coupons.map((c) => c.store.name))).slice(0, 4);
    return {
      col,
      count: coupons.length,
      storeNames,
    };
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Подборки промокодов",
        item: `${SITE_URL}/collections`,
      },
    ],
  };

  const collectionHubJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Тематические подборки промокодов и скидок",
    description:
      "Специальные подборки выгодных предложений от проверенных магазинов и сервисов доставки.",
    url: `${SITE_URL}/collections`,
    inLanguage: "ru-RU",
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand/30 pb-16">
        <JsonLd data={breadcrumbJsonLd} />
        <JsonLd data={collectionHubJsonLd} />

        <div className="border-b border-line bg-white/80">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/50">
              <Link href="/" className="hover:text-red transition-colors">
                Главная
              </Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink">Подборки</span>
            </nav>

            <h1 className="mt-5 max-w-3xl font-display text-2xl font-extrabold text-ink sm:text-4xl">
              Тематические подборки промокодов
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
              Специальные подборки предложений для удобного шопинга: скидки на первый заказ, бесплатная доставка, онлайн-кинотеатры, повышенный кэшбэк и главные распродажи сезона.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ col, count, storeNames }) => (
              <Link
                key={col.slug}
                href={`/collections/${col.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-red/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand text-2xl transition-transform group-hover:scale-110">
                      {col.emoji}
                    </span>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink/75">
                      {count} {plural(count, "предложение", "предложения", "предложений")}
                    </span>
                  </div>

                  <h2 className="mt-4 font-display text-lg font-extrabold text-ink group-hover:text-red transition-colors">
                    {col.name}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-ink/65 sm:text-sm line-clamp-3">
                    {col.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60">
                  {storeNames.length > 0 && (
                    <div className="text-xs text-ink/50 truncate">
                      Магазины: <span className="text-ink/80 font-medium">{storeNames.join(", ")}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between font-bold text-xs text-red group-hover:translate-x-0.5 transition-transform">
                    <span>Смотреть скидки</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <section aria-label="Как формируются подборки" className="mt-14 rounded-2xl border border-line bg-white p-6 sm:p-8">
            <h2 className="font-display text-xl font-extrabold text-ink">
              Как мы составляем подборки
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-3 text-sm text-ink/70 leading-relaxed">
              <div>
                <div className="font-bold text-ink">Только действующие коды</div>
                <p className="mt-1">
                  Каждый промокод и акция проходят автоматическую проверку срока действия и условий партнёра.
                </p>
              </div>
              <div>
                <div className="font-bold text-ink">Реальная экономия</div>
                <p className="mt-1">
                  Мы отбираем предложения с максимальным дисконтом: от 10% до 90% или с бесплатной доставкой.
                </p>
              </div>
              <div>
                <div className="font-bold text-ink">Прозрачные правила</div>
                <p className="mt-1">
                  На карточке каждого купона указаны требования: минимальный чек, правила для новых клиентов и ограничения.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
