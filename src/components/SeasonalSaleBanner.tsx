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
      className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white via-sand/40 to-white p-5 shadow-xs sm:p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red">
            <span>🔥</span>
            <span>Сезон больших скидок 2026</span>
          </div>
          <h2 className="mt-2 font-display text-xl font-extrabold text-ink sm:text-2xl">
            Главные распродажи осени: 11.11 и Чёрная Пятница
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink/70 sm:text-sm">
            Открыт разогрев ко Всемирному дню шопинга 11.11. Сравнивайте предложения, собирайте корзину заранее и активируйте промокоды до исчерпания лимитов.
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Карточка 1 (Хит): 11.11 Всемирный день шопинга — Главный старт недели */}
        <Link
          href="/akcii/den-shopinga-11-11"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-red/40 bg-gradient-to-br from-ink via-ink/95 to-red-dark/85 p-5 text-white shadow-md transition-all hover:-translate-y-1 hover:border-red hover:shadow-xl sm:p-6"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-red/30 blur-2xl group-hover:bg-red/40 transition-all" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-yellow/20 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-gradient-to-r from-yellow to-yellow-dark px-3 py-1 text-xs font-black tracking-wide uppercase text-ink shadow-xs">
                {shoppingStatus.badgeText}
              </span>
              <span className="text-xs font-bold text-yellow">
                {shoppingDayCount > 0 ? `${shoppingDayCount} предложений` : "Подборка активна"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-xl font-extrabold sm:text-2xl text-white group-hover:text-yellow transition-colors flex items-center gap-2">
              <span>🛍️</span>
              <span>Всемирный день шопинга 11.11</span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">
              Пик скидок года: праздничные промокоды на парфюмерию, косметику, электронику, доставку продуктов и подарки.
            </p>

            <div className="mt-3.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-white">Randewoo до −55%</span>
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-white">Пятёрочка −55%</span>
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-white">ЛЭТУАЛЬ до 35 000 ₽</span>
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-white">SUNLIGHT −5 000 ₽</span>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/15 pt-3.5 text-xs font-bold text-yellow group-hover:translate-x-1 transition-transform">
            <span>Смотреть промокоды 11.11</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>

        {/* Карточка 2: Чёрная Пятница 2026 */}
        <Link
          href="/akcii/chernaya-pyatnica-2026"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-red/40 hover:shadow-lg sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red/10 blur-2xl group-hover:bg-red/20 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-extrabold tracking-wide uppercase text-white shadow-xs">
                {bfStatus.badgeText}
              </span>
              <span className="text-xs font-semibold text-ink/65">
                {blackFridayCount > 0 ? `${blackFridayCount} предложений` : "Старт 26 ноября"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-lg font-extrabold sm:text-xl text-ink group-hover:text-red transition-colors flex items-center gap-2">
              <span>🖤</span>
              <span>Чёрная Пятница 2026</span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink/70 sm:text-sm">
              Финальный аккорд осени: распродажа бытовой техники, гаджетов, модной одежды и обуви со скидками до 80%.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-3.5 text-xs font-bold text-ink/80 group-hover:text-red group-hover:translate-x-1 transition-all">
            <span>Подробнее о Чёрной Пятнице</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
