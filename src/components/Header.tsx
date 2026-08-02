import Link from "next/link";

const NAV = [
  { href: "#coupons", label: "Купоны" },
  { href: "#how", label: "Как работает" },
  { href: "#partners", label: "Партнёрам" },
  { href: "#faq", label: "FAQ" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
          ПРОМО<span className="text-red">·</span>ДРОМ
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-ink/70">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-ink transition-colors">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#subscribe"
          className="rounded-full bg-red px-4 py-2 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          Ловить скидки
        </a>
      </div>
    </header>
  );
}
