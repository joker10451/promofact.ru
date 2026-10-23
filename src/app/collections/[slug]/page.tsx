import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponTicket from "@/components/CouponTicket";
import JsonLd from "@/components/JsonLd";
import { getCoupons, getUsesStats } from "@/lib/perfluence";
import { getCollections, getCollectionCoupons, MIN_INDEXABLE_COLLECTION_OFFERS } from "@/lib/collections";
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
  const pageTitle = `Промокоды и акции: ${col.name}`;
  const ogTitle = `${pageTitle} — ${SITE_NAME}`;
  const og = {
    title: ogTitle,
    description: count >= MIN_INDEXABLE_COLLECTION_OFFERS
      ? `${col.name}: ${count} предложений с условиями и сроками действия. Проверьте ограничения скидок перед заказом.`
      : `${col.name}: сейчас недостаточно действующих предложений для подборки. Посмотрите полный каталог.`,
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
        {col.slug === "black-friday" && (
          <div className="mt-5 max-w-3xl rounded-2xl bg-ink p-5 text-white shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <span>Распродажа Чёрная Пятница 2026</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              Главный период скидок года. Промокоды маркетплейсов и магазинов обновляются по мере старта акций. Добавляйте товары в корзину и проверяйте промокоды до оплаты.
            </p>
          </div>
        )}

        {list.length === 0 && (
          <Link href="/catalog" className="mt-5 inline-flex rounded-xl bg-red px-4 py-3 text-sm font-bold text-white">
            Посмотреть все предложения →
          </Link>
        )}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((coupon) => (
            <CouponTicket
              key={`${coupon.id}-${coupon.promocode.code}`}
              coupon={coupon}
              placement="collection_coupon"
              proofCount={uses.usesByCode.get(coupon.promocode.code) ?? 0}
              storeProofCount={uses.usesByStore.get(coupon.store.id) ?? 0}
            />
          ))}
        </div>

        
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
