// Отправляет все URL из sitemap.xml в Яндекс/Bing через /api/indexnow (протокол IndexNow)
// Запуск: node scripts/indexnow-push.mjs [baseUrl]
import "./load-env.cjs";
const BASE = process.argv[2] || "https://promofact.ru";
const secret = process.env.INDEXNOW_SECRET || process.env.CRON_SECRET;

async function main() {
  if (!secret) throw new Error("INDEXNOW_SECRET or CRON_SECRET required");
  const sitemapUrl = `${BASE}/sitemap.xml?t=${Date.now()}`;
  const res = await fetch(sitemapUrl, { headers: { "Cache-Control": "no-cache" } });
  if (!res.ok) {
    console.error("Не удалось скачать sitemap:", res.status);
    process.exit(1);
  }
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) {
    console.error("В sitemap нет URL");
    process.exit(1);
  }

  // IndexNow принимает до 10000 URL за раз, но шлём пачками по 200 для надёжности
  const CHUNK = 200;
  let sent = 0;
  for (let i = 0; i < urls.length; i += CHUNK) {
    const batch = urls.slice(i, i + CHUNK);
    const r = await fetch(`${BASE}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ urlList: batch }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(`IndexNow rejected batch: HTTP ${r.status}`);
    sent += batch.length;
    console.log(`Пачка ${Math.floor(i / CHUNK) + 1}: ${r.status} ${JSON.stringify(j)}`);
  }
  console.log(`Готово. Отправлено URL: ${sent}/${urls.length}`);
}

main().catch((e) => {
  console.error("Ошибка IndexNow push:", e);
  process.exit(1);
});
