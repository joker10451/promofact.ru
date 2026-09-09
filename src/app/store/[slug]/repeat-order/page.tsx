import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import HowToApply from "@/components/HowToApply";
import JsonLd from "@/components/JsonLd";
import OtherStores from "@/components/OtherStores";
import StoreLogo from "@/components/StoreLogo";
import StoreRatingWidget from "@/components/StoreRatingWidget";
import StoreIntentTabs from "@/components/StoreIntentTabs";
import StoreSummaryTable from "@/components/StoreSummaryTable";
import YandexAdBlock from "@/components/YandexAdBlock";
import { calculateStoreTrust } from "@/lib/trustEngine";
import { getAllStores, getUsesStats } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const stores = await getAllStores();
    if (stores.length > 0) return stores.map((store) => ({ slug: store.slug }));
  } catch (e) {
    console.error("[build] ошибка fetchCoupons при генерации repeat-order", e);
  }
  return [];
}

function getCapitalizedMonthYear(): string {
  const now = new Date();
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getMaxDiscount(coupons: { promocode: { bonusName: string | null } }[]): string {
  let maxPercent = 0;
  let maxRub = 0;
  for (const c of coupons) {
    const text = c.promocode.bonusName || "";
    const p = text.match(/(\d+)\s*%/);
    if (p && Number(p[1]) > maxPercent) maxPercent = Number(p[1]);
    const r = text.match(/(\d+[\s\d]*)\s*(?:₽|руб)/i);
    if (r) {
      const val = Number(r[1].replace(/\s+/g, ""));
      if (val > maxRub) maxRub = val;
    }
  }
  if (maxPercent > 0) return `до ${maxPercent}%`;
  if (maxRub > 0) return `до ${maxRub.toLocaleString("ru-RU")} ₽`;
  return "скидки";
}

const TODAY_RU = new Date().toLocaleDateString("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stores = await getAllStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) return {};

  const pageUrl = `${SITE_URL}/store/${slug}/repeat-order`;
  const monthYear = getCapitalizedMonthYear();
  const repeatCoupons = store.coupons.filter((c) => !c.promocode.isFirstOrderOnly);
  const maxDisc = getMaxDiscount(repeatCoupons.length > 0 ? repeatCoupons : store.coupons);

  const title = `Промокоды ${store.name} на повторный заказ на ${monthYear} — скидки для постоянных клиентов | ${SITE_NAME}`;
  const description = `Рабочие промокоды и скидки ${store.name} на повторные заказы на ${monthYear}. Специальные предложения ${maxDisc} для постоянных покупателей: экономьте на каждом заказе!`;

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
      images: store.logo ? [{ url: store.logo, alt: `Промокоды ${store.name} на повторный заказ` }] : undefined,
    },
    twitter: {
      card: store.logo ? "summary_large_image" : "summary",
      title,
      description,
      images: store.logo ? [store.logo] : undefined,
    },
  };
}

