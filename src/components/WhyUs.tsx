export default function WhyUs() {
  const items = [
    {
      icon: "✓",
      title: "Проверяем каждый день",
      desc: "Вручную и автоматически тестируем промокоды, сразу убирая неработающие.",
      color: "bg-mint/15 text-mint-dark",
    },
    {
      icon: "⚡",
      title: "Обновляем без задержек",
      desc: "Свежие акции и секретные промокоды появляются в каталоге в день запуска.",
      color: "bg-yellow/30 text-ink",
    },
    {
      icon: "💰",
      title: "Экономим ваши деньги",
      desc: "Сервис полностью бесплатный — мы не требуем регистраций и платных подписок.",
      color: "bg-red/10 text-red",
    },
  ];

  return (
    <section className="py-12 sm:py-16 border-t border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            Почему ПромоФакт?
          </h2>
          <p className="mt-2 text-sm text-ink/60 font-medium">
            Мы делаем поиск скидок быстрым, честным и надёжным
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-line bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black ${item.color}`}>
                {item.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-ink/70 leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
