"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px -5% 0px" }
    );
    observer.observe(el);
    // Фолбэк: если IntersectionObserver не сработал (медленный скролл/JS),
    // показываем контент через 1.5s, чтобы он не остался скрытым.
    const t = setTimeout(() => el.classList.add("is-visible"), 1500);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <Tag ref={ref as never} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
