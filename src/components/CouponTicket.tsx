"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import StoreLogo from "@/components/StoreLogo";
import { formatExpires } from "@/lib/format";
import { ymReachGoal } from "@/components/YandexMetrika";
import { CheckIcon } from "@/components/CheckIcon";
import { refineOffer } from "@/lib/offerRefiner";
import type { Coupon } from "@/lib/types";

/** Склонение «заказ/заказа/заказов» по числу. */
function pluralOrders(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "заказ";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заказа";
  return "заказов";
}

/** Стили главного акцента по типу оффера */
function getDiscountStyles(type: string): string {
  switch (type) {
    case "percent":
      return "text-red font-black tracking-tight";
    case "rub":
      return "text-ink font-black tracking-tight";
    case "gift":
      return "text-ink font-bold tracking-normal";
    case "subscription":
      return "text-[#1a56db] font-black tracking-tight";
    default:
      return "text-ink font-bold tracking-tight";
  }
}

/** Фоновая плашка акцента по типу */
function getDiscountBg(type: string): string {
  switch (type) {
    case "gift":
      return "bg-yellow/15 rounded-xl px-3 py-2 -mx-1";
    case "subscription":
      return "bg-blue-50 rounded-xl px-3 py-2 -mx-1";
    default:
      return "";
  }
}

