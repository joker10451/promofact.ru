// Ежедневная проверка здоровья promofact.ru: магазины, sitemap, IndexNow.
// Запуск: node scripts/healthcheck.mjs [baseUrl]
// Выводит текстовый отчёт в stdout (его агент пересылает в чат).
const BASE = process.argv[2] || "https://promofact.ru";

// Магазины, пропажу которых надо сразу сообщать (высокочастотные запросы).
// Если они исчезли из sitemap — это повод обновить коды в Perfluence.
const CRITICAL = ["samokat", "riv-gosh", "sokolov-offline", "tanukifamily", "otello"];

async function httpStatus(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual" });
    return res.status;
  } catch {
    return 0;
  }
}

async function main() {
  const lines = [];
  lines.push(`🔍 Healthcheck ${BASE} — ${new Date().toLocaleString("ru-RU")}`);

  // 1. Sitemap
  const smRes = await fetch(`${BASE}/sitemap.xml`);
  if (!smRes.ok) {
    lines.push(`❌ sitemap.xml недоступен: ${smRes.status}`);
    console.log(lines.join("\n"));
    process.exit(0);
  }
  const xml = await smRes.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const stores = new Set(
    urls.map((u) => u.match(/store\/([^/]+)/)?.[1]).filter(Boolean),
  );
  const coupons = urls.filter((u) => /\/store\/[^/]+\/.+/.test(u)).length;
  const articles = urls.filter((u) => /sovety\//.test(u)).length;
  lines.push(
    `📊 Всего URL: ${urls.length} | магазинов: ${stores.size} | страниц купонов: ${coupons} | статей: ${articles}`,
  );

  // 2. Критичные магазины
  const missing = CRITICAL.filter((s) => !stores.has(s));
  if (missing.length) {
    lines.push(
      `⚠️ Пропали критичные магазины: ${missing.join(", ")} — пора пост+проверка в Perfluence`,
    );
  } else {
    lines.push(`✅ Все критичные магазины на месте`);
  }

  // 3. Быстрая проверка 3 случайных магазинов на 200
  const sample = [...stores].slice(0, 3);
  for (const s of sample) {
    const st = await httpStatus(`${BASE}/store/${s}`);
    if (st !== 200) lines.push(`⚠️ /store/${s} отвечает ${st}`);
  }

  // 4. IndexNow push (уведомляем Яндекс обо всех URL)
  try {
    const r = await fetch(`${BASE}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urlList: urls }),
    });
    const j = await r.json().catch(() => ({}));
    lines.push(`📡 IndexNow: ${r.status} ${JSON.stringify(j).slice(0, 120)}`);
  } catch (e) {
    lines.push(`⚠️ IndexNow не прошёл: ${e.message}`);
  }

  console.log(lines.join("\n"));
}

main();
