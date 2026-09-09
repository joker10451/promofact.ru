import Link from "next/link";
import { getCategories, getCoupons } from "@/lib/perfluence";
import { COLLECTIONS } from "@/lib/collections";

const CATEGORY_ICONS: Record<string, string> = {
  "dostavka-iz-restoranov": "🍔",
  "dostavka-produktov": "🛒",
  "kosmetika-i-parfyumeriya": "💄",
  "odezhda-i-obuv": "👕",
  "puteshestviya-i-turizm": "✈️",
  "vse-dlya-doma": "🏠",
  "onlayn-kinoteatry": "🎬",
  "tsvety": "🌷",
  "servisy-i-podpiski": "⚡",
  "marketpleysy": "📦",
};

export default async function VisualCategoryTiles() {
  const [categories, coupons] = await Promise.all([
    getCategories(),
    getCoupons(),
  ]);

  if (categories.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
              Скидки по категориям
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-ink/60 font-medium">
              Выберите категорию, чтобы найти промокод
            </p>
          </div>
        </div>

        {/* Сетка категорий */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const count = coupons.filter((c) => c.store.categorySlug === cat.slug).length;
            const icon = CATEGORY_ICONS[cat.slug] || "🏷";

            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-5 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-red hover:shadow-md"
              >
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">
                  {icon}
                </span>
                <span className="mt-3 block font-display text-sm font-bold text-ink group-hover:text-red transition-colors">
                  {cat.name}
                </span>
                <span className="mt-0.5 text-[11px] font-semibold text-ink/45">
                  {count} {count === 1 ? "промокод" : count < 5 ? "промокода" : "промокодов"}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Популярные тематические подборки */}
        <div className="mt-12 pt-8 border-t border-line/70">
          <div className="mb-4">
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-ink">
              Популярные подборки
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm text-ink/60 font-medium">
              Готовые коллекции проверенных промокодов под разные поводы
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.slug}
                href={`/collections/${col.slug}`}
                className="group inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-ink shadow-2xs hover:border-red hover:text-red hover:shadow-xs transition-all"
              >
                <span>{col.emoji}</span>
                <span>{col.name}</span>
                <span className="text-ink/35 group-hover:text-red transition-colors text-xs">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
