import Link from "next/link";
import { categories, categorySlugs, type CategorySlug } from "@/lib/data";

export default function OtherCategories({ current }: { current?: CategorySlug }) {
  const others = categorySlugs.filter((slug) => slug !== current);

  return (
    <nav aria-label="Другие категории" className="mt-12">
      <div className="font-display text-lg font-extrabold">Другие категории</div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {others.map((slug) => (
          <Link
            key={slug}
            href={`/category/${slug}`}
            className="rounded-full bg-white border border-line px-4 py-2 text-sm font-bold text-ink/70 hover:border-ink hover:text-ink transition-colors"
          >
            {categories[slug]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
