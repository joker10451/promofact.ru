"use client";

import { useEffect, useRef, useState } from "react";

function animateValue(target: number, onFrame: (v: number) => void, duration = 1600) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onFrame(target);
    return;
  }
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    onFrame(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function Counters() {
  const [values, setValues] = useState([0, 0, 0]);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const targets = [12480, 940, 18];
          targets.forEach((target, i) => {
            animateValue(target, (v) => {
              setValues((prev) => {
                const next = [...prev];
                next[i] = v;
                return next;
              });
            });
          });
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fmt = (v: number) => v.toLocaleString("ru-RU");

  return (
    <div ref={ref} className="flex flex-wrap gap-x-8 gap-y-4">
      <div>
        <div className="font-display text-3xl sm:text-4xl font-extrabold text-ink">
          {fmt(values[0])}+
        </div>
        <div className="text-sm text-ink/60">промокодов</div>
      </div>
      <div>
        <div className="font-display text-3xl sm:text-4xl font-extrabold text-ink">
          {fmt(values[1])}+
        </div>
        <div className="text-sm text-ink/60">магазинов</div>
      </div>
      <div>
        <div className="font-display text-3xl sm:text-4xl font-extrabold text-red">
          {fmt(values[2])} млн ₽
        </div>
        <div className="text-sm text-ink/60">сэкономлено</div>
      </div>
    </div>
  );
}
