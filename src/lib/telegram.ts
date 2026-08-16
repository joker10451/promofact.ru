import { SITE_URL } from "@/lib/site";
import type { Coupon } from "@/lib/types";

export interface TelegramPostOptions {
  botToken?: string;
  channelId?: string;
  disableWebPagePreview?: boolean;
}

export interface TelegramButton {
  text: string;
  url: string;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(iso: string | null): string {
  if (!iso) return "бессрочно";
  const str = String(iso).trim();
  const ru = str.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  let d = "", m = "", y = "";
  if (ru) {
    [, d, m, y] = ru;
  } else {
    const parts = str.split("-");
    if (parts.length === 3) {
      [y, m, d] = parts;
    } else {
      return str;
    }
  }
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const mi = Number(m) - 1;
  return `${Number(d)} ${months[mi] ?? m}`;
}

/**
 * Генерирует HTML-разметку поста для Telegram по стандарту 2026
 */
export function formatTelegramPost(coupon: Coupon): {
  text: string;
  buttons: TelegramButton[][];
} {
  const storeName = escapeHtml(coupon.store.name.toUpperCase());
  const bonus = escapeHtml(stripHtml(coupon.promocode.bonusName) || "Скидка по промокоду");
  const code = escapeHtml(coupon.promocode.code);
  const terms = escapeHtml(stripHtml(coupon.promocode.terms));
  const region = escapeHtml(coupon.promocode.region);
  const expires = formatDate(coupon.promocode.expires);

  const lines: string[] = [];

  // 1. Интригующий заголовок с акцентом на выгоду
  if (coupon.promocode.isHit) {
    lines.push(`🔥 <b>Секретная скидка в ${storeName}!</b>\n`);
  } else {
    lines.push(`✨ <b>Лайфхак для заказа в ${storeName}</b>\n`);
  }

  // 2. Выгода крупно
  lines.push(`🎁 <b>${bonus}</b>\n`);

  // 3. Инструкция по экономии
  lines.push(`📋 <b>Как применить выгоду:</b>`);
  lines.push(`1. Перейдите по кнопке ниже`);
  lines.push(`2. Соберите заказ в корзину`);
  lines.push(`3. Введите промокод в поле заказа:\n`);

  // 4. Промокод для копирования в 1 клик
  lines.push(`🎟 Код: <code>${code}</code>`);
  lines.push(`<i>(нажмите на промокод, чтобы скопировать 👆)</i>\n`);

  // 5. Условия
  if (coupon.promocode.isFirstOrderOnly) {
    lines.push(`⚡️ <i>Работает на первый заказ</i>`);
  } else if (coupon.promocode.isUniversal) {
    lines.push(`✨ <i>Работает для всех (и на повторные заказы!)</i>`);
  }

  if (region && region !== "RU") {
    lines.push(`📍 <i>Город: ${region}</i>`);
  }

  lines.push(`⏳ <i>Актуально до ${expires}</i>`);

  // 5. Маркировка ОРД (Закон о рекламе)
  const ordText = escapeHtml(coupon.affiliate.ordText);
  const ordMarker = escapeHtml(coupon.affiliate.ordMarker);

  lines.push("\n────────────────────");
  if (ordText || ordMarker) {
    const markerStr = ordMarker ? ` erid: ${ordMarker}` : "";
    lines.push(`<i>${ordText}${markerStr}</i>`);
  } else {
    lines.push(`<i>Реклама.</i>`);
  }

  // 6. Широкие интерактивные кнопки
  const affiliateUrl = coupon.affiliate.link || coupon.affiliate.landingLink;
  const storeUrl = `${SITE_URL}/store/${coupon.store.slug}`;

  const buttons: TelegramButton[][] = [
    [{ text: `🛒 Перейти в ${coupon.store.name} и применить →`, url: affiliateUrl }],
    [{ text: `🌐 Больше скидок на Promofact.ru`, url: storeUrl }],
  ];

  return {
    text: lines.join("\n"),
    buttons,
  };
}

/**
 * Отправка сообщения или фото с текстом в Telegram
 */
export async function sendCouponToTelegram(
  coupon: Coupon,
  opts?: TelegramPostOptions,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const token = opts?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = opts?.channelId || process.env.TELEGRAM_CHANNEL_ID;

  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN не задан" };
  }
  if (!chatId) {
    return { ok: false, error: "TELEGRAM_CHANNEL_ID не задан" };
  }

  const { text, buttons } = formatTelegramPost(coupon);
  const replyMarkup = {
    inline_keyboard: buttons.map((row) =>
      row.map((btn) => ({ text: btn.text, url: btn.url })),
    ),
  };

  const photoUrl = coupon.store.logo;

  try {
    let endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    let body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
      disable_web_page_preview: opts?.disableWebPagePreview ?? true,
    };

    // Если есть валидный логотип, отправляем красивым sendPhoto
    if (photoUrl && photoUrl.startsWith("http")) {
      endpoint = `https://api.telegram.org/bot${token}/sendPhoto`;
      body = {
        chat_id: chatId,
        photo: photoUrl,
        caption: text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
        disable_notification: true, // Тихий режим без звукового пищания
      };
    } else {
      body.disable_notification = true;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!data.ok) {
      // Если sendPhoto упал (например, Telegram не смог скачать картинку), пробуем фоллбек на sendMessage
      if (endpoint.includes("sendPhoto")) {
        const fallbackRes = await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: "HTML",
              reply_markup: replyMarkup,
            }),
          },
        );
        const fallbackData = await fallbackRes.json();
        if (fallbackData.ok) {
          return { ok: true, messageId: fallbackData.result?.message_id };
        }
      }
      return { ok: false, error: data.description || "Ошибка Telegram API" };
    }

    const messageId = data.result?.message_id;

    // Авто-уведомление администратора в ЛС со ссылкой для сдачи отчета в Perfluence
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId && messageId) {
      const channelUsername = (process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka").replace("@", "");
      const postUrl = `https://t.me/${channelUsername}/${messageId}`;
      const perfluenceProjectUrl = `https://dash.perfluence.net/my-projects/${coupon.store.id}`;

      const adminText = [
        `📢 <b>Опубликован пост для отчета Perfluence!</b>`,
        ``,
        `🏬 Магазин: <b>${escapeHtml(coupon.store.name)}</b>`,
        `🎟 Промокод: <code>${escapeHtml(coupon.promocode.code)}</code>`,
        ``,
        `🔗 <b>Ссылка на пост (нажмите, чтобы скопировать):</b>`,
        `<code>${postUrl}</code>`,
      ].join("\n");

      const adminMarkup = {
        inline_keyboard: [
          [{ text: "⚡ Сдать отчет в Perfluence →", url: perfluenceProjectUrl }],
          [{ text: "👁 Открыть пост в канале", url: postUrl }],
        ],
      };

      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: adminText,
            parse_mode: "HTML",
            reply_markup: adminMarkup,
            disable_web_page_preview: true,
          }),
        });
      } catch (adminErr) {
        console.error("Admin notification error:", adminErr);
      }
    }

    return { ok: true, messageId };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
