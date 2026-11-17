import Link from "next/link";
import { getShoppingDayStatus, getBlackFridayStatus } from "@/lib/seasonalEvents";

interface SeasonalSaleBannerProps {
  blackFridayCount?: number;
  shoppingDayCount?: number;
}

export default function SeasonalSaleBanner({
  blackFridayCount = 0,
  shoppingDayCount = 0,
}: SeasonalSaleBannerProps) {
  const shoppingStatus = getShoppingDayStatus();
  const bfStatus = getBlackFridayStatus();

  return (
    <section
      aria-label="Главные распродажи сезона"
      className="border-t border-line pt-6 sm:pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
            Главные распродажи осени: 11.11 и Чёрная Пятница
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink/70 sm:text-sm">
            {bfStatus.stage === "warmup"
              ? "Чёрная Пятница стартует 27 ноября. Положите товары в корзину заранее и применяйте промокоды, пока не кончились лимиты."
              : bfStatus.stage === "active"
                ? "Чёрная Пятница идёт до 30 ноября. Применяйте промокоды, пока не кончились лимиты."
                : "Промокоды прошедших распродаж собраны в подборках."}
          </p>
        </div>

        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-xs font-bold text-red hover:underline"
        >
          <span>Все тематические подборки</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Карточка 1 (Хит): 11.11 Всемирный день шопинга — Главный старт недели */}
        <Link
          href="/akcii/den-shopinga-11-11"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-ink p-5 text-white transition-colors hover:bg-ink-soft sm:p-6"
        >

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-yellow">
                {shoppingStatus.badgeText}
              </span>
              <span className="text-xs font-semibold tabular-nums text-white/70">
                {shoppingDayCount > 0 ? `${shoppingDayCount} предложений` : "Подборка активна"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-xl font-extrabold sm:text-2xl text-white flex items-center gap-2">
              <span>Всемирный день шопинга 11.11</span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">
              Пик скидок года: праздничные промокоды на парфюмерию, косметику, электронику, доставку продуктов и подарки.
            </p>

            <div className="mt-3.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
              <span className="rounded border border-white/20 px-2 py-0.5 tabular-nums text-white/90">Randewoo до −55%</span>
              <span className="rounded border border-white/20 px-2 py-0.5 tabular-nums text-white/90">Пятёрочка −55%</span>
              <span className="rounded border border-white/20 px-2 py-0.5 tabular-nums text-white/90">ЛЭТУАЛЬ до 35 000 ₽</span>
              <span className="rounded border border-white/20 px-2 py-0.5 tabular-nums text-white/90">SUNLIGHT −5 000 ₽</span>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/15 pt-3.5 text-xs font-bold text-white">
            <span>Смотреть промокоды 11.11</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>

        {/* Карточка 2: Чёрная Пятница 2026 */}
        <Link
          href="/akcii/chernaya-pyatnica-2026"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-white p-5 transition-colors hover:border-ink/40 sm:p-6"
        >

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-red">
                {bfStatus.badgeText}
              </span>
              <span className="text-xs font-semibold tabular-nums text-ink/65">
                {blackFridayCount > 0 ? `${blackFridayCount} предложений` : "Старт 27 ноября"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-lg font-extrabold sm:text-xl text-ink group-hover:text-red transition-colors flex items-center gap-2">
              <span>Чёрная Пятница 2026</span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink/70 sm:text-sm">
              Финальный аккорд осени: распродажа бытовой техники, гаджетов, модной одежды и обуви со скидками до 80%.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-3.5 text-xs font-bold text-ink/80 group-hover:text-red transition-colors">
            <span>Подробнее о Чёрной Пятнице</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
