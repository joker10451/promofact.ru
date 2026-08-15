import { NextRequest, NextResponse } from "next/server";
import { getCoupons } from "@/lib/perfluence";
import { getVkBotKeyboard, sendVkBotMessage } from "@/lib/vk";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * VK Callback API Webhook обработчик для чат-бота сообщества
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type;

    // 1. Подтверждение адреса сервера для ВКонтакте (confirmation)
    if (type === "confirmation") {
      const confirmationCode = (process.env.VK_CONFIRMATION_CODE || "be170407").trim().replace(/^\uFEFF/, "");
      return new Response(confirmationCode, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 2. Новое входящее сообщение в сообщество (message_new)
    if (type === "message_new") {
      const message = body.object?.message;
      if (!message) return new Response("ok", { headers: { "Content-Type": "text/plain" } });

      const userId = message.from_id;
      const text = (message.text || "").trim().toLowerCase();
      let payload: { command?: string; slug?: string } = {};

      if (message.payload) {
        try {
          payload = JSON.parse(message.payload);
        } catch {}
      }

      const coupons = await getCoupons();

      // Приветствие / Старт
      if (text === "начать" || text === "start" || text === "привет" || text === "меню") {
        const welcomeText = `👋 Привет! Я умный бот сервиса ПромоФакт (promofact.ru).\n\nЯ помогу найти проверенный промокод и сэкономить на покупках!\n\n👇 Выберите категорию на кнопках ниже или просто напишите название магазина (например, «Тануки», «Рив Гош», «Литрес»):`;
        await sendVkBotMessage(userId, welcomeText, getVkBotKeyboard());
        return new Response("ok", { headers: { "Content-Type": "text/plain" } });
      }

      // Топ скидок дня
      if (payload.command === "top" || text.includes("топ") || text.includes("лучш") || text.includes("горяч")) {
        const topCoupons = coupons.slice(0, 3);
        let responseText = `🔥 Топ-3 самых выгодных промокодов на сегодня:\n\n`;

        for (const [i, c] of topCoupons.entries()) {
          const url = `${SITE_URL}/store/${c.store.slug}/${encodeURIComponent(c.promocode.code)}`;
          responseText += `${i + 1}. 🏬 ${c.store.name}\n🎁 ${c.promocode.bonusName || "Скидка"}\n🎟 Промокод: ${c.promocode.code}\n👉 ${url}\n\n`;
        }

        responseText += `Больше скидок и категорий на нашем сайте: ${SITE_URL}`;
        await sendVkBotMessage(userId, responseText, getVkBotKeyboard());
        return new Response("ok", { headers: { "Content-Type": "text/plain" } });
      }

      // Фильтрация по категории
      if (payload.command === "category" && payload.slug) {
        const matched = coupons.filter((c) => 
          c.store.categorySlug.includes(payload.slug!) || 
          (payload.slug === "kosmetika" && c.store.categorySlug.includes("kosmetika")) ||
          (payload.slug === "dostavka-edy" && (c.store.categorySlug.includes("edy") || c.store.categorySlug.includes("restoran"))) ||
          (payload.slug === "puteshestviya" && c.store.categorySlug.includes("puteshestv")) ||
          (payload.slug === "obrazovanie" && c.store.categorySlug.includes("obrazovan"))
        );

        if (matched.length > 0) {
          let responseText = `🏷 Найдено промокодов (${matched.length}):\n\n`;
          for (const c of matched.slice(0, 3)) {
            const url = `${SITE_URL}/store/${c.store.slug}/${encodeURIComponent(c.promocode.code)}`;
            responseText += `🏬 ${c.store.name}\n🎁 ${c.promocode.bonusName || "Скидка"}\n🎟 Промокод: ${c.promocode.code}\n👉 ${url}\n\n`;
          }
          await sendVkBotMessage(userId, responseText, getVkBotKeyboard());
          return new Response("ok", { headers: { "Content-Type": "text/plain" } });
        }
      }

      // Поиск по ключевому слову или названию магазина
      const matched = coupons.filter((c) =>
        c.store.name.toLowerCase().includes(text) ||
        c.promocode.code.toLowerCase().includes(text) ||
        (c.promocode.bonusName && c.promocode.bonusName.toLowerCase().includes(text)) ||
        c.store.category.toLowerCase().includes(text)
      );

      if (matched.length > 0) {
        let responseText = `🎉 Вот что удалось найти по вашему запросу «${text}»:\n\n`;
        for (const c of matched.slice(0, 3)) {
          const url = `${SITE_URL}/store/${c.store.slug}/${encodeURIComponent(c.promocode.code)}`;
          responseText += `🏬 ${c.store.name}\n🎁 ${c.promocode.bonusName || "Скидка"}\n🎟 Промокод: ${c.promocode.code}\n👉 ${url}\n\n`;
        }
        await sendVkBotMessage(userId, responseText, getVkBotKeyboard());
      } else {
        const notFoundText = `🔍 По запросу «${text}» точных совпадений нет, но у нас есть много других промокодов!\n\n👇 Воспользуйтесь кнопками категорий или посмотрите полный каталог на сайте: ${SITE_URL}`;
        await sendVkBotMessage(userId, notFoundText, getVkBotKeyboard());
      }

      return new Response("ok", { headers: { "Content-Type": "text/plain" } });
    }

    return new Response("ok", { headers: { "Content-Type": "text/plain" } });
  } catch (error) {
    console.error("[vk bot webhook error]:", error);
    return new Response("ok", { headers: { "Content-Type": "text/plain" } });
  }
}
