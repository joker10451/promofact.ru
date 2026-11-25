/**
 * scripts/perfluence-report.mjs
 * 
 * Автоматическое подтверждение и сдача отчета о публикации в Perfluence:
 * 1. Находит ID публикации (postId) для проекта и площадки @smart_zakupka (accountId: 3066585)
 * 2. Мгновенно отправляет подтверждение через прямой HTTP POST (0.2 сек, без зависаний браузера)
 * 3. Передает:
 *    - Post[type] = "post"
 *    - Post[published_day] = "today"
 *    - Post[post_link] = Ссылка на пост в Telegram (https://t.me/smart_zakupka/...)
 *    - Post[is_ord_marker_approved] = "1" (токен erid размещен)
 *    - Post[status] = "published" ("Внести публикацию")
 * 4. Предусмотрен Playwright-фоллбек на случай изменений в API.
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const SESSION_FILE = path.join(process.cwd(), "data", "perfluence_session.json");
const TG_ACCOUNT_ID = "3066585"; // @smart_zakupka

function getSessionCookies() {
  const b64 = process.env.PERFLUENCE_SESSION_B64_DEPLOYED || process.env.PERFLUENCE_SESSION_B64;
  if (b64) {
    try {
      const session = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      const cookieHeader = (session.cookies || []).map((c) => `${c.name}=${c.value}`).join("; ");
      if (cookieHeader) return { session, cookieHeader };
    } catch {}
  }
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(`Файл сессии ${SESSION_FILE} не найден. Требуется: node scripts/perfluence-auth.mjs`);
  }
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
  const cookieHeader = (session.cookies || []).map((c) => `${c.name}=${c.value}`).join("; ");
  return { session, cookieHeader };
}

/**
 * Находит ID публикации (postId) для заданного проекта в кабинете блогера
 */
export async function findPostForProject(projectId, accountId = TG_ACCOUNT_ID) {
  const { cookieHeader } = getSessionCookies();
  const url = "https://dash.perfluence.net/posts";

  const res = await fetch(url, {
    headers: {
      "Cookie": cookieHeader,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0"
    }
  });

  if (!res.ok) {
    throw new Error(`Не удалось загрузить список публикаций (HTTP ${res.status})`);
  }

  const html = await res.text();
  const tiles = html.split('<div class="post-tile-widget');

  for (const tile of tiles.slice(1)) {
    const postMatch = tile.match(/href="\/posts\/update\/(\d+)"/i);
    const projMatch = tile.match(/href="\/project\/(\d+)[^"]*"/i);
    const accountMatch = tile.match(/href="\/profile\/update-account-new\/(\d+)"/i);
    const statusMatch = tile.match(/<div class="card-post-status">([\s\S]*?)<\/div>/i);

    const tileProjectId = projMatch?.[1];
    const tileAccountId = accountMatch?.[1];
    const status = statusMatch?.[1]?.trim() || "";

    if (postMatch && String(tileProjectId) === String(projectId)) {
      if (!accountId || String(tileAccountId) === String(accountId)) {
        // Приоритет запланированным постам, ожидающим отчета
        if (status.includes("Запланирован") || status.includes("правки") || !status.includes("Опубликован")) {
          return {
            postId: postMatch[1],
            projectId: tileProjectId,
            accountId: tileAccountId,
            status
          };
        }
      }
    }
  }

  // Если нашли только опубликованный, сохраняем как запасной
  let fallbackPost = null;
  for (const tile of tiles.slice(1)) {
    const postMatch = tile.match(/href="\/posts\/update\/(\d+)"/i);
    const projMatch = tile.match(/href="\/project\/(\d+)[^"]*"/i);
    const accountMatch = tile.match(/href="\/profile\/update-account-new\/(\d+)"/i);
    const statusMatch = tile.match(/<div class="card-post-status">([\s\S]*?)<\/div>/i);

    if (postMatch && String(projMatch?.[1]) === String(projectId)) {
      if (!accountId || String(accountMatch?.[1]) === String(accountId)) {
        fallbackPost = {
          postId: postMatch[1],
          projectId: projMatch[1],
          accountId: accountMatch?.[1],
          status: statusMatch?.[1]?.trim() || ""
        };
        break;
      }
    }
  }

  return fallbackPost;
}

