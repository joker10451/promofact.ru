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

/**
 * Форматирует привлекательный текст поста для стены ВКонтакте
 */
export function formatVkPost(coupon: Coupon): string {
  const code = coupon.promocode.code;
  const storeName = coupon.store.name;
  const bonus = coupon.promocode.bonusName || `Скидка по промокоду ${code}`;
  const terms = coupon.promocode.terms ? `\n📌 Условия: ${coupon.promocode.terms}` : "";
  const siteUrl = `${SITE_URL}/store/${coupon.store.slug}/${encodeURIComponent(code)}`;

  const lines = [
    `🔥 Свежий промокод: ${storeName}!`,
    ``,
    `🎁 ${bonus}`,
    terms,
    ``,
    `🎟 Промокод: ${code}`,
    ``,
    `👉 Скопировать и применить: ${siteUrl}`,
    ``,
    `#скидки #${coupon.store.categorySlug.replace(/-/g, "_")} #промокод #${coupon.store.slug.replace(/-/g, "_")} #промофакт`,
  ];

  return lines.filter((l) => l !== undefined).join("\n");
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
  const postUrl = `${SITE_URL}/store/${coupon.store.slug}/${encodeURIComponent(coupon.promocode.code)}`;

  try {
    const params = new URLSearchParams({
      v: VK_API_VERSION,
      access_token: token,
      owner_id: ownerId,
      from_group: "1",
      message,
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
