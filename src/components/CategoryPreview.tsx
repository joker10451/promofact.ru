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
    <section aria-label="Популярные категории" className="relative overflow-hidden rounded-[24px] bg-ink px-4 py-6 text-white sm:rounded-[28px] sm:px-7 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-red/15 blur-3xl" aria-hidden="true" />
      <div className="relative mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-yellow px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink">
            Выбирайте по интересам
          </span>
          <h2 className="font-display text-xl font-extrabold leading-tight sm:text-2xl">
            Скидки по категориям
          </h2>
          <p className="mt-1 text-xs font-medium text-white/65 sm:text-sm">
            Сначала популярное — остальные разделы в полном каталоге
          </p>
        </div>
        <Link
          href="/category"
          className="inline-flex w-fit shrink-0 items-center gap-1 rounded-xl border border-white/25 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:border-yellow hover:bg-yellow hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
        >
          Все категории <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {featured.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group flex min-h-32 min-w-0 flex-col items-start rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all hover:-translate-y-0.5 hover:border-yellow/70 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow sm:p-4"
          >
            <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-yellow transition-colors group-hover:bg-yellow group-hover:text-ink">
              <Icon name={category.slug} size={19} />
            </span>
            <span className="mt-auto text-xs font-extrabold leading-snug text-white sm:text-sm">
              {category.label}
            </span>
            <span className="mt-1 text-[11px] font-medium text-white/60">
              {category.count} {plural(category.count, "предложение", "предложения", "предложений")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