/**
 * Автоматически нажимает «Повторить публикацию» в Perfluence, создавая новый слот
 */
export async function createOrRepeatPublication(projectId, accountId = TG_ACCOUNT_ID) {
  const { cookieHeader } = getSessionCookies();
  const url = `https://dash.perfluence.net/blogger/posts/create-publication?return-back=1&projectId=${projectId}&accountId=${accountId}`;
  console.log(`[Report] Запуск «Повторить публикацию» для проекта #${projectId}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "Cookie": cookieHeader,
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    const text = await res.text();
    console.log(`[Report] Результат «Повторить публикацию»: HTTP ${res.status}, ответ: ${text.slice(0, 120)}`);
    return true;
  } catch (err) {
    console.warn(`[Report] Ошибка нажатия «Повторить публикацию»: ${err.message}`);
    return false;
  }
}

function parseFormFieldPrefix(formHtml) {
  return formHtml.includes("PostForm[post_link]") ? "PostForm" : "Post";
}

function parseSelectedPostType(formHtml, prefix) {
  const selectRe = new RegExp(
    `<select[^>]+name="${prefix}\\[type\\]"[\\s\\S]*?<option[^>]*value="([^"]+)"[^>]*selected`,
    "i",
  );
  return formHtml.match(selectRe)?.[1] || "post";
}

function parseUploadPath(formHtml) {
  return formHtml.match(/value="(\/upload\/image\/[^"]+)"/i)?.[1] || "/upload/image/post_screen";
}

function extractYiiErrorSummary(html) {
  const errMatch = html.match(/class="error-summary[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const clean = errMatch.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (clean) return clean;
  const inline = html.match(/Исправьте следующие ошибки:[\s\S]{0,250}/i)?.[0] || "";
  return inline.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function uploadScreenshotHttp(
  cookieHeader,
  formHtml,
  formUrl,
  postId,
  postUrl,
  options = { headless: true },
) {
  const browserEngine = options._chromium || chromium;
  const browser = await browserEngine.launch({ headless: options.headless ?? true });
  let proofPath;
  try {
    proofPath = await captureProofScreenshot(browser, postId, postUrl);
  } finally {
    await browser.close();
  }

  const pngBuf = fs.existsSync(proofPath) ? fs.readFileSync(proofPath) : Buffer.from([]);
  const uploadPath = parseUploadPath(formHtml);
  const uploadUrl = uploadPath.startsWith("http") ? uploadPath : `https://dash.perfluence.net${uploadPath}`;
  const metaCsrf =
    formHtml.match(/name="csrf-token"\s+content="([^"]+)"/i)?.[1] ||
    formHtml.match(/name="_csrf"\s+value="([^"]+)"/i)?.[1] ||
    "";

  const formData = new FormData();
  formData.append("img", new Blob([pngBuf], { type: "image/png" }), `proof-${postId}.png`);

  const upRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
      Referer: formUrl,
      ...(metaCsrf ? { "X-CSRF-Token": metaCsrf } : {}),
    },
    body: formData,
  });

  const upText = await upRes.text();
  let upJson = null;
  try {
    upJson = JSON.parse(upText);
  } catch {
    throw new Error(`Некорректный ответ ${uploadPath}: HTTP ${upRes.status}`);
  }
  if (!upRes.ok || !upJson?.success || !upJson?.filename) {
    throw new Error(`Не удалось загрузить скриншот в ${uploadPath}: HTTP ${upRes.status} (${upText.slice(0, 180)})`);
  }
  console.log(`[Report/HTTP] ✓ Скриншот загружен в ${uploadPath}: ${upJson.filename}`);
  return upJson.filename;
}

/**
 * Быстрая и надежная сдача отчета через HTTP POST API (+ авто-дозагрузка скрина на /upload/image/post_screen)
 */
