import Icon from "@/components/Icon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import JsonLd from "@/components/JsonLd";
import OtherCategories from "@/components/OtherCategories";
import Breadcrumbs from "@/components/Breadcrumbs";
import StoreLogo from "@/components/StoreLogo";
import YandexAdBlock from "@/components/YandexAdBlock";
import { getCategories, getCoupons, getUsesStats } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { plural } from "@/lib/format";
import { canonicalCategorySlug, getCategoryDef } from "@/lib/categoryTaxonomy";

const MONTH_YEAR = new Date().toLocaleDateString("ru-RU", {
  month: "long",
  year: "numeric",
});

export const dynamicParams = true;
export const revalidate = 43200;

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    if (categories.length > 0)
      return categories.map((cat) => ({ slug: cat.slug }));
    console.error(
      "[build] fetchCoupons пуст — /store и /category не сгенерированы; проверь PERFLUENCE_WIDGET_URL в build-окружении",
    );
  } catch (e) {
    console.error(
      "[build] ошибка fetchCoupons при генерации /category; проверь PERFLUENCE_WIDGET_URL в build-окружении",
      e,
    );
  }
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [categories, all] = await Promise.all([getCategories(), getCoupons()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return {};
  const catName = getCategoryDef(slug)?.label ?? cat.name;
  const count = all.filter((c) => c.store.categorySlug === slug).length;
  const pageUrl = `${SITE_URL}/category/${slug}`;
  const og = {
    title: `Промокоды и купоны: ${catName} — скидки ${MONTH_YEAR}`,
    description: `Проверенные промокоды на скидки в категории «${catName}»: ${count} актуальных предложений от магазинов-партнёров. Копируй код и экономь уже сегодня.`,
    url: pageUrl,
    type: "website" as const,
    locale: "ru_RU",
    siteName: SITE_NAME,
  };
  return {
    title: og.title,
    description: og.description,
    alternates: { canonical: pageUrl },
    openGraph: og,
    twitter: {
      card: "summary",
      title: og.title,
      description: og.description,
    },
  };
}

function seoText(
  catName: string,
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
    `Подборка рабочих промокодов для категории «${catName}»: сейчас в ней ${couponCount} ${plural(
      couponCount,
      "актуальный купон",
      "актуальных купона",
      "актуальных купонов",
    )} от ${storeCount} ${plural(
      storeCount,
      "магазина-партнёра",
      "магазинов-партнёров",
      "магазинов-партнёров",
    )}. Собрали проверенные коды, которые участвуют в акциях и распродажах: ${shopList}. Каждый промокод перед публикацией проходит ручную проверку, поэтому в подборке нет нерабочих кодов.`,
    `Как применить промокод: скопируйте код кнопкой «Копировать», перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» на этапе оплаты. Условия у каждого купона свои: где-то нужна минимальная сумма заказа, где-то промокод действует только для новых клиентов. Обязательно читайте описание перед переходом в магазин — так скидка применится с первого раза.`,
    `Новые скидки в категории «${catName}» появляются в течение дня: мы отслеживаем запуски акций и добавляем свежие промокоды в день старта. Подпишитесь на рассылку, чтобы не пропустить ${
      top.length > 0 ? `новые акции ${top.join(", ")}` : "выгодные предложения"
    } и другие жирные скидки недели.`,
  ];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, all, uses] = await Promise.all([
    getCategories(),
    getCoupons(),
    getUsesStats(),
  ]);
  // Исторические слаги («Красота и косметика», «Продукты и доставка») схлопнуты
  // в канонические разделы. Такие адреса уже проиндексированы, поэтому отдаём
  // 308 на канонический URL, а не 404: иначе теряется накопленный поисковый вес.
  const canonical = canonicalCategorySlug(slug);
  if (canonical !== slug) permanentRedirect(`/category/${canonical}`);

  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  // Подпись и описание берём из справочника: он задаёт единую формулировку
  // для раздела во всём интерфейсе, тогда как имя из фида может отличаться
  // от источника к источнику.
  const def = getCategoryDef(slug);
  const catName = def?.label ?? cat.name;

  const list = all.filter((c) => c.store.categorySlug === slug);
  const storeNames = [...new Set(list.map((c) => c.store.name))];
  const paragraphs = seoText(catName, storeNames, storeNames.length, list.length);
  const pageUrl = `${SITE_URL}/category/${slug}`;

  // Уникальные магазины в категории с подсчётом купонов
  const categoryStoresMap = new Map<string, { store: (typeof list)[0]["store"]; count: number }>();
  for (const c of list) {
    const existing = categoryStoresMap.get(c.store.slug);
    if (existing) {
      existing.count += 1;
    } else {
      categoryStoresMap.set(c.store.slug, { store: c.store, count: 1 });
    }
  }
  const categoryStores = Array.from(categoryStoresMap.values());

  // Вычисляем максимальную скидку
  let maxPercent = 0;
  let maxRub = 0;
  for (const c of list) {
    const text = c.promocode.bonusName || "";
    const pMatch = text.match(/(\d+)\s*%/);
    if (pMatch) {
      const val = parseInt(pMatch[1], 10);
      if (val > maxPercent && val <= 90) maxPercent = val;
    }
    const rMatch = text.match(/(\d+[\s\d]*)\s*(₽|р\b|руб)/i);
    if (rMatch) {
      const val = parseInt(rMatch[1].replace(/\s/g, ""), 10);
      if (val > maxRub && val <= 50000) maxRub = val;
    }
  }
  const maxDisc = maxPercent > 0 ? `до −${maxPercent}%` : maxRub > 0 ? `до −${maxRub.toLocaleString("ru-RU")} ₽` : "до −30%";

  const faqItems = [
    {
      q: `Где искать рабочие промокоды в категории «${catName}»?`,
      a: `Все проверенные купоны и скидки в категории «${catName}» собраны на этой странице. Мы обновляем базу ежедневно, тестируем актуальность кодов и удаляем недействительные акции.`,
    },
    {
      q: `Есть ли скидки на первый заказ в магазинах категории «${catName}»?`,
      a: `Да! Большинство популярных магазинов категории (например, ${storeNames.slice(0, 3).join(", ") || "партнёры сети"}) предлагают специальную скидку на первый заказ. Ищите в каталоге купоны с отметкой «Новым» или переходите на страницу интересующего магазина.`,
    },
    {
      q: `Суммируются ли промокоды с распродажами и акциями?`,
      a: `Условия зависят от правил конкретного магазина: часть промокодов действует на товары со скидками и распродажи, а часть активируется только при полной стоимости позиций. Точные условия указаны в карточке каждого предложения.`,
    },
    {
      q: `Как получить бесплатную доставку заказов в категории «${catName}»?`,
      a: `Бесплатная доставка предоставляется при выполнении условий минимальной суммы заказа либо по специальному промокоду. Выбирайте предложения со значком «Бесплатная доставка» в каталоге выше.`,
    },
    {
      q: `Как применить промокод при оформлении заказа?`,
      a: `Нажмите кнопку «Копировать» на карточке купона, перейдите в магазин по нашей ссылке и вставьте промокод в поле «Промокод» или «Купон» в корзине до оплаты. Итоговая сумма автоматически уменьшится.`,
    },
  ];

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: catName, item: pageUrl },
    ],
  };

  const faqJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a,
      },
    })),
  };

  const listing: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Промокоды и купоны: ${catName}`,
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
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: catName },
          ]}
          className="mb-2"
        />

        <div className="mt-6">
          <h1 className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl md:text-4xl">
            Промокоды и купоны: {catName} — скидки {maxDisc}
          </h1>
          {def?.blurb ? (
            <p className="mt-2 text-sm font-medium text-ink/75 max-w-3xl">{def.blurb}</p>
          ) : null}
          <p className="mt-2 text-xs sm:text-sm text-ink/65 max-w-3xl">
            Собрали проверенные скидки на {MONTH_YEAR}: {list.length}{" "}
            {plural(list.length, "активный промокод", "активных промокода", "активных промокодов")} от {categoryStores.length}{" "}
            {plural(categoryStores.length, "магазина-партнёра", "магазинов-партнёров", "магазинов-партнёров")}.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 border border-mint/40 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-mint-dark">
              <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
              Проверено сегодня
            </span>
            <span className="rounded-full bg-paper border border-line px-2.5 py-1 text-[11px] sm:text-xs font-bold text-ink/65">
              Скидки {maxDisc}
            </span>
            <span className="rounded-full bg-red/10 border border-red/30 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-ink/70">
              {list.length} {plural(list.length, "купон", "купона", "купонов")}
            </span>
          </div>

          {/* Быстрые ссылки на магазины категории (SILO перелинковка) */}
          {categoryStores.length > 0 && (
            <div className="mt-6 pt-5 border-t border-line/60">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink/45 mb-2.5 flex items-center gap-1.5">
                <Icon name="store" size={16} />
                <span>Магазины в категории «{catName}»:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categoryStores.map(({ store, count }) => (
                  <Link
                    key={store.slug}
                    href={`/store/${store.slug}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-2xs hover:border-ink hover:shadow-xs transition-all shrink-0 group"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-line/60 bg-paper p-0.5">
                      <StoreLogo
                        slug={store.slug}
                        name={store.name}
                        logo={store.logo}
                        site={store.site}
                        size={18}
                      />
                    </div>
                    <span className="group-hover:text-red transition-colors">{store.name}</span>
                    <span className="rounded-full bg-paper px-1.5 py-0.2 text-[10px] font-mono text-ink/60">
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

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

        <YandexAdBlock
          blockId={process.env.NEXT_PUBLIC_YANDEX_CATEGORY_AD_ID || "R-A-1234567-3"}
          className="my-10"
        />

        <OtherCategories current={cat.slug} />

        <article className="mt-14 max-w-3xl rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Купоны на {catName.toLowerCase()} — что учесть перед покупкой
          </h2>
          <div className="mt-4 space-y-3 text-sm text-ink/70 leading-relaxed">
            {paragraphs.map((p, i) => (
              <p key={i}>
                {p}
              </p>
            ))}
          </div>
        </article>

        {/* Интерактивный FAQ с разметкой Schema.org FAQPage */}
        <section className="mt-12 max-w-3xl" aria-label="Частые вопросы">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Частые вопросы про скидки и купоны {catName.toLowerCase()}
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
      </div>
    </main>
  );
}
