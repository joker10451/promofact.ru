// Отправляет все URL из sitemap.xml в Яндекс/Bing через /api/indexnow (протокол IndexNow)
// Запуск: node scripts/indexnow-push.mjs [baseUrl]
const BASE = process.argv[2] || "https://promofact.ru";

async function main() {
  const sitemapUrl = `${BASE}/sitemap.xml`;
  const res = await fetch(sitemapUrl);
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urlList: batch }),
    });
    const j = await r.json().catch(() => ({}));
    sent += batch.length;
    console.log(`Пачка ${Math.floor(i / CHUNK) + 1}: ${r.status} ${JSON.stringify(j)}`);
  }
  console.log(`Готово. Отправлено URL: ${sent}/${urls.length}`);
}

main().catch((e) => {
  console.error("Ошибка IndexNow push:", e);
  process.exit(1);
});