export async function submitReportHttp(postId, postUrl, options = { headless: true }) {
  const { cookieHeader } = getSessionCookies();
  const formUrl = `https://dash.perfluence.net/posts/update/${postId}`;

  console.log(`[Report/HTTP] Получение формы и CSRF-токена: ${formUrl}...`);
  const formRes = await fetch(formUrl, {
    headers: {
      Cookie: cookieHeader,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    redirect: "manual",
  });

  const formLoc = formRes.headers.get("location");
  if (formRes.status >= 300 && formRes.status < 400 && formLoc && /\/(?:site\/)?login/i.test(formLoc)) {
    throw new Error(`Сессия Perfluence истекла при открытии формы #${postId}`);
  }
  if (!formRes.ok) {
    throw new Error(`Ошибка открытия формы поста #${postId}: HTTP ${formRes.status}`);
  }

  const formHtml = await formRes.text();
  if (/action="\/(?:site\/)?login"|Вход в личный кабинет/i.test(formHtml) && !formHtml.includes("logout")) {
    throw new Error(`Сессия Perfluence не авторизована при открытии формы #${postId}`);
  }

  const csrfMatch = formHtml.match(/name="_csrf"\s+value="([^"]+)"/i);
  if (!csrfMatch) {
    throw new Error("Не удалось извлечь CSRF-токен из формы Perfluence.");
  }
  const csrf = csrfMatch[1];
  const prefix = parseFormFieldPrefix(formHtml);
  const postType = parseSelectedPostType(formHtml, prefix);

  async function sendForm(screenKey = null) {
    const params = new URLSearchParams();
    params.append("_csrf", csrf);
    params.append(`${prefix}[type]`, postType);
    params.append(`${prefix}[published_day]`, "today");
    params.append(`${prefix}[post_link]`, postUrl);
    if (screenKey) {
      params.append(`${prefix}[screen_post]`, screenKey);
    }
    params.append(`${prefix}[is_ord_marker_approved]`, "1");
    params.append(`${prefix}[status]`, "published");

    const submitRes = await fetch(formUrl, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: formUrl,
      },
      body: params.toString(),
      redirect: "manual",
    });

    const status = submitRes.status;
    const location = submitRes.headers.get("location");
    console.log(`[Report/HTTP] Ответ сервера: HTTP ${status} (Location: ${location || "нет"})`);
    if (status === 302 && (!location || !/login/i.test(location))) {
      return { ok: true, status, location, body: "" };
    }
    return { ok: false, status, location, body: await submitRes.text() };
  }

  console.log(`[Report/HTTP] Отправка данных отчета:`);
  console.log(`  - Пост: ${postUrl}`);
  console.log(`  - Токен erid подтвержден: Да`);
  console.log(`  - День публикации: Сегодня`);
  console.log(`  - Статус: Опубликован`);

  const firstAttempt = await sendForm(null);
  if (firstAttempt.ok) {
    return { success: true, method: "http", postId, location: firstAttempt.location };
  }

  const hasUploadWidget =
    formHtml.includes("screen_post") || formHtml.includes("/upload/image/post_screen");
  const firstErr = extractYiiErrorSummary(firstAttempt.body);
  if (firstAttempt.status === 200 && hasUploadWidget) {
    console.log(`[Report/HTTP] Форма #${postId} требует скриншот (${firstErr || "screen_post"}). Снимаем и загружаем по HTTP...`);
    const screenKey = await uploadScreenshotHttp(cookieHeader, formHtml, formUrl, postId, postUrl, options);
    const secondAttempt = await sendForm(screenKey);
    if (secondAttempt.ok) {
      return {
        success: true,
        method: "http-screenshot",
        postId,
        location: secondAttempt.location,
        screenKey,
      };
    }
    const secondErr = extractYiiErrorSummary(secondAttempt.body);
    throw new Error(`Ответ HTTP ${secondAttempt.status} после загрузки скрина${secondErr ? `: ${secondErr}` : ""}`);
  }

  throw new Error(`Ответ HTTP ${firstAttempt.status}${firstErr ? `: ${firstErr}` : ""}`);
}

async function captureProofScreenshot(browser, postId, postUrl) {
  const proofDir = path.join(process.cwd(), "data", "debug");
  if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });
  const proofPath = path.join(proofDir, `proof-${postId}.png`);
  // Для Telegram-постов открываем публичный web-превью t.me/s/..., чтобы страница отрисовалась без клиента TG.
  const renderUrl = postUrl.replace(/^https:\/\/t\.me\/(?!s\/)([^/]+\/\d+)/i, "https://t.me/s/$1");
  const tgMatch = postUrl.match(/^https:\/\/t\.me\/(?:s\/)?([^/]+\/\d+)/i);
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  try {
    await page.goto(renderUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(2500);
    if (tgMatch && typeof page.locator === "function") {
      await page.locator(`[data-post="${tgMatch[1]}"]`).first().scrollIntoViewIfNeeded().catch(() => {});
    }
    await page.screenshot({ path: proofPath, fullPage: false });
    return proofPath;
  } finally {
    await page.close();
  }
}

