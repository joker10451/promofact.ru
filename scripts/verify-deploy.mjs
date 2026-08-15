import https from "https";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://promofact.ru";

const ENDPOINTS_TO_CHECK = [
  "/",
  "/store/litres",
  "/store/tehnopark",
  "/store/librederm",
  "/store/vseinstrumenti-ru",
  "/store/justfood",
  "/store/plati-po-miru",
  "/manifest.webmanifest",
  "/sitemap.xml",
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          url,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          size: data.length,
          hasContent: data.length > 500,
        });
      });
    });

    req.on("error", (err) => {
      resolve({ url, status: 0, ok: false, error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ url, status: 408, ok: false, error: "Timeout" });
    });
  });
}

async function verifyDeployment(maxAttempts = 8, delayMs = 6000) {
  console.log(`\n🔍 Проверка статуса деплоя на Vercel (${BASE_URL})...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    process.stdout.write(`⏳ Попытка ${attempt}/${maxAttempts}: опрос ключевых страниц... `);

    const results = await Promise.all(
      ENDPOINTS_TO_CHECK.map((path) => checkUrl(`${BASE_URL}${path}`))
    );

    const failed = results.filter((r) => !r.ok);

    if (failed.length === 0) {
      console.log(`\n\n🎉 ДЕПЛОЙ УСПЕШНО ПОДТВЕРЖДЕН! Все ${results.length} страниц отвечают 200 OK.`);
      console.log("────────────────────────────────────────────");
      results.forEach((r) => {
        const path = r.url.replace(BASE_URL, "") || "/";
        console.log(`  ✓ 200 OK: ${path.padEnd(28)} (${Math.round(r.size / 1024)} KB)`);
      });
      console.log("────────────────────────────────────────────\n");
      return true;
    }

    if (attempt < maxAttempts) {
      console.log(`Vercel ещё собирает проект (ошибок: ${failed.length}). Ждём ${delayMs / 1000}с...`);
      await new Promise((r) => setTimeout(r, delayMs));
    } else {
      console.log(`\n⚠️ Внимание: после ${maxAttempts} попыток не все страницы ответили OK:`);
      failed.forEach((f) => console.log(`  ❌ ${f.url} — статус: ${f.status} (${f.error || "Не ответил"})`));
      return false;
    }
  }
}

verifyDeployment().then((ok) => {
  if (!ok) process.exit(1);
}).catch((e) => {
  console.error("Ошибка верификации:", e);
  process.exit(1);
});
