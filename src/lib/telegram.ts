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
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const ru = str.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) {
    const [, d, m] = ru;
    return `${Number(d)} ${months[Number(m) - 1] ?? m}`;
  }
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, , m, d] = isoMatch;
    return `${Number(d)} ${months[Number(m) - 1] ?? m}`;
  }
  return str;
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

  // Выводим условия и подробности акции ДО маркировки
  if (coupon.promocode.terms) {
    lines.push("");
    lines.push("ℹ️ " + escapeHtml(stripHtml(coupon.promocode.terms)));
  }

  // 4. Аккуратная маркировка ОРД (Закон о рекламе) в самом низу поста
  const ordText = escapeHtml(coupon.affiliate.ordText);
  const ordMarker = escapeHtml(coupon.affiliate.ordMarker);

  lines.push("");
  lines.push("────────────────────");
  if (ordText) {
    const markerStr = ordMarker && !ordText.includes(ordMarker) ? ` erid: ${ordMarker}` : "";
    lines.push(`<i>${ordText}${markerStr}</i>`);
  } else if (ordMarker) {
    lines.push(`<i>Реклама. erid: ${ordMarker}</i>`);
  } else {
    lines.push(`<i>Реклама. ${storeName}</i>`);
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
    "💄 <b>До -50% в Золотом Яблоке: собрали все секретные промокоды октября!</b>",
    "",
    "Золотое Яблоко выкатило редкую скидку 50% на выделенный ассортимент и обновило промокоды на парфюмерию, косметику и уходовые средства:",
    "",
    `🛍 <a href="${affiliateUrl}">Перейти в Золотое Яблоко</a>`,
    "",
    "🔥 <b>Рабочие промокоды:</b>",
    "",
    "⚡️ <code>МИНУС</code> – скидка 50% от 8 000 ₽ на категорию «наша коллекция» (до 29 октября).",
    "⚡️ <code>PERF</code> – скидка до 10% от 3 000 ₽, до 15% от 6 000 ₽, до 20% от 9 000 ₽ + 300 бонусов на первый заказ (до 31 октября).",
    "⚡️ <code>ПРАЗДНИК</code> – скидка до 10% от 6 000 ₽, до 15% от 9 000 ₽ и до 20% от 12 000 ₽ на повторные заказы (до 29 октября).",
    "",
    "<i>(нажмите на промокод — он скопируется в буфер)</i>",
    "",
    "📌 <b>Условия акции:</b>",
    "• Промокоды действуют только для авторизованных пользователей в приложении и на сайте.",
    "• Не суммируются со скидками выше 40%, спецпредложениями и подарками.",
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

/**
 * Формирование срочного поста Пятёрочка Доставка (суммирование со скидками до конца октября)
 */
export function formatPyaterochkaSummationPost(): {
  text: string;
  buttons: TelegramButton[][];
  photoUrl: string;
} {
  const affiliateUrl = "https://pyaterochka.prfl.me/smart_zakupka/tatilo?erid=2Ranyng8Q3m";
  const storeUrl = `${SITE_URL}/store/pyaterochka`;
  const photoUrl = `${SITE_URL}/banners/pyaterochka_oct2026.jpg`;

  const text = [
    "🥐 <b>Уютный вечер и двойная выгода в Пятёрочка Доставка!</b>",
    "",
    "До конца октября действует приятная акция — промокоды <b>суммируются с желтыми ценниками и скидками</b>! Отличный повод взять сладости к чаю, свежую выпечку или продукты домой с максимальной экономией ☕️✨",
    "",
    "🔥 <b>Горячие промокоды:</b>",
    "",
    "⚡️ <code>4pmhdjrhsp7</code> — скидка <b>750 ₽</b> на первый заказ от 1 500 ₽",
    "⚡️ <code>6wrhnueusp6</code> — скидка <b>55%</b> на первый заказ от 700 ₽ <i>(макс. скидка 600 ₽)</i>",
    "",
    "<i>(нажмите на промокод — он скопируется в буфер)</i>",
    "",
    "💡 <b>Работают и на старых аккаунтах</b>, если вы не заказывали в доставке более 1 года!",
    "",
    "📌 Зона и время доставки ограничены. Имеются ограничения по условиям бесплатной доставки. Подробности в приложении «Пятёрочка Доставка» 18+.",
    "",
    "────────────────────",
    "<tg-spoiler><i>Реклама. ООО «Агроторг». ИНН 7825706086 erid: 2Ranyng8Q3m</i></tg-spoiler>",
  ].join("\n");

  const buttons: TelegramButton[][] = [
    [{ text: "🛍 Заказать в Пятёрочке →", url: affiliateUrl }],
    [{ text: "🌐 Все скидки Пятёрочки на сайте", url: storeUrl }],
  ];

  return { text, buttons, photoUrl };
}

export async function sendCustomPostToTelegram(
  post: { text: string; buttons?: TelegramButton[][]; photoUrl?: string },
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
    let endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    let body: Record<string, unknown> = {
      chat_id: chatId,
      text: post.text,
      parse_mode: "HTML",
      disable_notification: true,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    if (post.photoUrl && post.photoUrl.startsWith("http")) {
      endpoint = `https://api.telegram.org/bot${token}/sendPhoto`;
      body = {
        chat_id: chatId,
        photo: post.photoUrl,
        caption: post.text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
        disable_notification: true,
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let data = await res.json();
    if (!data.ok && endpoint.includes("sendPhoto")) {
      const fallbackRes = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: post.text,
            parse_mode: "HTML",
            reply_markup: replyMarkup,
            disable_notification: true,
            disable_web_page_preview: true,
          }),
        },
      );
      data = await fallbackRes.json();
    }
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
