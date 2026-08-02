import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import OtherCategories from "@/components/OtherCategories";
import { categories, categoriesGenitive, categorySlugs, getCouponsByCategory, type CategorySlug } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return categorySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const label = categories[slug as CategorySlug];
  if (!label) return {};
  const list = getCouponsByCategory(slug).map((c) => c.store).join(", ");
  return {
    title: `Промокоды и купоны: ${label}`,
    description: `Скидки на ${label.toLowerCase()}: промокоды ${list}. Проверенные купоны, срок действия, условия применения — всё в одном месте.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

function seoText(slug: string, label: string): string[] {
  const stores = getCouponsByCategory(slug).map((c) => c.store);
  const storeList = stores.join(", ");
  const top = stores[0] ?? "";
  const words: Record<CategorySlug, string> = {
    beauty: "косметика, парфюмерия и уход",
    fashion: "одежда, обувь и аксессуары",
    electro: "смартфоны, ноутбуки и техника для дома",
    food: "продукты и доставка",
    home: "мебель и товары для дома",
    travel: "авиабилеты и путешествия",
  };

  return [
    `Подборка рабочих промокодов для категории «${label}»: ${words[slug as CategorySlug] ?? "товары"}. Собрали ${stores.length > 0 ? "актуальные купоны" : "акции"} от проверенных магазинов, которые участвуют в акциях и распродажах. Каждый промокод перед публикацией проходит ручную проверку, поэтому в подборке нет нерабочих кодов.`,
    `В этой категории вы найдёте ${storeList || "скидки на популярные бренды"}. Условия у каждого купона свои: где-то нужна минимальная сумма заказа, где-то промокод действует только для новых клиентов. Обязательно читайте описание перед переходом в магазин — так скидка применится с первого раза.`,
    `Новые ${words[slug as CategorySlug]?.split(",")[0] ?? "скидки"} появляются ежедневно: мы отслеживаем запуски акций и добавляем свежие промокоды в день старта. Подпишитесь на рассылку, чтобы не пропустить ${top ? `новые акции ${top}` : "выгодные предложения"} и другие жирные скидки недели.`,
  ];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const label = categories[slug as CategorySlug];
  if (!label) notFound();

  const list = getCouponsByCategory(slug);
  const paragraphs = seoText(slug, label);

  return (
    <main>
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
          <span aria-current="page">{label}</span>
        </nav>

        <h1 className="mt-6 max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Промокоды и купоны: {label}
        </h1>
        <p className="mt-3 max-w-2xl text-ink/60">
          {list.length} {list.length === 1 ? "промокод" : "промокодов"} в категории
          «{label.toLowerCase()}». Обновляем ежедневно.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} />
          ))}
        </div>

        <OtherCategories current={slug as CategorySlug} />

        <article className="mt-14 max-w-3xl">
          <h2 className="font-display text-lg font-extrabold">
            Купоны на {categoriesGenitive[slug as CategorySlug]} — что учесть перед покупкой
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
