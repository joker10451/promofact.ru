"use client";

import { ymReachGoal } from "@/components/YandexMetrika";
import { CHANNELS } from "@/lib/site";

/**
 * Раньше здесь была форма «подписка на email»: адрес никуда не сохранялся,
 * а уходил параметром цели в Яндекс Метрику (правила Метрики это запрещают),
 * и обещанная еженедельная рассылка никому не приходила. Подписка —
 * в Telegram-канал, где подборки действительно выходят.
 */
export default function Subscribe() {
  return (
    <section id="subscribe" className="scroll-mt-24 relative overflow-hidden bg-red py-12 sm:py-16">
      <span className="watermark" aria-hidden="true">
        %
      </span>
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
          Не пропускай скидки
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Новые промокоды и подборки — в нашем Telegram-канале. Без регистрации, отписка в одно
          нажатие.
        </p>

        <a
          href={CHANNELS.telegram}
          target="_blank"
          rel="noopener nofollow"
          onClick={() => ymReachGoal("tg_subscribe_click", { source: "subscribe_block" })}
          className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-base font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
        >
          Подписаться в Telegram →
        </a>

        <p className="mt-6 text-sm font-semibold text-white/90">
          Мы есть и в других соцсетях
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <a
            href="https://www.youtube.com/@SmartShopping-o9k"
            target="_blank"
            rel="noopener nofollow"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.8 19 12 19 12 19s7.2 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12Zm-13 3V9l5 3-5 3Z" />
            </svg>
            YouTube
          </a>
          <a
            href="https://dzen.ru/id/66d486816000f25d542e7180"
            target="_blank"
            rel="noopener nofollow"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.6 11.2-4.2 2.2c-.5.3-1.1-.1-.9-.6l.9-3-2.6-2c-.5-.4-.2-1.1.4-1.1h4.9c.5 0 .8.5.6 1l-1.2 2.8 2.7 1.9c.5.4.2 1.1-.6 1Z" />
            </svg>
            Дзен
          </a>
        </div>
      </div>
    </section>
  );
}
