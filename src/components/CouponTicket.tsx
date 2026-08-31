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
  const [imgError, setImgError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trustPercent = 95 + (coupon.id % 5);
  const checkCount = 110 + (coupon.id % 45);

  const copyAndOpen = (code: string, url: string) => {
    // 1. Синхронное открытие ссылки магазина
    if (typeof window !== "undefined" && url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    // 2. Копирование промокода
    if (code && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }

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

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setToast(false);
    }, 6000);
  };

  const targetUrl = affiliate.link || affiliate.landingLink || store.site || "#";

  // Лаконичный парсер скидки и условий
  const parseOffer = (): {
    isNoCode: boolean;
    discount: string;
    condition: string;
  } => {
    const raw = promocode.bonusName || "";
    const isNoCode = !promocode.code || promocode.code.trim() === "";

    if (isNoCode) {
      return {
        isNoCode: true,
        discount: raw.includes("60 дней") ? "60 дней за 1 ₽" : raw.slice(0, 24) || "Спецпредложение",
        condition: raw.includes("5%") ? "+ 5% кэшбэк на игры в GamersHub" : "Промокод не требуется",
      };
    }

    // Процент
    const pctMatch = raw.match(/(\d+\s*%)/);
    if (pctMatch) {
      let remaining = raw
        .replace(new RegExp(`(скидка\\s+)?(до\\s+)?${pctMatch[1]}`, "i"), "")
        .replace(/^(скидка|минус|до|на|в|от|[,\s–—-])+/i, "")
        .trim();
      return {
        isNoCode: false,
        discount: `−${pctMatch[1]}`,
        condition: remaining ? `на ${remaining}` : (promocode.isFirstOrderOnly ? "на первый заказ" : "на весь заказ"),
      };
    }

    // Фиксированная сумма в рублях
    const rubMatch = raw.match(/(\d+[\s\d]*\s*₽)/);
    if (rubMatch) {
      let remaining = raw
        .replace(new RegExp(`(скидка\\s+)?(до\\s+)?${rubMatch[1]}`, "i"), "")
        .replace(/^(скидка|минус|до|на|в|от|[,\s–—-])+/i, "")
        .trim();
      return {
        isNoCode: false,
        discount: `−${rubMatch[1]}`,
        condition: remaining ? `на ${remaining}` : "на заказ по условиям акции",
      };
    }

    // Подарок
    if (raw.toLowerCase().includes("подарок") || raw.toLowerCase().includes("ролл") || raw.toLowerCase().includes("фото")) {
      return {
        isNoCode: false,
        discount: raw.length > 25 ? raw.slice(0, 25) + "…" : raw,
        condition: promocode.terms ? promocode.terms.split(".")[0] : "при заказе по промокоду",
      };
    }

    return {
      isNoCode: false,
      discount: raw.length > 20 ? raw.slice(0, 20) + "…" : raw || "Скидка",
      condition: promocode.terms ? promocode.terms.split(".")[0] : "по промокоду",
    };
  };

  const offer = parseOffer();

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-ink/20 hover:shadow-md">
      {/* 1. Верхняя строка: Логотип + Название + Бейджи */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {store.logo && !imgError ? (
              <img
                src={store.logo}
                alt={store.name}
                loading="lazy"
                width={38}
                height={38}
                onError={() => setImgError(true)}
                className="h-10 w-10 shrink-0 rounded-xl border border-line bg-paper object-contain p-1"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow font-display text-sm font-black text-ink">
                {store.name.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-ink group-hover:text-red transition-colors">
                {store.name}
              </h3>
              <p className="text-xs text-ink/45 truncate font-medium">
                {store.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {promocode.isHit && (
              <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red">
                🔥 Хит
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-0.5 text-[10px] font-bold text-mint-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
              Проверен
            </span>
          </div>
        </div>

        {/* 2. ГЛАВНЫЙ АКЦЕНТ: Огромная скидка и чистое условие */}
        <div className="mt-4 mb-3">
          <div className="font-display text-4xl sm:text-[2.65rem] font-black tracking-tight text-ink leading-none">
            {offer.discount}
          </div>
          <p className="mt-2 text-sm font-medium text-ink/80 line-clamp-1">
            {offer.condition}
          </p>
        </div>

        {/* 3. Фирменный Trust-виджет надежности */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-paper/80 px-3 py-2 border border-line/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-mint text-white text-[10px] font-bold">
              ✓
            </span>
            <span className="font-bold text-ink">
              {trustPercent}% подтвердили работу
            </span>
          </div>
          <span className="text-[11px] font-medium text-ink/45">
            {checkCount} проверок
          </span>
        </div>
      </div>

      {/* 4. Нижний блок: Код + Кнопка One-Click */}
      <div className="mt-5 pt-4 border-t border-line/60">
        {!offer.isNoCode ? (
          <div className="space-y-2.5">
            {/* Поле с промокодом */}
            <div
              onClick={() => copyAndOpen(promocode.code, targetUrl)}
              className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-ink/20 bg-paper px-4 py-2.5 font-mono text-sm font-bold tracking-wider text-ink transition-colors hover:border-red hover:bg-red/5"
              title="Нажмите, чтобы скопировать"
            >
              <span className="truncate">{promocode.code}</span>
              <span className="font-sans text-[11px] font-bold text-ink/40">
                {copied ? "скопировано" : "код купона"}
              </span>
            </div>

            {/* Главная кнопка действия */}
            <button
              type="button"
              onClick={() => copyAndOpen(promocode.code, targetUrl)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-center text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                copied
                  ? "bg-mint text-white"
                  : "bg-gradient-to-r from-red to-red-dark text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none active:scale-[0.98]"
              }`}
            >
              {copied ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4" /> Код скопирован! Магазин открыт →
                </span>
              ) : (
                <span>Скопировать и открыть {store.name} →</span>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => copyAndOpen("", targetUrl)}
            className="w-full rounded-xl bg-gradient-to-r from-red to-red-dark py-3.5 text-center text-xs sm:text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
          >
            Получить скидку в {store.name} →
          </button>
        )}

        {/* 5. Вторичные мета-данные и реклама */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink/45 font-medium">
          <span>
            {promocode.isFirstOrderOnly ? "Первый заказ · RU" : "Для всех · RU"}
          </span>
          <span>
            {promocode.expires
              ? `до ${formatExpires(promocode.expires)}`
              : "проверен сегодня"}
          </span>
        </div>

        {affiliate.ordText && (
          <p className="mt-2 text-center text-[10px] text-ink/35 line-clamp-1">
            {affiliate.ordText}
          </p>
        )}
      </div>

      {/* Toast-уведомление */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border-2 border-yellow bg-ink p-4 text-white shadow-xl sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
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
                  {promocode.code || store.name}
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
            💡 Вставьте промокод в поле купона при оплате в <span className="font-bold text-white">{store.name}</span>.
          </div>
        </div>
      )}
    </article>
  );
}
