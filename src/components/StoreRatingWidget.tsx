"use client";

import { useState, useEffect } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";

interface StoreRatingWidgetProps {
  storeSlug: string;
  storeName: string;
  initialRating: number;
  initialCount: number;
  compact?: boolean;
}

export default function StoreRatingWidget({
  storeSlug,
  storeName,
  initialRating,
  initialCount,
  compact = false,
}: StoreRatingWidgetProps) {
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`promofact_rating_${storeSlug}`);
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 1 && val <= 5) {
          setUserRating(val);
          setSubmitted(true);
        }
      }
    } catch {}
  }, [storeSlug]);

  const handleVote = (val: number) => {
    if (submitted) return;
    setUserRating(val);
    setSubmitted(true);
    setCount((prev) => prev + 1);

    // Пересчет средней оценки с учетом голоса пользователя
    const newAverage = (rating * count + val) / (count + 1);
    setRating(Math.round(newAverage * 10) / 10);

    try {
      localStorage.setItem(`promofact_rating_${storeSlug}`, val.toString());
      ymReachGoal("store_rating_submitted", { store: storeSlug, rating: val });
    } catch {}
  };

  const activeStars = hoverRating || userRating || Math.round(rating);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">
        <div className="flex items-center text-amber-500">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="font-extrabold">{rating.toFixed(1)}</span>
        <span className="text-amber-800/70 font-semibold">({count})</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-3.5 sm:p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Оценка и количество отзывов */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-display font-black text-lg shadow-sm">
            {rating.toFixed(1)}
          </div>
          <div>
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleVote(star)}
                  onMouseEnter={() => !submitted && setHoverRating(star)}
                  onMouseLeave={() => !submitted && setHoverRating(null)}
                  disabled={submitted}
                  className={`p-0.5 transition-transform ${
                    !submitted ? "hover:scale-125 cursor-pointer" : "cursor-default"
                  }`}
                  aria-label={`Поставить ${star} из 5 звёзд`}
                >
                  <svg
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      star <= activeStars
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "fill-slate-200 text-slate-200"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="mt-0.5 text-xs font-bold text-ink/75">
              Рейтинг купонов {storeName}:{" "}
              <span className="font-extrabold text-ink">{rating.toFixed(1)}</span> из 5{" "}
              <span className="text-ink/50 font-semibold">({count} оценок)</span>
            </div>
          </div>
        </div>

        {/* Статус голосования */}
        <div className="text-xs font-semibold">
          {submitted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 font-bold text-emerald-800">
              <span className="text-emerald-600">✓</span> Спасибо за вашу оценку!
            </span>
          ) : (
            <span className="text-ink/55 text-[11px] sm:text-xs">
              Кликните на звезду, чтобы оценить скидки
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
