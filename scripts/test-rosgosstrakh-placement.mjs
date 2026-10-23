import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { STABLE_STORES } from '../src/lib/stableStores.ts';
import { LOCAL_BRAND_ICONS, BRAND_REGISTRY, getLocalBrandLogo } from '../src/lib/brandLogos.ts';
import { CUSTOM_COUPONS } from '../src/lib/customCoupons.ts';
import { getStoreExtra } from '../src/lib/storeExtras.ts';
import { COLLECTIONS } from '../src/lib/collections.ts';

console.log('================================================================================');
console.log('🚀 ТЕСТИРОВАНИЕ ИНТЕГРАЦИИ ПАРТНЕРА РОСГОССТРАХ (PERFLUENCE ID 4463)');
console.log('================================================================================\n');

// 1. Logo existence
const logoPath = path.resolve('./public/brands/rosgosstrakh.png');
assert.ok(fs.existsSync(logoPath), 'Файл логотипа public/brands/rosgosstrakh.png должен существовать');
assert.ok(fs.statSync(logoPath).size > 1000, 'Логотип должен быть корректным изображением > 1KB');
console.log('✓ 1. Логотип public/brands/rosgosstrakh.png существует и валиден (PASS)');

// 2. Brand registry & local logos
assert.strictEqual(getLocalBrandLogo('rosgosstrakh'), '/brands/rosgosstrakh.png');
assert.strictEqual(getLocalBrandLogo('rgs'), '/brands/rosgosstrakh.png');
assert.ok(BRAND_REGISTRY['rosgosstrakh'], 'BRAND_REGISTRY должен содержать rosgosstrakh');
assert.strictEqual(BRAND_REGISTRY['rosgosstrakh'].domain, 'rgs.ru');
console.log('✓ 2. Реестр брендов и маппинг иконок зарегистрированы (PASS)');

// 3. Stable store entry
const store = STABLE_STORES['rosgosstrakh'];
assert.ok(store, 'STABLE_STORES обязан содержать rosgosstrakh');
assert.strictEqual(store.id, 4463);
assert.strictEqual(store.slug, 'rosgosstrakh');
assert.strictEqual(store.name, 'Росгосстрах');
assert.strictEqual(store.categorySlug, 'servisy-i-podpiski');
assert.strictEqual(store.logo, '/brands/rosgosstrakh.png');
assert.ok(store.about && store.about.includes('Росгосстрах'), 'about должен быть заполнен');
assert.ok(store.conditions && store.conditions.includes('промокод'), 'conditions должны быть заполнены');
console.log('✓ 3. Метаданные магазина в STABLE_STORES верифицированы (PASS)');

// 4. Custom coupons placement
const rosgosCoupons = CUSTOM_COUPONS.filter(c => c.store.slug === 'rosgosstrakh');
assert.ok(rosgosCoupons.length >= 1, 'В CUSTOM_COUPONS должен быть минимум 1 купон Росгосстраха');
const coupon = rosgosCoupons.find(c => c.promocode.code === 'PF1V34P');
assert.ok(coupon, 'Купон с промокодом PF1V34P обязан присутствовать');
assert.strictEqual(coupon.affiliate.ordMarker, '2RanyknSz51');
assert.ok(coupon.affiliate.link.includes('rosgostravel.prfl.me/sites/4cawc2?erid=2RanyknSz51'));
assert.ok(coupon.affiliate.ordText.includes('2RanyknSz51') && coupon.affiliate.ordText.includes('7707067683'));
assert.strictEqual(coupon.promocode.expires, '2026-10-31');
console.log('✓ 4. Купон PF1V34P, трекинг и маркировка ERID подтверждены (PASS)');

// 5. SEO extras & FAQ
const extra = getStoreExtra('rosgosstrakh');
assert.ok(extra, 'storeExtras должен содержать rosgosstrakh');
assert.ok(extra.customTitle, 'Должен быть customTitle');
assert.ok(extra.customDescription, 'Должен быть customDescription');
assert.ok(Array.isArray(extra.faq) && extra.faq.length >= 3, 'Должен быть FAQ с 3+ вопросами');
console.log('✓ 5. SEO метаданные и FAQ покупателя проверены (PASS)');

// 6. Collections matching
const financeCol = COLLECTIONS.find(c => c.slug === 'finansy-i-karty');
assert.ok(financeCol && financeCol.filter(coupon), 'Купон Росгосстраха должен попадать в подборку "Банковские карты и финансы"');
const travelCol = COLLECTIONS.find(c => c.slug === 'vygodnye-oteli');
assert.ok(travelCol && travelCol.filter(coupon), 'Купон Росгосстраха должен попадать в подборку "Отели и путешествия"');
console.log('✓ 6. Фильтрация в подборках финансов и путешествий подтверждена (PASS)');

console.log('\n🎉 ВСЕ ТЕСТЫ ИНТЕГРАЦИИ РОСГОССТРАХ УСПЕШНО ПРОЙДЕНЫ!\n');
