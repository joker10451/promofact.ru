import Link from "next/link";
import type { StoreInfo } from "@/lib/perfluence";

/**
 * SEO-GROWTH-2: useful internal navigation based on actual search impressions.
 * Never render empty shops or claim a coupon works without the live store feed.
 * The first three shops have verified Search Console demand (2026-10-14).
 * FMART is an explicit separate publisher placement frequently confused with Flowwow.
 */
const PRIORITIES = [
  { slug: "yandex-eda", label: "Яндекс Еда", description: "Доставка готовой еды" },
  { slug: "pyaterochka", label: "Пятёрочка Доставка", description: "Доставка продуктов" },
  { slug: "sberprime", label: "СберПрайм", description: "Подписки и сервисы" },
  { slug: "fmart", label: "FMART by flowwow", description: "Отдельные промокоды FMART" },
] as const;

export default function PrioritySearchLinks({ stores }: { stores: StoreInfo[] }) {
  const available = new Map(stores.filter(s => s.coupons.length > 0).map(s => [s.slug, s]));
  const items = PRIORITIES.flatMap(item => {
    const store = available.get(item.slug);
    return store ? [{ ...item, count: store.coupons.length }] : [];
  });
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="priority-stores-heading" className="rounded-[22px] border border-line bg-white px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-red">Быстрые переходы</p>
          <h2 id="priority-stores-heading" className="mt-1 font-display text-lg font-extrabold text-ink sm:text-xl">
            К промокодам популярных сервисов
          </h2>
        </div>
        <Link href="/promokody" className="text-xs font-bold text-red underline-offset-4 hover:underline">
          Все магазины →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/store/${item.slug}#offers`}
            className="flex min-h-24 flex-col justify-between rounded-xl border border-line bg-paper/40 px-3 py-3 transition-colors hover:border-red/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:min-h-28 sm:p-4"
          >
            <span className="text-sm font-extrabold leading-snug text-ink">{item.label}</span>
            <span className="mt-1 text-xs leading-snug text-ink/65">{item.description}</span>
            <span className="mt-2 text-[11px] font-semibold text-red">{item.count} действующих предложений →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
