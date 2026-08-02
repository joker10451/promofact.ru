"use client";

import { useState } from "react";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
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
            Вы подписаны ✓ Скидки уже летят к вам на почту
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
      </div>
    </section>
  );
}
