import assert from "node:assert/strict";
import { articleCoverFacts } from "../src/lib/articleCover.ts";
import { getArticles } from "../src/lib/articles.ts";

const store = [{ text: "Промокоды Яндекс Лавки", href: "/store/yandeks-lavka" }];
assert.deepEqual(articleCoverFacts("Промокоды Яндекс Лавки: −50% на первый заказ", store), {
  store: { slug: "yandeks-lavka", name: "Яндекс Лавки" },
  benefit: "−50%",
});
assert.equal(articleCoverFacts("Скидки до 30% на анализы", []).benefit, "до 30%");
assert.equal(articleCoverFacts("Туту: 1 500 ₽ на отели", []).benefit, "1 500 ₽");
// Цифры без % или ₽ — не выгода.
assert.equal(articleCoverFacts("Промокоды Перекрёсток: 4 кода на октябрь 2026", store).benefit, null);
// Ссылки не на магазин не превращаются в логотип.
assert.equal(articleCoverFacts("Советы", [{ text: "Все советы", href: "/sovety" }]).store, null);
assert.equal(articleCoverFacts("X", [{ text: "Купон", href: "/store/farfor/ABC123" }]).store, null);

// На живых статьях выгода всегда берётся только из заголовка.
for (const a of getArticles()) {
  const { benefit } = articleCoverFacts(a.title, a.related);
  if (benefit) assert.ok(a.title.replace(/[\s ]+/g, " ").includes(benefit), a.slug);
}
console.log("article cover ok");
// Подборка с первой ссылкой на магазин не получает его логотип.
assert.equal(articleCoverFacts("Где выгодно купить подарки на Новый год 2027", [{ text: "Промокоды SUNLIGHT", href: "/store/sunlight-ru" }]).store, null);
console.log("article cover store-in-title ok");
