import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import JsonLd from "@/components/JsonLd";
import OtherCategories from "@/components/OtherCategories";
import YandexAdBlock from "@/components/YandexAdBlock";
import { getCategories, getCoupons, getUsesStats } from "@/lib/perfluence";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const MONTH_YEAR = new Date().toLocaleDateString("ru-RU", {
  month: "long",
  year: "numeric",
});

export const dynamicParams = true;
export const revalidate = 1800;

const plural = (n: number, one: string, few: string, many: string): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}): Promise<Metadata> {
  const { slug: citySlug, category: catSlug } = await params;
  const city = CITIES_SEO.find((c) => c.slug === citySlug);
  if (!city) return {};
  const [categories, all] = await Promise.all([getCategories(), getCoupons()]);
  const cat = categories.find((c) => c.slug === catSlug);
  if (!cat) return {};

  const list = all.filter((c) => {
    const r = (c.promocode.region || "").toLowerCase();
    const isAllRu = !r || r === "ru" || r === "россия";
    const matchesCity = r.includes(city.name.toLowerCase());
    return (isAllRu || matchesCity) && c.store.categorySlug === catSlug;
  });

  const pageUrl = `${SITE_URL}/gorod/${citySlug}/${catSlug}`;
  const title = `Промокоды на ${cat.name.toLowerCase()} ${city.inCity} — скидки ${MONTH_YEAR}`;
  const description = `Проверенные промокоды на ${cat.name.toLowerCase()} ${city.inCity}: ${list.length} ${plural(
    list.length,
    "актуальное предложение",
    "актуальных предложения",
    "актуальных предложений",
  )} от магазинов-партнёров. Копируй код и экономь уже сегодня.`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CityCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}) {
  const { slug: citySlug, category: catSlug } = await params;
  const city = CITIES_SEO.find((c) => c.slug === citySlug);
  if (!city) notFound();

  const [categories, all, uses] = await Promise.all([
    getCategories(),
    getCoupons(),
    getUsesStats(),
  ]);
  const cat = categories.find((c) => c.slug === catSlug);
  if (!cat) notFound();

  // Двойная фильтрация: город (регион) И категория
  const list = all.filter((c) => {
    const r = (c.promocode.region || "").toLowerCase();
    const isAllRu = !r || r === "ru" || r === "россия";
    const matchesCity = r.includes(city.name.toLowerCase());
    return (isAllRu || matchesCity) && c.store.categorySlug === catSlug;
  });

  const storeNames = [...new Set(list.map((c) => c.store.name))];
  const pageUrl = `${SITE_URL}/gorod/${citySlug}/${catSlug}`;

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: `Промокоды ${city.inCity}`,
        item: `${SITE_URL}/gorod/${citySlug}`,
      },
      { "@type": "ListItem", position: 3, name: cat.name, item: pageUrl },
    ],
  };

  const faqJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Где искать промокоды на ${cat.name.toLowerCase()} ${city.inCity}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Все актуальные купоны на ${cat.name.toLowerCase()} ${city.inCity} собраны на этой странице. Мы обновляем их каждый день по мере запуска акций партнёров.`,
        },
      },
      {
        "@type": "Question",
        name: `Как применить промокод на ${cat.name.toLowerCase()} ${city.inCity}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Скопируйте код кнопкой «Копировать» на карточке, перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» на этапе оплаты. Скидка применится сразу.",
        },
      },
    ],
  };

  const listing: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Промокоды на ${cat.name} ${city.inCity}`,
    numberOfItems: list.length,
    itemListElement: list.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Offer",
        name: `Промокод ${c.promocode.code}`,
        description: c.promocode.bonusName || c.store.name,
        url: c.affiliate.link,
        priceValidUntil: c.promocode.expires,
        priceCurrency: "RUB",
        price: 0,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: c.store.name },
      },
    })),
  };

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={listing} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
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
          <Link
            href={`/gorod/${citySlug}`}
            className="hover:text-ink transition-colors"
          >
            {city.name}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span aria-current="page">{cat.name}</span>
        </nav>

        <h1 className="mt-6 max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Промокоды на {cat.name.toLowerCase()} {city.inCity}
        </h1>
        <p className="mt-3 max-w-2xl text-ink/60">
          {list.length} {list.length === 1 ? "промокод" : "промокодов"} на{" "}
          {cat.name.toLowerCase()} {city.inCity}. Обновляем ежедневно.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((coupon) => (
            <CouponTicket
              key={`${coupon.id}-${coupon.promocode.code}`}
              coupon={coupon}
              proofCount={uses.usesByCode.get(coupon.promocode.code) ?? 0}
              storeProofCount={uses.usesByStore.get(coupon.store.id) ?? 0}
            />
          ))}
        </div>

        {list.length === 0 && (
          <p className="mt-8 rounded-2xl border border-line bg-white p-6 text-sm text-ink/60">
            Пока нет активных промокодов на {cat.name.toLowerCase()}{" "}
            {city.inCity}. Загляните позже — мы добавляем свежие акции каждый
            день, или посмотрите{" "}
            <Link
              href={`/category/${catSlug}`}
              className="text-red font-bold hover:underline"
            >
              все промокоды категории «{cat.name}»
            </Link>
            .
          </p>
        )}

        <YandexAdBlock
          blockId={process.env.NEXT_PUBLIC_YANDEX_CATEGORY_AD_ID || "R-A-1234567-3"}
          className="my-10"
        />

        <OtherCategories current={catSlug} />

        <article className="mt-14 max-w-3xl">
          <h2 className="font-display text-lg font-extrabold">
            Купоны на {cat.name.toLowerCase()} {city.inCity} — что учесть перед
            покупкой
          </h2>
          <p className="mt-4 leading-relaxed text-ink/70">
            Жители {city.name} могут существенно сократить расходы на{" "}
            {cat.name.toLowerCase()}, используя проверенные промокоды с этой
            страницы. Мы ежедневно обновляем подборку: каждый код проходит
            ручную проверку через официальные API партнёров, поэтому в списке
            нет нерабочих предложений.
          </p>
          <p className="mt-4 leading-relaxed text-ink/70">
            Перед оформлением заказа {city.inCity} просто скопируйте промокод и
            вставьте его в поле «Промокод» на этапе оплаты. Большинство федеральных
            сетей предлагают скидки до 55% на первый заказ и кэшбэк для
            постоянных покупателей.
          </p>
        </article>

        <section className="mt-12 max-w-3xl" aria-label="Частые вопросы">
          <h2 className="font-display text-xl font-extrabold">
            Частые вопросы про купоны на {cat.name.toLowerCase()} {city.inCity}
          </h2>
          <div className="mt-5 space-y-3">
            <details className="group rounded-2xl border border-line bg-white px-5 py-4">
              <summary className="cursor-pointer list-none font-bold text-ink">
                Где искать промокоды на {cat.name.toLowerCase()} {city.inCity}?
                <span className="float-right text-red group-open:hidden">+</span>
                <span className="float-right text-red hidden group-open:inline">
                  −
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Все актуальные купоны на {cat.name.toLowerCase()} {city.inCity}{" "}
                собраны на этой странице. Мы обновляем их каждый день по мере
                запуска акций партнёров.
              </p>
            </details>
            <details className="group rounded-2xl border border-line bg-white px-5 py-4">
              <summary className="cursor-pointer list-none font-bold text-ink">
                Как применить промокод на {cat.name.toLowerCase()} {city.inCity}?
                <span className="float-right text-red group-open:hidden">+</span>
                <span className="float-right text-red hidden group-open:inline">
                  −
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Скопируйте код кнопкой «Копировать» на карточке, перейдите в
                магазин по нашей ссылке и вставьте код в поле «Промокод» на
                этапе оплаты. Скидка применится сразу.
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
