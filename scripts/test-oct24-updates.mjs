import assert from 'node:assert';
import { CUSTOM_COUPONS } from '../src/lib/customCoupons.ts';
import { STABLE_STORES } from '../src/lib/stableStores.ts';
import { BRAND_REGISTRY, LOCAL_BRAND_ICONS } from '../src/lib/brandLogos.ts';
import { getStoreExtra } from '../src/lib/storeExtras.ts';

console.log('--- Testing Oct 24 Updates ---');

// 1. Netology
assert.ok(STABLE_STORES['netology'], 'Netology must exist in STABLE_STORES');
assert.equal(STABLE_STORES['netology'].slug, 'netology');
assert.equal(LOCAL_BRAND_ICONS['netology'], '/brands/netology.png');
assert.ok(BRAND_REGISTRY['netology'], 'Netology must exist in BRAND_REGISTRY');
assert.ok(getStoreExtra('netology'), 'Netology must have STORE_EXTRAS');

const netologyCoupon = CUSTOM_COUPONS.find(c => c.store.slug === 'netology' && c.promocode.code === 'NETOOCT65');
assert.ok(netologyCoupon, 'Netology NETOOCT65 coupon must exist in CUSTOM_COUPONS');
assert.ok(netologyCoupon.promocode.bonusName.includes('65%'), 'Must mention 65%');
assert.ok(netologyCoupon.promocode.terms.includes('ИИ') || netologyCoupon.promocode.terms.includes('нейросет'), 'Must mention neural networks');
console.log('✓ Netology verified');

// 2. Start.ru flash
const startCoupon = CUSTOM_COUPONS.find(c => c.store.slug === 'start-ru' && c.promocode.bonusName.includes('14 дней'));
assert.ok(startCoupon, 'Start.ru 14 days flash coupon must exist');
assert.ok(startCoupon.promocode.expires.startsWith('2026-10-25'), 'Start.ru flash expires Oct 25');
console.log('✓ Start.ru flash verified');

// 3. Cozy Home flash
const cozyCoupon = CUSTOM_COUPONS.find(c => c.store.slug === 'cozy-home' && c.promocode.code === '9ELP3D1G');
assert.ok(cozyCoupon, 'Cozy Home 9ELP3D1G coupon must exist');
assert.ok(cozyCoupon.promocode.expires.startsWith('2026-10-24'), 'Cozy Home flash expires Oct 24');
console.log('✓ Cozy Home flash verified');

// 4. SberHealth flash
const sberCoupon = CUSTOM_COUPONS.find(c => c.store.slug === 'sberzdorovie' && c.promocode.bonusName.includes('40%'));
assert.ok(sberCoupon, 'SberHealth 40% flash coupon must exist');
console.log('✓ SberHealth flash verified');

// 5. Yandex Travel flash
const yandexTravelCoupon = CUSTOM_COUPONS.find(c => c.store.slug === 'yandeks-puteshestviya' && c.promocode.bonusName.includes('20%'));
assert.ok(yandexTravelCoupon, 'Yandex Travel 20% flash coupon must exist');
console.log('✓ Yandex Travel flash verified');

// 6. Dodo Pizza extras
assert.ok(getStoreExtra('dodo-pizza'), 'Dodo Pizza must have STORE_EXTRAS');
assert.ok(getStoreExtra('dodo-pizza').seoArticle.paragraphs.some(p => p.includes('пауз')), 'Must note pause in Dodo');
console.log('✓ Dodo Pizza extras verified');

console.log('\n🎉 ALL OCT 24 CHECKS PASSED!');
