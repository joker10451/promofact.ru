import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import HowToApply from "@/components/HowToApply";
import YandexAdBlock from "@/components/YandexAdBlock";
import { getStores } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL, CHANNELS } from "@/lib/site";
import {
  generateStoreIntro,
  generateStoreFAQ,
  generatePromoTable,
  generateSEOMeta,
  currentMonthYear,
} from "@/lib/seoArticles";
import PromoTable from "./PromoTable";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const stores = await getStores();
    return stores.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stores = await getStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) return {};

  const { title, description } = generateSEOMeta(store);
  const pageUrl = `${SITE_URL}/promokody/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "article",
      locale: "ru_RU",
      siteName: SITE_NAME,
      images: store.logo
        ? [{ url: store.logo, alt: `Промокоды ${store.name}` }]
        : undefined,
    },
  };
}

export default async function PromokodyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stores = await getStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const intro = generateStoreIntro(store);
  const faq = generateStoreFAQ(store);
  const tableRows = generatePromoTable(store.coupons);
  const { title } = generateSEOMeta(store);
  const monthYear = currentMonthYear();
  const pageUrl = `${SITE_URL}/promokody/${slug}`;

  const today = new Date().toISOString();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: `Все промокоды ${store.name} на ${monthYear}`,
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

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
      {
        "@type": "ListItem",
        position: 3,
        name: `${store.name}`,
        item: pageUrl,
      },
    ],
  };

  const otherStores = stores
    .filter((s) => s.slug !== slug)
    .sort((a, b) => b.coupons.length - a.coupons.length)
    .slice(0, 6);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Breadcrumbs */}
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
        <Link href="/promokody" className="hover:text-ink transition-colors">
          Промокоды
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span aria-current="page">{store.name}</span>
      </nav>

      {/* Header */}
      <div className="mt-6 flex items-center gap-4">
        {store.logo && (
          <img
            src={store.logo}
            alt={store.name}
            width={56}
            height={56}
            className="rounded-xl border border-line bg-white object-contain"
          />
        )}
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            Все промокоды {store.name} на {monthYear}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            Категория:{" "}
            <Link
              href={`/category/${store.categorySlug}`}
              className="underline underline-offset-2 hover:text-ink transition-colors"
            >
              {store.category}
            </Link>
            {" · "}
            Обновлено:{" "}
            {new Date().toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Intro */}
      <article className="mt-8 space-y-4">
        {intro.map((p, i) => (
          <p key={i} className="leading-relaxed text-ink/70">
            {p}
          </p>
        ))}
      </article>

      <YandexAdBlock
        blockId={
          process.env.NEXT_PUBLIC_YANDEX_ARTICLE_AD_ID || "R-A-1234567-1"
        }
        className="my-8"
      />

      {/* Promo Table */}
      <section className="mt-8" aria-labelledby="promo-table">
        <h2
          id="promo-table"
          className="font-display text-xl font-extrabold"
        >
          Таблица промокодов {store.name}
        </h2>
        <p className="mt-2 text-sm text-ink/50">
          {store.coupons.length} {store.coupons.length === 1 ? "промокод" : store.coupons.length >= 2 && store.coupons.length <= 4 ? "промокода" : "промокодов"} проверено и работает
        </p>
        <PromoTable rows={tableRows} storeName={store.name} />
      </section>

      {/* How to Apply */}
      <HowToApply />

      <YandexAdBlock
        blockId={
          process.env.NEXT_PUBLIC_YANDEX_ARTICLE_BOTTOM_AD_ID ||
          "R-A-1234567-2"
        }
        className="my-8"
      />

      {/* FAQ */}
      <section className="mt-10" aria-labelledby="faq-heading">
        <h2
          id="faq-heading"
          className="font-display text-xl font-extrabold"
        >
          Частые вопросы
        </h2>
        <dl className="mt-4 space-y-4">
          {faq.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <dt className="font-bold">{f.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink/65">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Cross-links */}
      <section className="mt-10 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-extrabold">
          Полезные ссылки
        </h2>
        <ul className="mt-4 space-y-2">
          <li>
            <Link
              href={`/store/${store.slug}`}
              className="font-semibold text-ink underline underline-offset-2 hover:text-red transition-colors"
            >
              Все купоны {store.name} — карточки с кнопкой «Скопировать»
            </Link>
          </li>
          <li>
            <Link
              href={`/category/${store.categorySlug}`}
              className="font-semibold text-ink underline underline-offset-2 hover:text-red transition-colors"
            >
              Промокоды: {store.category}
            </Link>
          </li>
          <li>
            <Link
              href="/sovety/chto-takoe-promokod"
              className="font-semibold text-ink underline underline-offset-2 hover:text-red transition-colors"
            >
              Что такое промокод и как им пользоваться
            </Link>
          </li>
        </ul>
      </section>

      {/* Other stores */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-extrabold">
          Промокоды других магазинов
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {otherStores.map((s) => (
            <Link
              key={s.slug}
              href={`/promokody/${s.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(11,16,43,0.06)]"
            >
              {s.logo && (
                <img
                  src={s.logo}
                  alt={s.name}
                  width={32}
                  height={32}
                  className="rounded-lg border border-line/50 object-contain"
                />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-bold group-hover:text-red transition-colors">
                  {s.name}
                </div>
                <div className="text-xs text-ink/40">
                  {s.coupons.length}{" "}
                  {s.coupons.length === 1 ? "код" : "кодов"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="mt-10 rounded-2xl border border-mint/30 bg-mint/10 p-6">
        <h2 className="font-display text-lg font-extrabold">
          Не пропустите новые промокоды
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Свежие скидки {store.name} и других магазинов — в наших каналах.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={CHANNELS.telegram}
            target="_blank"
            rel="noopener nofollow"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
          >
            Telegram
          </a>
          <a
            href={CHANNELS.vk}
            target="_blank"
            rel="noopener nofollow"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
          >
            ВКонтакте
          </a>
        </div>
      </section>

      <div className="mt-10">
        <Link
          href="/promokody"
          className="text-sm font-bold text-ink/70 hover:text-ink transition-colors"
        >
          ← Все магазины
        </Link>
      </div>
    </main>
  );
}
