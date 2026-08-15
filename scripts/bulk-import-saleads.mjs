import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || "").trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const TOKEN = process.env.SALEADS_API_TOKEN || "MWGsbY61i1pGZQQgSku1HPe58RTdg1wZyUBCV4Mo58kY7PGextvwiXWIWpPO0FdW";
const STAND_UUID = "0f94a390-98cd-11f1-8ca9-2f558d76c573";

const MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function translitName(input) {
  const lower = input.toLowerCase().trim();
  let out = "";
  for (const ch of lower) {
    if (MAP[ch]) out += MAP[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += "-";
  }
  return out.replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(25000),
      });
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function getAffiliateLink(offerUuid) {
  try {
    const res = await fetchWithRetry("https://saleads.pro/api/v1/connector/get-or-create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offer_uuid: offerUuid,
        stand_uuid: STAND_UUID,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const urlObj = (json.urls || [])[0];
    if (!urlObj) return null;
    return {
      url: urlObj.short_url || urlObj.url,
      erid: urlObj.short_url?.split("erid=")[1] || null,
    };
  } catch {
    return null;
  }
}

function detectCategory(name) {
  const n = name.toLowerCase();
  if (n.includes("книг") || n.includes("литрес") || n.includes("читай")) return { name: "Книги и образование", slug: "knigi-i-obrazovanie" };
  if (n.includes("косметик") || n.includes("librederm") || n.includes("красот") || n.includes("parfum")) return { name: "Красота и косметика", slug: "krasota-i-kosmetika" };
  if (n.includes("техно") || n.includes("инструмент") || n.includes("электроник") || n.includes("гаджет")) return { name: "Электроника и техника", slug: "elektronika-i-tehnika" };
  if (n.includes("еда") || n.includes("food") || n.includes("доставка") || n.includes("ресторан")) return { name: "Доставка еды", slug: "dostavka-edy" };
  if (n.includes("одежд") || n.includes("обув") || n.includes("мода") || n.includes("fashion")) return { name: "Одежда и обувь", slug: "odezhda-i-obuv" };
  if (n.includes("тур") || n.includes("путешеств") || n.includes("отел") || n.includes("билет")) return { name: "Путешествия и туризм", slug: "puteshestviya-i-turizm" };
  return { name: "Интернет-магазины", slug: "internet-magaziny" };
}

async function bulkImport() {
  console.log("🚀 Запуск массового импорта офферов из Saleads API...");
  
  const res = await fetchWithRetry("https://saleads.pro/api/v1/offer?limit=250", {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Saleads API error: ${res.status}`);
  const json = await res.json();
  const allOffers = json.data || [];
  console.log(`📦 Получено офферов из Saleads API: ${allOffers.length}`);

  // Фильтруем полезные B2C офферы
  const validOffers = allOffers.filter((o) => {
    if (o.status !== 1) return false;
    const n = o.name.toLowerCase();
    if (n.includes("займ") || n.includes("ки ") || n.includes("мфо") || n.includes("кредитн") || n.includes("рпп")) return false;
    return true;
  });

  console.log(`🎯 Качественных B2C предложений: ${validOffers.length}`);

  const customFile = path.join(ROOT_DIR, "src", "lib", "customCoupons.ts");
  let content = fs.readFileSync(customFile, "utf8");

  let addedCount = 0;
  let nextId = 50020;

  for (const offer of validOffers) {
    const cleanName = offer.name.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
    const slug = translitName(cleanName);
    if (!slug || slug.length < 2) continue;

    // Проверяем, есть ли уже на сайте
    if (content.includes(`slug: "${slug}"`) || content.includes(`name: "${cleanName}"`)) {
      continue;
    }

    console.log(`\n🔄 Подключаем [${cleanName}]...`);
    const affiliate = await getAffiliateLink(offer.uuid);
    if (!affiliate?.url) {
      console.log(`  ❌ Не удалось получить ссылку (требуется ручная модерация)`);
      continue;
    }

    const cat = detectCategory(cleanName);
    const goalPrice = offer.goals?.[0]?.price ? `Скидки и спецпредложения (выгода до ${Math.round(offer.goals[0].price)} ₽)` : `Скидки и акции в магазине ${cleanName}`;
    const domain = `${slug}.ru`;

    const block = `  {
    id: ${nextId},
    promocode: {
      id: ${nextId},
      code: "SALE",
      bonusName: "${goalPrice}",
      terms: "Действует на заказ в интернет-магазине ${cleanName} при переходе по специальной партнерской ссылке.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "saleads",
    },
    store: {
      id: ${nextId - 45000},
      name: "${cleanName}",
      slug: "${slug}",
      logo: "https://www.google.com/s2/favicons?domain=${domain}&sz=128",
      category: "${cat.name}",
      categorySlug: "${cat.slug}",
      about: "${cleanName} — популярный интернет-магазин с широким ассортиментом товаров, официальной гарантией и быстрой доставкой по всей России.",
      conditions: "Спецпредложение и скидка применяются автоматически при переходе по ссылке.",
      site: "${affiliate.url}",
      activeBloggers: 3500,
    },
    affiliate: {
      link: "${affiliate.url}",
      landingLink: "${affiliate.url}",
      ordMarker: "${affiliate.erid || ""}",
      ordText: "Реклама. erid: ${affiliate.erid || ""}",
    },
    extraLinks: [],
  },
];`;

    content = content.replace(/\];\s*$/, block);
    nextId++;
    addedCount++;
    console.log(`  ✅ [${cleanName}] добавлен на сайт (/store/${slug})`);

    // Ограничиваем порцию за один раз до 15-20 новых магазинов для стабильности
    if (addedCount >= 15) break;
  }

  if (addedCount > 0) {
    fs.writeFileSync(customFile, content, "utf8");
    console.log(`\n🎉 Успешно добавлено ${addedCount} новых магазинов в customCoupons.ts!`);
    
    console.log("🛠 Запуск проверки сборки...");
    execSync("node scripts/build-check.mjs", { cwd: ROOT_DIR, stdio: "inherit" });

    console.log("🚀 Коммитим и пушим в продакшн...");
    execSync(`git add src/lib/customCoupons.ts && git commit -m "feat(catalog): bulk import ${addedCount} top B2C offers from Saleads" && git push origin main`, {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });

    console.log("📡 Отправка обновленных URL в Яндекс и Bing (IndexNow)...");
    try {
      execSync("node scripts/indexnow-push.mjs", { cwd: ROOT_DIR, stdio: "inherit" });
    } catch {}

    console.log(`\n🏆 Массовый импорт завершен! Добавлено: ${addedCount} новых магазинов.`);
  } else {
    console.log("ℹ️ Все доступные офферы уже есть в каталоге.");
  }
}

bulkImport().catch(console.error);
