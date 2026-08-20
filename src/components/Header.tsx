import Link from "next/link";
import HeaderSearch from "@/components/HeaderSearch";

const NAV = [
  { href: "/#catalog", label: "Купоны" },
  { href: "/promokody", label: "Промокоды" },
  { href: "/gorod/moskva", label: "Города" },
  { href: "/#how", label: "Как работает" },
  { href: "/sovety", label: "Советы" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-paper/80 backdrop-blur-xl border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2 font-display text-lg font-extrabold tracking-tight sm:text-xl shrink-0"
          >
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red via-red-dark to-yellow shadow-[0_4px_14px_-4px_rgba(255,51,85,0.7)] transition-transform group-hover:scale-105">
              <img
                src="/icon.svg"
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px] brightness-0 invert"
              />
            </span>
            <span>
              ПРОМО<span className="text-red">·</span>ФАКТ
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-ink/70">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative hover:text-ink transition-colors whitespace-nowrap after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-red after:transition-all hover:after:w-full"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Интерактивный умный поиск с подсказками */}
        <div className="flex-1 max-w-xs sm:max-w-sm mx-2">
          <HeaderSearch />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://t.me/smart_zakupka"
            target="_blank"
            rel="noopener nofollow"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red to-red-dark px-3 py-1.5 text-xs font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,51,85,0.7)] transition-all hover:translate-y-[2px] sm:text-sm sm:px-4 sm:py-2"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
            </svg>
            <span>Telegram</span>
          </a>
        </div>
      </div>
    </header>
  );
}
