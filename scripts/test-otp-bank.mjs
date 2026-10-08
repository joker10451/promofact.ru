import assert from "node:assert";
import fs from "node:fs";
import crypto from "node:crypto";
import { getActivePromoBanners } from "../src/lib/promoBanners.ts";
import { getCoupons, getAllStores } from "../src/lib/perfluence.ts";

console.log("=== Тестирование оффера и баннера ОТП Банк (Дебетовая ОТП Карта) ===");

const publicImagePath = "public/images/otp-bank-debet-card.png";
const EXPECTED_IMAGE_SHA256 = "200bd9de78a2fd6d0641f4fee72eecc25e269c7aaee21641b5a105396c0fffa8";
const EXPECTED_IMAGE_SIZE = 5165180;

// 1. Проверка файла изображения в public/images
assert(fs.existsSync(publicImagePath), "Файл public/images/otp-bank-debet-card.png должен существовать");
const publicBuf = fs.readFileSync(publicImagePath);
assert.strictEqual(publicBuf.length, EXPECTED_IMAGE_SIZE, `Размер изображения должен быть ровно ${EXPECTED_IMAGE_SIZE} байт`);

const publicHash = crypto.createHash("sha256").update(publicBuf).digest("hex");
console.log("Image size:", publicBuf.length, "bytes");
console.log("Image SHA256:", publicHash);
assert.strictEqual(publicHash, EXPECTED_IMAGE_SHA256, "Изображение в public/images должно строго совпадать с эталонным SHA256");
console.log("✓ Подтверждено: байты изображения строго идентичны эталонному макету");

// 2. Проверка баннера
const banners = getActivePromoBanners({ storeSlug: "otp-bank" });
assert(banners.length > 0, "Должен быть активный баннер для otp-bank");
const banner = banners.find((b) => b.id === "otp-bank-debet-card-2026");
assert(banner, "Баннер otp-bank-debet-card-2026 должен существовать");
assert.strictEqual(banner.creativeOnly, true, "creativeOnly должно быть true для показа макета как есть");
assert.strictEqual(banner.image, "/images/otp-bank-debet-card.png", "Путь к изображению баннера должен совпадать");
assert(banner.exactCopy, "exactCopy должен присутствовать");
assert(banner.exactCopy.includes("Подарок за оформление дебетовой ОТП Карты!"), "exactCopy должен содержать заголовок акции");
assert(banner.exactCopy.includes("https://otpsert.prfl.me/sites/q3n058?erid=2RanynrNE1y"), "exactCopy должен содержать точную партнерскую ссылку");
assert(banner.exactCopy.includes("сертификат на 2000 ₽"), "exactCopy должен содержать сумму сертификата 2000 ₽");
assert(banner.exactCopy.includes("7708001614"), "exactCopy должен содержать ИНН 7708001614");
assert(banner.ordText && banner.ordText.includes("2RanynrNE1y"), "ordText должен содержать erid 2RanynrNE1y");
console.log("✓ Подтверждено: баннер активен, creativeOnly=true, exactCopy и маркировка ОРД корректны");

// 3. Проверка магазина и оффера в каталоге
const stores = await getAllStores();
const store = stores.find((s) => s.slug === "otp-bank");
assert(store, "Магазин otp-bank должен присутствовать в каталоге");

const coupons = await getCoupons();
const coupon = coupons.find((c) => c.store.slug === "otp-bank");
assert(coupon, "Оффер для otp-bank должен присутствовать в каталоге");
assert.strictEqual(coupon.affiliate?.ordMarker, "2RanynrNE1y", "Маркер ОРД купона должен быть 2RanynrNE1y");
assert(coupon.affiliate?.link.includes("2RanynrNE1y"), "Партнерская ссылка купона должна содержать erid");
console.log("✓ Подтверждено: магазин и оффер доступны в каталоге и привязаны к партнерской ссылке");

console.log("🎉 Все проверки оффера ОТП Банк успешно пройдены!");
