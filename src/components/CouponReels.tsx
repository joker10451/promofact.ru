import Link from "next/link";

type Reel = {
  src: string;
  title: string;
  caption: string;
  href: string;
};

const REELS: Reel[] = [
  {
    src: "/videos/zolotoe-yabloko.mp4",
    title: "Золотое Яблоко",
    caption: "Скидки на косметику и парфюмерию",
    href: "/category/kosmetika-i-parfyumeriya",
  },
  {
    src: "/videos/sportmaster.mp4",
    title: "Спортмастер",
    caption: "Промокоды на спорт и активный отдых",
    href: "/category/marketpleysy",
  },
  {
    src: "/videos/otello.mp4",
    title: "Отелло",
    caption: "Билеты и развлечения со скидкой",
    href: "/category/kino-i-teatr",
  },
  {
    src: "/videos/ebidoebi.mp4",
    title: "Ёбидоёби",
    caption: "Промокоды на маркетплейсах",
    href: "/category/marketpleysy",
  },
  {
    src: "/videos/carte-blanche.mp4",
    title: "Carte Blanche",
    caption: "Подарки и ювелирные изделия",
    href: "/category/yuvelirnye-izdeliya",
  },
];

export default function CouponReels() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
        Промокоды в коротких видео
      </h2>
      <p className="mt-3 max-w-2xl text-ink/60">
        Смотрите рилсы с актуальными промокодами и переходите за покупкой по
        ссылке под видео.
      </p>

      <div className="mt-8 flex gap-5 overflow-x-auto pb-4 snap-x">
        {REELS.map((r) => (
          <div
            key={r.src}
            className="snap-start shrink-0 w-[260px] sm:w-[300px]"
          >
            <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-line bg-ink">
              <video
                src={r.src}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              />
            </div>
            <div className="mt-3">
              <div className="font-display text-base font-extrabold">
                {r.title}
              </div>
              <div className="mt-1 text-sm text-ink/60">{r.caption}</div>
              <Link
                href={r.href}
                className="mt-2 inline-block rounded-full bg-gradient-to-r from-red to-red-dark px-4 py-2 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
              >
                Смотреть промокоды →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
