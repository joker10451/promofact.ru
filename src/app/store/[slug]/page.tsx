import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import HowToApply from "@/components/HowToApply";
import JsonLd from "@/components/JsonLd";
import OtherStores from "@/components/OtherStores";
import OtherCategories from "@/components/OtherCategories";
import YandexAdBlock from "@/components/YandexAdBlock";
import StoreLogo from "@/components/StoreLogo";
import { calculateStoreTrust } from "@/lib/trustEngine";
import { getAllStores, getUsesStats } from "@/lib/perfluence";
import { buildStoreArticle, buildStoreDescription, type StoreArticleInput } from "@/lib/storeSeoContent";
import { ARTICLES } from "@/lib/articles";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const stores = await getAllStores();
    if (stores.length > 0) return stores.map((store) => ({ slug: store.slug }));
    console.error(
      "[build] fetchCoupons пуст — /store и /category не сгенерированы; проверь PERFLUENCE_WIDGET_URL в build-окружении",
    );
  } catch (e) {
    console.error(
      "[build] ошибка fetchCoupons при генерации /store; проверь PERFLUENCE_WIDGET_URL в build-окружении",
      e,
    );
  }
  return [];
}

function getCapitalizedMonthYear(): string {
  const now = new Date();
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getMonthRuPrep(): string {
  const now = new Date();
  const monthsPrep = [
    "январь", "февраль", "март", "апрель", "май", "июнь",
    "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
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

// Даты фиксируем на уровне модуля — стабильны для SSR и клиента
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
  const pageUrl = `${SITE_URL}/store/${slug}`;
  const n = store.coupons.length;
  const countWord =
    n === 1 ? "проверенный промокод" : n >= 2 && n <= 4 ? "проверенных промокода" : "проверенных промокодов";
  const maxDisc = getMaxDiscount(store.coupons);
  const monthYear = getCapitalizedMonthYear();
  const monthRu = getMonthRuPrep();

  const title = `Промокоды ${store.name} на ${monthYear} — ${maxDisc} (${n} ${countWord}) | ${SITE_NAME}`;
  const description = buildStoreDescription({
    name: store.name,
    category: store.category,
    categorySlug: store.categorySlug,
    about: store.about,
    conditions: store.conditions,
    coupons: store.coupons.map((c) => ({ code: c.promocode.code, bonusName: c.promocode.bonusName })),
    couponCount: n,
    maxDiscount: maxDisc,
    isFirstOrder: store.coupons.some((c) => c.promocode.isFirstOrderOnly),
    activeBloggers: store.activeBloggers,
    monthYear,
    monthRu,
    todayRu: TODAY_RU,
  });

  const og = {
    title,
    description: description.slice(0, 160),
    url: pageUrl,
    type: "website" as const,
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: store.logo
      ? [{ url: store.logo, alt: `Промокоды ${store.name}` }]
      : undefined,
  };
  return {
    title,
    description: og.description,
    alternates: { canonical: pageUrl },
    openGraph: og,
    twitter: {
      card: store.logo ? "summary_large_image" : "summary",
      title,
      description: og.description,
      images: store.logo ? [store.logo] : undefined,
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [stores, uses] = await Promise.all([getAllStores(), getUsesStats()]);
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const best = store.coupons[0];
  const pageUrl = `${SITE_URL}/store/${slug}`;
  const storeProofCount = uses.usesByStore.get(store.id) ?? 0;
  const todayIso = TODAY_ISO;
  const todayRu = TODAY_RU;
  const monthYear = getCapitalizedMonthYear();
  const monthRu = getMonthRuPrep();
  const maxDisc = getMaxDiscount(store.coupons);
  const trust = calculateStoreTrust(store.slug, store.coupons.length, storeProofCount);

  const firstOrderPromo = store.coupons.find((c) => c.promocode.isFirstOrderOnly);
  const repeatOrderPromo = store.coupons.find((c) => !c.promocode.isFirstOrderOnly);

  // Уникальный SEO-текст: собирается из реальных фактов магазина, а не шаблона.
  const storeArticle = buildStoreArticle(
    {
      name: store.name,
      category: store.category,
      categorySlug: store.categorySlug,
      about: store.about,
      conditions: store.conditions,
      coupons: store.coupons.map((c) => ({ code: c.promocode.code, bonusName: c.promocode.bonusName })),
      couponCount: store.coupons.length,
      maxDiscount: maxDisc,
      isFirstOrder: Boolean(firstOrderPromo),
      activeBloggers: store.activeBloggers,
      monthYear,
      monthRu,
      todayRu: TODAY_RU,
    },
    slug,
  );

  const breadcrumb: Record<string, unknown> = {
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
      { "@type": "ListItem", position: 3, name: store.name, item: pageUrl },
    ],
  };

  const couponsJsonLd: Record<string, unknown>[] = store.coupons.map((c) => ({
    "@context": "https://schema.org",
    "@type": "Coupon",
    name: c.promocode.bonusName || `Промокод ${c.promocode.code}`,
    description: c.promocode.bonusName || store.name,
    discountCode: c.promocode.code,
    category: "Промокод",
    validThrough: c.promocode.expires,
    dateModified: todayIso,
    url: c.affiliate.link || store.site,
    seller: { "@type": "Organization", name: store.name },
    offers: {
      "@type": "Offer",
      url: c.affiliate.link || store.site,
      priceCurrency: "RUB",
      price: 0,
      availability: "https://schema.org/InStock",
    },
  }));

  const faqItems = [
    {
      q: `Как применить промокод ${store.name}?`,
      a: `Скопируйте код кнопкой «Копировать» на этой странице, перейдите в магазин ${store.name} по нашей ссылке и вставьте код в поле «Промокод» на этапе оформления заказа. Скидка применится автоматически до оплаты.`,
    },
    {
      q: `Есть ли промокод ${store.name} на первый заказ в ${monthRu}?`,
      a: firstOrderPromo
        ? `Да! Сейчас действует промокод «${firstOrderPromo.promocode.code}» — ${firstOrderPromo.promocode.bonusName || "скидка на первый заказ"}. Скопируйте его на этой странице и примените при оформлении первого заказа.`
        : `На данный момент большинство промокодов ${store.name} подходят как для новых, так и для постоянных клиентов. Проверьте условия в карточках купонов выше.`,
    },
    {
      q: `Какой максимальный размер скидки в ${store.name} сейчас?`,
      a: `На ${monthYear} максимальная выгода по промокодам в ${store.name} составляет ${maxDisc}. Все коды проверяются каждый день и гарантированно работают при соблюдении условий акции.`,
    },
    {
      q: `Почему промокод ${store.name} может не сработать?`,
      a: `Основные причины: сумма заказа меньше минимального порога, купон действует только на определенные товары/бренды или промокод не суммируется со спецпредложениями распродажи. Все ограничения подробно расписаны в карточке каждого купона.`,
    },
    {
      q: `Бесплатны ли промокоды ${store.name} на ПромоФакт?`,
      a: `Да, абсолютно все купоны бесплатны для пользователей. Мы зарабатываем на партнерских комиссиях магазинов, что никак не увеличивает стоимость ваших покупок.`,
    },
  ];

  const faqJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  const howToJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Как применить промокод ${store.name}`,
    step: [
      {
        "@type": "HowToStep",
        name: "Скопируйте промокод",
        text: "Нажмите кнопку «Копировать» на карточке купона на этой странице, чтобы скопировать код в буфер обмена.",
      },
      {
        "@type": "HowToStep",
        name: "Перейдите в магазин",
        text: `Откройте ${store.name} по нашей партнёрской ссылке с сайта.`,
      },
      {
        "@type": "HowToStep",
        name: "Вставьте код в корзине",
        text: "Добавьте товары в корзину и вставьте промокод в поле «Промокод» на этапе оплаты. Скидка применится автоматически.",
      },
    ],
  };

  // Организация без aggregateRating: сайт не собирает оценки, а разметка
  // рейтинга «от себя» — прямое нарушение правил структурированных данных
  // (основание для ручных санкций поисковиков на весь домен).
  const ratingJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: pageUrl,
  };

  const itemListJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Промокоды и купоны ${store.name}`,
    numberOfItems: store.coupons.length,
    itemListElement: store.coupons.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Offer",
        name: `Промокод ${c.promocode.code || store.name}`,
        description: c.promocode.bonusName || store.name,
        url: c.affiliate.link || pageUrl,
        priceCurrency: "RUB",
        price: 0,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: store.name },
      },
    })),
  };

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={howToJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={ratingJsonLd} />
      {couponsJsonLd.map((c) => (
        <JsonLd key={(c.discountCode as string) ?? JSON.stringify(c)} data={c} />
      ))}

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
            href={`/category/${store.categorySlug}`}
            className="hover:text-ink transition-colors"
          >
            {store.category}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span aria-current="page">{store.name}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-white p-1 shadow-2xs">
              <StoreLogo
                slug={store.slug}
                name={store.name}
                logo={store.logo}
                site={store.site}
                size={56}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div>
              <h1 className="max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                Промокоды {store.name} на {monthYear} — скидки {maxDisc}
              </h1>
              <p className="mt-3 max-w-2xl text-ink/60">
                {store.coupons.length}{" "}
                {store.coupons.length === 1
                  ? "рабочий промокод"
                  : store.coupons.length >= 2 && store.coupons.length <= 4
                    ? "рабочих промокода"
                    : "рабочих промокодов"}
                . Коды проверены сегодня, срок действия указан в карточке.
              </p>
              {/* Звёзды «4.8 · N оценок» и «N блогеров рекомендуют» убраны:
                  оценок не существует (значение было константой), а число
                  блогеров — тоже выдуманное. Оставляем проверяемые факты:
                  дату обновления и реальное число заказов через нас. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-mint/10 border border-mint/30 px-3 py-1.5 text-xs font-bold text-ink/70">
                  Обновлено {todayRu}
                </span>
                {storeProofCount > 0 && (
                  <span className="rounded-full bg-red/10 border border-red/30 px-3 py-1.5 text-xs font-bold text-ink/70">
                    по промокодам {store.name} оформлено {storeProofCount}{" "}
                    {storeProofCount === 1
                      ? "заказ"
                      : storeProofCount >= 2 && storeProofCount <= 4
                        ? "заказа"
                        : "заказов"}{" "}
                    через нас
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://t.me/smart_zakupka"
              target="_blank"
              rel="noopener nofollow"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink shadow-[0_2px_0_rgba(11,16,43,0.06)] hover:border-ink transition-all"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#0088cc" aria-hidden="true">
                <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
              </svg>
              <span>Скидки {store.name} в Telegram</span>
            </a>
            <div className="rounded-full bg-mint/10 border border-mint/30 px-3.5 py-2 text-xs font-bold text-ink/70">
              Проверено сегодня ✓
            </div>
          </div>
        </div>

        {/* Быстрая сводка (Quick Facts) для SEO и сниппетов */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Купонов сегодня</div>
            <div className="mt-1 font-display text-xl font-extrabold text-ink">{store.coupons.length}</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Макс. выгода</div>
            <div className="mt-1 font-display text-xl font-extrabold text-red">{maxDisc}</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Первый заказ</div>
            <div className="mt-1 font-display text-base font-extrabold text-mint">
              {firstOrderPromo ? "Скидка есть" : "Для всех"}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Проверка</div>
            <div className="mt-1 font-display text-base font-extrabold text-ink">Ежедневно</div>
          </div>
        </div>

        {/* First-Party Trust & Verification History Block */}
        <div className="mt-6 rounded-2xl border border-mint/30 bg-mint/5 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint text-white font-bold text-lg shadow-2xs">
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm sm:text-base font-extrabold text-ink">
                    PromoFact Trust Score: {trust.score}/100
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-bold text-mint-dark">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                    {trust.successRate}% успешных проверок
                  </span>
                </div>
                <p className="text-xs text-ink/65 font-medium mt-0.5">
                  Последняя ручная проверка: {trust.lastCheckedRu} · Всего {trust.totalChecks} {trust.totalChecks === 1 ? "проверка" : "проверки"} ({trust.successCount} успешно)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-ink/50 self-end sm:self-auto shrink-0 bg-white px-3 py-1.5 rounded-xl border border-line shadow-2xs">
              <span>🟢 Сегодня: активен</span>
              <span>·</span>
              <span>🟢 Вчера: проверен</span>
            </div>
          </div>

          {/* Журнал последних проверок промокодов */}
          <div className="mt-4 pt-3 border-t border-mint/20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2 flex items-center justify-between">
              <span>История верификации купонов {store.name}:</span>
              <span className="text-[10px] font-medium text-ink/40">Расчёт: 50% применение + 20% свежесть + 15% объём</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {trust.history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-white/80 p-2 text-xs border border-line/50">
                  <span className="h-2 w-2 rounded-full bg-mint shrink-0" />
                  <span className="font-mono font-bold text-[11px] text-ink/60">{h.date}</span>
                  <span className="text-[11px] font-semibold text-ink truncate">{h.verifier}</span>
                  <span className="ml-auto text-[10px] font-bold text-mint-dark">✓ OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {store.coupons.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
            <div className="font-display text-4xl font-extrabold text-ink/15">
              Скоро
            </div>
            <p className="mt-3 font-bold text-ink/70">
              Здесь появится купон {store.name}
            </p>
            <p className="mt-1 text-sm text-ink/50">
              Партнёрские акции ещё не запущены — вернись позже.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.coupons.map((coupon) => (
              <CouponTicket
                key={`${coupon.id}-${coupon.promocode.code}`}
                coupon={coupon}
                proofCount={uses.usesByCode.get(coupon.promocode.code) ?? 0}
                storeProofCount={storeProofCount}
              />
            ))}
          </div>
        )}

        <YandexAdBlock
          blockId={process.env.NEXT_PUBLIC_YANDEX_STORE_AD_ID || "R-A-1234567-4"}
          className="my-10"
        />

        {/* Сводная таблица для Быстрого ответа (Колдунщика) Яндекса и Google */}
        {store.coupons.length > 0 && (
          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_0_rgba(11,16,43,0.06)]">
            <div className="bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-yellow">
              📊 Сводная таблица актуальных промокодов {store.name} на {monthYear}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="border-b border-line bg-paper text-xs font-extrabold uppercase text-ink/60">
                  <tr>
                    <th scope="col" className="px-5 py-3">Предложение / Скидка</th>
                    <th scope="col" className="px-5 py-3">Промокод</th>
                    <th scope="col" className="px-5 py-3">Условия</th>
                    <th scope="col" className="px-5 py-3 text-right">Срок действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {store.coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-paper/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-ink">
                        {c.promocode.bonusName || `Скидка по коду ${c.promocode.code}`}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block rounded-lg bg-yellow/30 border border-yellow px-2.5 py-1 font-mono text-xs font-extrabold text-ink">
                          {c.promocode.code}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-ink/70 max-w-xs">
                        {c.promocode.terms || (c.promocode.isFirstOrderOnly ? "На первый заказ" : "Для всех клиентов")}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-right font-medium text-ink/60 whitespace-nowrap">
                        до 31 декабря
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <article className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl font-extrabold">
            Промокод {store.name} — как получить максимальную скидку
          </h2>
          {storeArticle.map((paragraph, i) => (
            <p key={i} className="mt-3 leading-relaxed text-ink/70">
              {paragraph}
            </p>
          ))}
          <p className="mt-3 leading-relaxed text-ink/70">
            Открыть официальный сайт {store.name} можно{" "}
            <a
              href={store.site}
              target="_blank"
              rel="noopener nofollow sponsored"
              className="font-semibold text-ink underline underline-offset-2 hover:text-red transition-colors"
            >
              по этой ссылке
            </a>
            . Если купон перестал действовать — оставьте заявку, и мы обновим подборку {store.name} в ближайшее время.
          </p>
        </article>

        {store.conditions && (
          <article className="mt-8 max-w-3xl">
            <div className="font-display text-lg font-extrabold">Условия</div>
            <p className="mt-3 leading-relaxed text-ink/70">
              {store.conditions}
            </p>
          </article>
        )}

        <section className="mt-10 max-w-3xl" aria-label="Частые вопросы">
          <h2 className="font-display text-xl font-extrabold">
            Частые вопросы про промокоды {store.name}
          </h2>
          <div className="mt-5 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-line bg-white px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-bold text-ink">
                  {item.q}
                  <span className="float-right text-red group-open:hidden">+</span>
                  <span className="float-right text-red hidden group-open:inline">
                    −
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <HowToApply />

        <section className="mt-10 max-w-3xl rounded-2xl border border-mint/30 bg-mint/10 p-5">
          <Link
            href={`/category/${store.categorySlug}`}
            className="flex items-center justify-between gap-3 group"
          >
            <div>
              <div className="font-display font-extrabold group-hover:text-red transition-colors">
                🏷 Все промокоды в категории «{store.category}»
              </div>
              <p className="mt-1 text-sm text-ink/55">
                Смотреть скидки других магазинов в этой же категории
              </p>
            </div>
            <span className="text-lg font-bold text-ink/30 group-hover:text-red transition-colors shrink-0">
              →
            </span>
          </Link>
        </section>

        <OtherStores current={store.slug} category={store.categorySlug} />

        {/* Ссылки на статьи блога по теме магазина (Двунаправленный граф перелинковки) */}
        {(() => {
          const storeArticles = ARTICLES.filter(
            (a) =>
              a.title.toLowerCase().includes(store.name.toLowerCase()) ||
              a.description.toLowerCase().includes(store.name.toLowerCase()) ||
              a.title.toLowerCase().includes(store.category.toLowerCase()) ||
              a.description.toLowerCase().includes(store.category.toLowerCase())
          ).slice(0, 2);

          const list = storeArticles.length > 0 ? storeArticles : ARTICLES.slice(0, 2);

          return (
            <section className="mt-10 max-w-3xl rounded-3xl border border-line bg-white p-6 shadow-xs">
              <h3 className="font-display text-base font-extrabold text-ink mb-3 flex items-center gap-2">
                <span>📚</span>
                <span>Полезные гиды и советы по покупкам в {store.name}</span>
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/sovety/${a.slug}`}
                    className="group rounded-2xl border border-line/60 bg-paper/40 p-3.5 hover:bg-white hover:border-ink/20 transition-all shadow-2xs"
                  >
                    <div className="font-display text-xs font-bold text-ink group-hover:text-red transition-colors line-clamp-2">
                      {a.title}
                    </div>
                    <span className="mt-2 text-[11px] font-bold text-red block">
                      Читать статью →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}
      </div>
    </main>
  );
}
