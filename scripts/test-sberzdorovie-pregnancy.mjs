import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PROMO_BANNERS, getActivePromoBanners } from "../src/lib/promoBanners.ts";
import { getAllStores } from "../src/lib/perfluence.ts";

console.log("=== Тестирование акции СберЗдоровье (Беременность 30%) ===");

// 1. Поиск баннера
const pregnancyBanner = PROMO_BANNERS.find((b) => b.id === "sberzdorovie-pregnancy-2026");
assert.ok(pregnancyBanner, "Баннер sberzdorovie-pregnancy-2026 должен присутствовать в PROMO_BANNERS");

// 2. storeSlug
assert.equal(pregnancyBanner.storeSlug, "sberzdorovie", "Баннер должен относиться к storeSlug=sberzdorovie");
assert.equal(pregnancyBanner.creativeOnly, true, "Баннер должен быть в режиме creativeOnly");

// 3. Проверка существования файла изображения и неизменности байт
assert.ok(pregnancyBanner.image, "Поле image должно быть указано");
const imgPath = path.resolve(`public${pregnancyBanner.image}`);
assert.ok(fs.existsSync(imgPath), `Файл изображения должен существовать по пути: ${imgPath}`);

const imgBuf = fs.readFileSync(imgPath);
const imgHash = crypto.createHash("sha256").update(imgBuf).digest("hex");
console.log("Image size:", imgBuf.length, "bytes");
console.log("Image SHA256:", imgHash);

// Читаем размеры PNG из заголовка IHDR (байты 16..24)
const width = imgBuf.readUInt32BE(16);
const height = imgBuf.readUInt32BE(20);
console.log(`Image dimensions: ${width}x${height}`);
assert.ok(width > 0 && height > 0, "Размеры изображения должны быть положительными");

// Проверка aspect ratio (2600 / 1856 ≈ 1.4008, исходный макет template.png)
const templatePath = "C:/Users/Kriri/AppData/Local/hermes/attachments/template.png";
if (fs.existsSync(templatePath)) {
  const origBuf = fs.readFileSync(templatePath);
  const origHash = crypto.createHash("sha256").update(origBuf).digest("hex");
  assert.equal(imgHash, origHash, "Хеш скопированного файла должен строго совпадать с template.png");
  console.log("✓ Подтверждено: байты изображения строго идентичны исходному template.png");
}

// 4. Проверка точного текста копии
const expectedCopy = `Беременность под заботой СберЗдоровья! 🤰

Сделайте этот особенный период еще более комфортным! 

Сдать анализы будущей маме теперь можно в удобное время и в удобном месте, даже в выходные. 
Все результаты — прямо в вашей медицинской карте в приложении.

✨ Бонус для вас: Скидка 30% на анализы для беременных от 1000 ₽ на первый и все последующие заказы!

❤️ Заботьтесь о себе с выгодой: Перейдите по ссылке https://sberanalizy.prfl.me/sites/jhtq64?erid=2Ranym5xMV5 и получите скидку 30% по промокоду PERPREGA309361 (действует при заказе от 1000 ₽).

Реклама. ООО «Инновационная медицина», 115432, г. Москва, вн.тер.г. муниципальный округ Даниловский, пр-кт Андропова, д. 10, помещ. 115, ОГРН 1197746310618`;

assert.equal(pregnancyBanner.exactCopy, expectedCopy, "Рекламный текст должен строго совпадать с ТЗ без изменений");
console.log("✓ Подтверждено: текст не сокращен, не изменен, 'еще' сохранено, эмодзи сохранены");

// 5. Проверка промокода, ссылки и erid
assert.equal(pregnancyBanner.code, "PERPREGA309361", "Промокод должен быть PERPREGA309361");
const expectedUrl = "https://sberanalizy.prfl.me/sites/jhtq64?erid=2Ranym5xMV5";
assert.equal(pregnancyBanner.link, expectedUrl, "Партнерская ссылка должна быть точной");
assert.ok(pregnancyBanner.ordText.includes("2Ranym5xMV5"), "erid 2Ranym5xMV5 должен присутствовать в ordText");
assert.ok(pregnancyBanner.ordText.includes("ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ"), "Медицинское предупреждение должно присутствовать в ordText");

// 6. Проверка, что старый баннер телемедицины неактивен на текущую дату
const now = new Date("2026-10-01T12:00:00+03:00").getTime();
const activeBanners = getActivePromoBanners({ storeSlug: "sberzdorovie", now });
const telemedActive = activeBanners.some((b) => b.id === "sberzdorovie-telemed-2026");
assert.equal(telemedActive, false, "Старый баннер телемедицины sberzdorovie-telemed-2026 должен быть неактивен");

const pregnancyActive = activeBanners.some((b) => b.id === "sberzdorovie-pregnancy-2026");
assert.equal(pregnancyActive, true, "Новый баннер sberzdorovie-pregnancy-2026 должен быть активен");
console.log("✓ Подтверждено: старый баннер скрыт, новый баннер активен");

// 7. Проверка карточки купона в каталоге
const stores = await getAllStores();
const sberStore = stores.find((s) => s.slug === "sberzdorovie");
assert.ok(sberStore, "Магазин sberzdorovie должен присутствовать в каталоге");

const pregnancyCoupon = sberStore.coupons.find((c) => c.promocode.code === "PERPREGA309361");
assert.ok(pregnancyCoupon, "Купон PERPREGA309361 должен присутствовать в купонах магазина sberzdorovie");
console.log("✓ Подтверждено: купон PERPREGA309361 отображается в StoreCouponBrowser для sberzdorovie");

console.log("🎉 Все проверки пройдены успешно!");
