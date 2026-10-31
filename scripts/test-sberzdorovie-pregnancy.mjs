import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PROMO_BANNERS, getActivePromoBanners } from "../src/lib/promoBanners.ts";
import { getAllStores, isApprovedPublicCouponPlacement } from "../src/lib/perfluence.ts";
import { SBER_ANALIZY_OCT29_OFFERS, isApprovedOct29SberAnalizyPlacement } from "../src/lib/perfluenceSberAnalizyOct29.ts";
import { withoutForbiddenSberAnalizyCreditCardCoPromotion } from "../src/lib/publisherPlacementRules.ts";
import { getCouponAudience } from "../src/lib/storeCouponAudience.ts";
import { buildStoreArticle } from "../src/lib/storeSeoContent.ts";

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
assert.equal(pregnancyActive, false, "Устаревший баннер беременности должен быть снят с публикации по уточнению владельца площадки");
console.log("✓ Подтверждено: исторический рекламный макет сохранён, но не публикуется");

// 7. Проверка карточки купона в каталоге
const stores = await getAllStores();
const sberStore = stores.find((s) => s.slug === "sberzdorovie");
assert.ok(sberStore, "Магазин sberzdorovie должен присутствовать в каталоге");

const expectedSberCodes = ["PERE7A4E5", "PERPREGT259702", "SPPA2EFFE", "PERPREGA309361", "SHD56E28", "SH40NOV0I6VB"];
assert.deepEqual(sberStore.coupons.map(c => c.promocode.code).sort(), expectedSberCodes.sort());
const approved = new Map(SBER_ANALIZY_OCT29_OFFERS.map(c => [c.promocode.code, c]));
assert.equal(approved.size, 3);
const pregnancyCoupon = approved.get("PERPREGA309361");
const analysesCoupon = approved.get("SHD56E28");
const flashCoupon = approved.get("SH40NOV0I6VB");
assert.ok(pregnancyCoupon && analysesCoupon && flashCoupon);
assert.match(pregnancyCoupon.promocode.bonusName, /30%.*первые и все повторные анализы для беременных/);
assert.match(analysesCoupon.promocode.bonusName, /20%.*анализы/);
assert.match(flashCoupon.promocode.bonusName, /40%.*анализы/);
assert.equal(pregnancyCoupon.promocode.expires, "2026-11-30T23:59:59+03:00");
assert.equal(analysesCoupon.promocode.expires, "2026-11-30T23:59:59+03:00");
assert.equal(flashCoupon.promocode.expires, "2026-11-01T23:59:59+03:00");
assert.equal(pregnancyCoupon.affiliate.link, "https://sberanalizy.prfl.me/sites/2gt5s4?erid=2RanyoFuJno");
assert.equal(analysesCoupon.affiliate.link, "https://sberanalizy.prfl.me/sites/n9dpk3?erid=2RanymSxzXD");
assert.equal(flashCoupon.affiliate.link, "https://sberanalizy.prfl.me/sites/ljtzj2?erid=2RanyoHPJ59");
for (const coupon of approved.values()) {
  assert.equal(coupon.affiliate.landingLink, coupon.affiliate.link);
  assert.equal(new URL(coupon.affiliate.link).searchParams.get("erid"), coupon.affiliate.ordMarker);
  assert.ok(coupon.affiliate.ordText.includes("ОГРН 1197746310618"));
  assert.ok(coupon.affiliate.ordText.includes("ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ"));
  assert.equal(isApprovedPublicCouponPlacement(coupon), true);
  assert.equal(isApprovedOct29SberAnalizyPlacement(coupon), true);
  assert.equal(isApprovedPublicCouponPlacement({ ...coupon, affiliate: { ...coupon.affiliate, link: "https://sberanalizy.prfl.me/sites/jhtq64?erid=2Ranym5xMV5" } }), false,
    "Историческая партнерская ссылка не должна восстановиться");
  assert.equal(isApprovedPublicCouponPlacement({ ...coupon, affiliate: { ...coupon.affiliate, ordMarker: "WRONG" } }), false);
}
const fakeCredit = { ...pregnancyCoupon, store: { ...pregnancyCoupon.store, slug: "kreditnaya-sberkarta", name: "Кредитная СберКарта" } };
const curated = withoutForbiddenSberAnalizyCreditCardCoPromotion([...SBER_ANALIZY_OCT29_OFFERS, fakeCredit]);
assert.ok(curated.some(c => c.store.slug === "kreditnaya-sberkarta"));
assert.equal(curated.some(c => ["PERPREGA309361", "SHD56E28", "SH40NOV0I6VB"].includes(c.promocode.code) && c.store.slug === "sberzdorovie"), false);
assert.equal(withoutForbiddenSberAnalizyCreditCardCoPromotion(SBER_ANALIZY_OCT29_OFFERS).length, 3);
console.log("✓ Три согласованных промокода с разными ссылками, проверкой маркировки и ограничением совместной рекламы");

const codes = new Map(sberStore.coupons.map(c => [c.promocode.code, c]));
assert.equal(getCouponAudience(codes.get("PERPREGT259702").promocode), "repeat-order");
assert.equal(getCouponAudience(codes.get("SPPA2EFFE").promocode), "repeat-order");
assert.equal(getCouponAudience(codes.get("PERPREGA309361").promocode), "repeat-order");
assert.equal(getCouponAudience(codes.get("SHD56E28").promocode), "unknown");
assert.equal(getCouponAudience(codes.get("PERE7A4E5").promocode), "unknown");
assert.equal(sberStore.coupons.filter(c => getCouponAudience(c.promocode) === "first-order").length, 0);
const article = buildStoreArticle({
  name: sberStore.name,
  category: sberStore.category,
  categorySlug: sberStore.categorySlug,
  coupons: sberStore.coupons.map(c => ({
    code: c.promocode.code, bonusName: c.promocode.bonusName, isBarcode: c.promocode.isBarcode,
  })),
  couponCount: sberStore.coupons.length,
  maxDiscount: "до 40%",
  isFirstOrder: false,
  activeBloggers: 0,
  monthYear: "Октябрь 2026",
  monthRu: "октябрь 2026",
  todayRu: "29 октября 2026",
}, "sberzdorovie").join("\n");
for (const code of expectedSberCodes) assert.ok(article.includes(code), `SEO must mention live code ${code}`);
assert.doesNotMatch(article, /витамины|БАДов|уменьшает сумму чека|вставьте код в корзину/iu);
assert.match(article, /медицинские анализы и онлайн-консультации/iu);
assert.match(article, /Имеются противопоказания, необходима консультация специалиста/);
const howTo = fs.readFileSync("src/components/HowToApply.tsx", "utf8");
const page = fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8");
assert(howTo.includes('variant === "sber-medical"'));
assert(page.includes('slug === "sberzdorovie" ? "sber-medical"'));
assert(page.includes('slug === "sberzdorovie" ? sberFaqItems'));
console.log("✓ СберЗдоровье: правильные ярлыки, все 6 кодов в SEO, отдельный медицинский FAQ и сценарий");

console.log("🎉 Все проверки пройдены успешно!");
