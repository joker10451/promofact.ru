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
            Готовьтесь к сезонным распродажам: сравнивайте доступные предложения и проверяйте сроки, минимальную сумму заказа и ограничения каждой акции.
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
        {/* Карточка 1: Чёрная Пятница */}
        <Link
          href="/akcii/chernaya-pyatnica-2026"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br from-ink to-ink/95 p-5 text-white shadow-sm transition-all hover:-translate-y-1 hover:border-red/60 hover:shadow-lg sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red/20 blur-2xl group-hover:bg-red/30 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-red px-3 py-1 text-xs font-extrabold tracking-wide uppercase text-white shadow-xs">
                {bfStatus.badgeText}
              </span>
              <span className="text-xs font-semibold text-white/70">
                {blackFridayCount > 0 ? `${blackFridayCount} предложений` : "Подборка готовится"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-lg font-extrabold sm:text-xl text-white group-hover:text-yellow transition-colors">
              Чёрная Пятница 2026
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-white/75 sm:text-sm">
              {blackFridayCount > 0
                ? "Предложения на одежду, косметику, технику и товары для дома. Размер выгоды и условия смотрите в карточках."
                : "Подтверждённых предложений пока нет. В подборке появятся акции с указанными сроками и условиями."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-3.5 text-xs font-bold text-yellow group-hover:translate-x-1 transition-transform">
            <span>{blackFridayCount > 0 ? "Смотреть купоны Чёрной Пятницы" : "О распродаже и подготовке"}</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>

        {/* Карточка 2: 11.11 Всемирный день шопинга */}
        <Link
          href="/akcii/den-shopinga-11-11"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-red/40 hover:shadow-lg sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow/25 blur-2xl group-hover:bg-yellow/40 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-yellow px-3 py-1 text-xs font-extrabold tracking-wide uppercase text-ink shadow-xs">
                {shoppingStatus.badgeText}
              </span>
              <span className="text-xs font-semibold text-ink/65">
                {shoppingDayCount > 0 ? `${shoppingDayCount} предложений` : "Подборка готовится"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-lg font-extrabold sm:text-xl text-ink group-hover:text-red transition-colors">
              Всемирный день шопинга 11.11
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink/70 sm:text-sm">
              Праздничные купоны и спецпредложения на популярные бренды: маркетплейсы, ювелирные изделия, мода, электроника и уют для дома.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-3.5 text-xs font-bold text-red group-hover:translate-x-1 transition-transform">
            <span>Смотреть акции 11.11</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
