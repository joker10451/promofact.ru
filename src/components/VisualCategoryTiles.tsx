import Link from "next/link";
import { getCategories, getCoupons } from "@/lib/perfluence";

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
      </div>
    </section>
  );
}
