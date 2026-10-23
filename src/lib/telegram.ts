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
  let d = "", m = "";
  if (ru) {
    [, d, m] = ru;
  } else {
    const parts = str.split("-");
    if (parts.length === 3) {
      [, m, d] = parts;
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
  const categoryEmojis: Record<string, string> = {
    "eda-i-dostavka": "🛒",
    "krasota-i-uhod": "💄",
    "odezhda-i-obuv": "👗",
    "elektronika": "📱",
    "servisy-i-podpiski": "🎬",
    "tsvety": "💐",
    "travel": "✈️",
    "zdorove-i-apteki": "💊",
  };

  const catIcon = categoryEmojis[coupon.store.categorySlug] || (coupon.promocode.isHit ? "🔥" : "🏷");
  const storeName = escapeHtml(coupon.store.name);
  const bonus = escapeHtml(stripHtml(coupon.promocode.bonusName) || "Скидка по промокоду");
  const code = escapeHtml(coupon.promocode.code);
  const expires = formatDate(coupon.promocode.expires);
  const region = escapeHtml(coupon.promocode.region);

  const lines: string[] = [];

  // 1. Заголовок
  lines.push(`${catIcon} <b>${storeName} — ${bonus}</b>\n`);

  // 2. Промокод для копирования в 1 клик
  if (code) {
    lines.push(`🎟 Промокод: <code>${code}</code>`);
    lines.push(`<i>(нажмите на код — он скопируется в буфер)</i>\n`);
  }

  // 3. Условия акции аккуратным списком
  const conditions: string[] = [];
  if (coupon.promocode.isFirstOrderOnly) {
    conditions.push("Только для новых клиентов (первый заказ)");
  } else if (coupon.promocode.isUniversal) {
    conditions.push("Для всех покупателей (включая повторные)");
  }
  if (coupon.promocode.minimumOrder) {
    conditions.push(`При заказе от ${coupon.promocode.minimumOrder.value.toLocaleString("ru-RU")} ₽`);
  }
  if (region && region !== "RU") {
    conditions.push(`Город: ${region}`);
  }
  conditions.push(`Действует до ${expires}`);

  lines.push("📌 <b>Условия:</b>");
  conditions.forEach((c) => lines.push(`• ${c}`));

  // 4. Аккуратная маркировка ОРД (Закон о рекламе) одной строкой
  const ordText = escapeHtml(coupon.affiliate.ordText);
  const ordMarker = escapeHtml(coupon.affiliate.ordMarker);

  lines.push("");
  if (ordText) {
    const markerStr = ordMarker && !ordText.includes(ordMarker) ? ` erid: ${ordMarker}` : "";
    lines.push(`<i>${ordText}${markerStr}</i>`);
  } else if (ordMarker) {
    lines.push(`<i>Реклама. erid: ${ordMarker}</i>`);
  } else {
    lines.push(`<i>Реклама. ${storeName}</i>`);
  }

  // Выводим условия и подробности акции
  if (coupon.promocode.terms) {
    lines.push("ℹ️ " + escapeHtml(stripHtml(coupon.promocode.terms)));
  }
  const affiliateUrl = coupon.affiliate.link || coupon.affiliate.landingLink || coupon.store.site;
  const storeUrl = `${SITE_URL}/store/${coupon.store.slug}`;
  const buttons: TelegramButton[][] = [
    [{ text: `🛍 В магазин ${coupon.store.name} →`, url: affiliateUrl }],
  ];
  if (coupon.store.slug !== "flor2u") {
    buttons.push([{ text: `🌐 Все купоны ${coupon.store.name} на сайте`, url: storeUrl }]);
  }

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
              disable_web_page_preview: true,
              disable_notification: true,
            }),
          },
        );
        const fallbackData = await fallbackRes.json();
        if (fallbackData.ok) {
          return { ok: true, messageId: fallbackData.result?.message_id };
        }
        return {
          ok: false,
          error: `sendPhoto err: ${data.description || res.statusText} (${res.status}) | fallback err: ${fallbackData.description || fallbackRes.statusText} (${fallbackRes.status})`,
        };
      }
      return {
        ok: false,
        error: `Telegram API: ${data.description || res.statusText} (status: ${res.status}, tokenPrefix: ${token ? token.slice(0, 5) : "none"}..., chatId: ${chatId})`,
      };
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

/**
 * Удаление сообщения в Telegram (например, при замене поста)
 */
export async function deleteTelegramMessage(
  messageId: number,
  opts?: TelegramPostOptions,
): Promise<boolean> {
  const token = opts?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = opts?.channelId || process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error("Failed to delete Telegram message:", err);
    return false;
  }
}

/**
 * Формирование праздничного хэллоуинского поста Золотого Яблока сразу с 2 промокодами
 */
