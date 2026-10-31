import assert from 'node:assert/strict';
import { getCustomCoupons } from '../src/lib/customCoupons.ts';
import { dedupeCoupons } from '../src/lib/dedupe.ts';

const custom = getCustomCoupons();
console.log(`Total active custom coupons: ${custom.length}`);

// 1. M.Kosmetik
const mk = custom.filter(c => c.store.slug === 'm-kosmetik');
console.log(`M.Kosmetik active coupons: ${mk.length}`);
const mkCodes = mk.map(c => c.promocode.code);
console.log(`M.Kosmetik codes:`, mkCodes);
assert.ok(mkCodes.includes('31OFGB3JRC'), '31OFGB3JRC must be present');
assert.ok(mkCodes.includes('Дождь'), 'Дождь must be present for M.Kosmetik');

// 2. Magnit
const magnit = custom.filter(c => c.store.slug === 'magnit-dostavka');
console.log(`Magnit active coupons: ${magnit.length}`);
const magnitCodes = magnit.map(c => c.promocode.code);
console.log(`Magnit codes:`, magnitCodes);
assert.ok(magnitCodes.includes('PFAD7EACMD'), 'PFAD7EACMD 40% flash must be present');

// 3. Yandex Flowers
const flowers = custom.filter(c => c.store.slug === 'yandeks-tsvety');
console.log(`Yandex Flowers active coupons: ${flowers.length}`);
const flowerCodes = flowers.map(c => c.promocode.code);
console.log(`Yandex Flowers codes:`, flowerCodes);
assert.ok(flowerCodes.includes('oxh702'), 'oxh702 40% bonus must be present');

// 4. PREMIER
const premier = custom.filter(c => c.store.slug === 'premier');
console.log(`PREMIER active coupons: ${premier.length}`);
const premier66 = premier.find(c => c.id === 826311005);
assert.ok(premier66, 'PREMIER 66 days offer must be present');
assert.equal(premier66.affiliate.link, 'https://premier.prfl.me/sites/pq53cm?erid=2RanyoLSJro');
assert.equal(premier66.affiliate.ordMarker, '2RanyoLSJro');

// 5. Dedupe check
const { coupons: deduped } = dedupeCoupons([{ source: 'custom', coupons: custom }]);
const flowersDeduped = deduped.filter(c => c.store.slug === 'yandeks-tsvety');
console.log('Flowers after dedupe:', flowersDeduped.map(c => c.promocode.code));
assert.equal(flowersDeduped.length, 2, 'Should have exactly 2 distinct flowers coupons after dedupe');

console.log('\n🎉 ALL OCT 31 LIVE PERFLUENCE OFFERS VERIFIED SUCCESSFULLY!');
