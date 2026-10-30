"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { ymReachGoal } from "@/components/YandexMetrika";

interface NewsletterBoxProps {
  source?: string;
}

export default function NewsletterBox({ source = "home" }: NewsletterBoxProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Укажите корректный email");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        ymReachGoal("email_subscribe_success", { source });
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Не удалось оформить подписку");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Сетевая ошибка. Попробуйте позже");
    }
  };

  return (
    <section
      aria-label="Подписка на дайджест промокодов"
      className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-paper via-white to-sand/40 p-6 sm:p-10 shadow-xs"
    >
      {/* Фоновые акценты */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-yellow/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red">
            <span>📬</span>
            <span>Дайджест экономии</span>
          </div>
          <h2 className="mt-2.5 font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
            Лучшие промокоды недели — прямо на почту
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-ink/70 leading-relaxed max-w-xl">
            Раз в неделю отбираем проверенные секретные промокоды, закрытые скидки до 90% и подарки к заказам. Никакого спама, отписка в 1 клик.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-ink/60">
            <span className="flex items-center gap-1.5">
              <Icon name="check" size={14} className="text-mint-dark" />
              <span>Только проверенные промокоды</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="check" size={14} className="text-mint-dark" />
              <span>Без спама и рекламы займов</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {status === "success" ? (
            <div className="rounded-2xl border border-mint/40 bg-mint/10 p-5 text-center">
              <span className="text-2xl">🎉</span>
              <p className="mt-1 font-display text-sm sm:text-base font-extrabold text-ink">
                Вы успешно подписались!
              </p>
              <p className="mt-1 text-xs text-ink/70">
                Первая подборка секретных скидок прилетит в ближайшем выпуске.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш адрес эл. почты"
                aria-label="Email для подписки"
                className="h-12 flex-1 rounded-xl sm:rounded-2xl border border-line bg-white px-4 text-xs sm:text-sm text-ink outline-none transition-all placeholder:text-ink/40 focus:border-red focus:ring-2 focus:ring-red/20 shadow-xs"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-12 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red to-red-dark text-xs sm:text-sm font-extrabold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                {status === "loading" ? "Подписка..." : "Подписаться →"}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-xs font-semibold text-red">{errorMessage}</p>
          )}

          {/* Альтернатива: Telegram */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-line/60">
            <span className="text-xs text-ink/60 font-medium">Предпочитаете Telegram?</span>
            <a
              href="https://t.me/smart_zakupka"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1d8fc8] hover:underline"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              <span>Подписаться на канал →</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