export function formatGoldAppleHalloweenPost(): {
  text: string;
  buttons: TelegramButton[][];
} {
  const affiliateUrl = "https://gldppl.prfl.me/smart_zakupka/3pfp4h?erid=2RanykjEuHD";
  const storeUrl = `${SITE_URL}/store/zolotoe-yabloko`;

  const text = [
    "🎃 <b>Готовы к самому волшебному и загадочному празднику года?</b>",
    "",
    "Да, речь идет о Хэллоуине! 👻 На Хэллоуин каждый из нас может стать настоящим героем или героиней своего любимого фильма, мифа или сказки. Но чтобы ваш образ был по-настоящему потрясающим, необходимы яркие и выразительные косметические продукты, которые помогут вам превратиться во что угодно — от злой колдуньи до вампира!",
    "",
    `Спешите сделать заказ в приложении Золотого Яблока:`,
    `🛍 <a href="${affiliateUrl}">Перейти в Золотое Яблоко</a>`,
    "",
    "А чтобы сэкономить, используйте промокоды:",
    "",
    "➡️ <code>МИНУС</code> – скидка 50% от 8 000 ₽ на категорию «наша коллекция».",
    "➡️ <code>PERF</code> – скидка на первый заказ до 10% от 3 000 ₽, до 15% от 6 000 ₽, до 20% от 9 000 ₽ + 300 бонусов на счет.",
    "➡️ <code>ПРАЗДНИК</code> – скидка до 10% от 6 000 ₽, до 15% от 9 000 ₽ и до 20% от 12 000 ₽ на первый и все повторные заказы на подборку товаров.",
    "",
    "<i>(нажмите на промокод — он скопируется в буфер)</i>",
    "",
    "Воплотите свои самые смелые идеи и насладитесь атмосферой этого невероятного праздника!",
    "",
    "📌 <b>Условия акции:</b>",
    "• Промокоды действуют только для авторизованных пользователей.",
    "• Не суммируются со скидками выше 40%, акциями 3=2, 2=1 и подарками при покупке.",
    "• Не действуют при покупке пластиковых и электронных подарочных карт.",
    "• ❗️ Есть бренды-исключения.",
    "• Сроки действия: «МИНУС» и «ПРАЗДНИК» до 29 октября, «PERF» до 31 октября 2026.",
    "",
    '<i>Реклама. ООО "ЕКАТЕРИНБУРГ ЯБЛОКО", адрес: г. Екатеринбург, ул. Сакко и Ванцетти, 62, ОГРН 1126670019585 erid: 2RanykjEuHD</i>',
  ].join("\n");

  const buttons: TelegramButton[][] = [
    [{ text: "🛍 В магазин Золотое Яблоко →", url: affiliateUrl }],
    [{ text: "🌐 Все купоны Золотое Яблоко на сайте", url: storeUrl }],
  ];

  return { text, buttons };
}

/**
 * Отправка кастомного / мульти-промо поста в Telegram
 */

/**
 * Формирование праздничного / флеш поста FMART by Flowwow (скидка 30% + промокоды)
 */
export function formatFmartFlashPost(): {
  text: string;
  buttons: TelegramButton[][];
} {
  const affiliateUrl = "https://fmart-flowers.prfl.me/smart_zakupka/ekef65?erid=2RanykURyUw";
  const storeUrl = `${SITE_URL}/store/fmart`;

  const text = [
    "🌸 <b>Скидка 30% на цветы и подарки в FMART by Flowwow!</b>",
    "",
    "Только с 23 по 26 октября в сервисе доставки цветов и подарков FMART by Flowwow действует эксклюзивная флеш-акция!",
    "",
    "Порадуйте любимых свежими букетами и авторскими композициями с максимальной выгодой:",
    `🛍 <a href="${affiliateUrl}">Заказать цветы в FMART by Flowwow</a>`,
    "",
    "🔥 <b>Горячие предложения и промокоды:</b>",
    "",
    "⚡️ <b>Скидка 30%</b> на первый или один повторный заказ (макс. скидка 700 ₽) по акции до 26 октября!",
    "➡️ <code>FMARTPE23khl6x</code> – скидка 23% на первый или повторный заказ букетов от 3 000 ₽.",
    "➡️ <code>FMARTPE900btr9u</code> – скидка 900 ₽ на первый или повторный заказ от 4 000 ₽.",
    "",
    "<i>(нажмите на промокод — он скопируется в буфер)</i>",
    "",
    "📌 <b>Условия акции:</b>",
    "• Флеш-скидка 30% действует строго по 26 октября 2026 года.",
    "• Промокоды 23% и 900 ₽ действуют до 31 октября 2026 года.",
    "• Не суммируется с другими промокодами и сертификатами.",
    "",
    '<i>Реклама. ООО "ФМАРТ" ОГРН 1237700524060 г. Москва erid: 2RanykURyUw</i>',
  ].join("\n");

  const buttons: TelegramButton[][] = [
    [{ text: "💐 В магазин FMART by Flowwow →", url: affiliateUrl }],
    [{ text: "🌐 Все купоны FMART на сайте", url: storeUrl }],
  ];

  return { text, buttons };
}

export async function sendCustomPostToTelegram(
  post: { text: string; buttons?: TelegramButton[][] },
  meta?: { storeId?: number; storeName?: string; promoCodes?: string[] },
  opts?: TelegramPostOptions,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const token = opts?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = opts?.channelId || process.env.TELEGRAM_CHANNEL_ID;

  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN не задан" };
  if (!chatId) return { ok: false, error: "TELEGRAM_CHANNEL_ID не задан" };

  const replyMarkup = post.buttons && post.buttons.length > 0 ? {
    inline_keyboard: post.buttons.map((row) =>
      row.map((btn) => ({ text: btn.text, url: btn.url })),
    ),
  } : undefined;

  try {
    const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: post.text,
      parse_mode: "HTML",
      disable_notification: true,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!data.ok) {
      return {
        ok: false,
        error: `Telegram API: ${data.description || res.statusText} (status: ${res.status})`,
      };
    }

    const messageId = data.result?.message_id;

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId && messageId) {
      const channelUsername = (process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka").replace("@", "");
      const postUrl = `https://t.me/${channelUsername}/${messageId}`;
      const perfluenceProjectUrl = meta?.storeId
        ? `https://dash.perfluence.net/my-projects/${meta.storeId}`
        : "https://dash.perfluence.net";

      const adminText = [
        `📢 <b>Опубликован пост для отчета Perfluence!</b>`,
        ``,
        `🏬 Магазин: <b>${escapeHtml(meta?.storeName || "Золотое Яблоко")}</b>`,
        `🎟 Промокоды: <code>${(meta?.promoCodes || []).join(", ") || "Все"}</code>`,
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
