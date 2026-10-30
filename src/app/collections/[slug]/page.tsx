import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponTicket from "@/components/CouponTicket";
import CollectionFilterContainer from "@/components/CollectionFilterContainer";
import JsonLd from "@/components/JsonLd";
import { getCoupons, getUsesStats } from "@/lib/perfluence";
import { getCollections, getCollectionCoupons, MIN_INDEXABLE_COLLECTION_OFFERS } from "@/lib/collections";
import { getShoppingDayStatus, getBlackFridayStatus } from "@/lib/seasonalEvents";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Keep thematic pages current as partner catalog offers change.
export const dynamicParams = false;
export const revalidate = 900;

export async function generateStaticParams() {
  try {
    const collections = await getCollections();
    if (collections.length > 0)
      return collections.map((col) => ({ slug: col.slug }));
    console.error(
      "[build] getCollections пуст — /collections не сгенерированы",
    );
  } catch (e) {
    console.error(
      "[build] ошибка getCollections при генерации /collections",
      e,
    );
  }
  return [];
}

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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [collections, all] = await Promise.all([getCollections(), getCoupons()]);
  const col = collections.find((c) => c.slug === slug);
  if (!col) return {};
  const count = getCollectionCoupons(col, all).length;
  const pageUrl = `${SITE_URL}/collections/${slug}`;
  let pageTitle = `Промокоды и акции: ${col.name}`;
  let description = count >= MIN_INDEXABLE_COLLECTION_OFFERS
    ? `${col.name}: ${count} предложений с условиями и сроками действия. Проверьте ограничения скидок перед заказом.`
    : `${col.name}: сейчас недостаточно действующих предложений для подборки. Посмотрите полный каталог.`;

  if (slug === "den-shopinga-11-11") {
    pageTitle = "Промокоды на День шопинга 11.11 (2026) — скидки и купоны";
    description = "Все действующие промокоды и скидки ко Всемирному дню шопинга 11.11 (2026) в интернет-магазинах России. Сравните условия купонов на маркетплейсы, одежду, косметику и электронику.";
  } else if (slug === "black-friday") {
    pageTitle = "Чёрная Пятница 2026: промокоды, скидки и купоны на распродажу";
    description = "Промокоды и купоны на Чёрную Пятницу 2026 в России. Максимальные скидки до 90% на маркетплейсах, в магазинах техники, одежды и косметики. Проверяйте условия перед оплатой.";
  }

  const ogTitle = `${pageTitle} — ${SITE_NAME}`;
  const og = {
    title: ogTitle,
    description,
    url: pageUrl,
    type: "website" as const,
    locale: "ru_RU",
    siteName: SITE_NAME,
  };
  return {
    title: pageTitle,
    description: og.description,
    alternates: { canonical: pageUrl },
    robots: { index: count >= MIN_INDEXABLE_COLLECTION_OFFERS, follow: true },
    openGraph: og,
    twitter: {
      card: "summary",
      title: og.title,
      description: og.description,
    },
  };
}

