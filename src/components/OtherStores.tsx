import Link from "next/link";
import { getStores } from "@/lib/perfluence";

export default async function OtherStores({
  current,
  category,
}: {
  current?: string;
  category?: string;
}) {
  const stores = (await getStores()).filter((s) => s.slug !== current);
  const sameCategory = category
    ? stores.filter((s) => s.categorySlug === category)
    : [];
  const others = stores.filter((s) => s.categorySlug !== category);
  const list = [...sameCategory, ...others].slice(0, 12);
  const title =
    sameCategory.length > 0 && category
      ? `Другие магазины в категории ${stores.find((s) => s.categorySlug === category)?.category ?? ""}`
      : "Промокоды в других магазинах";

  return (
    <nav aria-label="Другие магазины" className="mt-12">
      <div className="font-display text-lg font-extrabold">{title.trim()}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((store) => (
          <Link
            key={store.slug}
            href={`/store/${store.slug}`}
            className="group flex items-center justify-between gap-3 rounded-2xl bg-white border border-line px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(11,16,43,0.08)]"
          >
            <div className="min-w-0">
              <div className="font-bold truncate group-hover:text-red transition-colors">
                {store.name}
              </div>
              <div className="text-xs text-ink/50">
                {store.coupons.length}{" "}
                {store.coupons.length === 1 ? "промокод" : "промокода"}
              </div>
            </div>
            <span
              className="shrink-0 font-display text-red transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
