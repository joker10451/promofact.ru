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

const MAGNIT_STEPS = [
  { n: "1", title: "Скопируй код", text: "Скопируй выбранный промокод из карточки вместе с условиями." },
  { n: "2", title: "Открой приложение «Магнит»", text: "Перейди по ссылке и выбери нужный раздел: «Экспресс» или «Гипермаркет»." },
  { n: "3", title: "Проверь сумму заказа", text: "Собери корзину, введи код и убедись, что скидка отобразилась до оплаты." },
];

const AVITO_STEPS = [
  {
    n: "1",
    title: "Открой предложение",
    text: "Перейди по ссылке на нужную акцию Авито Путешествий: жильё или отель.",
  },
  {
    n: "2",
    title: "Проверь условия в Авито",
    text: "Войди в аккаунт. Если сервис выдаёт персональный код или требует активацию скидки, выполни эти условия.",
  },
  {
    n: "3",
    title: "Проверь цену до оплаты",
    text: "Сравни окончательную стоимость, сборы и правила отмены. Бронируй только если выгода подтверждена.",
  },
];

const SUBSCRIPTION_STEPS = [
  {
    n: "1",
    title: "Выбери вариант подписки",
    text: "Проверь, на какой пробный период и по какой цене ты подходишь.",
  },
  {
    n: "2",
    title: "Открой Яндекс Плюс",
    text: "Перейди по партнёрской ссылке из карточки и войди в свой аккаунт.",
  },
  {
    n: "3",
    title: "Проверь условия",
    text: "Введи промокод, если потребуется. До подтверждения проверь оплату и автопродление.",
  },
];

export default function HowToApply({ variant = "code" }: { variant?: "code" | "avito-links" | "subscription" | "magnit-app" }) {
  const isAvito = variant === "avito-links";
  const isSubscription = variant === "subscription";
  const steps = variant === "magnit-app" ? MAGNIT_STEPS : isAvito ? AVITO_STEPS : isSubscription ? SUBSCRIPTION_STEPS : STEPS;
  return (
    <section className="mt-12" aria-labelledby="how-apply">
      <h2 id="how-apply" className="font-display text-lg font-extrabold">
        {variant === "magnit-app" ? "Как применить промокод в приложении «Магнит»" : isAvito ? "Как получить скидку в Авито Путешествиях" : isSubscription ? "Как подключить Яндекс Плюс по промокоду" : "Как применить код"}
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
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
