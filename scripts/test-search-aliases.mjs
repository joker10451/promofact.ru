import assert from "node:assert/strict";
import {
  matchStoreSearch,
  normalizeSearchTerm,
  convertKeyboardLayout,
  transliterateRuToEn,
  STORE_ALIASES,
} from "../src/lib/searchUtils.ts";

console.log("--- TEST: Brand Search Aliases & Transliteration ---");

// 1. Проверка RUTUBE
console.log("Test 1: RUTUBE search queries");
const rutube = { name: "RUTUBE", slug: "rutube", category: "Онлайн-кинотеатры" };
assert.ok(matchStoreSearch(rutube, "рутуб"), "рутуб must match RUTUBE");
assert.ok(matchStoreSearch(rutube, "рутьюб"), "рутьюб must match RUTUBE");
assert.ok(matchStoreSearch(rutube, "рутубе"), "рутубе must match RUTUBE");
assert.ok(matchStoreSearch(rutube, "rutube"), "rutube must match RUTUBE");
assert.ok(matchStoreSearch(rutube, "рутуб премиум"), "рутуб премиум must match RUTUBE");
assert.ok(matchStoreSearch(rutube, "видео"), "видео must match RUTUBE");
console.log("✓ Test 1 passed: RUTUBE matches ru/en/alias queries");

// 2. Проверка PREMIER
console.log("Test 2: PREMIER search queries");
const premier = { name: "PREMIER", slug: "premier", category: "Онлайн-кинотеатры" };
assert.ok(matchStoreSearch(premier, "премьер"), "премьер must match PREMIER");
assert.ok(matchStoreSearch(premier, "premier"), "premier must match PREMIER");
assert.ok(matchStoreSearch(premier, "премьер тв"), "премьер тв must match PREMIER");
console.log("✓ Test 2 passed: PREMIER matches ru/en queries");

// 3. Проверка Делимобиль & Ситидрайв (каршеринг)
console.log("Test 3: Carsharing search queries");
const delimobil = { name: "Делимобиль", slug: "delimobil", category: "Транспорт" };
const citydrive = { name: "Ситидрайв", slug: "citydrive", category: "Транспорт" };
assert.ok(matchStoreSearch(delimobil, "делимобиль"), "делимобиль must match Delimobil");
assert.ok(matchStoreSearch(delimobil, "delimobil"), "delimobil must match Delimobil");
assert.ok(matchStoreSearch(delimobil, "делик"), "делик must match Delimobil");
assert.ok(matchStoreSearch(delimobil, "каршеринг"), "каршеринг must match Delimobil");
assert.ok(matchStoreSearch(citydrive, "ситидрайв"), "ситидрайв must match Citydrive");
assert.ok(matchStoreSearch(citydrive, "citydrive"), "citydrive must match Citydrive");
assert.ok(matchStoreSearch(citydrive, "каршеринг"), "каршеринг must match Citydrive");
console.log("✓ Test 3 passed: Carsharing brands match correctly");

// 4. Проверка латинских брендов на кириллице
console.log("Test 4: Latin brands searched in Cyrillic");
const cozyHome = { name: "Cozy Home", slug: "cozy-home" };
const elementaree = { name: "Elementaree", slug: "elementaree" };
const geltek = { name: "Geltek", slug: "geltek" };
const poizon = { name: "Poizon", slug: "poizon" };
const carely = { name: "Carely", slug: "carely" };
const markFormelle = { name: "Mark Formelle", slug: "mark-formelle" };