/**
 * Запасной Playwright-метод (на случай изменений структуры формы или обязательного скриншота)
 */
export async function submitReportPlaywright(postId, postUrl, options = { headless: true }) {
  console.log(`[Report/Browser] Запуск браузерного режима для поста #${postId}...`);
  const browserEngine = options._chromium || chromium;
  const browser = await browserEngine.launch({ headless: options.headless });
  try {
    const context = await browser.newContext({
      storageState: options._storageState ?? SESSION_FILE,
      viewport: { width: 1280, height: 860 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    const targetUrl = `https://dash.perfluence.net/posts/update/${postId}`;
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 25000 });

    // Заполняем ссылку (учитываем формы и Post[...], и PostForm[...])
    const linkInput = page.locator('#post-post_link, input[name="Post[post_link]"], input[name="PostForm[post_link]"]').first();
    if (await linkInput.count()) {
      await linkInput.fill(postUrl);
    }

    // Выбираем "Сегодня"
    const daySelect = page.locator('#post-published_day, select[name="Post[published_day]"], select[name="PostForm[published_day]"]').first();
    if (await daySelect.count()) {
      await daySelect.selectOption("today").catch(() => {});
    }
    const todayBadge = page.locator('.badge-select-item[data-value="today"]').first();
    if (await todayBadge.count()) {
      await todayBadge.click().catch(() => {});
    }

    // На форме два input[type="file"][name="img"]: первый для сторис (#post-screen_stories, часто скрыт),
    // второй именно для публикации (#post-screen_post). Бьём строго в контейнер #post-screen_post.
    const postHiddenSelector = (await page.locator('#post-screen_post').count())
      ? '#post-screen_post'
      : (await page.locator('input[name="PostForm[screen_post]"]').count())
        ? 'input[name="PostForm[screen_post]"]'
        : null;

    if (postHiddenSelector) {
      const container = page.locator(postHiddenSelector).locator('xpath=ancestor::*[.//input[@type="file"][@name="img"]][1]');
      const postFileInput = (await container.locator('input[type="file"][name="img"]').count())
        ? container.locator('input[type="file"][name="img"]').first()
        : page.locator('input[type="file"][name="img"]').last();

      const proofPath = await captureProofScreenshot(browser, postId, postUrl);
      await postFileInput.setInputFiles(proofPath);

      // Ждём фактического ответа /upload/image/post_screen и заполнения hidden-поля!
      await page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return Boolean(el && typeof el.value === "string" && el.value.trim().length > 3);
        },
        postHiddenSelector,
        { timeout: 15000 },
      );
      const uploadedKey = await page.locator(postHiddenSelector).inputValue();
      console.log(`[Report/Browser] Скриншот загружен в ${postHiddenSelector}: ${uploadedKey}`);
    } else if (await page.locator('input[type="file"][name="img"]:visible').count()) {
      const proofPath = await captureProofScreenshot(browser, postId, postUrl);
      await page.locator('input[type="file"][name="img"]:visible').first().setInputFiles(proofPath);
      await page.waitForTimeout(4000);
    }

    // Подтверждаем токен ОРД (на скрытом/кастомном checkbox обычный .check() может падать outside viewport)
    const tokenCheckbox = page.locator('#post-is_ord_marker_approved, input[type="checkbox"][name="Post[is_ord_marker_approved]"], input[type="checkbox"][name="PostForm[is_ord_marker_approved]"]').first();
    if ((await tokenCheckbox.count()) && !(await tokenCheckbox.isChecked())) {
      await tokenCheckbox.check({ force: true }).catch(async () => {
        await tokenCheckbox.evaluate((el) => {
          el.checked = true;
          el.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
    }

    // Нажимаем кнопку отправки
    const submitBtn = page.locator(
      'button[name="Post[status]"][value="published"], button[type="submit"]:has-text("Внести публикацию"), button[type="submit"]:has-text("Внести скриншот"), button:has-text("Отправить на проверку")',
    ).first();
    if (!(await submitBtn.count())) {
      const curTitle = await page.title().catch(() => "");
      throw new Error(`Кнопка отправки отчёта не найдена на форме #${postId} (${page.url()} | ${curTitle})`);
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null),
      submitBtn.click(),
    ]);
    await page.waitForTimeout(1500);

    // Жёсткая проверка: если остались на форме /posts/update/<id> с ошибкой или невыбранным скрином — бросаем ошибку
    const finalUrl = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText || "");
    const stillUpdateUrl = finalUrl.includes(`/posts/update/${postId}`) || finalUrl.includes(`/posts/add-screenshot/${postId}`);
    if (stillUpdateUrl && /Исправьте следующие ошибки|Необходимо заполнить/i.test(bodyText)) {
      const snippet = bodyText.match(/Исправьте следующие ошибки:[\s\S]{0,200}/i)?.[0]?.replace(/\s+/g, " ")?.trim() || "ошибка валидации формы";
      throw new Error(`Perfluence отклонил форму поста #${postId}: ${snippet}`);
    }
    if (stillUpdateUrl && !/Опубликован|На проверке|В запланированные/i.test(bodyText)) {
      throw new Error(`Форма поста #${postId} не перешла в статус Опубликован (${finalUrl})`);
    }

    return { success: true, method: "playwright", postId, url: finalUrl };
  } finally {
    await browser.close();
  }
}

