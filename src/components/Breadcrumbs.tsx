import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

export default function Breadcrumbs({
  items,
  className = "",
  showHomeIcon = true,
}: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Хлебные крошки"
      className={`flex items-center text-xs text-ink/50 overflow-x-auto whitespace-nowrap scrollbar-none py-1 ${className}`}
    >
      <ol className="flex items-center flex-nowrap sm:flex-wrap gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.label + index} className="flex items-center gap-1.5 shrink-0">
              {/* Разделитель между элементами */}
              {!isFirst && (
                <svg
                  className="h-3 w-3 text-ink/30 shrink-0 select-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}

              {/* Ссылка или текущая страница */}
              {!isLast && item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 font-medium hover:text-ink transition-colors hover:underline underline-offset-2"
                >
                  {isFirst && showHomeIcon && (
                    <svg
                      className="h-3.5 w-3.5 text-ink/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="font-bold text-ink/80 truncate max-w-[220px] sm:max-w-md"
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
