import assert from 'node:assert/strict';
import { PERFLUENCE_OCT16_APPROVED_OFFERS, PERFLUENCE_OCT16_CODES } from '../src/lib/perfluenceOct16Offers.ts';
import { CUSTOM_COUPONS } from '../src/lib/customCoupons.ts';
import { getStoreExtra } from '../src/lib/storeExtras.ts';

console.log('--- Testing Oct 27 Updates ---');

// 1. ЛЭТУАЛЬ ШАНС vs УДАЧА
const letualCodes = PERFLUENCE_OCT16_CODES.letual;
assert.ok(letualCodes.includes('ШАНС'), 'ЛЭТУАЛЬ must contain ШАНС');
assert.ok(!letualCodes.includes('УДАЧА'), 'ЛЭТУАЛЬ must NOT contain УДАЧА');

const shansCoupon = PERFLUENCE_OCT16_APPROVED_OFFERS.find(c => c.store.slug === 'letual' && c.promocode.code === 'ШАНС');
assert.ok(shansCoupon, 'ШАНС coupon must exist in PERFLUENCE_OCT16_APPROVED_OFFERS');
assert.ok(shansCoupon.promocode.bonusName.includes('3 000 ₽'), 'Must mention 3 000 ₽');
assert.ok(shansCoupon.promocode.terms.includes('7 000 ₽'), 'Must mention 7 000 ₽');
console.log('✓ ЛЭТУАЛЬ ШАНС verified');

// 2. Пятёрочка Доставка
const pyaterochkaExtras = getStoreExtra('pyaterochka');
assert.ok(pyaterochkaExtras, 'Пятёрочка must have store extras');
assert.ok(pyaterochkaExtras.badge.includes('суммируются'), 'Must have summation badge');
assert.ok(pyaterochkaExtras.seoArticle.paragraphs.some(p => p.includes('суммируются')), 'Must mention summation');
console.log('✓ Пятёрочка суммирование verified');

// 3. Самокат
const samokatCoupons = CUSTOM_COUPONS.filter(c => c.store.slug === 'samokat');
assert.ok(samokatCoupons.length > 0, 'Samokat coupons must exist');
for (const c of samokatCoupons) {
  assert.ok(c.affiliate.ordText.includes('31.12.2026'), 'Samokat ordText must run through 31.12.2026');
}
console.log('✓ Самокат дисклеймер 31.12.2026 verified');

// 4. Randewoo
const randewooCoupon = CUSTOM_COUPONS.find(c => c.store.slug === 'randewoo' && c.promocode.bonusName.includes('55%'));
assert.ok(randewooCoupon, 'Randewoo flash coupon must exist');
console.log('✓ Randewoo flash verified');

console.log('\n🎉 ALL OCT 27 CHECKS PASSED!');
