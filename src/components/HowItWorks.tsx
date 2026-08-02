const STEPS = [
  { n: "01", text: "Найди нужный магазин в каталоге и открой промокод" },
  { n: "02", text: "Скопируй код кнопкой — он попадёт в буфер обмена" },
  { n: "03", text: "Перейди в магазин по нашей ссылке и собери корзину" },
  { n: "04", text: "Вставь код при оплате и получи скидку мгновенно" },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6">
      <h2 className="text-center font-display text-2xl sm:text-3xl font-extrabold">
        Как это работает
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink/60">
        Три клика — и скидка твоя. Вот как выглядит твой путь от промокода до экономии.
      </p>

      <div className="mt-10 mx-auto max-w-md">
        <div className="zigzag-both bg-white border border-line pt-5 pb-4 px-7 rotate-[2deg] transition-transform duration-500 hover:rotate-0 shadow-[0_14px_0_rgba(11,16,43,0.08)]">
          <div className="text-center font-display text-lg font-extrabold tracking-wide">
            ПРОМО<span className="text-red">·</span>ДРОМ
          </div>
          <div className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
            Кассовый чек №001
          </div>

          <div className="receipt-dashed my-4 opacity-40" />

          <ul className="space-y-3.5">
            {STEPS.map((step) => (
              <li key={step.n} className="flex items-start gap-3">
                <span className="font-display text-xs font-extrabold text-red pt-0.5">
                  {step.n}
                </span>
                <span className="flex-1 text-sm leading-snug">{step.text}</span>
              </li>
            ))}
          </ul>

          <div className="receipt-dashed my-4 opacity-40" />

          <div className="flex items-center justify-between font-display text-lg font-extrabold">
            <span>ИТОГО: ВЫГОДА</span>
            <span className="text-mint">100%</span>
          </div>

          <div className="barcode mx-auto mt-4 w-2/3" aria-hidden="true" />
          <div className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
            Спасибо за покупку со скидкой!
          </div>
        </div>
      </div>
    </section>
  );
}
