import assert from "node:assert/strict";
import { ACTIONS, getAction } from "../src/lib/actions.ts";
import { getArticles } from "../src/lib/articles.ts";
import { isGoneArticle } from "../src/lib/goneArticles.ts";
import { COLLECTIONS } from "../src/lib/collections.ts";
import { CITIES_SEO } from "../src/lib/citiesSeo.ts";

console.log("================================================================================");
console.log("             SEO INDEXING & STRUCTURED DATA COMPREHENSIVE AUDIT                 ");
console.log("================================================================================");

// 1. Audit ACTIONS data integrity & FAQ completeness
console.log("1. Проверка сезонных акций и расширенных данных FAQ...");
const peakActions = ["den-shopinga-11-11", "chernaya-pyatnica-2026", "novogodnie-skidki-2027"];

for (const slug of peakActions) {
  const action = getAction(slug);
  assert(action, `Акция ${slug} должна существовать`);
  assert(action.title.length > 20, `Title акции ${slug} должен быть информативным (>20 символов)`);
  assert(action.description.length > 50, `Description акции ${slug} должен быть подробным (>50 символов)`);
  assert(action.faq && action.faq.length >= 3, `Акция ${slug} должна содержать минимум 3 FAQ вопроса для поисковых сниппетов (найдено: ${action.faq?.length})`);
  
  for (const item of action.faq) {
    assert(item.q.endsWith("?"), `Вопрос FAQ "${item.q}" должен заканчиваться знаком вопроса`);
    assert(item.a.length >= 30, `Ответ FAQ на "${item.q}" должен быть развёрнутым`);
  }
}
console.log("✓ [PASS] Все ключевые сезонные акции содержат валидные FAQ для сниппетов в поиске");

// 2. Audit Articles integrity & 410 protection
console.log("2. Проверка базы знаний и защиты удалённых статей...");
const articles = getArticles();
assert.equal(articles.length, 34, `Ожидается ровно 34 актуальных статей (найдено: ${articles.length})`);

for (const a of articles) {
  assert(!isGoneArticle(a.slug), `Статья ${a.slug} не должна быть в списке 410 Gone`);
  assert(a.faq && a.faq.length > 0, `Статья ${a.slug} должна содержать FAQ`);
}
console.log(`✓ [PASS] Все ${articles.length} статей валидны, содержат FAQ и изолированы от 410 Gone`);

// 3. Audit Collections coverage
console.log("3. Проверка подборок для индексации...");
assert(COLLECTIONS.length >= 8, "Должно быть не менее 8 тематических подборок");
const has1111Col = COLLECTIONS.some((c) => c.slug === "den-shopinga-11-11");
const hasBfCol = COLLECTIONS.some((c) => c.slug === "black-friday");
assert(has1111Col, "Подборка den-shopinga-11-11 обязана присутствовать");
assert(hasBfCol, "Подборка black-friday обязана присутствовать");
console.log(`✓ [PASS] Подборки 11.11 и Чёрной Пятницы активны и присутствуют в реестре`);

// 4. Audit Cities SEO
console.log("4. Проверка реестра городов...");
assert(CITIES_SEO.length >= 10, "Должно быть не менее 10 городов SEO");
console.log(`✓ [PASS] Реестр городов содержит ${CITIES_SEO.length} локаций`);

console.log("================================================================================");
console.log("🎉 ВСЕ ПРОВЕРКИ SEO ИНДЕКСАЦИИ И МИКРОРАЗМЕТКИ УСПЕШНО ПРОЙДЕНЫ! (100% PASS)");
console.log("================================================================================");
