import Link from "next/link";
import Image from "next/image";

import MegaMenu, { type MegaMenuGroup } from "@/components/MegaMenu";
import MobileCatalogMenu from "@/components/MobileCatalogMenu";
import HeaderSearchTrigger from "@/components/HeaderSearchTrigger";
import { getCategories } from "@/lib/perfluence";
import {
  CATEGORY_GROUPS,
  getCategoryDef,
  canonicalCategorySlug,
} from "@/lib/categoryTaxonomy";

// Прямые ссылки, которым не место в каталоге категорий.
const NAV = [
  { href: "/akcii/den-shopinga-11-11", label: "🔥 11.11", isHot: true },
  { href: "/catalog", label: "Купоны", isHot: false },
  { href: "/promokody", label: "Магазины", isHot: false },
  { href: "/collections", label: "Подборки", isHot: false },
  { href: "/sovety", label: "Советы", isHot: false },
];

/**
 * Счётчики берём из реальной выдачи, а не из справочника: показывать раздел
 * с нулём предложений — обманывать пользователя, поэтому пустые категории
 * и пустые разделы в меню не выводятся вовсе.
 */
async function buildGroups(): Promise<MegaMenuGroup[]> {
  const categories = await getCategories();
  const counts = new Map<string, number>();
  for (const c of categories) {
    const slug = canonicalCategorySlug(c.slug);
    counts.set(slug, (counts.get(slug) ?? 0) + c.count);
  }

  return CATEGORY_GROUPS.map((g) => {
    const cats = g.categorySlugs
      .map((slug) => {
        const def = getCategoryDef(slug);
        const count = counts.get(slug) ?? 0;
        return def && count > 0
          ? { slug, label: def.label, blurb: def.blurb, count }
          : null;
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.count - a.count);

    return {
      id: g.id,
      label: g.label,

      categories: cats,
      total: cats.reduce((s, c) => s + c.count, 0),
    };
  }).filter((g) => g.categories.length > 0);
}

export default async function Header() {
  const groups = await buildGroups();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-line shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Логотип */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight sm:text-xl shrink-0 text-ink"
          >
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red via-red-dark to-yellow shadow-[0_4px_12px_-2px_rgba(255,51,85,0.4)] transition-transform group-hover:scale-105">
              <Image
                src="/icon.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 brightness-0 invert"
              />
            </span>
            <span className="font-display font-extrabold tracking-tight">
              ПРОМО<span className="text-red">·</span>ФАКТ
            </span>
          </Link>

          {/* Навигация */}
          <MegaMenu groups={groups} />
          <MobileCatalogMenu groups={groups} />

          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-bold text-ink/70">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative transition-all whitespace-nowrap py-1 ${
                  item.isHot
                    ? "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red/10 text-red font-extrabold hover:bg-red/15 hover:scale-105"
                    : "hover:text-ink after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-red after:transition-all hover:after:w-full"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Правая часть: Search + Catalog CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <HeaderSearchTrigger />

          <a
            href="https://t.me/smart_zakupka"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-[#2AABEE]/10 border border-[#2AABEE]/25 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#1d8fc8] hover:bg-[#2AABEE]/20 hover:border-[#2AABEE]/40 transition-all shrink-0"
            title="Telegram-канал Смарт Закупка: промокоды и секретные скидки"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            <span className="hidden sm:inline">TG-канал</span>
          </a>

          <Link
            href="/catalog#catalog"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red to-red-dark px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            <span>Все купоны →</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

