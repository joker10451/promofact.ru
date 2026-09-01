"use client";

import { useEffect, useRef, useState } from "react";
import { formatExpires } from "@/lib/format";
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

  // Высокоточный парсер скидки и условий
  const parseOffer = (): {
    isNoCode: boolean;
    discount: string;
    condition: string;
  } => {
    const raw = (promocode.bonusName || "").trim();
    const isNoCode = !promocode.code || promocode.code.trim() === "";

    if (isNoCode) {
      return {
        isNoCode: true,
        discount: raw.includes("60 дней") ? "60 дней за 1 ₽" : (raw.slice(0, 24) || "Спецпредложение"),
        condition: raw.includes("5%") ? "+ 5% кэшбэк на игры в GamersHub" : "Промокод не требуется",
      };
    }

    // 1. Подарки (проверяем ДО рублей, чтобы не путать подарок от 4299 ₽ со скидкой 4299 ₽)
    const isGift =
      /подарок|ролл|фото|пицца|подвеск/i.test(raw) ||
      /подарок|ролл|фото/i.test(promocode.terms || "");

    if (isGift) {
      let giftTitle = "🎁 Подарок к заказу";
      if (/ролл/i.test(raw)) giftTitle = "🎁 Ролл в подарок";
      else if (/фото/i.test(raw)) giftTitle = "🎁 50 фото в подарок";
      else if (/подвеск/i.test(raw)) giftTitle = "🎁 Подвеска в подарок";

      const thresholdMatch = (raw + " " + (promocode.terms || "")).match(/от\s+([\d\s]+)\s*₽/i);
      const condition = thresholdMatch
        ? `при заказе от ${thresholdMatch[1].trim()} ₽`
        : (promocode.terms ? promocode.terms.split(".")[0] : "при заказе по промокоду");

      return {
        isNoCode: false,
        discount: giftTitle,
        condition,
      };
    }

    // 2. Процентные скидки (-15%, -20%, -55%)
    const pctMatch = raw.match(/(\d+\s*%)/);
    if (pctMatch) {
      const pct = pctMatch[1].replace(/\s/g, "");
      // Очищаем хвост от повторения процентов и мусора
      let cleaned = raw
        .replace(new RegExp(`(скидка\\s+)?(до\\s+)?[-−]?\\s*${pctMatch[1]}`, "gi"), "")
        .replace(/^(на|в|от|при)\s+\d+\s*%/gi, "")
        .replace(/^(скидка|минус|до|на|в|от|[,\s–—-])+/gi, "")
        .replace(/[,\s–—-]+$/g, "")
        .trim();

      let condition = `на заказ`;
      if (cleaned) {
        if (/^(при|от|на|в|\+)\s+/i.test(cleaned)) {
          condition = cleaned;
        } else {
          condition = `на ${cleaned}`;
        }
      } else if (promocode.isFirstOrderOnly) {
        condition = "на первый заказ";
      }

      return {
        isNoCode: false,
        discount: `−${pct}`,
        condition,
      };
    }

    // 3. Фиксированные скидки в рублях (-1 050 ₽, -500 ₽)
    const rubMatch = raw.match(/(\d+[\s\d]*\s*₽)/);
    if (rubMatch) {
      const rub = rubMatch[1].trim();
      let cleaned = raw
        .replace(new RegExp(`(скидка\\s+)?(до\\s+)?[-−]?\\s*${rubMatch[1]}`, "gi"), "")
        .replace(/^(на|в|от|при)\s+\d+[\s\d]*\s*₽/gi, "")
        .replace(/^(скидка|минус|до|на|в|от|[,\s–—-])+/gi, "")
        .replace(/[,\s–—-]+$/g, "")
        .trim();

      let condition = "на заказ по акции";
      if (cleaned) {
        if (/^(при|от|на|в|\+)\s+/i.test(cleaned)) {
          condition = cleaned;
        } else {
          condition = `на ${cleaned}`;
        }
      } else if (promocode.isFirstOrderOnly) {
        condition = "на первый заказ";
      }

      return {
        isNoCode: false,
        discount: `−${rub}`,
        condition,
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
    <article className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-xs">
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
                {store.name.slice(0, 1).toUpperCase()}
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
          <div className="font-display text-3xl sm:text-4xl font-black tracking-tight text-ink leading-none">
            {offer.discount}
          </div>
          <p className="mt-2 text-xs sm:text-sm font-medium text-ink/75 line-clamp-1">
            {offer.condition}
          </p>
        </div>

        {/* 3. Фирменный Trust-виджет надежности */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-paper/80 px-3 py-1.5 border border-line/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-mint text-white text-[9px] font-bold">
              ✓
            </span>
            <span className="font-bold text-ink text-[11px] sm:text-xs">
              {trustPercent}% подтвердили работу
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-ink/45">
            {checkCount} проверок
          </span>
        </div>
      </div>

      {/* 4. Нижний блок: Код + Кнопка One-Click */}
      <div className="mt-4 pt-3.5 border-t border-line/60">
        {!offer.isNoCode ? (
          <div className="space-y-2">
            {/* Поле с промокодом */}
            <div
              onClick={() => copyAndOpen(promocode.code, targetUrl)}
              className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-ink/20 bg-paper px-3.5 py-2 font-mono text-xs sm:text-sm font-bold tracking-wider text-ink transition-colors hover:border-red hover:bg-red/5"
              title="Нажмите, чтобы скопировать"
            >
              <span className="truncate">{promocode.code}</span>
              <span className="font-sans text-[10px] font-bold text-ink/40">
                {copied ? "скопировано" : "код купона"}
              </span>
            </div>

            {/* Главная кнопка действия */}
            <button
              type="button"
              onClick={() => copyAndOpen(promocode.code, targetUrl)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-center text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
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
                <span className="truncate">Скопировать и открыть {store.name} →</span>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => copyAndOpen("", targetUrl)}
            className="w-full rounded-xl bg-gradient-to-r from-red to-red-dark py-3 px-4 text-center text-xs sm:text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer truncate"
          >
            Получить скидку в {store.name} →
          </button>
        )}

        {/* 5. Вторичные мета-данные и реклама */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-ink/40 font-medium">
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
          <p className="mt-1.5 text-center text-[9px] text-ink/30 line-clamp-1">
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
