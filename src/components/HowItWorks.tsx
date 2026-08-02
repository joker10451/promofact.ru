const STEPS = [
  {
    n: "01",
    text: "Найди нужный магазин в каталоге и открой промокод",
    accent: "bg-yellow",
  },
  {
    n: "02",
    text: "Скопируй код кнопкой — он попадёт в буфер обмена",
    accent: "bg-mint",
  },
  {
    n: "03",
    text: "Перейди в магазин по нашей ссылке и собери корзину",
    accent: "bg-red",
  },
  {
    n: "04",
    text: "Вставь код при оплате и получи скидку мгновенно",
    accent: "bg-ink",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6">
      <h2 className="text-center font-display text-2xl sm:text-3xl font-extrabold">
        Как это работает
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink/60">
        Три клика — и скидка твоя. Вот как выглядит твой путь от промокода до
        экономии.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_36px_-14px_rgba(11,16,43,0.28)]"
          >
            <span
              className={`absolute right-5 top-5 h-9 w-9 rounded-full ${step.accent} flex items-center justify-center font-display text-sm font-extrabold text-ink shadow-[0_3px_0_rgba(11,16,43,0.18)]`}
            >
              {step.n}
            </span>
            <span className="font-display text-5xl font-extrabold text-ink/10 transition-colors group-hover:text-red/20">
              {step.n}
            </span>
            <p className="mt-4 text-sm leading-snug text-ink/80">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
