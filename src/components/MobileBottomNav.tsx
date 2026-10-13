"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Не показываем в админке или на страницах статистики
  if (pathname.startsWith("/admin") || pathname.startsWith("/stats")) {
    return null;
  }

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("promo:open-search"));
  };

  const navItems = [
    {
      label: "Купоны",
      href: "/catalog",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      ),
      active: pathname === "/catalog",
    },
    {
      label: "Поиск",
      href: "#search",
      onClick: handleSearchClick,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
      active: false,
    },
    {
      label: "Магазины",
      href: "/promokody",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
        </svg>
      ),
      active: pathname.startsWith("/promokody") || pathname.startsWith("/store"),
    },
    {
      label: "Советы",
      href: "/sovety",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      ),
      active: pathname.startsWith("/sovety"),
    },
    {
      label: "Категории",
      href: "/category",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
      active: pathname.startsWith("/category"),
    },
  ];

  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 backdrop-blur-md px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden shadow-[0_-4px_16px_rgba(11,16,43,0.08)]"
    >
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const content = (
            <div
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all ${
                item.active
                  ? "text-red font-bold"
                  : "text-ink/60 hover:text-ink font-medium"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center transition-transform active:scale-90 ${
                  item.active ? "text-red scale-110" : "text-ink/70"
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
            </div>
          );

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              aria-current={item.active ? "page" : undefined}
              className="w-full select-none min-h-[44px] flex items-center justify-center"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