/**
 * Главная экспортируемая функция
 */
export async function submitReport(projectIdOrPostId, postUrl, options = { headless: true }) {
  let postId = null;

  // Если передан готовый postId или число больше 100000 (ID публикаций 8-значные)
  if (String(projectIdOrPostId).length >= 7) {
    postId = projectIdOrPostId;
  } else {
    console.log(`[Report] Поиск активной публикации для проекта #${projectIdOrPostId}...`);
    let found = await findPostForProject(projectIdOrPostId, TG_ACCOUNT_ID);

    // Если пост уже был опубликован или не найден — нажимаем «Повторить публикацию», чтобы открыть новый слот
    if (!found || found.status.includes("Опубликован")) {
      console.log(`[Report] Пост уже опубликован либо не найден. Нажимаем кнопку «Повторить публикацию»...`);
      await createOrRepeatPublication(projectIdOrPostId, TG_ACCOUNT_ID);
      const updated = await findPostForProject(projectIdOrPostId, TG_ACCOUNT_ID);
      if (updated) found = updated;
    }

    if (found) {
      postId = found.postId;
      console.log(`[Report] Найдена публикация #${postId} (статус: ${found.status})`);
    } else {
      console.warn(`[Report] Активная публикация для проекта #${projectIdOrPostId} не найдена в списке запланированных.`);
      // Попробуем сдать через URL проекта напрямую
    }
  }

  if (!postId) {
    throw new Error(`Не найден ID публикации для проекта #${projectIdOrPostId}`);
  }

  // Шаг 1: Пробуем быстрый HTTP-метод (+ при необходимости авто-дозагрузка скрина через /upload/image/post_screen)
  try {
    const res = await submitReportHttp(postId, postUrl, options);
    console.log(`[Report] ✓ Отчет по публикации #${postId} успешно отправлен в Perfluence!`);
    return res;
  } catch (httpErr) {
    console.warn(`[Report] HTTP-отправка не удалась (${httpErr.message}). Переход на браузер...`);
    return await submitReportPlaywright(postId, postUrl, options);
  }
}

// Запуск напрямую из CLI
if (process.argv[1]?.endsWith("perfluence-report.mjs")) {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val ? val.replace(/["']/g, "") : true;
    }
  }

  const target = args.postId || args.projectId;
  const postUrl = args.postUrl;

  if (target && postUrl) {
    submitReport(target, postUrl, { headless: args.headless !== "false" })
      .then(res => console.log("Результат:", res))
      .catch(err => {
        console.error("Ошибка:", err.message);
        process.exit(1);
      });
  } else {
    console.log("Использование: node scripts/perfluence-report.mjs --projectId=1341 --postUrl='https://t.me/smart_zakupka/50'");
  }
}
