import Icon from "@/components/Icon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPausedPublisherStore } from "@/lib/publisherPauses";
import PromoBanner from "@/components/PromoBanner";
import { getActivePromoBanners } from "@/lib/promoBanners";
import HowToApply from "@/components/HowToApply";
import JsonLd from "@/components/JsonLd";
import OtherStores from "@/components/OtherStores";
import YandexAdBlock from "@/components/YandexAdBlock";
import StoreLogo from "@/components/StoreLogo";
import StoreCouponBrowser from "@/components/StoreCouponBrowser";
import StoreSummaryTable from "@/components/StoreSummaryTable";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAllStores, getUsesStats } from "@/lib/perfluence";
import { buildStoreArticle, buildStoreDescription } from "@/lib/storeSeoContent";
import { getMaxVerifiedDiscount, hasGiftOffer } from "@/lib/storeDiscount";
import { getStoreExtra, hasActiveRequiredCoupons } from "@/lib/storeExtras";
import { getArticles } from "@/lib/articles";
import { getOfferSchema, getOfferDisplayName } from "@/lib/seoOfferSchema";
import { isRealPromoCode } from "@/lib/dedupe";
import { formatStoreOfferTitle, formatPriorityStoreTitle, getStoreHeadlineOfferCounts, formatStoreOfferCounts } from "@/lib/storeOfferHeadline";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// New site-scoped Admitad stores arrive after deployment. Do not 404 on
// slugs absent from generateStaticParams at build time.
export const dynamicParams = true;
export const revalidate = 600;

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
  if (isPausedPublisherStore(slug)) notFound();
  const stores = await getAllStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) return {};
  const pageUrl = `${SITE_URL}/store/${slug}`;
  const n = store.coupons.length;
  const { codes: realCodeCount, codeFree: codeFreeCount, barcodes: barcodeCount } = getStoreHeadlineOfferCounts(store.coupons);
  const maxDisc = getMaxVerifiedDiscount(store.coupons);
  const hasGift = hasGiftOffer(store.coupons);
  const monthYear = getCapitalizedMonthYear();
  const monthRu = getMonthRuPrep();
  const storeExtra = getStoreExtra(slug);

  // Кастомные SEO-метаданные с конкретными условиями разрешено применять ТОЛЬКО если
  // все требуемые промокоды действительно активны (не истекли) среди купонов магазина.
  const useCustomMetadata = hasActiveRequiredCoupons(storeExtra, store.coupons);

  // Бренд к заголовку добавляет шаблон в layout («%s — ПромоФакт»), поэтому
  // сам заголовок его не содержит — иначе в выдаче получалось «… | ПромоФакт
  // — ПромоФакт». А вот в OpenGraph и Twitter шаблон не применяется, туда
  // бренд подставляем явно.
  const priorityTitle = formatPriorityStoreTitle({
    slug, month: monthRu, codes: realCodeCount, codeFree: codeFreeCount,
  });
  const title = priorityTitle ?? (useCustomMetadata && storeExtra?.customTitle
    ? storeExtra.customTitle(monthRu, monthYear)
    : n > 0
      ? formatStoreOfferTitle({
          name: store.name,
          month: monthRu,
          codes: realCodeCount,
          codeFree: codeFreeCount,
          barcodes: barcodeCount,
          maxDiscount: maxDisc,
          searchBrandPromo: slug === "tasty-coffee",
        })
      : `Скидки и акции ${store.name} на ${monthYear}`);
  const titleWithBrand = `${title} | ${SITE_NAME}`;
  const description =
    useCustomMetadata && storeExtra?.customDescription
      ? storeExtra.customDescription(monthRu, monthYear)
      : buildStoreDescription({
          name: store.name,
          category: store.category,
          categorySlug: store.categorySlug,
          about: store.about,
          conditions: store.conditions,
          coupons: store.coupons.map((c) => ({ code: c.promocode.code, bonusName: c.promocode.bonusName, isBarcode: c.promocode.isBarcode })),
          couponCount: n,
          maxDiscount: maxDisc,
           hasGiftOffer: hasGift,
          isFirstOrder: store.coupons.some((c) => c.promocode.isFirstOrderOnly),
          activeBloggers: store.activeBloggers,
          monthYear,
          monthRu,
          todayRu: TODAY_RU,
        });

  // Безопасное усечение Description по границе предложения или слова без обрезания на полуслове
  const safeOgDescription = (() => {
    if (description.length <= 160) return description;
    const truncated = description.slice(0, 160);
    const lastPunct = Math.max(truncated.lastIndexOf(". "), truncated.lastIndexOf("! "), truncated.lastIndexOf("? "));
    if (lastPunct > 50) return truncated.slice(0, lastPunct + 1).trim();
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 50) return truncated.slice(0, lastSpace).trim();
    return truncated.trim();
  })();

  const og = {
    title: titleWithBrand,
    description: safeOgDescription,
    url: pageUrl,
    type: "website" as const,
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `Промокоды ${store.name} — ${SITE_NAME}`,
      },
    ],
  };
  return {
    title,
    description: safeOgDescription,
    alternates: { canonical: pageUrl },
    robots: {
      index: n > 0,
      follow: true,
    },
    openGraph: og,
    twitter: {
      card: store.logo ? "summary_large_image" : "summary",
      title: titleWithBrand,
      description: safeOgDescription,
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
  if (isPausedPublisherStore(slug)) notFound();
  const [stores, uses] = await Promise.all([getAllStores(), getUsesStats()]);
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const pageUrl = `${SITE_URL}/store/${slug}`;
  const { codes: realCodeCount, codeFree: codeFreeCount, barcodes: barcodeCount } = getStoreHeadlineOfferCounts(store.coupons);
  const offerCountLabel = formatStoreOfferCounts(realCodeCount, codeFreeCount, barcodeCount);
  const storeProofCount = uses.usesByStore.get(store.id) ?? 0;
  const todayIso = TODAY_ISO;
  const todayRu = TODAY_RU;
  const monthYear = getCapitalizedMonthYear();
  const monthRu = getMonthRuPrep();
  const maxDisc = getMaxVerifiedDiscount(store.coupons);
  const hasGift = hasGiftOffer(store.coupons);

  const firstOrderPromo = store.coupons.find((c) =>
    c.promocode.isFirstOrderOnly && isRealPromoCode(c.promocode.code)
  );


  // Уникальный SEO-текст: собирается из реальных фактов магазина, а не шаблона.
  const storeArticle = buildStoreArticle(
    {
      name: store.name,
      category: store.category,
      categorySlug: store.categorySlug,
      about: store.about,
      conditions: store.conditions,
      coupons: store.coupons.map((c) => ({ code: c.promocode.code, bonusName: c.promocode.bonusName, isBarcode: c.promocode.isBarcode })),
      couponCount: store.coupons.length,
      maxDiscount: maxDisc,
      hasGiftOffer: hasGift,
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

  const couponsJsonLd: Record<string, unknown>[] = store.coupons.map((c) =>
    getOfferSchema(store.name, c.affiliate.link || store.site, c.promocode, store.logo),
  );

  const storeExtra = getStoreExtra(slug);
  // Offer-specific FAQ из StoreExtra фильтруем по сроку только если для магазина явно
  // заданы requiredActiveCodes. Если requiredActiveCodes нет (например, общие FAQ для
  // FARFOR, RUTUBE, СберЗдоровья) — FAQ сохраняется в полном объёме.
  const customFaqItems =
    !storeExtra?.faq
      ? []
      : storeExtra.requiredActiveCodes && storeExtra.requiredActiveCodes.length > 0
        ? hasActiveRequiredCoupons(storeExtra, store.coupons)
          ? storeExtra.faq
          : []
        : storeExtra.faq;

  // Narrow FAQs to the actual GSC search intent without promising unavailable coupons.
  const searchIntentFaq = slug === "tasty-coffee"
    ? [
        {
          q: "Где найти промокод Tasty Coffee на кофе?",
          a: store.coupons.length > 0
            ? "Действующие предложения Tasty Coffee перечислены в карточках выше. Перед заказом проверьте срок действия, минимальный чек и исключения."
            : "Сейчас в каталоге нет подтверждённого действующего промокода Tasty Coffee. Проверяйте условия акций в магазине.",
        },
      ]
    : slug === "pyaterochka"
      ? [
          {
            q: "Где взять промокод Пятёрочки Доставка на повторный заказ?",
            a: "Проверьте в карточке предложения, разрешено ли его использование постоянным покупателям. Код для первого заказа не обязательно подходит для повторного.",
          },
          {
            q: "Промокод Пятёрочки даёт бесплатную доставку?",
            a: "Скидка на товары и бесплатная доставка — разные условия. Итоговую стоимость доставки нужно проверить в корзине до оплаты.",
          },
        ]
      : slug === "yandex-eda"
        ? [
            {
              q: "Как найти действующий промокод Яндекс Еда?",
              a: realCodeCount > 0
                ? "Действующие коды и сроки указаны в карточках выше. Проверьте минимальную сумму, категорию заказа и применимость в своём городе до оплаты."
                : "Сейчас на этой странице нет подтверждённого вводимого промокода Яндекс Еда. Акции без кода, если они есть, показаны отдельно.",
            },
            {
              q: "Можно ли применить промокод Яндекс Еда на повторный заказ?",
              a: "Не каждый купон подходит для повторного заказа. Смотрите ограничения конкретного предложения и проверяйте скидку в корзине до оплаты.",
            },
          ]
        : slug === "yandeks-puteshestviya"
        ? [
            {
              q: "Есть ли промокод Яндекс Путешествий на первый заказ?",
              a: firstOrderPromo
                ? "Посмотрите действующее предложение для первого заказа в карточках выше: применимость зависит от дат, выбранного отеля и правил акции."
                : "Подтверждённого предложения именно на первый заказ сейчас в карточках нет. Не рассчитывайте на скидку без проверки условий при бронировании.",
            },
            {
              q: "Как проверить скидку при бронировании в Яндекс Путешествиях?",
              a: "Сравните итоговую цену, включая обязательные сборы, и условия отмены до и после применения кода. Оформляйте заказ только после подтверждения суммы.",
            },
          ]
        : [];

  const faqItems = [
    ...customFaqItems,
    ...searchIntentFaq,
    realCodeCount > 0
      ? {
          q: `Как применить промокод ${store.name}?`,
          a: `Скопируйте код кнопкой «Копировать» на этой странице, перейдите в магазин ${store.name} по нашей ссылке и вставьте код в поле «Промокод» на этапе оформления заказа. Если условия выполнены, скидка отобразится в корзине до оплаты.`,
        }
      : {
          q: `Как воспользоваться акцией ${store.name} без промокода?`,
          a: `Откройте действующее предложение на этой странице, проверьте его условия и перейдите по ссылке в магазин ${store.name}. Для акций без кода вводить промокод не требуется.`,
        },
    {
      q: `Есть ли промокод ${store.name} на первый заказ в ${monthRu}?`,
      a: firstOrderPromo
        ? `Да! Сейчас действует промокод «${firstOrderPromo.promocode.code}» — ${firstOrderPromo.promocode.bonusName || "скидка на первый заказ"}. Скопируйте его на этой странице и примените при оформлении первого заказа.`
        : `Подтверждённого предложения специально для первого заказа сейчас нет. Наличие других действующих предложений и их условия указаны в карточках выше.`,
    },
    {
      q: `Какие скидки и подарки есть в ${store.name} сейчас?`,
      a:
        maxDisc && maxDisc !== null
          ? `На ${monthYear} максимальная выгода по промокодам в ${store.name} составляет ${maxDisc}. Истёкшие коды убираются со страницы автоматически; перед заказом сверьте условия в карточке купона.`
          : store.coupons.length > 0
            ? `Для ${store.name} есть ${store.coupons.length} действующих предложений. Размер выгоды не указан в виде фиксированной денежной скидки; проверьте условия в карточках.`
            : `Сейчас для ${store.name} нет опубликованных действующих промокодов. Не используйте истёкшие коды без проверки на сайте магазина.`,
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

  // Разметку Product здесь не отдаём: промокод — не товар, а без настоящих
  // отзывов и рейтинга Google помечал её ошибками («нет review/aggregateRating»).
  // Подставлять выдуманный рейтинг нельзя — его уже убирали по аудиту.

  const organizationJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    ...(store.site ? { url: store.site } : {}),
    ...(store.logo ? { logo: store.logo } : {}),
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
        name: getOfferDisplayName(store.name, c.promocode),
        description: c.promocode.bonusName || store.name,
        url: c.affiliate.link || pageUrl,
        priceValidUntil: c.promocode.expires,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: store.name, ...(store.logo ? { logo: store.logo } : {}) },
      },
    })),
  };

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd} />
      {realCodeCount > 0 && <JsonLd data={howToJsonLd} />}
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={organizationJsonLd} />
      {couponsJsonLd.map((c) => (
        <JsonLd key={(c.discountCode as string) ?? JSON.stringify(c)} data={c} />
      ))}

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: store.category, href: `/category/${store.categorySlug}` },
            { label: store.name },
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
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-ink break-words">
                {`${barcodeCount > 0 ? "Промокоды и штрихкоды" : realCodeCount > 0 ? (codeFreeCount > 0 ? "Промокоды и акции" : "Промокоды") : "Акции"} ${store.name} на ${monthYear}${maxDisc ? ` — скидки ${maxDisc}` : ""}`}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-ink/60">
                {offerCountLabel}. Срок действия указан в карточке.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-paper border border-line px-2.5 py-1 text-[11px] sm:text-xs font-bold text-ink/65">
                  Обновлено {todayRu}
                </span>
                {storeProofCount > 0 && (
                  <span className="rounded-full bg-red/10 border border-red/30 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-ink/70">
                    {storeProofCount}{" "}
                    {storeProofCount === 1
                      ? "заказ оформлен"
                      : storeProofCount >= 2 && storeProofCount <= 4
                        ? "заказа оформлено"
                        : "заказов оформлено"}{" "}
                    через нас
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://t.me/smart_zakupka"
              target="_blank"
              rel="noopener nofollow"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink shadow-[0_2px_0_rgba(11,16,43,0.06)] hover:border-ink transition-all"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#0088cc" aria-hidden="true">
                <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
              </svg>
              <span>Скидки в Telegram</span>
            </a>
          </div>
        </div>

        {/* Clear distinction between Flowwow and FMART by flowwow:
            separate publisher URLs, discount codes and ERID. */}
        {slug === "flowwow" && stores.some((s) => s.slug === "fmart" && s.coupons.length > 0) && (
          <aside aria-label="Отдельный проект FMART" className="mt-5 rounded-2xl border border-line bg-paper/60 px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-ink">Ищете промокоды FMART by flowwow?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/70 sm:text-sm">
              FMART — отдельный проект с собственными промокодами и рекламной ссылкой.
              Их нет в купонах обычного Flowwow.
            </p>
            <Link href="/store/fmart#offers" className="mt-2 inline-flex min-h-11 items-center text-sm font-extrabold text-red underline-offset-4 hover:underline">
              Открыть актуальные промокоды FMART →
            </Link>
          </aside>
        )}
        {slug === "fmart" && (
          <p className="mt-4 rounded-xl border border-line bg-paper/60 px-4 py-3 text-xs leading-relaxed text-ink/75 sm:text-sm">
            Это предложения FMART by flowwow, а не отдельные промокоды сервиса Flowwow.
            Действующие коды, сроки и условия перечислены ниже. Применимость проверяйте в корзине.
          </p>
        )}

        {/* 1. ГЛАВНЫЙ БЛОК: АКТИВНЫЕ КУПОНЫ И ПРОМОКОДЫ (СРАЗУ НА 1-М ЭКРАНЕ) */}
        <div id="offers" className="mt-6 scroll-mt-24">
          {store.coupons.length === 0 ? (
            <div className="rounded-3xl border border-line bg-white p-6 sm:p-10 text-center shadow-xs">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-paper border border-line mb-3 text-ink/40">
                <Icon name="tag" size={24} />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
                Подтверждённых промокодов для {store.name} пока нет
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-ink/65 max-w-md mx-auto leading-relaxed">
                {slug === "winlab"
                  ? "Мы получили новые коды ВинЛаб от партнёрской сети, но для их публикации ещё нужно проверить рекламную маркировку. Старые коды не показываем. Магазин остаётся в каталоге."
                  : "На данный момент у нас нет подтверждённых действующих предложений этого магазина. Проверяйте ассортимент и цены на официальном сайте."}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                {store.site && (
                  <a
                    href={store.site}
                    target="_blank"
                    rel="noopener nofollow"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red to-red-dark px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    <span>Перейти на официальный сайт {store.name} →</span>
                  </a>
                )}
                <a
                  href="https://t.me/smart_zakupka"
                  target="_blank"
                  rel="noopener nofollow"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-5 py-3 text-xs sm:text-sm font-bold text-ink hover:border-ink transition-all"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="#0088cc" aria-hidden="true">
                    <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
                  </svg>
                  <span>Следить за новостями в Telegram</span>
                </a>
              </div>
            </div>
          ) : (
            <StoreCouponBrowser
              coupons={store.coupons}
              storeName={store.name}
              usesMap={Object.fromEntries(
                store.coupons.map((c) => [c.promocode.code, uses.usesByCode.get(c.promocode.code) ?? 0])
              )}
              storeProofCount={storeProofCount}
            />
          )}
        </div>

        {/* Купоны конкретного магазина всегда выше партнёрского креатива.
            Баннеры показываем только для явно соответствующей страницы. */}
        {getActivePromoBanners({ storeSlug: store.slug }).map((banner) => (
          <div key={banner.id} className="mt-6">
            <PromoBanner banner={banner} />
          </div>
        ))}

        {/* 2. Быстрая сводка (Quick Facts) для SEO и сниппетов */}
        <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-white p-3 sm:p-4 text-center">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink/45">Предложений сегодня</div>
            <div className="mt-1 font-display text-lg sm:text-xl font-extrabold text-ink">{store.coupons.length}</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3 sm:p-4 text-center">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink/45">{maxDisc ? "Макс. скидка" : "Тип предложения"}</div>
            <div className="mt-1 font-display text-lg sm:text-xl font-extrabold text-red">
              {maxDisc ? maxDisc : hasGift ? "Подарок" : "Акция"}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3 sm:p-4 text-center">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink/45">Первый заказ</div>
            <div className="mt-1 font-display text-sm sm:text-base font-extrabold text-mint">
              {firstOrderPromo ? "Скидка есть" : "Для всех"}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3 sm:p-4 text-center">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink/45">Оформление</div>
            <div className="mt-1 font-display text-sm sm:text-base font-extrabold text-ink">По правилам магазина</div>
          </div>
        </div>

        <YandexAdBlock
          blockId={process.env.NEXT_PUBLIC_YANDEX_STORE_AD_ID || "R-A-1234567-4"}
          className="my-10"
        />

        {/* Сводная таблица для Быстрого ответа (Колдунщика) Яндекса и Google */}
        <StoreSummaryTable
          coupons={store.coupons}
          storeName={store.name}
          storeSlug={store.slug}
        />

        <article className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl font-extrabold">
            {maxDisc ? `Предложения ${store.name} — условия максимальной скидки` : `Промокоды и акции ${store.name} — условия и подарки`}
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

        {storeExtra?.cities && (
          <section className="mt-8 max-w-3xl" aria-label={storeExtra.cities.heading}>
            <h2 className="font-display text-xl font-extrabold">{storeExtra.cities.heading}</h2>
            <p className="mt-3 leading-relaxed text-ink/70">{storeExtra.cities.text}</p>
            <p className="mt-4 text-sm font-bold text-ink/60">Чаще всего промокоды {store.name} ищут в городах:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {storeExtra.cities.list.map((city) => (
                <li key={city} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-ink/70">
                  {city}
                </li>
              ))}
            </ul>
          </section>
        )}

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
                <Icon name="tag" size={14} className="inline" /> Все промокоды в категории «{store.category}»
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

        <OtherStores
          current={store.slug}
          category={store.categorySlug}
          storeName={store.name}
        />

        {/* Ссылки на статьи блога по теме магазина (Двунаправленный граф перелинковки) */}
        {(() => {
          const storeArticles = getArticles().filter((a) =>
            a.related.some((link) => link.href === `/store/${store.slug}`) ||
            a.title.toLowerCase().includes(store.name.toLowerCase()) ||
            a.description.toLowerCase().includes(store.name.toLowerCase())
          ).slice(0, 3);

          // Never inject unrelated blog articles just to fill a widget.
          if (storeArticles.length === 0) return null;

          return (
            <section className="mt-10 max-w-3xl rounded-3xl border border-line bg-white p-6 shadow-xs">
              <h3 className="font-display text-base font-extrabold text-ink mb-3 flex items-center gap-2">
                <Icon name="clipboard" size={16} />
                <span>Полезные гиды и советы по покупкам в {store.name}</span>
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {storeArticles.map((a) => (
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
