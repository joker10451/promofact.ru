import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import JsonLd from "@/components/JsonLd";
import OtherCategories from "@/components/OtherCategories";
import { getCategories, getCoupons, getUsesStats } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const MONTH_YEAR = new Date().toLocaleDateString("ru-RU", {
  month: "long",
  year: "numeric",
});

export const dynamicParams = true;
export const revalidate = 1800;

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
  const [categories, all] = await Promise.all([getCategories(), getCoupons()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return {};
  const count = all.filter((c) => c.store.categorySlug === slug).length;
  const pageUrl = `${SITE_URL}/category/${slug}`;
  const og = {
    title: `Промокоды и купоны: ${cat.name} — скидки ${MONTH_YEAR}`,
    description: `Проверенные промокоды на скидки в категории «${cat.name}»: ${count} актуальных предложений от магазинов-партнёров. Копируй код и экономь уже сегодня.`,
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
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  const list = all.filter((c) => c.store.categorySlug === slug);
  const storeNames = [...new Set(list.map((c) => c.store.name))];
  const paragraphs = seoText(cat.name, storeNames, storeNames.length, list.length);
  const pageUrl = `${SITE_URL}/category/${slug}`;

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: cat.name, item: pageUrl },
    ],
  };

  const listing: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Промокоды и купоны: ${cat.name}`,
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
          <span aria-current="page">{cat.name}</span>
        </nav>

        <h1 className="mt-6 max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Промокоды и купоны: {cat.name}
        </h1>
        <p className="mt-3 max-w-2xl text-ink/60">
          {list.length} {list.length === 1 ? "промокод" : "промокодов"} в
          категории «{cat.name.toLowerCase()}». Обновляем ежедневно.
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

        <OtherCategories current={cat.slug} />

        <article className="mt-14 max-w-3xl">
          <h2 className="font-display text-lg font-extrabold">
            Купоны на {cat.name.toLowerCase()} — что учесть перед покупкой
          </h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="mt-4 leading-relaxed text-ink/70">
              {p}
            </p>
          ))}
        </article>
      </div>
    </main>
  );
}
