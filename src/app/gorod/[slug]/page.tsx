import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponTicket from "@/components/CouponTicket";
import JsonLd from "@/components/JsonLd";
import { getCoupons, getUsesStats } from "@/lib/perfluence";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 1800;

export async function generateStaticParams() {
  return CITIES_SEO.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES_SEO.find((c) => c.slug === slug);
  if (!city) return {};

  const now = new Date();
  const months = [
    "январь", "февраль", "март", "апрель", "май", "июнь",
    "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
  ];
  const dateStr = `${months[now.getMonth()]} ${now.getFullYear()}`;

  const title = `Промокоды и скидки ${city.inCity} на ${dateStr} — ${SITE_NAME}`;
  const description = `${city.description} Скидки до 55% на ${city.popularCategory} в ${city.name}. Проверенные промокоды на ${dateStr}.`;

  return {
    title,
    description,
    keywords: [
      `промокоды ${city.name.toLowerCase()}`,
      `скидки ${city.name.toLowerCase()}`,
      `доставка еды ${city.name.toLowerCase()} промокод`,
      `купоны ${city.name.toLowerCase()}`,
      `акции ${city.name.toLowerCase()}`,
    ],
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/gorod/${city.slug}`,
      type: "website",
    },
    alternates: {
      canonical: `${SITE_URL}/gorod/${city.slug}`,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = CITIES_SEO.find((c) => c.slug === slug);
  if (!city) notFound();

  const [allCoupons, uses] = await Promise.all([
    getCoupons(),
    getUsesStats(),
  ]);

  // Фильтруем купоны, действующие в этом городе (или по всей РФ)
  const cityCoupons = allCoupons.filter((c) => {
    const r = (c.promocode.region || "").toLowerCase();
    const isAllRu = !r || r === "ru" || r === "россия";
    const matchesCity = r.includes(city.name.toLowerCase());
    return isAllRu || matchesCity;
  });

  const proofsByCode = Object.fromEntries(uses.usesByCode);
  const proofsByStore = Object.fromEntries(uses.usesByStore);

  const now = new Date();
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const dateStr = `${months[now.getMonth()]} ${now.getFullYear()}`;

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `Промокоды в ${city.name}`, item: `${SITE_URL}/gorod/${city.slug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Какие сервисы доставки работают со скидкой ${city.inCity}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `В ${city.name} со скидками и промокодами работают Пятёрочка Доставка, Тануки, Яндекс Афиша, Т-Банк и другие популярные сервисы.`,
        },
      },
      {
        "@type": "Question",
        name: `Как применить промокод на заказ ${city.inCity}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Скопируйте промокод на сайте ПромоФакт, перейдите в приложение или на сайт магазина и вставьте код в поле «Промокод» при оформлении заказа.`,
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqJsonLd} />
      <Header />

      <main className="min-h-screen bg-paper pb-20">
        {/* Хлебные крошки и Hero */}
        <div className="border-b border-line bg-gradient-to-b from-white to-paper px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <nav className="mb-4 flex items-center gap-2 text-xs font-semibold text-ink/50">
              <Link href="/" className="hover:text-ink">Главная</Link>
              <span>/</span>
              <span className="text-ink font-bold">Города</span>
              <span>/</span>
              <span className="text-red font-bold">{city.name}</span>
            </nav>

            <div className="inline-flex items-center gap-2 rounded-full bg-red/10 px-3 py-1 text-xs font-bold text-red mb-3">
              📍 Локальные предложения на {dateStr}
            </div>

            <h1 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Промокоды и скидки {city.inCity}
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium text-ink/70 sm:text-base leading-relaxed">
              {city.description} Собрали {cityCoupons.length} актуальных предложений: {city.popularCategory}. Все промокоды проверены на сегодня.
            </p>

            {/* Быстрые ссылки на другие популярные города */}
            <div className="mt-6 flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
              <span className="text-xs font-bold text-ink/50">Другие города:</span>
              {CITIES_SEO.filter((c) => c.slug !== city.slug).map((c) => (
                <Link
                  key={c.slug}
                  href={`/gorod/${c.slug}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-ink/70 hover:border-ink hover:text-ink transition-all"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Сетка купонов города */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Действующие акции {city.inCity} ({cityCoupons.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityCoupons.map((coupon) => (
              <CouponTicket
                key={`${coupon.id}-${coupon.promocode.code}`}
                coupon={coupon}
                proofCount={proofsByCode[coupon.promocode.code] ?? 0}
                storeProofCount={proofsByStore[coupon.store.id] ?? 0}
              />
            ))}
          </div>
        </div>

        {/* SEO статья и FAQ */}
        <div className="mx-auto max-w-4xl px-4 mt-8 sm:px-6">
          <div className="rounded-3xl border border-line bg-white p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink">
              Как экономить на покупках и доставке {city.inCity}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-ink/70 leading-relaxed">
              <p>
                Жители {city.name} могут существенно сократить расходы на повседневные покупки, используя эксклюзивные купоны. Большинство федеральных сетей и ресторанов предлагают скидки до 55% на первый заказ и регулярный кэшбэк для постоянных покупателей.
              </p>
              <p>
                Перед оформлением заказа в {city.inCity} просто скопируйте промокод с этой страницы. Наш сервис ежедневно проверяет работоспособность каждого кода через официальные API партнеров.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
