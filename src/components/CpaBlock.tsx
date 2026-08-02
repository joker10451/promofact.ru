const CHAIN = [
  { title: "Посетитель", text: "приходит из поиска за промокодом" },
  { title: "Купон", text: "копирует код и жмёт «В магазин»" },
  { title: "CPA-ссылка", text: "переход по партнёрской ссылке Perfluence" },
  { title: "Заказ", text: "покупатель оплачивает заказ в магазине" },
  { title: "Комиссия", text: "магазин платит вознаграждение" },
];

export default function CpaBlock() {
  return (
    <section id="partners" className="scroll-mt-24 relative overflow-hidden bg-ink py-16 sm:py-20">
      <span className="watermark" aria-hidden="true">
        %
      </span>
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-2xl sm:text-3xl font-extrabold text-white">
          Зарабатывай на каждой покупке по CPA-модели
        </h2>
        <p className="mt-3 max-w-2xl text-white/60">
          ПРОМО·ДРОМ переводит покупателей со скидками, а магазины платят за заказы
          через партнёрскую платформу Perfluence. Честная схема без кликов-фейков.
        </p>

        <ol className="mt-10 grid gap-3 sm:grid-cols-5">
          {CHAIN.map((step, i) => (
            <li key={step.title} className="relative bg-white/5 border border-white/10 rounded-2xl px-4 py-5">
              <div className="font-display text-xs font-extrabold text-yellow">0{i + 1}</div>
              <div className="mt-2 font-bold text-white">{step.title}</div>
              <div className="mt-1 text-xs leading-snug text-white/50">{step.text}</div>
              {i < CHAIN.length - 1 && (
                <span
                  className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-yellow font-display sm:block"
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 shadow-[0_8px_0_rgba(255,208,47,0.4)]">
            <div className="font-display text-xs font-extrabold uppercase tracking-widest text-red">
              Рекламодателям
            </div>
            <h3 className="mt-2 font-display text-xl font-extrabold text-ink">
              Привлекайте покупателей, платите за результат
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/65">
              Разместите свои промокоды у нас и запустите CPA-кампанию в Perfluence.
              Платите только за подтверждённые заказы — без рисков за показы и клики.
            </p>
            <a
              href="https://perfluence.net"
              target="_blank"
              rel="noopener nofollow sponsored"
              className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Стать рекламодателем
            </a>
          </div>

          <div className="rounded-2xl bg-yellow p-7 shadow-[0_8px_0_rgba(11,16,43,0.35)]">
            <div className="font-display text-xs font-extrabold uppercase tracking-widest text-ink/50">
              Блогерам
            </div>
            <h3 className="mt-2 font-display text-xl font-extrabold text-ink">
              Монетизируйте аудиторию на промокодах
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Подключайтесь к Perfluence, получайте персональные промокоды и комиссию
              с заказов вашей аудитории. Отчётность в реальном времени и выплаты по запросу.
            </p>
            <a
              href="https://perfluence.net"
              target="_blank"
              rel="noopener nofollow sponsored"
              className="mt-5 inline-block rounded-full bg-red px-5 py-2.5 text-sm font-bold text-white shadow-offset hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Подключиться как блогер
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
