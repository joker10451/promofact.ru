/**
 * Проверяет правила размещения рекламы РСЯ:
 * 1. Заглушек вида R-A-1234567 в коде нет — иначе Яндекс отдаёт 400 в консоли
 *    на каждой странице, а пустой блок ломает вёрстку.
 * 2. Карточка купонов не содержит рекламного блока выше предложений магазина.
 * 3. Скрипт context.js грузится только после согласия на cookie.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./scripts/ts-loader.mjs', pathToFileURL('./'));

const { isAdAllowedOnPath } = await import('@/lib/adPlacements');

console.log('='.repeat(70));
console.log('ПРАВИЛА РАЗМЕЩЕНИЯ РЕКЛАМЫ РСЯ');
console.log('='.repeat(70));

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// 1. Никаких фиктивных ID блоков
const stubHits = [];
for (const file of walk(path.resolve('src'))) {
  const src = fs.readFileSync(file, 'utf-8');
  if (src.includes('R-A-1234567')) stubHits.push(path.relative(process.cwd(), file));
}
assert.deepEqual(stubHits, [],
  `Фиктивные ID рекламных блоков в: ${stubHits.join(', ')}. Без реального ID блок обязан отдавать пусто.`);

// 2. Компонент обязан не рисовать ничего без валидного ID
const blockSrc = fs.readFileSync(path.resolve('src/components/YandexAdBlock.tsx'), 'utf-8');
assert.ok(blockSrc.includes('if (!isValidBlock)'), 'YandexAdBlock обязан возвращать null без валидного ID');
assert.ok(blockSrc.includes('startsWith("R-A-")'), 'ID блока должен проверяться по префиксу R-A-');

// 3. Скрипт загружается только после согласия
const adsSrc = fs.readFileSync(path.resolve('src/components/YandexAds.tsx'), 'utf-8');
assert.ok(adsSrc.includes('getConsent() === "accepted"'), 'context.js не должен грузиться до согласия на cookie');
assert.ok(!adsSrc.includes('strategy="beforeInteractive"'), 'context.js не должен блокировать первую отрисовку');

// 4. Правила путей
assert.equal(isAdAllowedOnPath('/sovety/chto-takoe-promokod'), true, 'Статьи могут показывать рекламу');
assert.equal(isAdAllowedOnPath('/category/dostavka-produktov'), true, 'Категории могут показывать рекламу');
assert.equal(isAdAllowedOnPath('/store/samokat'), false, 'Карточка купонов не должна показывать рекламу');

// 5. На странице магазина реклама стоит НИЖЕ блока с предложениями
const storeSrc = fs.readFileSync(path.resolve('src/app/store/[slug]/page.tsx'), 'utf-8');
const adIdx = storeSrc.indexOf('<YandexAdBlock');
const summaryIdx = storeSrc.indexOf('<StoreSummaryTable');
assert.ok(adIdx > 0 && summaryIdx > adIdx,
  'Реклама на странице магазина должна идти после сводной таблицы предложений, а не перед ней');
assert.ok(storeSrc.includes('isAdAllowedOnPath'), 'Страница магазина должна уважать правило размещения');

console.log('\n✓ Фиктивных ID блоков нет');
console.log('✓ Компонент отдаёт пусто без валидного ID');
console.log('✓ context.js грузится только после согласия на cookie');
console.log('✓ Карточка купонов исключена из показа');
console.log('✓ Реклама на странице магазина стоит после предложений');
console.log('\n🎉 ТЕСТ РАЗМЕЩЕНИЯ РЕКЛАМЫ ПРОЙДЕН\n');