assert.ok(matchStoreSearch(cozyHome, "кози хоум"), "кози хоум must match Cozy Home");
assert.ok(matchStoreSearch(cozyHome, "cozy home"), "cozy home must match Cozy Home");
assert.ok(matchStoreSearch(elementaree, "элементари"), "элементари must match Elementaree");
assert.ok(matchStoreSearch(elementaree, "elementaree"), "elementaree must match Elementaree");
assert.ok(matchStoreSearch(geltek, "гельтек"), "гельтек must match Geltek");
assert.ok(matchStoreSearch(geltek, "geltek"), "geltek must match Geltek");
assert.ok(matchStoreSearch(poizon, "пойзон"), "пойзон must match Poizon");
assert.ok(matchStoreSearch(poizon, "poizon"), "poizon must match Poizon");
assert.ok(matchStoreSearch(carely, "керли"), "керли must match Carely");
assert.ok(matchStoreSearch(carely, "carely"), "carely must match Carely");
assert.ok(matchStoreSearch(markFormelle, "марк формель"), "марк формель must match Mark Formelle");
assert.ok(matchStoreSearch(markFormelle, "mark formelle"), "mark formelle must match Mark Formelle");
console.log("✓ Test 4 passed: Cozy Home, Elementaree, Geltek, Poizon, Carely, Mark Formelle");

// 5. Проверка русских брендов, искомых на латинице/алиасам
console.log("Test 5: Cyrillic brands searched with Latin / keywords");
const yandexPlus = { name: "Яндекс Плюс", slug: "yandex-plus" };
const avito = { name: "Авито Путешествия", slug: "avito-puteshestviya" };
const tbank = { name: "Т-Банк Джуниор", slug: "t-bank-junior" };
const winlab = { name: "ВинЛаб", slug: "winlab" };
const podruzhka = { name: "Подружка", slug: "podruzhka" };

assert.ok(matchStoreSearch(yandexPlus, "плюс"), "плюс must match Яндекс Плюс");
assert.ok(matchStoreSearch(yandexPlus, "yandex plus"), "yandex plus must match Яндекс Плюс");
assert.ok(matchStoreSearch(avito, "авито"), "авито must match Авито Путешествия");
assert.ok(matchStoreSearch(avito, "avito"), "avito must match Авито Путешествия");
assert.ok(matchStoreSearch(tbank, "тинькофф"), "тинькофф must match Т-Банк Джуниор");
assert.ok(matchStoreSearch(tbank, "детская карта"), "детская карта must match Т-Банк Джуниор");
assert.ok(matchStoreSearch(tbank, "t-bank"), "t-bank must match Т-Банк Джуниор");
assert.ok(matchStoreSearch(winlab, "винлаб"), "винлаб must match ВинЛаб");
assert.ok(matchStoreSearch(winlab, "winlab"), "winlab must match ВинЛаб");
assert.ok(matchStoreSearch(podruzhka, "подружка"), "подружка must match Подружка");
assert.ok(matchStoreSearch(podruzhka, "podruzhka"), "podruzhka must match Подружка");
console.log("✓ Test 5 passed: Яндекс Плюс, Авито, Т-Банк Джуниор, ВинЛаб, Подружка");

// 6. Проверка fallback по названию магазина (когда slug пустой)
console.log("Test 6: Fallback when slug is empty");
assert.ok(matchStoreSearch({ name: "RUTUBE", slug: "" }, "рутуб"), "RUTUBE by name matches рутуб");
assert.ok(matchStoreSearch({ name: "Делимобиль", slug: "" }, "delimobil"), "Делимобиль by name matches delimobil");
assert.ok(matchStoreSearch({ name: "PREMIER", slug: "" }, "премьер"), "PREMIER by name matches премьер");
console.log("✓ Test 6 passed: Fallback by store name when slug is empty works");

// 7. Проверка транслитерации
console.log("Test 7: Phonetic transliteration helper");
assert.equal(transliterateRuToEn("рутуб"), "rutub");
assert.equal(transliterateRuToEn("делимобиль"), "delimobil");
assert.equal(transliterateRuToEn("вайлдберриз"), "vayldberriz");
console.log("✓ Test 7 passed: Transliteration helper works as expected");

console.log("\nALL SEARCH TESTS PASSED SUCCESSFULLY! 🎉");
