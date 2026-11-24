import Link from "next/link";
import { getShoppingDayStatus, getBlackFridayStatus, getNewYearStatus } from "@/lib/seasonalEvents";

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
  const nyStatus = getNewYearStatus();
  const useFinanceAndBf = shoppingStatus.stage === "ended" && bfStatus.stage !== "ended";
  const isDecember = bfStatus.stage === "ended";

  return (
    <section
      aria-label="Главные распродажи сезона"
      className="border-t border-line pt-6 sm:pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
            {isDecember
              ? "Новогодние скидки 2027 и карты с кэшбэком"
              : useFinanceAndBf
                ? "Чёрная Пятница 2026 и карты с рассрочкой 0%"
                : "Главные распродажи осени: 11.11 и Чёрная Пятница"}
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink/70 sm:text-sm">
            {isDecember
              ? "Готовимся к праздникам выгодно: проверенные промокоды на подарки и банковские карты со 120 днями без % и кэшбэком."
              : bfStatus.stage === "warmup"
                ? "Чёрная Пятница стартует 27 ноября. Соберите корзину заранее и оплатите картой с кэшбэком или Сплитом 0% поверх промокода."
                : bfStatus.stage === "active"
                  ? "Чёрная Пятница идёт до 30 ноября. Применяйте промокоды и суммируйте с банковским кэшбэком, пока действуют лимиты."
                  : "Промокоды прошедших распродаж и актуальные финансовые подборки."}
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
        {/* Левая карточка: 11.11 (пока идёт) → Финансовый фокус перед зимой / Новогодние скидки 2027 */}
        {shoppingStatus.stage !== "ended" ? (
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
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/15 pt-3.5 text-xs font-bold text-white">
              <span>Смотреть промокоды 11.11</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ) : (
          <Link
            href={isDecember ? "/akcii/novogodnie-skidki-2027" : "/collections/finansy-i-karty"}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-ink p-5 text-white transition-colors hover:bg-ink-soft sm:p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-yellow">
                  {isDecember ? nyStatus.badgeText : "Рассрочка 0% и 120 дней без %"}
                </span>
                <span className="text-xs font-semibold tabular-nums text-white/70">
                  {isDecember ? nyStatus.formattedTargetDate : "0 ₽ обслуживание"}
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-extrabold sm:text-2xl text-white flex items-center gap-2">
                <span>{isDecember ? "Новогодние распродажи 2027" : "Карты и кэшбэк под крупные покупки"}</span>
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">
                {isDecember
                  ? "Подготовка к праздникам: подарки близким, косметика, деликатесы и техника по проверенным промокодам."
                  : "Яндекс Пэй Сплит 0%, 120 дней без % по картам ЗЕНИТ и ОТП, Т-Банк Платинум и кэшбэк до 100% — работают поверх промокодов."}
              </p>

              <div className="mt-3.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="rounded border border-white/20 px-2 py-0.5 text-white/90">Яндекс Пэй Сплит</span>
                <span className="rounded border border-white/20 px-2 py-0.5 text-white/90">ОТП 120 дней 0%</span>
                <span className="rounded border border-white/20 px-2 py-0.5 text-white/90">ЗЕНИТ 120 дней</span>
                <span className="rounded border border-white/20 px-2 py-0.5 text-white/90">Альфа-Карта 0 ₽</span>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/15 pt-3.5 text-xs font-bold text-white">
              <span>{isDecember ? "Смотреть новогодние акции" : "Сравнить карты и оформить"}</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        )}

        {/* Правая карточка: Чёрная Пятница 2026 (пока идёт) → Карты и кэшбэк в декабре */}
        <Link
          href={isDecember ? "/collections/finansy-i-karty" : "/akcii/chernaya-pyatnica-2026"}
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-white p-5 transition-colors hover:border-ink/40 sm:p-6"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-red">
                {isDecember ? "0 ₽ за обслуживание" : bfStatus.badgeText}
              </span>
              <span className="text-xs font-semibold tabular-nums text-ink/65">
                {isDecember
                  ? "Кредитные и дебетовые карты"
                  : blackFridayCount > 0 ? `${blackFridayCount} предложений` : "Старт 27 ноября"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-lg font-extrabold sm:text-xl text-ink group-hover:text-red transition-colors flex items-center gap-2">
              <span>{isDecember ? "Банковские карты и кэшбэк 2026" : "Чёрная Пятница 2026"}</span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink/70 sm:text-sm">
              {isDecember
                ? "Подберите карту для предновогоднего шопинга: 120 дней без процентов, рассрочка 0% и возврат кэшбэка рублями."
                : "Главный период скидок конца ноября: маркетплейсы, бытовая техника, косметика, ювелирные украшения и подарки."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-3.5 text-xs font-bold text-ink/80 group-hover:text-red transition-colors">
            <span>{isDecember ? "Перейти к витрине карт" : "Подробнее о Чёрной Пятнице"}</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
