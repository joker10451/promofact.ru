import Link from "next/link";
import Icon from "@/components/Icon";

export default function TeamBanner() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <Link
        href="/#catalog"
        className="group relative flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-yellow/30 via-white to-mint/20 p-5 sm:p-6 shadow-2xs transition-all hover:border-ink/20 hover:shadow-sm"
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow text-ink shadow-2xs group-hover:scale-105 transition-transform">
            <Icon name="check" size={24} className="text-ink" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/60 uppercase tracking-wider mb-0.5">
              <span>ПромоФакт Эксклюзив</span>
            </div>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-ink">
              Промокоды от команды ПромоФакт
            </h3>
            <p className="text-xs sm:text-sm text-ink/70 font-medium">
              Мы отбираем и вручную проверяем каждый промокод перед публикацией — без скрытых условий и нерабочих купонов.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow-offset transition-transform group-hover:translate-x-0.5">
          <span>Смотреть скидки</span>
          <span>→</span>
        </span>
      </Link>
    </div>
  );
}
