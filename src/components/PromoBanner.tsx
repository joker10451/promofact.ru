import Image from "next/image";
import Icon from "@/components/Icon";
import ScheduledReveal from "@/components/ScheduledReveal";
import { bannerStartMs, isBannerStarted, type PromoBanner as PromoBannerData } from "@/lib/promoBanners";

/**
 * Партнёрский баннер с обязательной маркировкой рекламы под ним.
 *
 * Креатив рекламодателя показываем целиком, без обрезки: в нём самом
 * бывает юридический текст, который нельзя терять. Вертикальный креатив
 * (сторис) ставится узкой колонкой, чтобы баннер не растягивался на экран.
 */
export default function PromoBanner({ banner }: { banner: PromoBannerData }) {
  const startMs = bannerStartMs(banner);
  const started = isBannerStarted(banner);
  return (
    <ScheduledReveal startMs={startMs} startedOnServer={started}>
      <PromoBannerBody banner={banner} />
    </ScheduledReveal>
  );
}

function PromoBannerBody({ banner }: { banner: PromoBannerData }) {
  const hasImage = Boolean(banner.image && banner.imageWidth && banner.imageHeight);
  const portrait = hasImage && banner.imageHeight! > banner.imageWidth!;

  const grid = !hasImage
    ? "md:grid-cols-[1.15fr_1fr]"
    : portrait
      ? "md:grid-cols-[minmax(0,300px)_1fr] md:items-center"
      : "md:grid-cols-[1.35fr_1fr] md:items-center";

  return (
    <aside aria-label="Реклама" className="w-full">
      <a
        href={banner.link}
        target="_blank"
        rel="sponsored nofollow noopener"
        className={`group grid overflow-hidden rounded-3xl bg-ink text-white shadow-offset transition-transform hover:-translate-y-0.5 ${grid}`}
      >
        {hasImage && (
          <Image
            src={banner.image!}
            alt={banner.imageAlt ?? banner.title}
            width={banner.imageWidth}
            height={banner.imageHeight}
            sizes={
              portrait
                ? "(min-width: 768px) 300px, 220px"
                : "(min-width: 1280px) 700px, (min-width: 768px) 57vw, 100vw"
            }
            className={portrait ? "mx-auto mt-6 h-auto w-[220px] rounded-2xl md:m-0 md:w-full md:rounded-none" : "h-auto w-full"}
          />
        )}
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-xs font-bold text-mint">
            <Icon name="gift" size={14} /> {banner.label ?? "Акция"}
          </span>
          <h2
            className={`font-display font-extrabold leading-tight ${
              hasImage && !portrait ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {banner.title}
          </h2>
          <p className="text-sm text-white/70 sm:text-base">{banner.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gradient-to-r from-mint to-[#1fa3e0] px-5 py-2.5 font-display text-lg font-extrabold">
              {banner.badge}
            </span>
            <span className="text-xs text-white/60">{banner.note}</span>
          </div>
          {banner.code && (
            <div className="flex w-fit items-center gap-3 rounded-xl border-2 border-dashed border-white/30 px-4 py-2.5">
              <span className="text-xs text-white/60">Кодовое слово</span>
              <span className="font-mono text-lg font-bold tracking-wider text-white">{banner.code}</span>
            </div>
          )}
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-yellow px-5 py-3 text-sm font-bold text-ink transition-colors group-hover:bg-yellow-dark">
            {banner.cta} →
          </span>
        </div>
        {!hasImage && (
          <div
            aria-hidden="true"
            className="hidden items-center justify-center bg-gradient-to-br from-mint/30 via-ink-soft to-ink md:flex"
          >
            <span className="whitespace-nowrap font-display text-5xl font-extrabold text-mint/80 lg:text-6xl">
              {banner.badge}
            </span>
          </div>
        )}
      </a>
      <p className="mt-2 text-[11px] leading-snug text-ink/45">{banner.ordText}</p>
    </aside>
  );
}
