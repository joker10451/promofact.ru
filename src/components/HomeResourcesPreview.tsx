import Link from "next/link";

/**
 * Lightweight navigation for secondary intents, not three full landing
 * sections repeated on the homepage.
 */
const RESOURCES = [
  {
    href: "/guide",
    title: "Как применить промокод",
    description: "Где взять код, как проверить условия и что делать, если скидка не сработала.",
    action: "Читать инструкцию",
  },
  {
    href: "/sovety",
    title: "Советы по экономии",
    description: "Гайды по акциям, доставке, подпискам и выгодным покупкам.",
    action: "Перейти к советам",
  },
  {
    href: "/calculator",
    title: "Посчитать выгоду",
    description: "Оцените экономию в рублях или процентах до оформления заказа.",
    action: "Открыть калькулятор",
  },
] as const;

export default function HomeResourcesPreview() {
  return (
    <section aria-labelledby="home-resources-heading" id="how">
      <div className="mb-5">
        <h2 id="home-resources-heading" className="font-display text-xl font-extrabold text-ink sm:text-2xl">
          Не сработал код? Разберёмся
        </h2>
        <p className="mt-1.5 text-sm text-ink/60">
          Инструкция, советы по экономии и калькулятор выгоды
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 md:gap-8">
        {RESOURCES.map((resource) => (
          <Link
            key={resource.href}
            href={resource.href}
            className="group relative flex min-w-0 flex-col border-t-2 border-ink/15 pt-4 transition-colors hover:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
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
