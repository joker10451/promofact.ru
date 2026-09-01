import Link from "next/link";
import { getStores } from "@/lib/perfluence";
import { getBrandMeta } from "@/lib/brandLogos";

const POPULAR_SLUGS = [
  "pyaterochka",
  "otello",
  "kinopoisk",
  "yandeks-tsvety",
  "iv-roshe",
  "vazhnaya-ryba",
  "fix-price",
  "netprint",
];

export default async function PopularStores() {
  let stores: Awaited<ReturnType<typeof getStores>> = [];
  try {
    stores = await getStores();
  } catch {
    stores = [];
  }

  if (stores.length === 0) return null;

  // Отбираем 8 ключевых популярных российских брендов
  const storeMap = new Map(stores.map((s) => [s.slug, s]));
  const top: typeof stores = [];

  for (const slug of POPULAR_SLUGS) {
    const s = storeMap.get(slug);
    if (s) top.push(s);
  }

  // Если каких-то нет, добираем из оставшихся
  for (const s of stores) {
    if (top.length >= 8) break;
    if (!top.some((t) => t.slug === s.slug)) {
      top.push(s);
    }
  }

  return (
    <section aria-label="Популярные магазины" className="py-10 sm:py-12 border-b border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                Популярные магазины
              </h2>
              <p className="text-xs text-ink/60 font-medium">
                Быстрый вход к скидкам любимых брендов
              </p>
            </div>
          </div>
          <Link
            href="/promokody"
            className="text-xs sm:text-sm font-bold text-red hover:text-red-dark transition-colors whitespace-nowrap"
          >
            Все магазины ({stores.length}) →
          </Link>
        </div>

        {/* Сетка 8 ключевых брендов с гарантированными логотипами */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {top.map((s) => {
            const brandMeta = getBrandMeta(s.slug, s.name, s.site);
            const logo = s.logo || brandMeta.logoUrl;

            return (
              <Link
                key={s.slug}
                href={`/store/${s.slug}`}
                className="group flex flex-col items-center justify-center rounded-2xl border border-line bg-paper/50 p-3.5 text-center shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white hover:shadow-xs"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 border border-line/60 shadow-2xs group-hover:scale-105 transition-transform">
                  {logo ? (
                    <img
                      src={logo}
                      alt={s.name}
                      width={36}
                      height={36}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br ${brandMeta.bgGradient} ${brandMeta.textColor} text-sm font-black`}
                    >
                      {brandMeta.emoji}
                    </div>
                  )}
                </div>
                <span className="mt-2.5 block font-display text-xs font-bold text-ink group-hover:text-red transition-colors truncate max-w-full">
                  {s.name}
                </span>
                <span className="text-[10px] font-semibold text-mint-dark">
                  {s.coupons.length} {s.coupons.length === 1 ? "код" : s.coupons.length < 5 ? "кода" : "кодов"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
