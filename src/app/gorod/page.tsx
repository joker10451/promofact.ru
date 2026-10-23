import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Промокоды по городам России — скидки и акции",
  description:
    "Каталог актуальных промокодов и акций по городам России: быстрая доставка еды, супермаркеты, такси, каршеринг и выгодный шопинг в вашем регионе.",
  alternates: { canonical: `${SITE_URL}/gorod` },
  openGraph: {
    title: `Промокоды по городам России — ${SITE_NAME}`,
    description:
      "Выберите свой город и получайте лучшие промокоды на доставку еды, супермаркеты, аптеки и онлайн-покупки.",
    url: `${SITE_URL}/gorod`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `Промокоды по городам России — ${SITE_NAME}`,
    description:
      "Выберите свой город и получайте лучшие промокоды на доставку еды, супермаркеты, аптеки и онлайн-покупки.",
  },
};

export default function CitiesIndexPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Города",
        item: `${SITE_URL}/gorod`,
      },
    ],
  };

  const citiesHubJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Промокоды и скидки по городам России",
    description:
      "Региональный каталог акций и купонов на доставку еды, продуктов и услуги для жителей крупнейших городов РФ.",
    url: `${SITE_URL}/gorod`,
    inLanguage: "ru-RU",
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand/30 pb-16">
        <JsonLd data={breadcrumbJsonLd} />
        <JsonLd data={citiesHubJsonLd} />

        <div className="border-b border-line bg-white/80">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/50">
              <Link href="/" className="hover:text-red transition-colors">
                Главная
              </Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink">Города</span>
            </nav>

            <h1 className="mt-5 max-w-3xl font-display text-2xl font-extrabold text-ink sm:text-4xl">
              Промокоды и скидки по городам России
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
              Выберите ваш город, чтобы увидеть действующие купоны на доставку продуктов, готовых блюд из ресторанов, поездки и онлайн-заказы с учётом региональной зоны обслуживания.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CITIES_SEO.map((city) => (
              <div
                key={city.slug}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-red/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-xl font-extrabold text-ink group-hover:text-red transition-colors">
                      {city.name}
                    </span>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink/70">
                      {city.inCity}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-ink/65 sm:text-sm">
                    {city.description}
                  </p>

                  <div className="mt-4 rounded-xl bg-sand/60 p-3 text-xs text-ink/75">
                    <span className="font-bold text-ink">Популярно:</span>{" "}
                    {city.popularCategory}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60">
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-ink/60 mb-3">
                    <Link
                      href={`/gorod/${city.slug}/dostavka-produktov`}
                      className="rounded-lg bg-sand/80 px-2.5 py-1 hover:bg-sand hover:text-ink transition-colors"
                    >
                      Продукты
                    </Link>
                    <Link
                      href={`/gorod/${city.slug}/dostavka-iz-restoranov`}
                      className="rounded-lg bg-sand/80 px-2.5 py-1 hover:bg-sand hover:text-ink transition-colors"
                    >
                      Рестораны
                    </Link>
                  </div>

                  <Link
                    href={`/gorod/${city.slug}`}
                    className="flex items-center justify-between font-bold text-xs text-red group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Все скидки {city.inCity}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <section aria-label="Особенности региональных промокодов" className="mt-14 rounded-2xl border border-line bg-white p-6 sm:p-8">
            <h2 className="font-display text-xl font-extrabold text-ink">
              Как работают региональные промокоды
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-3 text-sm text-ink/70 leading-relaxed">
              <div>
                <div className="font-bold text-ink">Зона покрытия доставки</div>
                <p className="mt-1">
                  Сервисы экспресс-доставки (Пятёрочка, Самокат, Перекрёсток) применяют разные промокоды в зависимости от филиала и склада сборки.
                </p>
              </div>
              <div>
                <div className="font-bold text-ink">Рестораны и заведения</div>
                <p className="mt-1">
                  Сетевые рестораны (Тануки, FARFOR, Додо Пицца) проводят локальные промо-акции с повышенными бонусами в отдельных городах.
                </p>
              </div>
              <div>
                <div className="font-bold text-ink">Федеральные предложения</div>
                <p className="mt-1">
                  Большинство маркетплейсов, аптек и финансовых сервисов действуют по всей России с доставкой в любой пункт выдачи вашего города.
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
