import Link from "next/link";

/**
 * Lightweight navigation for secondary intents, not three full landing
 * sections repeated on the homepage.
 */
const RESOURCES = [
  {
    href: "/guide",
    eyebrow: "Пошаговая инструкция",
    title: "Как применить промокод",
    description: "Где взять код, как проверить условия и что делать, если скидка не сработала.",
    action: "Читать инструкцию",
    number: "01",
  },
  {
    href: "/sovety",
    eyebrow: "Полезные материалы",
    title: "Советы по экономии",
    description: "Гайды по акциям, доставке, подпискам и выгодным покупкам.",
    action: "Перейти к советам",
    number: "02",
  },
  {
    href: "/calculator",
    eyebrow: "Простой инструмент",
    title: "Посчитать выгоду",
    description: "Оцените экономию в рублях или процентах до оформления заказа.",
    action: "Открыть калькулятор",
    number: "03",
  },
] as const;

export default function HomeResourcesPreview() {
  return (
    <section aria-labelledby="home-resources-heading" id="how">
      <div className="mb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-red">
          Не только купоны
        </p>
        <h2 id="home-resources-heading" className="mt-1 font-display text-xl font-extrabold text-ink sm:text-2xl">
          Всё, чтобы сэкономить без лишних шагов
        </h2>
        <p className="mt-1.5 text-sm text-ink/60">
          Короткие ссылки на подробные инструкции и полезные инструменты
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {RESOURCES.map((resource) => (
          <Link
            key={resource.href}
            href={resource.href}
            className="group relative flex min-w-0 flex-col rounded-[20px] border border-line bg-white px-5 py-5 shadow-[0_8px_25px_-22px_rgba(11,16,43,0.2)] transition-all hover:-translate-y-0.5 hover:border-red/40 hover:shadow-[0_14px_30px_-20px_rgba(11,16,43,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:px-6"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red">{resource.eyebrow}</span>
              <span className="font-display text-xl font-black text-ink/15" aria-hidden="true">{resource.number}</span>
            </div>
            <h3 className="font-display text-base font-extrabold text-ink">{resource.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-ink/65 sm:text-sm">{resource.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-red group-hover:underline">
              {resource.action} <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