export default async function StoreRepeatOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [stores, uses] = await Promise.all([getAllStores(), getUsesStats()]);
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const pageUrl = `${SITE_URL}/store/${slug}/repeat-order`;
  const parentStoreUrl = `${SITE_URL}/store/${slug}`;
  const storeProofCount = uses.usesByStore.get(store.id) ?? 0;
  const monthYear = getCapitalizedMonthYear();
  const trust = calculateStoreTrust(store.slug, store.coupons.length, storeProofCount);
  const ratingValue = Number((trust.score / 20).toFixed(1));
  const ratingCount = Math.max(48, trust.totalChecks * 3 + (storeProofCount || 0));

  // Фильтруем купоны: оставляем только купоны для постоянных и всех клиентов (исключаем strictly first-order)
  const repeatCoupons = store.coupons.filter((c) => !c.promocode.isFirstOrderOnly);
  const firstOrderCount = store.coupons.filter(
    (c) =>
      c.promocode.isFirstOrderOnly ||
      /перв|1[-‑–—]?[ыое]?й/i.test(c.promocode.bonusName || "") ||
      /перв|1[-‑–—]?[ыое]?й/i.test(c.promocode.terms || "")
  ).length;

  const displayCoupons = repeatCoupons.length > 0 ? repeatCoupons : store.coupons;
  const maxDisc = getMaxDiscount(displayCoupons);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: store.category,
        item: `${SITE_URL}/category/${store.categorySlug}`,
      },
      { "@type": "ListItem", position: 3, name: store.name, item: parentStoreUrl },
      { "@type": "ListItem", position: 4, name: "Повторные заказы", item: pageUrl },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Промокоды ${store.name} на повторный заказ`,
    description: `Рабочие промокоды и скидки ${store.name} для постоянных покупателей на ${monthYear}. Скидки ${maxDisc}.`,
    image: store.logo || `${SITE_URL}/icon.svg`,
    brand: { "@type": "Brand", name: store.name },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: ratingCount,
      reviewCount: ratingCount,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "RUB",
      lowPrice: 0,
      highPrice: 0,
      offerCount: displayCoupons.length || 1,
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: parentStoreUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: ratingCount,
    },
  };

  const faqItems = [
    {
      q: `Бывают ли промокоды ${store.name} для старых пользователей?`,
      a: `Да! На этой странице собраны все актуальные купоны и скидки ${store.name}, которые работают для повторных заказов и не имеют ограничений «только для новых клиентов».`,
    },
    {
      q: `Как применить промокод на повторный заказ в ${store.name}?`,
      a: `Скопируйте купон с этой страницы, зайдите в свой существующий аккаунт ${store.name}, соберите корзину и вставьте промокод в поле «Промокод» перед оплатой.`,
    },
    {
      q: `Можно ли суммировать промокод с бонусами программы лояльности ${store.name}?`,
      a: `В большинстве случаев промокод применяется к корзине до списания баллов лояльности или кэшбэка, позволяя получить двойную выгоду. Детали читайте в условиях каждого купона.`,
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={productJsonLd} />
      <JsonLd data={organizationJsonLd} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/45">
          <Link href="/" className="hover:text-ink transition-colors">Главная</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href={`/category/${store.categorySlug}`} className="hover:text-ink transition-colors">{store.category}</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href={parentStoreUrl} className="hover:text-ink transition-colors">{store.name}</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page" className="text-mint-dark font-bold">Повторные заказы</span>
        </nav>

        <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-white p-1 shadow-2xs">
              <StoreLogo
                slug={store.slug}
                name={store.name}
                logo={store.logo}
                site={store.site}
                size={56}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 border border-mint/40 px-2.5 py-0.5 text-[11px] font-bold text-mint-dark mb-2">
                <span>🔁</span>
                <span>Для постоянных покупателей и всех заказов</span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-ink break-words">
                Промокоды {store.name} на повторный заказ ({monthYear})
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-ink/60">
                Собрали действующие купоны {store.name} без ограничений первого заказа. Скидки {maxDisc} для каждого покупателя.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <StoreRatingWidget
                  storeSlug={store.slug}
                  storeName={store.name}
                  initialRating={ratingValue}
                  initialCount={ratingCount}
                  compact
                />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 border border-mint/40 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-mint-dark">
                  <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
                  Проверено сегодня · Trust {trust.score}/100
                </span>
                <span className="rounded-full bg-paper border border-line px-2.5 py-1 text-[11px] sm:text-xs font-bold text-ink/65">
                  Обновлено {TODAY_RU}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Главный блок с вкладками интента и карточками */}
        <div className="mt-8">
          <StoreIntentTabs
            storeSlug={store.slug}
            activeTab="repeat-order"
            allCount={store.coupons.length}
            firstCount={firstOrderCount}
            repeatCount={repeatCoupons.length}
          />

          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display text-base sm:text-lg font-extrabold text-ink">
              Купоны на повторный заказ ({displayCoupons.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayCoupons.map((coupon) => (
              <CouponTicket
                key={`${coupon.id}-${coupon.promocode.code}`}
                coupon={coupon}
                proofCount={uses.usesByCode.get(coupon.promocode.code) ?? 0}
                storeProofCount={storeProofCount}
              />
            ))}
          </div>
        </div>

        {/* Интерактивный виджет оценки */}
        <div className="mt-8">
          <StoreRatingWidget
            storeSlug={store.slug}
            storeName={store.name}
            initialRating={ratingValue}
            initialCount={ratingCount}
          />
        </div>

        {/* Пошаговая инструкция применения */}
        <div className="mt-8">
          <HowToApply />
        </div>

        {/* Сводная таблица скидок на повторные заказы */}
        <StoreSummaryTable
          coupons={displayCoupons}
          storeName={store.name}
          storeSlug={store.slug}
          title={`Сводная таблица промокодов ${store.name} на повторный заказ`}
          subtitle={`Все актуальные предложения для постоянных покупателей собраны в единой сравнительной таблице.`}
        />

        {/* SEO статья: Повторные заказы */}
        <article className="mt-10 max-w-3xl rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Как экономить постоянным покупателям в {store.name}
          </h2>
          <div className="mt-4 space-y-3 text-sm text-ink/70 leading-relaxed">
            <p>
              Многие покупатели ошибочно считают, что промокоды действуют только для новых пользователей. В {store.name} регулярно выпускаются купоны для постоянных клиентов: скидки от определенной суммы чека, промокоды на категории товаров, сезонные распродажи и бесплатная доставка.
            </p>
            <p>
              <strong>Лайфхаки экономии на повторных покупках:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Добавляйте в корзину товары из раздела распродажи, если купон суммируется со скидками.</li>
              <li>Проверяйте минимальную сумму чека для бесплатной доставки — доберите заказ полезной мелочью.</li>
              <li>Используйте кэшбэк банковских карт в связке с нашими промокодами для двойной выгоды.</li>
            </ul>
          </div>
        </article>

        {/* FAQ */}
        <section className="mt-10 max-w-3xl" aria-label="Частые вопросы">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Частые вопросы про повторные заказы в {store.name}
          </h2>
          <div className="mt-5 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-line bg-white p-4 transition-colors open:border-ink/20"
              >
                <summary className="flex cursor-pointer items-center justify-between font-display text-sm font-bold text-ink">
                  {item.q}
                  <span className="text-xs text-ink/40 transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-ink/70 leading-relaxed border-t border-line/60 pt-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <YandexAdBlock
          blockId={process.env.NEXT_PUBLIC_YANDEX_STORE_AD_ID || "R-A-1234567-4"}
          className="my-10"
        />

        <div className="mt-10">
          <OtherStores current={store.slug} category={store.categorySlug} />
        </div>
      </div>
    </main>
  );
}
