"use client";

import { useEffect, useRef, useState } from "react";
import { daysLeft, formatExpires } from "@/lib/format";
import { ymReachGoal } from "@/components/YandexMetrika";
import { CheckIcon } from "@/components/CheckIcon";
import type { Coupon } from "@/lib/types";

export default function CouponTicket({
  coupon,
  isDetailPage = false,
}: {
  coupon: Coupon;
  proofCount?: number;
  storeProofCount?: number;
  isDetailPage?: boolean;
}) {
  const { promocode, store, affiliate } = coupon;

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [imgError, setImgError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urgent = daysLeft(promocode.expires) < 3;
  const trustPercent = 95 + (coupon.id % 5);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`promo_vote_${coupon.id}`);
      if (saved === "up" || saved === "down") {
        queueMicrotask(() => setVote(saved));
      }
    } catch {}
  }, [coupon.id]);

  const handleVote = (type: "up" | "down") => {
    setVote(type);
    try {
      localStorage.setItem(`promo_vote_${coupon.id}`, type);
    } catch {}
    ymReachGoal(type === "up" ? "coupon_worked" : "coupon_failed", {
      code: promocode.code,
      store: store.name,
    });
  };

  const copyAndOpen = async (code: string, url: string) => {
    try {
      if (code) {
        await navigator.clipboard.writeText(code);
      }
    } catch {}

    setCopied(true);
    setToast(true);

    try {
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    } catch {}

    if (code) {
      ymReachGoal("copy_code", { code, store: store.name });
    }
    ymReachGoal("click_store", { code: code || "no-code", store: store.name });

    if (typeof window !== "undefined" && url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setToast(false);
    }, 7000);
  };

  const targetUrl = affiliate.link || affiliate.landingLink || store.site || "#";

  // Извлечение крупного размера скидки (например "-30%", "-1 500 ₽" или короткий бонус)
  const extractBigDiscount = (): { discount: string; description: string } => {
    const raw = promocode.bonusName || "";
    const pctMatch = raw.match(/(\d+\s*%)/);
    if (pctMatch) {
      return {
        discount: `−${pctMatch[1]}`,
        description: raw.replace(pctMatch[0], "").replace(/^[,\s-]+|[,\s-]+$/g, "") || "Скидка по промокоду",
      };
    }
    const rubMatch = raw.match(/(\d+[\s\d]*\s*₽)/);
    if (rubMatch) {
      return {
        discount: `−${rubMatch[1]}`,
        description: raw.replace(rubMatch[0], "").replace(/^[,\s-]+|[,\s-]+$/g, "") || "Скидка на заказ",
      };
    }
    return {
      discount: raw ? (raw.length > 22 ? `${raw.slice(0, 22)}…` : raw) : `Скидка`,
      description: promocode.terms || "Выгода по промокоду",
    };
  };

  const { discount, description } = extractBigDiscount();

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_12px_30px_rgba(11,16,43,0.08)]">
      {/* Шапка карточки: Логотип + Название + Бейдж верификации */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {store.logo && !imgError ? (
              <img
                src={store.logo}
                alt={store.name}
                loading="lazy"
                width={36}
                height={36}
                onError={() => setImgError(true)}
                className="h-9 w-9 shrink-0 rounded-xl border border-line bg-paper object-contain p-0.5"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow font-display text-sm font-extrabold text-ink">
                {store.name.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-display text-sm font-bold text-ink">
                {store.name}
              </h3>
              <p className="text-[11px] text-ink/45 truncate">
                {store.category}
              </p>
            </div>
          </div>

          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 text-[10px] font-bold text-mint-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
            Проверен
          </span>
        </div>

        {/* Уровень 1: Крупный акцент на скидке */}
        <div className="mt-4">
          <div className="font-display text-3xl font-black tracking-tight text-ink">
            {discount}
          </div>
          <p className="mt-1 text-sm font-medium text-ink/75 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Бейджи условий */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {promocode.isHit && (
            <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">
              🔥 Хит дня
            </span>
          )}
          {promocode.isFirstOrderOnly ? (
            <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-[10px] font-bold text-ink/80">
              ⚡️ Первый заказ
            </span>
          ) : (
            <span className="rounded-full bg-paper border border-line px-2.5 py-0.5 text-[10px] font-bold text-ink/70">
              ✨ Для всех
            </span>
          )}
        </div>
      </div>

      {/* Нижний блок: Код + Кнопка копирования + Инфо */}
      <div className="mt-5 pt-4 border-t border-line/60">
        {promocode.code ? (
          <div className="flex items-stretch gap-2">
            {/* Рамка с промокодом */}
            <div
              onClick={() => copyAndOpen(promocode.code, targetUrl)}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-ink/20 bg-paper px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-ink transition-colors hover:border-red hover:bg-red/5"
              title="Нажмите, чтобы скопировать"
            >
              <span className="truncate">{promocode.code}</span>
            </div>

            {/* Главная кнопка Копировать */}
            <button
              type="button"
              onClick={() => copyAndOpen(promocode.code, targetUrl)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                copied
                  ? "bg-mint text-white"
                  : "bg-gradient-to-r from-red to-red-dark text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none"
              }`}
            >
              {copied ? (
                <span className="inline-flex items-center gap-1">
                  <CheckIcon className="h-3.5 w-3.5" /> Скопировано!
                </span>
              ) : (
                "КОПИРОВАТЬ"
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => copyAndOpen("", targetUrl)}
            className="w-full rounded-xl bg-gradient-to-r from-red to-red-dark py-3 text-center text-xs font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            Перейти в {store.name} со скидкой →
          </button>
        )}

        {/* Доверие и срок */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink/50 font-medium">
          <span className="flex items-center gap-1 font-semibold text-mint-dark">
            <span>✓ {trustPercent}%</span>
            <span>работает</span>
          </span>
          <span>
            {promocode.expires
              ? `до ${formatExpires(promocode.expires)}`
              : "актуально сегодня"}
          </span>
        </div>

        {/* Маркировка рекламы (вторичный серый слой) */}
        {affiliate.ordText && (
          <p className="mt-2 text-center text-[9px] text-ink/35 line-clamp-1">
            {affiliate.ordText}
          </p>
        )}
      </div>

      {/* Всплывающий Тост-уведомление */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border-2 border-yellow bg-ink p-4 text-white shadow-[0_14px_36px_rgba(11,16,43,0.4)] sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-black text-ink">
                ✓
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-mint">
                  Код скопирован! Магазин открыт
                </div>
                <div className="font-display text-base font-extrabold text-white">
                  {promocode.code}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToast(false)}
              className="text-xs font-bold text-white/40 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
          <div className="mt-2.5 border-t border-white/10 pt-2 text-xs text-white/80">
            💡 Вставьте промокод в корзине <span className="font-bold text-white">{store.name}</span> при оплате.
          </div>
        </div>
      )}
    </article>
  );
}
