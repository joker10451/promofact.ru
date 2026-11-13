import Link from "next/link";
import Icon from "@/components/Icon";
import { getCategories } from "@/lib/perfluence";
import { canonicalCategorySlug, getCategoryDef } from "@/lib/categoryTaxonomy";
import { plural } from "@/lib/format";

/**
 * A deliberately short homepage preview. The complete grouped catalogue lives
 * at /category, so home visitors are not forced through the full category tree.
 * Both views use the same live category source and canonical taxonomy.
 */
export default async function CategoryPreview() {
  const categories = await getCategories();
  const counts = new Map<string, number>();
  for (const category of categories) {
    const slug = canonicalCategorySlug(category.slug);
    counts.set(slug, (counts.get(slug) ?? 0) + category.count);
  }

  const featured = [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([slug, count]) => {
      const def = getCategoryDef(slug);
      return def ? { ...def, count } : null;
    })
    .filter((category): category is NonNullable<typeof category> => category !== null)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ru"))
    .slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section aria-label="Популярные категории" className="border-t border-line pt-6 sm:pt-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold leading-tight text-ink sm:text-2xl">
            Скидки по категориям
          </h2>
          <p className="mt-1 text-xs font-medium text-ink/60 sm:text-sm">
            Самые большие разделы, остальные — в «Все категории»
          </p>
        </div>
        <Link
          href="/category"
          className="inline-flex w-fit shrink-0 items-center gap-1 rounded-xl border border-ink/20 px-4 py-2.5 text-xs font-bold text-ink transition-colors hover:border-red hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          Все категории <span aria-hidden="true">→</span>
        </Link>
      </div>

      <p className="mb-2 text-[11px] font-medium text-ink/55 sm:hidden">Листайте категории →</p>
      <div className="grid grid-flow-col auto-cols-[minmax(158px,66%)] gap-2.5 overflow-x-auto overscroll-x-contain pb-3 snap-x snap-mandatory no-scrollbar sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
        {featured.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group flex min-h-36 min-w-0 snap-start flex-col items-start rounded-2xl border border-line bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-red/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:p-4"
          >
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-yellow transition-colors group-hover:bg-red group-hover:text-white">
              <Icon name={category.slug} size={26} />
            </span>
            <span className="mt-auto text-xs font-extrabold leading-snug text-ink sm:text-sm">
              {category.label}
            </span>
            <span className="mt-1 text-[11px] font-medium text-ink/60">
              {category.count} {plural(category.count, "предложение", "предложения", "предложений")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
