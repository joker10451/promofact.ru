import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import JsonLd from "@/components/JsonLd";
import OtherCategories from "@/components/OtherCategories";
import { getCategories, getCoupons } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return {};
  const pageUrl = `${SITE_URL}/category/${slug}`;
  return {
    title: `Промокоды и купоны: ${cat.name}`,
    description: `Скидки на ${cat.name.toLowerCase()}: проверенные промокоды магазинов-партнёров. Срок действия, условия применения — всё в одном месте.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `Промокоды и купоны: ${cat.name}`,
      description: `Скидки на ${cat.name.toLowerCase()}: проверенные промокоды. Обновляем ежедневно.`,
      url: pageUrl,
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
    },
  };
}

function seoText(catName: string, storeList: string): string[] {
  const top = storeList.split(", ")[0] ?? "";
  return [
    `Подборка рабочих промокодов для категории «${catName}»: собрали актуальные купоны от проверенных магазинов, которые участвуют в акциях и распродажах. Каждый промокод перед публикацией проходит ручную проверку, поэтому в подборке нет нерабочих кодов.`,
    `В этой категории вы найдёте ${storeList || "скидки на популярные бренды"}. Условия у каждого купона свои: где-то нужна минимальная сумма заказа, где-то промокод действует только для новых клиентов. Обязательно читайте описание перед переходом в магазин — так скидка применится с первого раза.`,
    `Новые скидки появляются в течение дня: мы отслеживаем запуски акций и добавляем свежие промокоды в день старта. Подпишитесь на рассылку, чтобы не пропустить ${top ? `новые акции ${top}` : "выгодные предложения"} и другие жирные скидки недели.`,
  ];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, all] = await Promise.all([getCategories(), getCoupons()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  const list = all.filter((c) => c.store.categorySlug === slug);
  const storeNames = [...new Set(list.map((c) => c.store.name))].join(", ");
  const paragraphs = seoText(cat.name, storeNames);
  const pageUrl = `${SITE_URL}/category/${slug}`;

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Купоны", item: `${SITE_URL}/#coupons` },
      { "@type": "ListItem", position: 3, name: cat.name, item: pageUrl },
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
        validTo: c.promocode.expires,
        priceCurrency: "RUB",
        price: 0,
        seller: { "@type": "Organization", name: c.store.name },
      },
    })),
  };

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={listing} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/45">
          <Link href="/" className="hover:text-ink transition-colors">
            Главная
          </Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/#coupons" className="hover:text-ink transition-colors">
            Купоны
          </Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page">{cat.name}</span>
        </nav>

        <h1 className="mt-6 max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Промокоды и купоны: {cat.name}
        </h1>
        <p className="mt-3 max-w-2xl text-ink/60">
          {list.length} {list.length === 1 ? "промокод" : "промокодов"} в категории
          «{cat.name.toLowerCase()}». Обновляем ежедневно.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} />
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