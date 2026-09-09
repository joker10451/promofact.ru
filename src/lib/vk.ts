import "server-only";
import { SITE_URL } from "@/lib/site";
import type { Coupon } from "@/lib/types";

const VK_API_VERSION = "5.199";

export interface VkPostResult {
  ok: boolean;
  postId?: number;
  error?: string;
}

export interface VkMessageResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Проверяет, настроена ли интеграция с VK (токен и ID сообщества)
 */
export function isVkConfigured(): boolean {
  return Boolean(process.env.VK_ACCESS_TOKEN && process.env.VK_OWNER_ID);
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "eda-i-dostavka": "🛒",
  "dostavka-produktov": "🥦",
  "dostavka-iz-restoranov": "🍕",
  "marketpleysy": "📦",
  "onlayn-kinoteatry": "🎬",
  "servisy-i-podpiski": "✨",
  "odezhda-i-obuv": "👗",
  "kosmetika-i-parfyumeriya": "💄",
  "elektronika": "📱",
  "vse-dlya-doma": "🛋",
  "puteshestviya-i-turizm": "✈️",
  "zdorove-i-vitaminy": "💊",
  "onlayn-obrazovanie": "🎓",
  "sport-i-otdyh": "⚽",
  "detskie-tovary": "🧸",
  "tsvety": "💐",
};

/**
 * Форматирует привлекательный текст поста для стены ВКонтакте
 */
export function formatVkPost(coupon: Coupon): string {
  const code = coupon.promocode.code;
  const storeName = coupon.store.name;
  const emoji = CATEGORY_EMOJIS[coupon.store.categorySlug] || (coupon.promocode.isHit ? "🔥" : "🏷");
  const categoryTitle = (coupon.store.category || "Скидки и акции").toUpperCase();
  const bonus = coupon.promocode.bonusName || "Скидка по промокоду";
  const storeUrl = `${SITE_URL}/store/${coupon.store.slug}`;
  const directLink = coupon.affiliate.link || coupon.affiliate.landingLink || coupon.store.site || storeUrl;

  const lines: string[] = [
    `${emoji} ${categoryTitle}`,
    ``,
    `🔥 ${storeName} — ${bonus}`,
    ``,
    `🎟 Промокод: ${code}`,
    ``,
  ];

  lines.push("📌 Условия:");
  if (coupon.promocode.isFirstOrderOnly) {
    lines.push("• Только для новых клиентов (первый заказ)");
  } else if (coupon.promocode.isUniversal) {
    lines.push("• Для всех клиентов (включая повторные заказы)");
  }
  if (coupon.promocode.minimumOrder) {
    lines.push(`• При заказе от ${coupon.promocode.minimumOrder.value.toLocaleString("ru-RU")} ₽`);
  }
  if (coupon.promocode.terms) {
    lines.push(`• ${coupon.promocode.terms}`);
  }
  if (coupon.promocode.expires) {
    const d = new Date(coupon.promocode.expires);
    if (!Number.isNaN(d.getTime())) {
      const expFormatted = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
      lines.push(`• Срок действия: до ${expFormatted}`);
    }
  }

  lines.push(``);
  lines.push(`🛍 В магазин: ${directLink}`);
  lines.push(`🌐 Все купоны магазина: ${storeUrl}`);

  // Обязательная маркировка рекламы (ОРД) по закону РФ
  const ordText = coupon.affiliate.ordText;
  const ordMarker = coupon.affiliate.ordMarker;
  lines.push(``);
  if (ordText) {
    const markerStr = ordMarker && !ordText.includes(ordMarker) ? ` erid: ${ordMarker}` : "";
    lines.push(`${ordText}${markerStr}`);
  } else if (ordMarker) {
    lines.push(`Реклама. erid: ${ordMarker}`);
  } else {
    lines.push(`Реклама. ${storeName}`);
  }

  // Хэштеги
  const catTag = coupon.store.categorySlug ? `#${coupon.store.categorySlug.replace(/-/g, "_")}` : "";
  const storeTag = `#${coupon.store.slug.replace(/-/g, "_")}`;
  lines.push(``);
  lines.push(`#скидки #промокод ${storeTag} ${catTag} #промофакт`.replace(/\s+/g, " ").trim());

  return lines.join("\n");
}

