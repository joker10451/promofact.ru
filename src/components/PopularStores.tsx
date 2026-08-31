import Link from "next/link";
import { getStores } from "@/lib/perfluence";

export default async function PopularStores() {
  let stores: Awaited<ReturnType<typeof getStores>> = [];
  try {
    stores = await getStores();
  } catch {
    stores = [];
  }
  const top = stores.slice(0, 10);
  if (top.length === 0) return null;

  return (
    <section aria-label="Популярные магазины" className="py-12 sm:py-16 border-t border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
              🔥 Популярные магазины
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-ink/60 font-medium">
              Скидки и промокоды в любимых сервисах
            </p>
          </div>
          <Link
            href="/promokody"
            className="text-xs sm:text-sm font-bold text-red hover:text-red-dark transition-colors whitespace-nowrap"
          >
            Все бренды ({stores.length}) →
          </Link>
        </div>

        {/* Сетка брендовых карточек */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {top.map((s) => (
            <Link
              key={s.slug}
              href={`/store/${s.slug}`}
              className="group flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-5 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper p-2 border border-line/60 group-hover:scale-105 transition-transform">
                {s.logo ? (
                  <img
                    src={s.logo}
                    alt={s.name}
                    width={40}
                    height={40}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="font-display text-lg font-black text-ink">
                    {s.name[0]}
                  </span>
                )}
              </div>
              <span className="mt-3 block font-display text-sm font-bold text-ink group-hover:text-red transition-colors truncate max-w-full">
                {s.name}
              </span>
              <span className="mt-0.5 text-xs font-semibold text-mint-dark">
                {s.coupons.length} {s.coupons.length === 1 ? "промокод" : s.coupons.length < 5 ? "промокода" : "промокодов"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
