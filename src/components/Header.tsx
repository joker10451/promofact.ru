import Link from "next/link";

const NAV = [
  { href: "/promokody", label: "Магазины" },
  { href: "/#catalog", label: "Категории" },
  { href: "/#hot", label: "🔥 Горящие" },
  { href: "/sovety", label: "Советы" },
];

export default function Header() {
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
              <img
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
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-ink/70">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative hover:text-ink transition-colors whitespace-nowrap py-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-red after:transition-all hover:after:w-full"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Правая часть: Колесо скидок + Telegram */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://t.me/smart_zakupka"
            target="_blank"
            rel="noopener nofollow"
            className="hidden sm:flex items-center gap-2 rounded-full bg-paper border border-line px-3.5 py-2 text-xs font-bold text-ink/80 hover:text-ink hover:border-ink/40 transition-all"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="text-[#2AABEE]">
              <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
            </svg>
            <span>@smart_zakupka</span>
          </a>

          <a
            href="/#catalog"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red to-red-dark px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            <span>Все купоны →</span>
          </a>
        </div>
      </div>
    </header>
  );
}

