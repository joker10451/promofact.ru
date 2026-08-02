const STEPS = [
  {
    n: "1",
    title: "Скопируй код",
    text: "Нажми «Копировать» — промокод попадёт в буфер обмена.",
  },
  {
    n: "2",
    title: "Перейди в магазин",
    text: "Открой сайт магазина по нашей ссылке и собери корзину.",
  },
  {
    n: "3",
    title: "Вставь код при оплате",
    text: "В поле «Промокод» на этапе оформления скидка применится сразу.",
  },
];

export default function HowToApply() {
  return (
    <section className="mt-12" aria-labelledby="how-apply">
      <h2 id="how-apply" className="font-display text-lg font-extrabold">
        Как применить код
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.n} className="rounded-2xl bg-white border border-line px-5 py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow font-display text-sm font-extrabold shadow-offset">
              {step.n}
            </span>
            <div className="mt-3 font-bold">{step.title}</div>
            <p className="mt-1 text-sm leading-snug text-ink/60">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
