import Icon from "@/components/Icon";
import Link from "next/link";
import { getStores } from "@/lib/perfluence";
import StoreLogo from "@/components/StoreLogo";

const POPULAR_SLUGS = [
  "sunlight-ru",
  "yandex-eda",
  "ivi",
  "pyaterochka",
  "otello",
  "kinopoisk",
  "yandeks-tsvety",
  "iv-roshe",
  "vazhnaya-ryba",
  "fix-price",
  "netprint",
  "samokat",
  "magnit-dostavka",
  "yandex-market",
];

export default async function PopularStores() {
  let stores: Awaited<ReturnType<typeof getStores>> = [];
  try {
    stores = await getStores();
  } catch {
    stores = [];
  }

  if (stores.length === 0) return null;

  // Отбираем популярные российские бренды (до 12 штук)
  const storeMap = new Map(stores.map((s) => [s.slug, s]));
  const top: typeof stores = [];

  for (const slug of POPULAR_SLUGS) {
    const s = storeMap.get(slug);
    if (s) top.push(s);
  }

  // Если каких-то нет, добираем из оставшихся
  for (const s of stores) {
    if (top.length >= 12) break;
    if (!top.some((t) => t.slug === s.slug)) {
      top.push(s);
    }
  }

  return (
    <section id="popular-stores" aria-label="Популярные магазины" className="py-6 sm:py-8 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Icon name="store" size={19} className="text-ink/50" />
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Популярные магазины
              </h2>
              <p className="text-xs text-ink/60 font-medium">
                Выберите магазин — покажем доступные предложения
              </p>
            </div>
          </div>
          <Link
            href="/promokody"
            className="text-xs sm:text-sm font-bold text-red hover:text-red-dark transition-colors shrink-0"
          >
            Все магазины ({stores.length}) →
          </Link>
        </div>

        {/* Real active shops only; compact navigation cards, no fabricated discounts. */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {top.map((s, index) => (
            <Link
              key={s.slug}
              href={`/store/${s.slug}`}
              className={`${index >= 6 ? "hidden sm:flex" : "flex"} group flex-col items-center justify-center rounded-xl border border-line bg-white p-3 text-center transition-colors hover:border-red/35 hover:bg-[#fffaf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7f5f1] p-1.5">
                <StoreLogo
                  slug={s.slug}
                  name={s.name}
                  logo={s.logo}
                  site={s.site}
                  size={40}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="mt-2 block w-full truncate font-sans text-xs font-semibold text-ink group-hover:text-red transition-colors">
                {s.name}
              </span>
              <span className="mt-1 inline-block text-[11px] font-medium text-ink/55">
                {s.coupons.length} {s.coupons.length === 1 ? "акция" : s.coupons.length < 5 ? "акции" : "акций"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
