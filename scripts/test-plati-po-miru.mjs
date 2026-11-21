import assert from "node:assert";
import fs from "node:fs";
import crypto from "node:crypto";
import { getActivePromoBanners } from "../src/lib/promoBanners.ts";

console.log("=== Тестирование оффера и макета Плати по миру (Премиальная пластиковая карта) ===");

const publicImagePath = "public/images/plati-po-miru-premium-card.png";
const EXPECTED_IMAGE_SHA256 = "9b32db5ceaebc7bc5bc623da813b72b3fe81cd651a56a5c9c2a5a8619d1174d5";
const EXPECTED_IMAGE_SIZE = 8063286;

// 1. Портативная проверка файла изображения через эталонный SHA256 (без локальных абсолютных путей)
assert(fs.existsSync(publicImagePath), "Файл public/images/plati-po-miru-premium-card.png должен существовать");
const publicBuf = fs.readFileSync(publicImagePath);
assert.strictEqual(publicBuf.length, EXPECTED_IMAGE_SIZE, `Размер изображения должен быть ровно ${EXPECTED_IMAGE_SIZE} байт`);

const publicHash = crypto.createHash("sha256").update(publicBuf).digest("hex");
console.log("Image size:", publicBuf.length, "bytes");
console.log("Image SHA256:", publicHash);
assert.strictEqual(publicHash, EXPECTED_IMAGE_SHA256, "Изображение в public/images должно строго совпадать с эталонным SHA256");
console.log("✓ Подтверждено: байты изображения строго идентичны эталонному макету (SHA256 проверен портативно)");

// 2. Проверка баннера
const banners = getActivePromoBanners({ storeSlug: "plati-po-miru", now: Date.parse("2026-10-15T12:00:00+03:00") });
assert(banners.length > 0, "Должен быть активный баннер для plati-po-miru");
const banner = banners.find((b) => b.id === "plati-po-miru-premium-2026");
assert(banner, "Баннер plati-po-miru-premium-2026 должен существовать");
assert.strictEqual(banner.creativeOnly, true, "creativeOnly должно быть true для показа макета как есть");
assert.strictEqual(banner.image, "/images/plati-po-miru-premium-card.png", "Путь к изображению баннера должен совпадать");
assert.strictEqual(banner.code, "PFPLPCGN", "Код баннера должен быть PFPLPCGN");
assert(banner.exactCopy && banner.exactCopy.includes("PFPLPCGN"), "exactCopy должен содержать промокод PFPLPCGN");
assert(banner.exactCopy.includes("9703231520"), "exactCopy должен содержать ИНН 9703231520");
assert(banner.ordText && banner.ordText.includes("2RanynysXpw"), "ordText должен содержать erid 2RanynysXpw");
console.log("✓ Подтверждено: октябрьский баннер имел корректный макет, код и маркировку ОРД");

// 3. Кампания завершилась 31 октября: старый баннер не должен показываться в ноябре.
const afterExpiry = getActivePromoBanners({
  storeSlug: "plati-po-miru",
  now: Date.parse("2026-11-21T12:00:00+03:00"),
});
assert(!afterExpiry.some((b) => b.id === "plati-po-miru-premium-2026"),
  "Истёкший баннер не должен показываться после 31 октября");
console.log("✓ Подтверждено: истёкшая реклама не отображается после окончания кампании");

console.log("🎉 Архивная акция Плати по миру: даты и рекламный макет проверены!");
