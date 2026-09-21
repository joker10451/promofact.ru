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
  let userToken = process.env.VK_USER_TOKEN;
  let ownerId = process.env.VK_OWNER_ID;
  let groupId = process.env.VK_GROUP_ID;

  if (fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf8");
    for (const line of envContent.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || "").trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1).trim();
        }
        if (match[1] === "VK_ACCESS_TOKEN" && !token) token = val;
        if (match[1] === "VK_USER_TOKEN" && !userToken) userToken = val;
        if (match[1] === "VK_OWNER_ID" && !ownerId) ownerId = val;
        if (match[1] === "VK_GROUP_ID" && !groupId) groupId = val;
      }
    }
  }

  return {
    token: (token || "").replace(/["']/g, "").trim(),
    userToken: (userToken || "").replace(/["']/g, "").trim(),
    ownerId: (ownerId || "-240879299").replace(/["']/g, "").trim(),
    groupId: (groupId || "240879299").replace(/["']/g, "").trim()
  };
}

/**
 * Загружает изображение баннера на стену группы ВКонтакте
 */
async function uploadVkWallPhoto(filePath, token, groupId) {
  if (!fs.existsSync(filePath)) return null;

  try {
    // 1. Получаем upload_url через photos.getWallUploadServer
    const serverUrl = `https://api.vk.com/method/photos.getWallUploadServer?v=5.199&access_token=${token}&group_id=${groupId}`;
    const serverRes = await fetch(serverUrl);
    const serverData = await serverRes.json();
    if (!serverData.response?.upload_url) {
      if (serverData.error?.error_code === 27) {
        console.warn(" -> ℹ [VK] Для прикрепления фотобаннеров нужен VK_USER_TOKEN (токен админа с правами photos,wall). Пост публикуется текстом.");
      } else {
        console.warn("[VK] Ошибка получения upload_url:", serverData.error?.error_msg || serverData);
      }
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
  storeSlug,
  code,
  bonus,
  terms,
  affUrl,
  ordMarker,
  ordText,
  flashDeal,
  // Анонс вместо рекламы: без партнёрской ссылки и без erid, со ссылкой на
  // страницу магазина. Сообщество ВК не подключено к Perfluence как площадка,
  // поэтому свой erid на него не выдают, а чужой ставить нельзя. Реклама с
  // маркировкой живёт на сайте, куда ведёт ссылка.
  siteMode = true
}) {
  const lines = [];
  const sitePage = storeSlug
    ? `https://promofact.ru/store/${storeSlug}`
    : "https://promofact.ru";

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

  if (!siteMode && affUrl) {
    lines.push(`👉 Активировать скидку: ${affUrl}`);
  }
  lines.push(`🌐 Все коды и условия: ${sitePage}\n`);

  // Хештеги
  const cleanTag = storeName.replace(/[^a-zA-Z0-9а-яА-Я]/g, "").toLowerCase();
  lines.push(`#скидки #промокод #${cleanTag} #акции #промофакт`);

  // Маркировка нужна только там, где стоит партнёрская ссылка
  if (!siteMode) {
    lines.push("");
    if (ordMarker && ordText && !ordText.includes(ordMarker)) {
      lines.push(`${ordText} erid: ${ordMarker}`);
    } else if (ordText) {
      lines.push(ordText);
    } else if (ordMarker) {
      lines.push(`Реклама. erid: ${ordMarker}`);
    }
  }

  return lines.join("\n");
}

/**
 * Публикует пост на стену ВКонтакте
 */
export async function postToVk(offerData) {
  const { token, userToken, ownerId, groupId } = getVkEnv();
  if (!token && !userToken) {
    console.warn("[VK] VK_ACCESS_TOKEN не задан, кросспостинг во ВКонтакте пропущен.");
    return { ok: false, skipped: true };
  }

  console.log(`[VK] Подготовка публикации поста "${offerData.storeName}" в сообщество vk.com/promofact...`);

  // 1. Загружаем баннер, если он есть
  let attachment = null;
  if (offerData.bannerPath && fs.existsSync(offerData.bannerPath)) {
    console.log(` -> 📸 Загрузка баннера [${offerData.bannerPath}] в VK...`);
    attachment = await uploadVkWallPhoto(offerData.bannerPath, userToken || token, groupId);
    if (attachment) {
      console.log(` -> ✓ Баннер прикреплен: ${attachment}`);
    }
  }

  // 2. Формируем текст
  const postText = formatVkPostText(offerData);

  // 3. Публикуем на стену
  // Публикуем тем же токеном, которым грузили баннер: раньше здесь стоял
  // только VK_ACCESS_TOKEN, и при заполненном VK_USER_TOKEN запрос уходил
  // с пустым ключом — пост молча не появлялся.
  const postParams = new URLSearchParams({
    v: "5.199",
    access_token: userToken || token,
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
