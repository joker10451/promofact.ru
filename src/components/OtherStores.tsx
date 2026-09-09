import Link from "next/link";
import { getStores } from "@/lib/perfluence";
import StoreLogo from "@/components/StoreLogo";
import type { Coupon } from "@/lib/types";

function plural(n: number, one: string, two: string, five: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return five;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return two;
  return five;
}

function getStoreMaxDiscount(coupons: Coupon[]): string | null {
  let maxPercent = 0;
  let maxRub = 0;
  for (const c of coupons) {
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
  if (maxPercent > 0) return `до −${maxPercent}%`;
  if (maxRub > 0) return `до −${maxRub.toLocaleString("ru-RU")} ₽`;
  return null;
}

export default async function OtherStores({
  current,
  category,
  storeName,
}: {
  current?: string;
  category?: string;
  storeName?: string;
}) {
  const allStores = await getStores();
  const stores = allStores.filter((s) => s.slug !== current);

  // Прямые конкуренты и аналоги из той же категории
  const sameCategory = category
    ? stores
        .filter((s) => s.categorySlug === category)
        .sort((a, b) => b.coupons.length - a.coupons.length)
    : [];

  const categoryName =
    sameCategory[0]?.category ||
    allStores.find((s) => s.categorySlug === category)?.category ||
    "";

  // Популярные магазины из других категорий
  const otherStores = stores
    .filter((s) => s.categorySlug !== category)
    .sort((a, b) => b.coupons.length - a.coupons.length);

  return (
    <nav aria-label="Похожие и популярные магазины" className="mt-12 space-y-10">
      {/* 1. Блок прямых конкурентов из той же категории */}
      {sameCategory.length > 0 && (
        <section aria-label="Магазины в той же категории">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink flex items-center gap-2">
                <span>🔄</span>
                <span>
                  {storeName
                    ? `Похожие на ${storeName} магазины`
                    : categoryName
                    ? `Похожие магазины: ${categoryName}`
                    : "Похожие магазины"}
                </span>
              </h2>
              <p className="text-xs text-ink/60 mt-0.5">
                Сравните условия и промокоды прямых конкурентов в категории «{categoryName}»
              </p>
            </div>
            {category && (
              <Link
                href={`/category/${category}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-red hover:underline shrink-0"
              >
                <span>Все промокоды категории</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sameCategory.slice(0, 6).map((store) => {
              const maxDiscount = getStoreMaxDiscount(store.coupons);
              return (
                <Link
                  key={store.slug}
                  href={`/store/${store.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-white border border-line p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_6px_0_rgba(11,16,43,0.06)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-paper p-1.5 transition-colors group-hover:border-ink/20">
                      <StoreLogo
                        slug={store.slug}
                        name={store.name}
                        logo={store.logo}
                        site={store.site}
                        size={32}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-ink truncate group-hover:text-red transition-colors">
                        {store.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-ink/55">
                          {store.coupons.length}{" "}
                          {plural(store.coupons.length, "купон", "купона", "купонов")}
                        </span>
                        {maxDiscount && (
                          <span className="inline-flex items-center rounded-md bg-mint/15 px-1.5 py-0.2 text-[10px] font-bold text-mint-dark">
                            {maxDiscount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-sm font-bold text-ink/30 transition-transform group-hover:translate-x-1 group-hover:text-red"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Блок популярных магазинов из других категорий */}
      <section aria-label="Популярные промокоды в других магазинах">
        <div className="mb-4">
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink flex items-center gap-2">
            <span>⭐</span>
            <span>
              {sameCategory.length > 0
                ? "Популярные магазины в других категориях"
                : "Популярные магазины с промокодами"}
            </span>
          </h2>
          <p className="text-xs text-ink/60 mt-0.5">
            Самые выгодные предложения и проверенные купоны от наших партнёров
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(sameCategory.length > 0 ? otherStores.slice(0, 6) : stores.slice(0, 9)).map(
            (store) => {
              const maxDiscount = getStoreMaxDiscount(store.coupons);
              return (
                <Link
                  key={store.slug}
                  href={`/store/${store.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-white border border-line p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_6px_0_rgba(11,16,43,0.06)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-paper p-1.5 transition-colors group-hover:border-ink/20">
                      <StoreLogo
                        slug={store.slug}
                        name={store.name}
                        logo={store.logo}
                        site={store.site}
                        size={32}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-ink truncate group-hover:text-red transition-colors">
                        {store.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-ink/55">
                          {store.coupons.length}{" "}
                          {plural(store.coupons.length, "купон", "купона", "купонов")}
                        </span>
                        {maxDiscount && (
                          <span className="inline-flex items-center rounded-md bg-paper border border-line px-1.5 py-0.2 text-[10px] font-bold text-ink/70">
                            {maxDiscount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-sm font-bold text-ink/30 transition-transform group-hover:translate-x-1 group-hover:text-red"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </section>
    </nav>
  );
}