/**
 * Публикация поста на стену группы ВКонтакте через wall.post
 */
export async function sendCouponToVk(coupon: Coupon): Promise<VkPostResult> {
  const token = process.env.VK_ACCESS_TOKEN;
  let ownerId = process.env.VK_OWNER_ID;

  if (!token || !ownerId) {
    return { ok: false, error: "VK_ACCESS_TOKEN или VK_OWNER_ID не настроены в переменных окружения" };
  }

  if (!ownerId.startsWith("-") && !ownerId.startsWith("id")) {
    ownerId = `-${ownerId}`;
  }

  const message = formatVkPost(coupon);
  const storeUrl = `${SITE_URL}/store/${coupon.store.slug}`;

  try {
    const params = new URLSearchParams({
      v: VK_API_VERSION,
      access_token: token,
      owner_id: ownerId,
      from_group: "1",
      message,
      attachments: storeUrl,
    });

    const res = await fetch(`https://api.vk.com/method/wall.post`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();

    if (data.error) {
      console.error("[vk] Ошибка публикации VK API:", data.error);
      return {
        ok: false,
        error: `[VK Error ${data.error.error_code}]: ${data.error.error_msg}`,
      };
    }

    const postId = data.response?.post_id;
    console.log(`[vk] Успешно опубликован пост ID: ${postId} для магазина ${coupon.store.name}`);
    return { ok: true, postId };
  } catch (e) {
    console.error("[vk] Сетевой сбой при отправке в VK:", e);
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Отправка сообщения пользователю в диалоге группы VK с интерактивными кнопками
 */
export async function sendVkBotMessage(
  userId: number,
  text: string,
  keyboard?: Record<string, unknown>
): Promise<VkMessageResult> {
  const token = process.env.VK_ACCESS_TOKEN;

  if (!token) {
    return { ok: false, error: "VK_ACCESS_TOKEN не настроен" };
  }

  try {
    const randomId = Math.floor(Math.random() * 1000000000);
    const params: Record<string, string> = {
      v: VK_API_VERSION,
      access_token: token,
      user_id: String(userId),
      random_id: String(randomId),
      message: text,
    };

    if (keyboard) {
      params.keyboard = JSON.stringify(keyboard);
    }

    const res = await fetch(`https://api.vk.com/method/messages.send`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });

    const data = await res.json();

    if (data.error) {
      console.error("[vk bot] Ошибка messages.send:", data.error);
      return { ok: false, error: data.error.error_msg };
    }

    return { ok: true, messageId: data.response };
  } catch (e) {
    console.error("[vk bot] Сбой отправки сообщения в VK:", e);
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Интерактивная клавиатура с категориями и популярными магазинами
 */
export function getVkBotKeyboard() {
  return {
    one_time: false,
    inline: false,
    buttons: [
      [
        {
          action: {
            type: "text",
            label: "🍣 Доставка еды",
            payload: JSON.stringify({ command: "category", slug: "dostavka-edy" }),
          },
          color: "primary",
        },
        {
          action: {
            type: "text",
            label: "💄 Косметика",
            payload: JSON.stringify({ command: "category", slug: "kosmetika" }),
          },
          color: "primary",
        },
      ],
      [
        {
          action: {
            type: "text",
            label: "🏨 Отели и туризм",
            payload: JSON.stringify({ command: "category", slug: "puteshestviya" }),
          },
          color: "primary",
        },
        {
          action: {
            type: "text",
            label: "📚 Книги и курсы",
            payload: JSON.stringify({ command: "category", slug: "obrazovanie" }),
          },
          color: "primary",
        },
      ],
      [
        {
          action: {
            type: "text",
            label: "🔥 Топ скидок дня",
            payload: JSON.stringify({ command: "top" }),
          },
          color: "positive",
        },
        {
          action: {
            type: "open_link",
            label: "🌐 Сайт ПромоФакт",
            link: SITE_URL,
          },
        },
      ],
    ],
  };
}
