/**
 * scripts/vk-crossposter.mjs
 * 
 * Модуль автоматического кросспостинга акций и промокодов в сообщество ВКонтакте:
 * "ПромоФакт | Промокоды и скидки на каждый день" (vk.com/promofact, ID: 240879299).
 * 
 * Возможности:
 * 1. Загрузка брендового баннера с напечатанным промокодом на стену группы через VK API.
 * 2. Форматирование текста под стандарты ВК (эмодзи, кликабельные ссылки, хештеги, маркировка erid).
 * 3. Публикация от имени сообщества (from_group = 1).
 * 4. Бесшовный запуск параллельно с Telegram-пайплайном.
 */

import fs from "node:fs";
import path from "node:path";

// Чтение переменных окружения
function getVkEnv() {
  let token = process.env.VK_ACCESS_TOKEN;
  let ownerId = process.env.VK_OWNER_ID;
  let groupId = process.env.VK_GROUP_ID;

  if (!token && fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf8");
    const mToken = envContent.match(/VK_ACCESS_TOKEN\s*=\s*["']?([^"'\r\n]+)/);
    const mOwner = envContent.match(/VK_OWNER_ID\s*=\s*["']?([^"'\r\n]+)/);
    const mGroup = envContent.match(/VK_GROUP_ID\s*=\s*["']?([^"'\r\n]+)/);
    if (mToken) token = mToken[1].trim();
    if (mOwner) ownerId = mOwner[1].trim();
    if (mGroup) groupId = mGroup[1].trim();
  }

  return {
    token,
    ownerId: ownerId || "-240879299",
    groupId: groupId || "240879299"
  };
}

/**
 * Загружает изображение баннера на стену группы ВКонтакте
 */
async function uploadVkWallPhoto(filePath, token, groupId) {
  if (!fs.existsSync(filePath)) return null;

  try {
    // 1. Получаем upload_url
    const serverUrl = `https://api.vk.com/method/photos.getWallUploadServer?v=5.199&access_token=${token}&group_id=${groupId}`;
    const serverRes = await fetch(serverUrl);
    const serverData = await serverRes.json();
    if (!serverData.response?.upload_url) {
      console.warn("[VK] Ошибка получения upload_url:", serverData.error?.error_msg || serverData);
      return null;
    }

    // 2. Отправляем файл
    const fileBuffer = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append("photo", new Blob([fileBuffer], { type: "image/png" }), "banner.png");

    const uploadRes = await fetch(serverData.response.upload_url, {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.photo || uploadData.photo === "[]") {
      console.warn("[VK] Ошибка выгрузки файла на сервер VK:", uploadData);
      return null;
    }

    // 3. Сохраняем фото в альбом группы
    const saveParams = new URLSearchParams({
      v: "5.199",
      access_token: token,
      group_id: groupId,
      photo: uploadData.photo,
      server: String(uploadData.server),
      hash: uploadData.hash
    });

    const saveRes = await fetch("https://api.vk.com/method/photos.saveWallPhoto", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: saveParams.toString()
    });
    const saveData = await saveRes.json();
    const photoObj = saveData.response?.[0];
    if (photoObj) {
      return `photo${photoObj.owner_id}_${photoObj.id}`;
    }
    return null;
  } catch (err) {
    console.warn("[VK] Ошибка загрузки фото:", err.message);
    return null;
  }
}

/**
 * Формирует текст поста для ВКонтакте
 */
export function formatVkPostText({
  storeName,
  code,
  bonus,
  terms,
  affUrl,
  ordMarker,
  ordText,
  flashDeal
}) {
  const lines = [];

  if (flashDeal && !flashDeal.isInternalOnly && flashDeal.audienceDesc) {
    lines.push(`⚡ ${flashDeal.badge}: ${flashDeal.title.toUpperCase()}!`);
    if (flashDeal.audienceDesc) lines.push(`📢 ${flashDeal.audienceDesc}\n`);
  }

  lines.push(`🔥 ${storeName} — ${bonus}\n`);
  lines.push(`🎟 Промокод: ${code}`);
  lines.push(`(скопируйте промокод и вставьте в корзине при заказе)\n`);

  if (terms) {
    const cleanTerms = terms.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    lines.push(`📌 Условия: ${cleanTerms}\n`);
  }

  if (affUrl) {
    lines.push(`👉 Активировать скидку: ${affUrl}`);
  }
  lines.push(`🌐 Все промокоды на сайте: https://promofact.ru\n`);

  // Хештеги
  const cleanTag = storeName.replace(/[^a-zA-Z0-9а-яА-Я]/g, "").toLowerCase();
  lines.push(`#скидки #промокод #${cleanTag} #акции #промофакт\n`);

  // Маркировка
  if (ordMarker && ordText && !ordText.includes(ordMarker)) {
    lines.push(`${ordText} erid: ${ordMarker}`);
  } else if (ordText) {
    lines.push(ordText);
  } else if (ordMarker) {
    lines.push(`Реклама. erid: ${ordMarker}`);
  }

  return lines.join("\n");
}

/**
 * Публикует пост на стену ВКонтакте
 */
export async function postToVk(offerData) {
  const { token, ownerId, groupId } = getVkEnv();
  if (!token) {
    console.warn("[VK] VK_ACCESS_TOKEN не задан, кросспостинг во ВКонтакте пропущен.");
    return { ok: false, skipped: true };
  }

  console.log(`[VK] Подготовка публикации поста "${offerData.storeName}" в сообщество vk.com/promofact...`);

  // 1. Загружаем баннер, если он есть
  let attachment = null;
  if (offerData.bannerPath && fs.existsSync(offerData.bannerPath)) {
    console.log(` -> 📸 Загрузка баннера [${offerData.bannerPath}] в VK...`);
    attachment = await uploadVkWallPhoto(offerData.bannerPath, token, groupId);
    if (attachment) {
      console.log(` -> ✓ Баннер прикреплен: ${attachment}`);
    }
  }

  // 2. Формируем текст
  const postText = formatVkPostText(offerData);

  // 3. Публикуем на стену
  const postParams = new URLSearchParams({
    v: "5.199",
    access_token: token,
    owner_id: ownerId,
    from_group: "1",
    message: postText
  });

  if (attachment) {
    postParams.append("attachments", attachment);
  }

  try {
    const postRes = await fetch("https://api.vk.com/method/wall.post", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: postParams.toString()
    });
    const postData = await postRes.json();

    if (postData.response?.post_id) {
      const postId = postData.response.post_id;
      const cleanOwner = ownerId.replace(/^-/, "");
      const postUrl = `https://vk.com/wall-${cleanOwner}_${postId}`;
      console.log(`🎉 [VK] Пост успешно опубликован на стене ВКонтакте: ${postUrl}`);
      return { ok: true, postId, postUrl };
    }

    console.warn("❌ [VK] Ошибка публикации:", postData.error?.error_msg || postData);
    return { ok: false, error: postData.error?.error_msg || "Unknown VK error" };
  } catch (err) {
    console.warn("❌ [VK] Исключение при отправке поста:", err.message);
    return { ok: false, error: err.message };
  }
}

// Тестовый запуск из командной строки
if (process.argv[1]?.includes("vk-crossposter.mjs")) {
  const testBanner = path.join(process.cwd(), "data", "banners", "Start_ru-pf5m0gcpfw6.png");
  postToVk({
    storeName: "Start.ru",
    code: "pf5m0gcpfw6",
    bonus: "30 дней доступа на START за 0 ₽ + скидка 50% на первое продление",
    terms: "Действует для всех новых пользователей при первой подписке.",
    affUrl: "https://start.prfl.me/smart_zakupka/ffjk1k?erid=2RanynSzDQ7",
    ordMarker: "2RanynSzDQ7",
    ordText: 'Реклама. ООО "СТАРТ.РУ", ИНН 7728374780',
    bannerPath: testBanner,
    flashDeal: {
      badge: "📈 ПОВЫШЕННАЯ СТАВКА",
      title: "Повышение ставки!",
      desc: "На проекте Start.ru с 17.09 повышается ставка за платное продление."
    }
  }).then(res => console.log("Result:", res));
}
