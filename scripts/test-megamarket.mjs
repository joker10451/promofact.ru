import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const envLocalPath = path.resolve(".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { getCoupons, getAllStores } = await import("@/lib/perfluence");

console.log("=== Проверка промокодов Мегамаркет CPA ===");

const coupons = await getCoupons();
const megaCoupons = coupons.filter(c => c.store.slug === "megamarket");

console.log(`Найдено активных купонов Мегамаркет: ${megaCoupons.length}`);
assert(megaCoupons.length >= 1, "Должен быть минимум 1 активный промокод Мегамаркета");

const codes = megaCoupons.map(c => c.promocode.code.toLowerCase());
console.log("Коды купонов:", codes);

assert(codes.includes("prf1"), "Промокод PRF1 должен присутствовать");

for (const c of megaCoupons) {
  assert(c.affiliate.link && c.affiliate.link.includes("megamarket1.prfl.me"), `Купон ${c.promocode.code} должен содержать корректную партнерскую ссылку`);
  assert(c.affiliate.ordMarker, `Купон ${c.promocode.code} должен иметь erid маркировку`);
  console.log(`✓ Купон ${c.promocode.code}: ${c.promocode.bonusName}, erid ${c.affiliate.ordMarker}, действует до ${c.promocode.expires}`);
}

const stores = await getAllStores();
const megaStore = stores.find(s => s.slug === "megamarket");
assert(megaStore, "Магазин megamarket должен присутствовать в каталоге");
assert(megaStore.coupons.length >= 1, "Количество купонов магазина должно быть >= 1");
console.log(`✓ Магазин ${megaStore.name} найден в категории ${megaStore.category} (${megaStore.categorySlug}) с ${megaStore.coupons.length} купонами`);

console.log(" Все проверки промокодов Мегамаркет CPA успешно пройдены!");
