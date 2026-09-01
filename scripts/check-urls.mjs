async function checkUrl(url) {
  try {
    const t0 = Date.now();
    const res = await fetch(url, { redirect: "manual" });
    const ms = Date.now() - t0;
    const loc = res.headers.get("location");
    let info = `[${res.status}] (${ms}ms) ${url}`;
    if (loc) info += ` -> Redirect: ${loc}`;
    console.log(info);

    if (res.status === 200) {
      const text = await res.text();
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "No <title>";
      const h1Match = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, "").trim() : "No <h1>";
      console.log(`    Title: "${title}"`);
      console.log(`    H1:    "${h1}"`);
      console.log(`    Size:  ${text.length} bytes`);
    }
  } catch (e) {
    console.log(`[ERR] ${url}: ${e.message}`);
  }
}

async function run() {
  console.log("=== 1. Проверка schitay-online.ru ===");
  await checkUrl("https://schitay-online.ru/calc/ipoteka-sberbank-2026/");
  await checkUrl("https://schitay-online.ru/calc/ipoteka-sberbank-2026");
  await checkUrl("https://schitay-online.ru/");

  console.log("\n=== 2. Проверка promofact.ru (Категории и Подборки) ===");
  await checkUrl("https://promofact.ru/category/dostavka-produktov");
  await checkUrl("https://promofact.ru/category/dostavka-iz-restoranov");
  await checkUrl("https://promofact.ru/category/finansy-i-keshbek");
  await checkUrl("https://promofact.ru/collections/food-delivery");
  await checkUrl("https://promofact.ru/collections/first-order");
  await checkUrl("https://promofact.ru/collections/exclusive");

  console.log("\n=== 3. Проверка системных файлов и карт сайта ===");
  await checkUrl("https://promofact.ru/sitemap.xml");
  await checkUrl("https://promofact.ru/sitemap-images.xml");
  await checkUrl("https://promofact.ru/robots.txt");
}

run();