export default function CouponTicket({
  coupon,
  proofCount = 0,
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyAndOpen = (code: string, url: string) => {
    if (typeof window !== "undefined" && url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
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
    if (code) ymReachGoal("copy_code", { code, store: store.name });
    ymReachGoal("click_store", { code: code || "no-code", store: store.name });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setToast(false);
    }, 6000);
  };

  const targetUrl = affiliate.link || affiliate.landingLink || store.site || "#";

  const offer = refineOffer(
    promocode.bonusName || "",
    promocode.terms || "",
    promocode.code || "",
    store.name,
    promocode.isFirstOrderOnly
  );

  const discountSizeClass =
    offer.discount.length > 20
      ? "text-lg sm:text-xl leading-snug"
      : offer.discount.length > 12
      ? "text-2xl sm:text-3xl leading-tight"
      : "text-3xl sm:text-4xl leading-none";

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-xs">
      {/* 1. Верхняя строка: Логотип + Название + Бейджи */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/store/${store.slug}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line/60 bg-white p-1 shadow-2xs hover:border-ink/30 transition-all"
              title={`Все промокоды ${store.name}`}
            >
              <StoreLogo
                slug={store.slug}
                name={store.name}
                logo={store.logo}
                site={store.site}
                size={36}
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={`/store/${store.slug}`}
                className="truncate font-display text-base font-bold text-ink hover:text-red transition-colors block"
                title={`Все промокоды ${store.name}`}
              >
                {store.name}
              </Link>
              <Link
                href={`/category/${store.categorySlug || "all"}`}
                className="text-xs text-ink/45 truncate font-medium hover:text-ink transition-colors block"
              >
                {store.category}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {promocode.isHit && (
              <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red">
                🔥 Хит
              </span>
            )}
            {promocode.customerTypeLabel ? (
              <span className="rounded-full bg-paper border border-line px-2 py-0.5 text-[10px] font-bold text-ink/70">
                {promocode.customerTypeLabel}
              </span>
            ) : promocode.isFirstOrderOnly ? (
              <span className="rounded-full bg-yellow/30 border border-yellow/50 px-2 py-0.5 text-[10px] font-bold text-ink/80">
                1-й заказ
              </span>
            ) : (
              <span className="rounded-full bg-paper border border-line px-2 py-0.5 text-[10px] font-bold text-ink/60">
                Для всех
              </span>
            )}
          </div>
        </div>

        {/* 2. Главный акцент — визуально разный для каждого типа */}
        <div className="mt-3.5 mb-2.5 min-h-[68px] flex flex-col justify-center">
          {/* Тип: subscription — синяя плашка, «✨ Промокод не требуется» */}
          {offer.type === "subscription" ? (
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2.5">
              <div className={`font-display ${discountSizeClass} text-[#1a56db] font-black`}>
                {offer.discount}
              </div>
              <p className="mt-1 text-xs font-semibold text-[#1a56db]/70">
                ✨ Промокод не требуется
              </p>
            </div>
          ) : offer.type === "gift" ? (
            /* Тип: gift — жёлтая плашка */
            <div className="rounded-xl bg-yellow/15 border border-yellow/40 px-3 py-2.5">
              <div className={`font-display ${discountSizeClass} text-ink font-bold`}>
                {offer.discount}
              </div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-ink/70 line-clamp-2 leading-relaxed">
                {offer.condition}
              </p>
            </div>
          ) : (
            /* Тип: percent / rub / default — стандартный */
            <>
              <div
                className={`font-display ${discountSizeClass} ${getDiscountStyles(offer.type)}`}
              >
                {offer.discount}
              </div>
              <p className="mt-1.5 text-xs sm:text-sm font-medium text-ink/75 line-clamp-2 leading-relaxed">
                {offer.condition}
              </p>
            </>
          )}
          {/* Для subscription отдельно показываем condition под плашкой */}
          {offer.type === "subscription" && (
            <p className="mt-2 text-xs sm:text-sm font-medium text-ink/70 line-clamp-2 leading-relaxed">
              {offer.condition}
            </p>
          )}
        </div>

        {/* 3. Статус проверки */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-paper/80 px-3 py-1.5 border border-line/50 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
            <span className="font-bold text-mint-dark text-[11px] sm:text-xs">
              {proofCount > 0
                ? `${proofCount} ${pluralOrders(proofCount)} подтверждено`
                : "Работает · Проверен сегодня"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDetailsModal(true)}
            className="text-[10px] sm:text-[11px] font-bold text-ink/60 hover:text-red transition-colors underline cursor-pointer"
          >
            Условия акции ℹ️
          </button>
        </div>
      </div>

      {/* 4. Нижний блок: Код + Кнопка One-Click */}
      <div className="mt-4 pt-3.5 border-t border-line/60">
        {!offer.isNoCode ? (
          <div className="space-y-2">
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

        {/* 5. Мета-данные и реклама */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-ink/40 font-medium">
          <span>
            {promocode.customerTypeLabel || (promocode.isFirstOrderOnly ? "Первый заказ" : "Для всех")} · RU
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

      {/* Модальное окно */}
      {showDetailsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-line animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink/60 hover:bg-paper/80 hover:text-ink transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line/60 bg-white p-1 shadow-2xs">
                <StoreLogo
                  slug={store.slug}
                  name={store.name}
                  logo={store.logo}
                  site={store.site}
                  size={40}
                />
              </div>
              <div>
                <h4 className="font-display text-lg font-extrabold text-ink">{store.name}</h4>
                <p className="text-xs text-ink/50 font-medium">{store.category}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-paper/60 p-4 border border-line/60">
              <div className="font-display text-2xl font-black text-ink">{offer.discount}</div>
              <div className="mt-1 text-sm font-semibold text-ink/80">{offer.condition}</div>
            </div>

            <div className="mt-5 space-y-3 text-xs leading-relaxed text-ink/80">
              <div>
                <span className="font-bold text-ink block mb-1">📋 Полные условия акции:</span>
                <p className="rounded-xl bg-slate-50 p-3 text-ink/70 border border-line/40">
                  {offer.fullTerms}
                </p>
              </div>

              <div className="rounded-xl bg-mint/10 border border-mint/30 p-3 text-[11px] text-ink/80 space-y-1">
                <div className="font-bold text-mint-dark flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Гарантия актуальности ПромоФакт</span>
                </div>
                <p className="text-ink/65 text-[10px] leading-relaxed">
                  Промокод проверен сегодня на официальном сайте магазина {store.name}. Скидка применяется в корзине при соблюдении условий.
                </p>
                {proofCount > 0 && (
                  <p className="text-ink/65 text-[10px] leading-relaxed font-semibold">
                    По этому коду уже подтверждено {proofCount} {pluralOrders(proofCount)}.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/50 text-[11px]">
                <div>
                  <span className="text-ink/45 block">Действует:</span>
                  <span className="font-bold text-ink">
                    {promocode.expires ? `до ${formatExpires(promocode.expires)}` : "Бессрочно"}
                  </span>
                </div>
                <div>
                  <span className="text-ink/45 block">Для кого:</span>
                  <span className="font-bold text-ink">
                    {promocode.customerTypeLabel || (promocode.isFirstOrderOnly ? "Только новый клиент" : "Для всех покупателей")}
                  </span>
                </div>
              </div>

              {affiliate.ordText && (
                <div className="pt-2 text-[10px] text-ink/40 border-t border-line/40">
                  {affiliate.ordText}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  copyAndOpen(promocode.code, targetUrl);
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-red to-red-dark py-3.5 px-4 text-center text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
              >
                {promocode.code ? `Скопировать ${promocode.code} и перейти →` : `Перейти в магазин →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
