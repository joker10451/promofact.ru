import Image from "next/image";
import Icon from "@/components/Icon";
import type { PromoBanner as PromoBannerData } from "@/lib/promoBanners";

/** Партнёрский баннер с обязательной маркировкой рекламы под ним. */
export default function PromoBanner({ banner }: { banner: PromoBannerData }) {
  return (
    <aside aria-label="Реклама" className="w-full">
      <a
        href={banner.link}
        target="_blank"
        rel="sponsored nofollow noopener"
        className="group grid overflow-hidden rounded-3xl bg-ink text-white shadow-offset transition-transform hover:-translate-y-0.5 md:grid-cols-[1.15fr_1fr]"
      >
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-xs font-bold text-mint">
            <Icon name="gift" size={14} /> Розыгрыш
          </span>
          <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            {banner.title}
          </h2>
          <p className="text-sm text-white/70 sm:text-base">{banner.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gradient-to-r from-mint to-[#1fa3e0] px-5 py-2.5 font-display text-lg font-extrabold">
              {banner.badge}
            </span>
            <span className="text-xs text-white/60">{banner.note}</span>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-yellow px-5 py-3 text-sm font-bold text-ink transition-colors group-hover:bg-yellow-dark">
            {banner.cta} →
          </span>
        </div>
        {banner.image ? (
          <div className="relative min-h-52 md:min-h-full">
            <Image
              src={banner.image}
              alt={banner.imageAlt ?? banner.title}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="hidden items-center justify-center bg-gradient-to-br from-mint/30 via-ink-soft to-ink md:flex"
          >
            <span className="whitespace-nowrap font-display text-5xl font-extrabold text-mint/80 lg:text-6xl">150&nbsp;000&nbsp;₽</span>
          </div>
        )}
      </a>
      <p className="mt-2 text-[11px] leading-snug text-ink/45">{banner.ordText}</p>
    </aside>
  );
}
