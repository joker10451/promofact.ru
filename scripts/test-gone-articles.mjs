/**
 * Проверяет, что удалённые статьи отдают 410, а не 404, и что список
 * удалённых не разошёлся с реальной базой статей.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./scripts/ts-loader.mjs', pathToFileURL('./'));

const { GONE_ARTICLE_SLUGS, isGoneArticle } = await import('@/lib/goneArticles');
const { ARTICLES } = await import('@/lib/articles');

console.log('='.repeat(70));
console.log('ПРОВЕРКА 410 GONE ДЛЯ УДАЛЁННЫХ СТАТЕЙ');
console.log('='.repeat(70));

// 1. Удалённых статей не должно остаться в базе — иначе 410 перекроет живую
//    страницу и она выпадет из индекса, хотя существует.
const revived = ARTICLES.filter((a) => GONE_ARTICLE_SLUGS.has(a.slug)).map((a) => a.slug);
assert.deepEqual(revived, [],
  `Эти статьи вернулись в базу, но остались в GONE_ARTICLE_SLUGS: ${revived.join(', ')}`);

// 2. Список не должен быть пустым или подозрительно маленьким
assert.ok(GONE_ARTICLE_SLUGS.size >= 30,
  `Ожидалось минимум 30 удалённых статей, найдено ${GONE_ARTICLE_SLUGS.size}`);

// 3. Никаких дублей в самом массиве (Set их схлопывает, проверяем исходник)
const source = fs.readFileSync(path.resolve('src/lib/goneArticles.ts'), 'utf-8');
const literal = source.split('new Set([')[1]?.split('])')[0] ?? '';
const listed = literal.split('\n').map((l) => l.trim().replace(/^"|",?$/g, '')).filter(Boolean);
assert.equal(listed.length, new Set(listed).size, 'В списке удалённых статей есть дубликаты');
assert.equal(listed.length, GONE_ARTICLE_SLUGS.size,
  `Список в файле (${listed.length}) расходится с Set (${GONE_ARTICLE_SLUGS.size})`);

// 4. Функция работает
assert.equal(isGoneArticle('kak-kopit-dengi'), true);
assert.equal(isGoneArticle('chto-takoe-promokod'), false);
assert.equal(isGoneArticle('nesushchestvuyushchiy-slug'), false);

// 5. HTTP 410 must be served by proxy before rendering; Next.js pages cannot return Response.
const pageSrc = fs.readFileSync(path.resolve('src/app/sovety/[slug]/page.tsx'), 'utf-8');
const proxySrc = fs.readFileSync(path.resolve('src/proxy.ts'), 'utf-8');
assert.ok(proxySrc.includes('isGoneArticle(goneMatch[1])'), 'Proxy must check removed article slugs');
assert.ok(proxySrc.includes('status: 410'), 'Proxy must return HTTP 410');
assert.ok(proxySrc.includes('"/sovety/:path*"'), 'Proxy matcher must cover removed articles');
assert.ok(pageSrc.includes('if (isGoneArticle(slug)) notFound();'), 'Page must have 404 fallback without returning Response');
assert.ok(!pageSrc.includes('return new Response('), 'Page must only return React nodes to pass Next.js build typing');

// 6. Удалённые статьи не должны попадать в sitemap и ленты
for (const file of ['src/app/sitemap.ts', 'src/app/rss.xml/route.ts', 'src/app/dzen.xml/route.ts']) {
  const src = fs.readFileSync(path.resolve(file), 'utf-8');
  assert.ok(!src.includes('GONE_ARTICLE_SLUGS'), `${file} не должен ссылаться на список удалённых`);
}
const sitemapSrc = fs.readFileSync(path.resolve('src/app/sitemap.ts'), 'utf-8');
assert.ok(sitemapSrc.includes('getArticles()'),
  'sitemap обязан брать статьи из getArticles(), а удалённые в неё не входят');

console.log(`\n✓ Удалённых статей: ${GONE_ARTICLE_SLUGS.size}`);
console.log('✓ Ни одна не вернулась в базу');
console.log('✓ 410 отдаётся до notFound()');
console.log('✓ Sitemap и ленты берут только живые статьи');
console.log('\n🎉 ТЕСТ 410 GONE ПРОЙДЕН\n');
