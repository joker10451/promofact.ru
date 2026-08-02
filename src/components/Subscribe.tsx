"use client";

import { useState } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    ymReachGoal("subscribe", { email: email.trim() });
    setDone(true);
  };

  return (
    <section id="subscribe" className="scroll-mt-24 relative overflow-hidden bg-red py-16 sm:py-20">
      <span className="watermark" aria-hidden="true">
        %
      </span>
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
          Не пропускай скидки
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Раз в неделю присылаем подборку самых жирных промокодов недели. Без спама,
          отписка в один клик.
        </p>

        {done ? (
          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white px-6 py-5 font-bold text-ink shadow-offset">
            Вы подписаны на скидки уже летят к вам на почту
          </div>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ваш@email.ru"
              className="flex-1 rounded-full border-2 border-ink bg-white px-5 py-3 text-sm outline-none focus:border-yellow transition-colors"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Подписаться
            </button>
          </form>
        )}

        <p className="mt-6 text-sm font-semibold text-white/90">
          Или заходи чаще — мы в Telegram
        </p>
        <a
          href="https://t.me/smart_zakupka"
          target="_blank"
          rel="noopener nofollow"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
          </svg>
          @smart_zakupka
        </a>
      </div>
    </section>
  );
}
