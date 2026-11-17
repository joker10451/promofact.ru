import Link from "next/link";
import { getStores } from "@/lib/perfluence";
import StoreLogo from "@/components/StoreLogo";
import { plural } from "@/lib/format";
import { withoutLegacyTwins } from "@/lib/storeDisplayName";

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
    stores = withoutLegacyTwins(await getStores());
  } catch {
    stores = [];
  }

  if (stores.length === 0) return null;

  // Only stores with active coupons participate; same data source as full catalog.
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
    <section aria-label="Популярные магазины" className="py-1 sm:py-2">
      <div>
        <div className="mb-2.5 sm:mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-ink">
                Популярные магазины
              </h2>
              <p className="hidden text-xs text-ink/60 font-medium sm:block">
                Промокоды {top.slice(0, 3).map((s) => s.name).join(", ")} и других
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
        <div className="grid grid-cols-3 pl-px pt-px sm:grid-cols-4 md:grid-cols-6">
          {top.slice(0, 12).map((s, index) => (
            <Link
              key={s.slug}
              href={`/store/${s.slug}`}
              className={`${index >= 6 ? "hidden sm:flex" : "flex"} group -ml-px -mt-px min-w-0 flex-col items-center justify-center border border-line bg-white px-2 py-3 sm:py-5 text-center transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red`}
            >
              <div className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                <StoreLogo
                  slug={s.slug}
                  name={s.name}
                  logo={s.logo}
                  site={s.site}
                  size={56}
                  priority={index < 6}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="mt-2.5 line-clamp-2 min-h-[2.4em] w-full break-words text-xs font-extrabold leading-tight sm:text-[13px] text-ink group-hover:text-red transition-colors">
                {s.name}
              </span>
              <span className="mt-0.5 inline-block text-[11px] font-medium tabular-nums text-ink/55">
                {s.coupons.length} {plural(s.coupons.length, "акция", "акции", "акций")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
