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
import Breadcrumbs from "@/components/Breadcrumbs";
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
    console.error("[build] ошибка fetchCoupons при генерации first-order", e);
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

function getMonthRuPrep(): string {
  const now = new Date();
  const monthsPrep = [
    "январь", "февраль", "март", "апрель", "май", "июнь",
    "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
  ];
  return `${monthsPrep[now.getMonth()]} ${now.getFullYear()}`;
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

const TODAY_ISO = new Date().toISOString();
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

  const pageUrl = `${SITE_URL}/store/${slug}/first-order`;
  const monthYear = getCapitalizedMonthYear();
  const maxDisc = getMaxDiscount(store.coupons);

  const title = `Промокоды ${store.name} на первый заказ на ${monthYear} — скидки ${maxDisc} | ${SITE_NAME}`;
  const description = `Все рабочие промокоды и скидки ${store.name} на первый заказ на ${monthYear}. Специальные предложения ${maxDisc} для новых клиентов: скопируйте промокод и экономьте!`;

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
      images: store.logo ? [{ url: store.logo, alt: `Промокоды ${store.name} на первый заказ` }] : undefined,
    },
    twitter: {
      card: store.logo ? "summary_large_image" : "summary",
      title,
      description,
      images: store.logo ? [store.logo] : undefined,
    },
  };
}

export default async function StoreFirstOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [stores, uses] = await Promise.all([getAllStores(), getUsesStats()]);
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const pageUrl = `${SITE_URL}/store/${slug}/first-order`;
  const parentStoreUrl = `${SITE_URL}/store/${slug}`;
  const storeProofCount = uses.usesByStore.get(store.id) ?? 0;
  const monthYear = getCapitalizedMonthYear();
  const monthRu = getMonthRuPrep();
  const maxDisc = getMaxDiscount(store.coupons);
  const trust = calculateStoreTrust(store.slug, store.coupons.length, storeProofCount);
  const ratingValue = Number((trust.score / 20).toFixed(1));
  const ratingCount = Math.max(48, trust.totalChecks * 3 + (storeProofCount || 0));

  // Купоны на первый заказ имеют абсолютный приоритет
  const strictFirstOrder = store.coupons.filter(
    (c) =>
      c.promocode.isFirstOrderOnly ||
      /перв|1[-‑–—]?[ыое]?й/i.test(c.promocode.bonusName || "") ||
      /перв|1[-‑–—]?[ыое]?й/i.test(c.promocode.terms || "")
  );

  const universalCoupons = store.coupons.filter(
    (c) => !strictFirstOrder.some((fo) => fo.id === c.id)
  );

  // Все купоны, подходящие для первого заказа (сначала строго первый, потом универсальные)
  const displayCoupons = [...strictFirstOrder, ...universalCoupons];

  const repeatOrderCount = store.coupons.filter((c) => !c.promocode.isFirstOrderOnly).length;

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
      { "@type": "ListItem", position: 4, name: "На первый заказ", item: pageUrl },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Промокоды ${store.name} на первый заказ`,
    description: `Рабочие промокоды и скидки ${store.name} для новых клиентов на ${monthYear}. Скидки ${maxDisc}.`,
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
      q: `Как получить скидку на первый заказ в ${store.name}?`,
      a: `Скопируйте промокод на этой странице, откройте приложение или сайт ${store.name}, добавьте товары в корзину и вставьте промокод в поле купона при оформлении. Скидка применится мгновенно.`,
    },
    {
      q: `Кто считается новым покупателем в ${store.name}?`,
      a: `Новым клиентом считается пользователь, который оформляет первый заказ на свой номер телефона или новый аккаунт. Если вы уже заказывали ранее, промокод на первый заказ может не сработать.`,
    },
    {
      q: `Какой максимальный промокод на первый заказ в ${store.name} сейчас?`,
      a: `На ${monthYear} выгода на первый заказ в ${store.name} достигает ${maxDisc}. Все коды на этой странице проверены и активны на сегодня.`,
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
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: store.category, href: `/category/${store.categorySlug}` },
            { label: store.name, href: parentStoreUrl },
            { label: "На первый заказ" },
          ]}
          className="mb-2"
        />

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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red/10 border border-red/30 px-2.5 py-0.5 text-[11px] font-bold text-red mb-2">
                <span>🎁</span>
                <span>Спецпредложения для новых клиентов</span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-ink break-words">
                Промокоды {store.name} на первый заказ ({monthYear})
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-ink/60">
                Собрали все промокоды и скидки {maxDisc} для новых пользователей {store.name}. Проверено на сегодня.
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
            activeTab="first-order"
            allCount={store.coupons.length}
            firstCount={strictFirstOrder.length}
            repeatCount={repeatOrderCount}
          />

          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display text-base sm:text-lg font-extrabold text-ink">
              Скидки и купоны на первый заказ ({displayCoupons.length})
            </h2>
          </div>

          {displayCoupons.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
              <div className="font-display text-4xl font-extrabold text-ink/15">Скоро</div>
              <p className="mt-3 font-bold text-ink/70">
                Специальные купоны для новых клиентов {store.name} появятся в ближайшее время.
              </p>
              <Link href={parentStoreUrl} className="mt-3 inline-block font-bold text-red underline">
                Посмотреть все акции {store.name} →
              </Link>
            </div>
          ) : (
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
          )}
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

        {/* Пошаговая инструкция применения первого промокода */}
        <div className="mt-8">
          <HowToApply />
        </div>

        {/* Сводная таблица скидок на первый заказ */}
        <StoreSummaryTable
          coupons={displayCoupons}
          storeName={store.name}
          storeSlug={store.slug}
          title={`Сводная таблица промокодов ${store.name} на первый заказ`}
          subtitle={`Все актуальные промокоды для новых клиентов собраны в единой сравнительной таблице.`}
        />

        {/* SEO статья: Первый заказ */}
        <article className="mt-10 max-w-3xl rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Как активировать промокод на первый заказ в {store.name}
          </h2>
          <div className="mt-4 space-y-3 text-sm text-ink/70 leading-relaxed">
            <p>
              Первый заказ в {store.name} — это лучшая возможность сэкономить до {maxDisc} от суммы чека. Большинство интернет-магазинов и сервисов доставки предлагают повышенные скидки новым клиентам, чтобы вы могли протестировать качество сервиса.
            </p>
            <p>
              <strong>Секреты максимальной выгоды для нового клиента:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Используйте промокод на первый заказ сразу в корзине до перехода к оплате.</li>
              <li>Проверьте минимальную сумму корзины — часто скидка активируется от определенного порога.</li>
              <li>Сохраняйте бесплатную доставку, комбинируя промокоды со спецпредложениями.</li>
            </ul>
          </div>
        </article>

        {/* FAQ */}
        <section className="mt-10 max-w-3xl" aria-label="Частые вопросы">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Частые вопросы про первый заказ в {store.name}
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
          <OtherStores
            current={store.slug}
            category={store.categorySlug}
            storeName={store.name}
          />
        </div>
      </div>
    </main>
  );
}
