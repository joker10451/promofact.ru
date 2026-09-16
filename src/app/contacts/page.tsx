import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CHANNELS, OPERATOR, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Как связаться с ${SITE_NAME}: вопросы по промокодам, реклама и сотрудничество.`,
  alternates: { canonical: `${SITE_URL}/contacts` },
};

export default function ContactsPage() {
  const mail = `mailto:${OPERATOR.email}`;
  return (
    <LegalPage
      title="Контакты"
      lead={<>Пишите — отвечаем на все письма, обычно в течение пары рабочих дней.</>}
    >
      <section>
        <h2>Почта</h2>
        <p>
          <a href={mail} className="text-lg">
            {OPERATOR.email}
          </a>
        </p>
        <ul>
          <li>промокод не сработал или акция закончилась раньше срока;</li>
          <li>реклама и размещение предложений магазина;</li>
          <li>вопросы о персональных данных — см. также <Link href="/privacy">политику конфиденциальности</Link>.</li>
        </ul>
        <p className="text-sm text-ink/60">
          Мы не продаём товары и не оформляем заказы: по вопросам доставки, оплаты и возврата
          обращайтесь в поддержку магазина.
        </p>
      </section>

      <section>
        <h2>Мы в соцсетях</h2>
        <ul>
          <li>
            Telegram-канал со скидками:{" "}
            <a href={CHANNELS.telegram} target="_blank" rel="noopener nofollow">
              @smart_zakupka
            </a>
          </li>
          <li>
            ВКонтакте:{" "}
            <a href={CHANNELS.vk} target="_blank" rel="noopener nofollow">
              vk.com/promofact
            </a>
          </li>
          <li>
            Дзен:{" "}
            <a href={CHANNELS.dzen} target="_blank" rel="noopener nofollow">
              dzen.ru
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>Владелец сайта</h2>
        <p>{OPERATOR.name}</p>
      </section>
    </LegalPage>
  );
}
