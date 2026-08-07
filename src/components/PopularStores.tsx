import Link from "next/link";
import { getStores } from "@/lib/perfluence";

export default async function PopularStores() {
  let stores: Awaited<ReturnType<typeof getStores>> = [];
  try {
    stores = await getStores();
  } catch {
    stores = [];
  }
  const top = stores.slice(0, 12);
  if (top.length === 0) return null;

  return (
    <section aria-label="Популярные магазины" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
        Популярные магазины
      </h2>
      <p className="mt-3 max-w-2xl text-ink/60">
        Промокоды проверены сегодня. Нажмите, чтобы открыть страницу магазина
        и скопировать код.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {top.map((s) => (
          <Link
            key={s.slug}
            href={`/store/${s.slug}`}
            className="group flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(11,16,43,0.08)]"
          >
            {s.logo ? (
              <img
                src={s.logo}
                alt={s.name}
                width={20}
                height={20}
                className="h-5 w-5 rounded object-contain"
              />
            ) : null}
            <span className="group-hover:text-red transition-colors">{s.name}</span>
            <span className="text-xs font-normal text-ink/40">
              {s.coupons.length}
            </span>
          </Link>
        ))}
        <Link
          href="/store"
          className="rounded-full border border-red/30 bg-red/5 px-4 py-2 text-sm font-bold text-red transition-colors hover:bg-red/10"
        >
          Все магазины →
        </Link>
      </div>
    </section>
  );
}
