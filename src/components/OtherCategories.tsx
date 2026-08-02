import Link from "next/link";
import { getCategories } from "@/lib/perfluence";

export default async function OtherCategories({
  current,
}: {
  current?: string;
}) {
  const categories = await getCategories();
  const others = categories.filter((c) => c.slug !== current);
  if (others.length === 0) return null;

  return (
    <nav aria-label="Другие категории" className="mt-12">
      <div className="font-display text-lg font-extrabold">
        Популярные категории
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {others.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="rounded-full bg-white border border-line px-4 py-2 text-sm font-bold text-ink/70 hover:border-ink hover:text-ink transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