function seoText(
  colName: string,
  storeNames: string[],
  storeCount: number,
  couponCount: number,
): string[] {
  const top = storeNames.slice(0, 3);
  const shopList =
    storeNames.length > 0
      ? storeNames.slice(0, 5).join(", ")
      : "скидки на популярные бренды";
  return [
    `В подборке «${colName}» сейчас ${couponCount} ${plural(
      couponCount,
      "актуальный купон",
      "актуальных купона",
      "актуальных купонов",
    )} от ${storeCount} ${plural(
      storeCount,
      "магазина-партнёра",
      "магазинов-партнёров",
      "магазинов-партнёров",
    )}. Предложения по магазинам: ${shopList}. Сроки и условия приведены в карточках; итоговую скидку нужно проверить перед оплатой.`,
    `Как применить промокод: скопируйте код кнопкой «Копировать», перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» на этапе оплаты. Условия у каждого купона свои: где-то нужна минимальная сумма заказа, где-то промокод действует только для новых клиентов. Читайте условия до перехода: скидка может не подойти выбранным товарам или аккаунту.`,
    `Состав подборки «${colName}» меняется по мере обновления партнёрских программ. Сравните условия, если выбираете ${
      top.length > 0 ? `акции ${top.join(", ")}` : "выгодные предложения"
    } и специальные скидки недели.`,
  ];
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collections, all, uses] = await Promise.all([
    getCollections(),
    getCoupons(),
    getUsesStats(),
  ]);
  const col = collections.find((c) => c.slug === slug);
  if (!col) notFound();

  const shoppingStatus = getShoppingDayStatus();
  const bfStatus = getBlackFridayStatus();

  const list = getCollectionCoupons(col, all);
  const storeNames = [...new Set(list.map((c) => c.store.name))];
  const paragraphs = seoText(col.name, storeNames, storeNames.length, list.length);
  const pageUrl = `${SITE_URL}/collections/${slug}`;

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Подборки", item: `${SITE_URL}/collections` },
      { "@type": "ListItem", position: 3, name: col.name, item: pageUrl },
    ],
  };

  const defaultFaq = [
    {
      q: `Где искать промокоды ${col.name.toLowerCase()}?`,
      a: `На этой странице показаны предложения, доступные в каталоге. Состав обновляется по мере синхронизации с партнёрами; условия нужно проверить у магазина.`,
    },
    {
      q: `Как применить промокод ${col.name.toLowerCase()}?`,
      a: "Скопируйте код кнопкой «Копировать» на карточке, перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» на этапе оплаты. Магазин покажет итоговую сумму до оплаты, если предложение подходит вашему заказу.",
    },
  ];

  const faqList = col.faq && col.faq.length > 0 ? col.faq : defaultFaq;

  const faqJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqList.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const listing: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Промокоды и купоны: ${col.name}`,
    numberOfItems: list.length,
    itemListElement: list.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Offer",
        name: c.promocode.code ? `Промокод ${c.promocode.code}` : `Акция ${c.store.name}`,
        description: c.promocode.bonusName || c.store.name,
        url: `${SITE_URL}/store/${c.store.slug}`,
        priceValidUntil: c.promocode.expires,

        seller: { "@type": "Organization", name: c.store.name },
      },
    })),
  };

  const collectionJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Промокоды и купоны: ${col.name}`,
    description: col.description,
    url: pageUrl,
    inLanguage: "ru-RU",
    mainEntity: listing,
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
      <JsonLd data={breadcrumb} />
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={faqJsonLd} />


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
          <Link href="/collections" className="hover:text-ink transition-colors">
            Подборки
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span aria-current="page">{col.name}</span>
        </nav>

        <h1 className="mt-6 max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Промокоды и купоны: {col.name}
        </h1>
        <p className="mt-3 max-w-2xl text-ink/60">
          {list.length > 0
            ? `${list.length} предложений с условиями и датами действия. Проверяйте итоговую сумму перед заказом.`
            : "Сейчас действующих предложений в подборке нет. Откройте полный каталог."}
        </p>
        {col.slug === "den-shopinga-11-11" && (
          <div className="mt-6 max-w-4xl rounded-3xl border border-yellow/30 bg-gradient-to-br from-amber-50 via-yellow/10 to-white p-5 sm:p-7 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-ink shadow-2xs">
                <span>🔥</span>
                <span>{shoppingStatus.badgeText}</span>
              </span>
              <span className="text-xs font-semibold text-ink/70">
                Период: {shoppingStatus.formattedTargetDate}
              </span>
            </div>
            <h2 className="mt-3 font-display text-lg sm:text-xl font-extrabold text-ink">
              {shoppingStatus.headline}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink/75">
              Всемирный день шопинга 11.11 — крупнейшая распродажа осени. Промокоды магазинов одежды, косметики, электроники и маркетплейсов уже проверены. Сохраняйте товары в корзину и активируйте промокоды на старте акции.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-yellow/40 bg-white/90 p-3">
                <span className="text-[11px] font-bold text-yellow-800 uppercase tracking-wider block">1 этап: до 10 ноября</span>
                <span className="mt-1 font-bold text-xs sm:text-sm text-ink block">Разогрев и сбор корзины</span>
                <span className="mt-1 text-[11px] text-ink/65 block">Фиксация цен и выбор купонов</span>
              </div>
              <div className="rounded-xl border border-red/40 bg-red/5 p-3">
                <span className="text-[11px] font-bold text-red uppercase tracking-wider block">2 этап: 11–13 ноября</span>
                <span className="mt-1 font-bold text-xs sm:text-sm text-ink block">Пик скидок 11.11</span>
                <span className="mt-1 text-[11px] text-ink/65 block">Активация главных кодов</span>
              </div>
              <div className="rounded-xl border border-line bg-white/80 p-3">
                <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider block">3 этап: 14–15 ноября</span>
                <span className="mt-1 font-bold text-xs sm:text-sm text-ink block">Финальный дисконт</span>
                <span className="mt-1 text-[11px] text-ink/65 block">Распродажа остатков</span>
              </div>
            </div>
          </div>
        )}

        {col.slug === "black-friday" && (
          <div className="mt-6 max-w-4xl rounded-3xl border border-ink/10 bg-gradient-to-br from-ink to-ink/95 p-5 sm:p-7 text-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-2xs">
                <span>🖤</span>
                <span>{bfStatus.badgeText}</span>
              </span>
              <span className="text-xs font-semibold text-white/70">
                Период: {bfStatus.formattedTargetDate}
              </span>
            </div>
            <h2 className="mt-3 font-display text-lg sm:text-xl font-extrabold text-white">
              {bfStatus.headline} — скидки до -90%
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/80">
              Главный период распродаж года. Промокоды маркетплейсов, магазинов техники, моды и парфюмерии обновляются по мере запуска предраспродаж. Добавляйте товары в избранное заранее.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">С 20 ноября</span>
                <span className="mt-1 font-bold text-xs sm:text-sm text-white block">Предраспродажа</span>
                <span className="mt-1 text-[11px] text-white/70 block">Ранний доступ к закрытым акциям</span>
              </div>
              <div className="rounded-xl border border-red/60 bg-red/20 p-3">
                <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider block">26–27 ноября</span>
                <span className="mt-1 font-bold text-xs sm:text-sm text-white block">Чёрная Пятница (Пик)</span>
                <span className="mt-1 text-[11px] text-white/70 block">Максимальный дисконт года</span>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider block">30 ноября</span>
                <span className="mt-1 font-bold text-xs sm:text-sm text-white block">Киберпонедельник</span>
                <span className="mt-1 text-[11px] text-white/70 block">Финальные скидки на гаджеты</span>
              </div>
            </div>
          </div>
        )}

        {list.length === 0 && (
          <Link href="/catalog" className="mt-5 inline-flex rounded-xl bg-red px-4 py-3 text-sm font-bold text-white">
            Посмотреть все предложения →
          </Link>
        )}
        <CollectionFilterContainer
          items={list.map((coupon) => ({
            id: `${coupon.id}-${coupon.promocode.code}`,
            storeSlug: coupon.store.slug,
            storeName: coupon.store.name,
            storeLogo: coupon.store.logo,
            isFirstOrder: Boolean(coupon.promocode.isFirstOrderOnly || /перв/i.test(coupon.promocode.terms || "")),
            isTop: Boolean(coupon.promocode.isHit || /30%|50%|1\s*₽|500|1000|подарок/i.test(coupon.promocode.bonusName || "")),
            element: (
              <CouponTicket
                key={`${coupon.id}-${coupon.promocode.code}`}
                coupon={coupon}
                placement="collection_coupon"
                proofCount={uses.usesByCode.get(coupon.promocode.code) ?? 0}
                storeProofCount={uses.usesByStore.get(coupon.store.id) ?? 0}
              />
            ),
          }))}
        />

        
        {col.buyerTips && (
          <section aria-label="Памятка покупателю" className="mt-12 max-w-3xl rounded-2xl border border-line bg-white p-5 sm:p-7">
            <h2 className="font-display text-xl font-extrabold text-ink">Что проверить перед покупкой</h2>
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink/75">
              {col.buyerTips.map((tip, index) => <li key={index}>{tip}</li>)}
            </ol>
          </section>
        )}
        {col.relatedArticles && col.relatedArticles.length > 0 && (
          <section aria-label="Полезные статьи и гиды" className="mt-12 max-w-3xl rounded-2xl border border-line bg-white p-5 sm:p-7">
            <h2 className="font-display text-xl font-extrabold text-ink">Полезные статьи и гиды по теме</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {col.relatedArticles.map((art) => (
                <Link
                  key={art.href}
                  href={art.href}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-line/70 hover:border-mint hover:bg-mint/5 transition-colors group"
                >
                  <span className="text-sm font-semibold text-ink group-hover:text-ink">{art.text}</span>
                  <span className="text-ink/40 group-hover:text-ink text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <article className="mt-14 max-w-3xl">
          <h2 className="font-display text-lg font-extrabold">
            Купоны на {col.name.toLowerCase()} — что учесть перед покупкой
          </h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="mt-4 leading-relaxed text-ink/70">
              {p}
            </p>
          ))}
        </article>

        <section className="mt-12 max-w-3xl" aria-label="Частые вопросы">
          <h2 className="font-display text-xl font-extrabold">
            {col.name.toLowerCase().includes("чёрн") || col.name.toLowerCase().includes("день")
              ? `Частые вопросы: ${col.name}`
              : `Частые вопросы про купоны ${col.name.toLowerCase()}`}
          </h2>
          <div className="mt-5 space-y-3">
            {faqList.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-line bg-white px-5 py-4">
                <summary className="cursor-pointer list-none font-bold text-ink">
                  {item.q}
                  <span className="float-right text-red group-open:hidden">+</span>
                  <span className="float-right text-red hidden group-open:inline">−</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
      <Footer />
    </>
  );
}
