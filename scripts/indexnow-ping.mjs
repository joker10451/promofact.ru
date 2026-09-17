/**
 * scripts/indexnow-ping.mjs
 * 
 * Модуль мгновенного оповещения поисковых систем (Яндекс, Bing, IndexNow)
 * о публикации новых и обновленных промокодов, акций и страниц магазинов.
 * 
 * Использование в коде:
 *   import { pingIndexNow } from "./indexnow-ping.mjs";
 *   await pingIndexNow(["https://promofact.ru/store/start", "https://promofact.ru"]);
 * 
 * Использование из консоли:
 *   node scripts/indexnow-ping.mjs /store/start
 *   node scripts/indexnow-ping.mjs --all
 */

const HOST = "promofact.ru";
const BASE_URL = `https://${HOST}`;
const INDEXNOW_KEY = "c62c55b32f449cc4602687e29849f898";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

const ENDPOINTS = [
  "https://yandex.com/indexnow",
  "https://www.bing.com/indexnow",
  "https://api.indexnow.org/indexnow"
];

/**
 * Отправляет список URL в поисковые системы через протокол IndexNow
 * @param {string|string[]} urls - один URL или массив URL (относительные или абсолютные)
 * @returns {Promise<{ ok: boolean, sentUrls: string[], endpointResults: object[] }>}
 */
export async function pingIndexNow(urls) {
  const urlArray = Array.isArray(urls) ? urls : [urls];

  // Нормализация и фильтрация URL
  const cleanUrls = urlArray
    .map(u => {
      if (!u || typeof u !== "string") return null;
      let trimmed = u.trim();
      if (trimmed.startsWith("/")) trimmed = `${BASE_URL}${trimmed}`;
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        trimmed = `${BASE_URL}/${trimmed}`;
      }
      return trimmed;
    })
    .filter(u => u && (u.startsWith(`https://${HOST}`) || u.startsWith(`https://www.${HOST}`)));

  const uniqueUrls = [...new Set(cleanUrls)];

  if (uniqueUrls.length === 0) {
    return { ok: false, sentUrls: [], endpointResults: [], error: "No valid URLs for host " + HOST };
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: uniqueUrls
  };

  const results = await Promise.allSettled(
    ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return {
        endpoint,
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      };
    })
  );

  const endpointResults = results.map(r => 
    r.status === "fulfilled" ? r.value : { endpoint: "unknown", ok: false, error: r.reason?.message }
  );

  const successCount = endpointResults.filter(e => e.ok).length;
  const isOk = successCount > 0;

  return {
    ok: isOk,
    sentUrls: uniqueUrls,
    endpointResults
  };
}

/**
 * Отправляет все страницы из sitemap.xml
 */
export async function pingAllSitemapUrls() {
  console.log(`[IndexNow] Загрузка карты сайта ${BASE_URL}/sitemap.xml...`);
  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml?t=${Date.now()}`, {
      headers: { "Cache-Control": "no-cache" }
    });
    if (!res.ok) {
      console.error(`[IndexNow] Ошибка загрузки sitemap: HTTP ${res.status}`);
      return false;
    }
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    if (urls.length === 0) {
      console.error("[IndexNow] В sitemap.xml не найдено URL.");
      return false;
    }

    console.log(`[IndexNow] Найдено ${urls.length} URL. Отправка пачками по 200...`);
    const CHUNK_SIZE = 200;
    let sent = 0;

    for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
      const batch = urls.slice(i, i + CHUNK_SIZE);
      const resBatch = await pingIndexNow(batch);
      sent += batch.length;
      console.log(` -> Пачка ${Math.floor(i / CHUNK_SIZE) + 1}: ${resBatch.ok ? "✓ 200 OK" : "⚠ Ошибка"} (${sent}/${urls.length} URL)`);
    }

    console.log(`[IndexNow] 🎉 Все ${urls.length} страниц успешно переданы в поисковики!`);
    return true;
  } catch (err) {
    console.error("[IndexNow] Сбой отправки всей карты сайта:", err.message);
    return false;
  }
}

// Запуск напрямую из командной строки
if (process.argv[1]?.includes("indexnow-ping.mjs")) {
  const args = process.argv.slice(2);
  if (args.includes("--all") || args.includes("--sitemap")) {
    pingAllSitemapUrls();
  } else if (args.length > 0) {
    console.log(`[IndexNow] Отправка указанных URL...`);
    pingIndexNow(args).then(res => {
      console.log(`Результат (OK: ${res.ok}):`);
      res.sentUrls.forEach(u => console.log(`  ✓ ${u}`));
      res.endpointResults.forEach(e => console.log(`  [${e.endpoint}] HTTP ${e.status} (${e.statusText || e.error})`));
    });
  } else {
    console.log("Использование:");
    console.log("  node scripts/indexnow-ping.mjs /store/start");
    console.log("  node scripts/indexnow-ping.mjs https://promofact.ru/store/pyaterochka");
    console.log("  node scripts/indexnow-ping.mjs --all");
  }
}
