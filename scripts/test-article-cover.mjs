import assert from "node:assert/strict";
import { articleCoverFacts } from "../src/lib/articleCover.ts";
import { getArticles } from "../src/lib/articles.ts";

const lavka = [{ text: "Промокоды Яндекс Лавки", href: "/store/yandeks-lavka" }];
assert.deepEqual(articleCoverFacts("Промокоды Яндекс Лавки: −50% на первый заказ", lavka), {
  store: { slug: "yandeks-lavka", name: "Яндекс Лавки" },
  benefit: "−50%",
});
assert.equal(articleCoverFacts("Скидки до 30% на анализы", []).benefit, "до 30%");
assert.equal(articleCoverFacts("Туту: 1 500 ₽ на отели", []).benefit, "1 500 ₽");
// Диапазоны целиком; дефис — не минус.
assert.equal(articleCoverFacts("Скидки 10–20% на всё", []).benefit, "10–20%");
assert.equal(articleCoverFacts("Скидки 10-20% на всё", []).benefit, "10-20%");
// Цифры без % или ₽ — не выгода.
assert.equal(articleCoverFacts("Промокоды Перекрёсток: 4 кода на октябрь 2026", lavka).benefit, null);
// Цена и призовой фонд — не выгода.
assert.equal(articleCoverFacts("Кинопоиск: 30 дней за 1 ₽", []).benefit, null);
assert.equal(articleCoverFacts("Розыгрыш СберПрайм: призы на 150 000 ₽", []).benefit, null);

// Ссылки не на магазин не превращаются в логотип.
assert.equal(articleCoverFacts("Советы", [{ text: "Все советы", href: "/sovety" }]).store, null);
assert.equal(articleCoverFacts("Купон FARFOR", [{ text: "Купон", href: "/store/farfor/ABC123" }]).store, null);
// Подборка с первой ссылкой на магазин не получает его логотип.
assert.equal(articleCoverFacts("Где выгодно купить подарки на Новый год 2027", [{ text: "Промокоды SUNLIGHT", href: "/store/sunlight-ru" }]).store, null);
// Магазин в списке после двоеточия — не предмет статьи.
assert.equal(articleCoverFacts("Лайфхаки шопинга на маркетплейсах: Ozon, Wildberries, Мегамаркет", [{ text: "Промокоды Мегамаркет", href: "/store/megamarket" }]).store, null);
// Несколько магазинов в предмете заголовка — без логотипа.
assert.equal(articleCoverFacts("Кинопоиск и Иви: подписки", [
  { text: "Промокоды Кинопоиск", href: "/store/kinopoisk" },
  { text: "Промокоды Иви", href: "/store/ivi" },
]).store, null);
// Список после двоеточия не мешает магазину из предмета.
assert.equal(articleCoverFacts("Промокоды Туту: отели, туры, авиа и ж/д билеты", [{ text: "Промокоды Туту", href: "/store/tutu" }]).store?.slug, "tutu");

// На живых статьях выгода всегда берётся только из заголовка.
for (const a of getArticles()) {
  const { benefit } = articleCoverFacts(a.title, a.related);
  if (benefit) assert.ok(a.title.replace(/[\s ]+/g, " ").includes(benefit), a.slug);
}
console.log("article cover ok");
