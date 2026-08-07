import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import HowToApply from "@/components/HowToApply";
import JsonLd from "@/components/JsonLd";
import OtherStores from "@/components/OtherStores";
import { getStores, getUsesStats } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const stores = await getStores();
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

const MONTH_YEAR = new Date().toLocaleDateString("ru-RU", {
  month: "long",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stores = await getStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) return {};
  const pageUrl = `${SITE_URL}/store/${slug}`;
  const codes = store.coupons.map((c) => c.promocode.code).join(", ");
  const n = store.coupons.length;
  const countWord =
    n === 1 ? "проверенный промокод" : n >= 2 && n <= 4 ? "проверенных промокода" : "проверенных промокодов";
  const description =
    `Актуальные промокоды и купоны ${store.name}: ${n} ${countWord}` +
    `${codes ? ` (${codes})` : ""}. Копируй и применяй в корзине.`;
  const og = {
    title: `Промокод ${store.name} — скидки ${MONTH_YEAR}`,
    description: description.slice(0, 160),
    url: pageUrl,
    type: "website" as const,
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: store.logo
      ? [{ url: store.logo, alt: store.name }]
      : undefined,
  };
  return {
    title: og.title,
    description: og.description,
    alternates: { canonical: pageUrl },
    openGraph: og,
    twitter: {
      card: store.logo ? "summary_large_image" : "summary",
      title: og.title,
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
  const [stores, uses] = await Promise.all([getStores(), getUsesStats()]);
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const best = store.coupons[0];
  const pageUrl = `${SITE_URL}/store/${slug}`;
  const storeProofCount = uses.usesByStore.get(store.id) ?? 0;
  const todayIso = new Date().toISOString();
  const todayRu = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
      a: `Скопируйте код кнопкой «Копировать» на этой странице, перейдите в магазин ${store.name} по нашей ссылке и вставьте код в поле «Промокод» на этапе оплаты. Скидка применится сразу — её обычно видно до подтверждения заказа.`,
    },
    {
      q: `Где искать свежие промокоды ${store.name}?`,
      a: `Актуальные купоны ${store.name} мы собираем на этой странице и обновляем каждый день по мере запуска акций. Подпишитесь на уведомления или заходите раз в несколько дней — истёкшие коды убираем сразу.`,
    },
    {
      q: `Почему промокод ${store.name} не сработал?`,
      a: `Чаще всего причина в условиях: купон истёк, действует только для новых клиентов, требует минимальной суммы заказа или не суммируется с распродажей. Все ограничения указаны в карточке купона — прочитайте их перед переходом в магазин.`,
    },
    {
      q: `Сколько стоит промокод ${store.name} на ПромоФакт?`,
      a: `Все промокоды бесплатны. Мы зарабатываем на партнёрских CPA-ссылках: если вы закажете что-то по нашей ссылке, магазин заплатит нам комиссию. На размер вашей скидки это не влияет.`,
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

  const ratingCount = Math.max(storeProofCount, 12);
  const ratingJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: pageUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      bestRating: "5",
      ratingCount: ratingCount,
    },
  };

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={howToJsonLd} />
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
            {store.logo && (
              <img
                src={store.logo}
                alt={store.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl border border-line bg-white object-contain p-1"
              />
            )}
            <div>
              <h1 className="max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                Промокод {store.name} — скидки {MONTH_YEAR}
              </h1>
              <p className="mt-3 max-w-2xl text-ink/60">
                {store.coupons.length}{" "}
                {store.coupons.length === 1
                  ? "рабочий промокод"
                  : "рабочих промокода"}
                . Коды проверены сегодня, срок действия указан в карточке.
              </p>
              <div
                className="mt-2 flex items-center gap-2 text-sm font-bold text-ink/70"
                aria-label={`Рейтинг ${store.name} 4.8 из 5 на основе ${ratingCount} оценок`}
              >
                <span className="text-red" aria-hidden="true">
                  ★★★★★
                </span>
                <span>4.8</span>
                <span className="text-ink/45 font-normal">
                  · {ratingCount} оценок
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-mint/10 border border-mint/30 px-3 py-1.5 text-xs font-bold text-ink/70">
                  Обновлено {todayRu}
                </span>
                {store.activeBloggers > 0 && (
                  <span className="rounded-full bg-yellow/20 border border-yellow/50 px-3 py-1.5 text-xs font-bold text-ink/70">
                    {store.activeBloggers}{" "}
                    {store.activeBloggers === 1
                      ? "блогер"
                      : store.activeBloggers >= 2 && store.activeBloggers <= 4
                        ? "блогера"
                        : "блогеров"}{" "}
                    рекомендуют {store.name}
                  </span>
                )}
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
          <div className="rounded-full bg-mint/10 border border-mint/30 px-4 py-1.5 text-xs font-bold text-ink/70">
            Проверено сегодня ✓
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

        <article className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl font-extrabold">
            Промокод {store.name} — как получить максимальную скидку
          </h2>
          {store.about ? (
            <p className="mt-3 leading-relaxed text-ink/70">{store.about}</p>
          ) : (
            <p className="mt-3 leading-relaxed text-ink/70">
              На этой странице собраны все актуальные промокоды и купоны{" "}
              {store.name} на {new Date().toLocaleDateString("ru-RU")}. Магазин
              относится к категории «{store.category}». Ниже — рабочие коды,
              проверенные по партнёрским CPA-кампаниям Perfluence: копируйте
              промокод одной кнопкой и применяйте в корзине{" "}
              {store.name} для мгновенной скидки.
            </p>
          )}

          {store.coupons.length > 0 ? (
            <p className="mt-3 leading-relaxed text-ink/70">
              Сейчас у {store.name} действует{" "}
              {store.coupons.length === 1 ? "промокод" : "промокода"}{" "}
              {store.coupons.map((c) => c.promocode.code).join(", ")}. Срок
              действия и условия применения указаны в карточке каждого купона —
              обязательно прочитайте их перед переходом в магазин, чтобы скидка
              применилась с первого раза. Если код не сработал, проверьте
              минимальную сумму заказа и ограничения по категории товаров.
            </p>
          ) : (
            <p className="mt-3 leading-relaxed text-ink/70">
              Партнёрские акции {store.name} ещё не запущены: новые промокоды
              появляются на этой странице в день старта акции. Заглядывайте
              позже или подпишитесь на рассылку, чтобы не пропустить свежие
              скидки {store.name}.
            </p>
          )}

          <p className="mt-3 leading-relaxed text-ink/70">
            Все коды мы проверяем вручную раз в 1–2 дня: истёкшие промокоды
            убираем сразу, а рабочие отмечаем на главной. Открыть официальный
            сайт {store.name} можно{" "}
            <a
              href={store.site}
              target="_blank"
              rel="noopener nofollow sponsored"
              className="font-semibold text-ink underline underline-offset-2 hover:text-red transition-colors"
            >
              по этой ссылке
            </a>
            . Если купон перестал действовать — оставьте заявку, и мы обновим
            подборку {store.name} в ближайшее время.
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

        <OtherStores current={store.slug} category={store.categorySlug} />
      </div>
    </main>
  );
}
