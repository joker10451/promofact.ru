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
    <section aria-label="Популярные магазины" className="rounded-[22px] border border-line bg-white py-5 sm:rounded-[28px] sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
          <div className="flex items-center gap-2">
            <Icon name="store" size={19} className="text-ink/50" />
            <div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-ink">
                Популярные магазины
              </h2>
              <p className="text-xs text-ink/60 font-medium">
                Быстрый вход к скидкам любимых брендов
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

        {/* Сетка популярных брендов в стиле Pikabu (круглые иконки, бейджи акций) */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 xl:grid-cols-12">
          {top.map((s, index) => (
            <Link
              key={s.slug}
              href={`/store/${s.slug}`}
              className={`${index >= 6 ? "hidden sm:flex" : "flex"} group min-w-0 flex-col items-center justify-center rounded-2xl border border-line bg-paper/35 px-2 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-red/30 hover:bg-white hover:shadow-xs`}
            >
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 border border-line group-hover:border-red/35 transition-colors">
                <StoreLogo
                  slug={s.slug}
                  name={s.name}
                  logo={s.logo}
                  site={s.site}
                  size={40}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="mt-2 block w-full truncate text-xs font-extrabold text-ink group-hover:text-red transition-colors">
                {s.name}
              </span>
              <span className="mt-1 inline-block rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-semibold text-mint-dark">
                {s.coupons.length} {s.coupons.length === 1 ? "акция" : s.coupons.length < 5 ? "акции" : "акций"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
