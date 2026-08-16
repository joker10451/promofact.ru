"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ymReachGoal } from "@/components/YandexMetrika";

interface WheelPrize {
  id: number;
  label: string;
  storeName: string;
  storeSlug: string;
  code: string;
  bonus: string;
  link: string;
  color: string;
  textColor: string;
}

const PRIZES: WheelPrize[] = [
  {
    id: 1,
    label: "🍣 Тануки −20%",
    storeName: "Тануки Family",
    storeSlug: "tanukifamily",
    code: "20AV1474",
    bonus: "Скидка 20% от 1 090 ₽ на первый заказ",
    link: "/store/tanukifamily",
    color: "#ff3355",
    textColor: "#ffffff",
  },
  {
    id: 2,
    label: "🛒 Пятёрочка −55%",
    storeName: "Пятёрочка Доставка",
    storeSlug: "pyaterochka-dostavka",
    code: "a5w5yh74pr5",
    bonus: "Скидка 55% на первый заказ от 700 ₽",
    link: "/store/pyaterochka-dostavka",
    color: "#10b981",
    textColor: "#ffffff",
  },
  {
    id: 3,
    label: "🐟 Важная Рыба −15%",
    storeName: "Важная Рыба",
    storeSlug: "vazhnaya-ryba",
    code: "SPTB1068",
    bonus: "Скидка 15% на заказ от 3 999 ₽ по СПб",
    link: "/store/vazhnaya-ryba",
    color: "#0284c7",
    textColor: "#ffffff",
  },
  {
    id: 4,
    label: "💳 Карта −500₽",
    storeName: "Плати по миру",
    storeSlug: "plati-po-miru",
    code: "SALEADS2026",
    bonus: "Скидка 500 ₽ на международную карту",
    link: "/store/plati-po-miru",
    color: "#1877f2",
    textColor: "#ffffff",
  },
  {
    id: 5,
    label: "🎭 Афиша −100%",
    storeName: "Яндекс Афиша",
    storeSlug: "yandeks-afisha",
    code: "FW494632",
    bonus: "Скидка 100% на сервисный сбор",
    link: "/store/yandeks-afisha",
    color: "#8b5cf6",
    textColor: "#ffffff",
  },
  {
    id: 6,
    label: "👗 IRNBY −1000₽",
    storeName: "IRNBY",
    storeSlug: "irnby",
    code: "saleads",
    bonus: "Скидка 1 000 ₽ от 3 000 ₽ на одежду",
    link: "/store/irnby",
    color: "#f59e0b",
    textColor: "#0b102b",
  },
];

export default function DiscountWheel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Проверяем, крутил ли уже пользователь
    const savedPrize = localStorage.getItem("promofact_wheel_prize");
    if (savedPrize) {
      try {
        setWonPrize(JSON.parse(savedPrize));
        setHasSpun(true);
      } catch {}
    }
  }, []);

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWonPrize(null);
    setCopied(false);

    // Случайный выигрыш
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const selectedPrize = PRIZES[prizeIndex];

    const segmentAngle = 360 / PRIZES.length;
    // Угол сектора, чтобы сектор prizeIndex встал ровно под указатель сверху (0 градусов)
    const targetAngle = 360 - (prizeIndex * segmentAngle);
    // Добавляем 5 полных оборотов
    const totalRotation = rotation + 1800 + (targetAngle - (rotation % 360));

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(selectedPrize);
      setHasSpun(true);
      localStorage.setItem("promofact_wheel_prize", JSON.stringify(selectedPrize));
      ymReachGoal("wheel_spin_win");
    }, 4000);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    ymReachGoal("wheel_code_copied");
  };

  return (
    <>
      {/* Плавающая аккуратная кнопка-виджет на экране */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-line bg-white/95 backdrop-blur px-3.5 py-2 text-xs font-extrabold text-ink shadow-[0_4px_16px_rgba(11,16,43,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        aria-label="Колесо скидок"
      >
        <span className="text-base">🎰</span>
        <span className="font-bold">Колесо скидок</span>
      </button>

      {/* Модальное окно с колесом */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl">
            {/* Кнопка закрытия */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Закрыть"
            >
              ✕
            </button>

            <div className="text-center">
              <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                🎁 Беспроигрышная рулетка
              </span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl font-black text-white">
                Колесо Скидок
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Крути рулетку и выбей секретный эксклюзивный промокод!
              </p>
            </div>

            {/* Визуализация колеса фортуны */}
            <div className="relative mx-auto my-6 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
              {/* Указатель сверху */}
              <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 text-2xl sm:text-3xl filter drop-shadow-md">
                ▼
              </div>

              {/* Само вращающееся колесо */}
              <div
                className="relative h-full w-full rounded-full border-4 border-amber-400 shadow-2xl overflow-hidden transition-transform ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? "4s" : "0s",
                  transitionTimingFunction: "cubic-bezier(0.15, 0.9, 0.2, 1)",
                }}
              >
                {PRIZES.map((prize, idx) => {
                  const angle = 360 / PRIZES.length;
                  const rotate = idx * angle;
                  return (
                    <div
                      key={prize.id}
                      className="absolute top-0 left-0 h-full w-full origin-center"
                      style={{
                        transform: `rotate(${rotate}deg)`,
                        clipPath: "polygon(50% 50%, 15% 0%, 85% 0%)",
                        backgroundColor: prize.color,
                      }}
                    >
                      <div
                        className="absolute top-4 left-1/2 -translate-x-1/2 text-center text-xs sm:text-sm font-extrabold"
                        style={{ color: prize.textColor }}
                      >
                        <span className="block max-w-[90px] leading-tight drop-shadow-sm">
                          {prize.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Центр колеса */}
                <div className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border-2 border-amber-400 shadow-inner text-amber-400 font-extrabold text-xs">
                  ПРОМО
                </div>
              </div>
            </div>

            {/* Результат выигрыша */}
            {wonPrize && !isSpinning ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center animate-fade-in">
                <div className="text-2xl">🎉</div>
                <div className="font-display font-extrabold text-lg text-emerald-400">
                  Поздравляем! Ваш приз:
                </div>
                <div className="mt-1 font-bold text-white text-base">
                  {wonPrize.storeName}: {wonPrize.bonus}
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="rounded-xl border border-dashed border-amber-400/60 bg-amber-500/10 px-4 py-2 font-mono text-lg font-black text-amber-300 tracking-wider">
                    {wonPrize.code}
                  </div>
                  <button
                    onClick={() => copyCode(wonPrize.code)}
                    className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 text-sm font-bold transition-all shadow-md active:scale-95"
                  >
                    {copied ? "✓ Скопировано" : "Скопировать"}
                  </button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    href={wonPrize.link}
                    onClick={() => setIsOpen(false)}
                    className="inline-block rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all text-center"
                  >
                    Перейти к промокоду →
                  </Link>
                  <button
                    onClick={spinWheel}
                    className="text-xs text-slate-400 hover:text-white underline py-1"
                  >
                    Крутить еще раз
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className="w-full sm:w-auto min-w-[200px] rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 py-3.5 px-8 font-display text-base sm:text-lg font-black text-slate-950 shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSpinning ? "Колесо вращается..." : "ИСПЫТАТЬ УДАЧУ 🎲"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
