# PromoFact — P2.4: Index Hygiene / LOW_DEMAND Full Audit

> Дата формирования аудита: 30 сентября 2026 г.
> Источники данных: исходные выгрузки Яндекс.Вебмастера (`promofact.ru_b3f3481c1eea9fc8b6753e32.csv` от 30.09.2026, обход `promofact.ru_796beb771f42a0af00090719.csv` от 29.09.2026), живой sitemap `https://promofact.ru/sitemap.xml` и прямой HTTP-скан продакшена `https://promofact.ru`.

---

## 1. Резюме и ключевая диагностика LOW_DEMAND

По данным актуальной выгрузки Яндекс.Вебмастера, статус **LOW_DEMAND** («Малополезная страница, некорректный HTTP-код или ошибка при обходе») на текущий момент зафиксирован для **156 уникальных URL** сайта.

Главные системные причины разметки LOW_DEMAND со стороны Яндекса:
1. **Исторические битые URL (80 из 156 — 51.3%):** 72 страницы отдают **HTTP 404**, 8 страниц отдают редиректы **HTTP 307/308**. Робот Яндекса помнит старые адреса с момента запуска сайта в августе 2026 года и продолжает попытки обхода. В выгрузке Вебмастера статус LOW_DEMAND объединяет как страницы с недостаточным контентом, так и несуществующие/ошибочные URL.
2. **Клоны и подстраницы магазинов (`/first-order`, `/repeat-order`, `/[code]`):** 51 URL в LOW_DEMAND. Страницы `/first-order` и `/repeat-order` дублировали каталог основного магазина и уже закрыты тегом `noindex, follow` (коммит `67807c7`), но Яндекс пока не вычистил их из исторического отчёта. Страницы одиночных купонов `/[code]` имеют `canonical -> /store/[slug]` и содержат ультра-тонкий контент.
3. **Информационные статьи `/sovety/[slug]` (34 URL):** содержат качественный авторский текст (>200 КБ разметки), но опубликованы без выраженного коммерческого спроса и без перелинковки с релевантными офферами, либо дублируют общие финансовые темы.
4. **Пустые разделы категорий и подборок (24 URL):** 9 категорий отдают 404 (старые ненормализованные слаги вроде `/category/dostavka-edy`), а 9 активных категорий и 6 подборок содержат 0 или 1 оффер из-за колебаний фида Perfluence.
5. **Городские гео-страницы (`/gorod/[city]`):** 4 страницы отдают одинаковый набор федеральных акций, не имея локальной дифференциации по городам.

---

## 2. Сводная таблица распределения LOW_DEMAND по типам URL

| Тип URL | Всего в LOW_DEMAND | HTTP 200 (Живые) | HTTP 404 (Битые) | HTTP 307/308 (Редирект) | В Sitemap | Вне Sitemap |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/store/[slug]` | 39 | 15 | 23 | 1 | 15 | 24 |
| `/sovety/[slug]` | 34 | 33 | 0 | 1 | 33 | 1 |
| `/store/[slug]/[code]` | 25 | 2 | 20 | 3 | 0 | 25 |
| `/category/[slug]` | 18 | 9 | 9 | 0 | 9 | 9 |
| `/store/[slug]/repeat-order` | 16 | 3 | 13 | 0 | 0 | 16 |
| `/store/[slug]/first-order` | 10 | 3 | 7 | 0 | 0 | 10 |
| `/collections/[slug]` | 6 | 6 | 0 | 0 | 6 | 0 |
| `/gorod/[city]` | 4 | 4 | 0 | 0 | 4 | 0 |
| `/actions/[slug]` | 3 | 0 | 0 | 3 | 0 | 3 |
| Другое (`/sitemap-html`) | 1 | 1 | 0 | 0 | 1 | 0 |
| **ИТОГО** | **156** | **76** | **72** | **8** | **68** | **88** |

---

## 3. Детальный аудит компонентов сайта

### 3.1. Store Subpages (`/first-order`, `/repeat-order`, `/[code]`)
- **Фактический статус:**
  - Из 51 страницы подтипов магазинов **40 страниц отдают HTTP 404** (так как магазины исчезли из фида или сменили слаги).
  - 8 страниц отдают HTTP 200: 3 страницы `/first-order` (Пятёрочка, Санлайт, Яндекс Маркет), 3 страницы `/repeat-order` (Кинопоиск, Плати по миру, Яндекс Маркет), 2 страницы `/[code]` (`/store/iv-roshe/YRNM290`, `/store/plati-po-miru/SALEADS2026`).
  - 3 страницы отдают редиректы 307/308.
- **Анализ уникальности:**
  - Подстраницы заказов полностью дублируют офферы родительской страницы `/store/[slug]`. Страница первого заказа Пятёрочки содержит ровно те же 0–1 купон, что и главная.
  - В коде метаданных (`src/app/store/[slug]/first-order/page.tsx` и `repeat-order/page.tsx`) уже прописано `robots: { index: false, follow: true }`. Они исключены из sitemap.xml.
  - Страницы купонов `/[code]` имеют `<link rel="canonical" href="https://promofact.ru/store/[slug]">`, но отдают `robots: index, follow` при полном отсутствии уникального контента кроме одного кода.
- **Источники внутренних ссылок:**
  - `/first-order` и `/repeat-order`: компонент `StoreIntentTabs.tsx` ссылается на них с каждой страницы магазина.
  - `/[code]`: компонент `HeaderSearch.tsx` ссылается на них в поисковой подсказке при клике на купон.

### 3.2. Неактивные магазины (`/store/[slug]`)
Из 39 магазинов в LOW_DEMAND:
- **Группа A (Известные бренды с временным окончанием офферов, 15 URL HTTP 200):**
  - Бренды: `yandex-eda`, `yandeks-lavka`, `yandeks-afisha`, `vkusvill-dostavka`, `magnit-dostavka`, `farfor`, `premier`, `cozy-home`, `irnby`, `librederm`, `yandex-plus`, `otello`, `riv-gosh`, `sokolov-offline`, `tehnopark`.
  - Страницы отдают 200 OK благодаря механизму `CORE_FALLBACK_STORES` в `perfluence.ts`. Они содержат брендовый контент, правила покупок и нейтральное состояние («Акции временно обновляются»).
  - **Стратегия:** **KEEP / IMPROVE**. Ни в коем случае не ставить 410 и не удалять. Это федеральные бренды с органическим спросом. Необходимо пополнять офферы через ручные промокоды или виджет.
- **Группа B (Устаревшие/удаленные магазины, 23 URL HTTP 404):**
  - Примеры: `/store/t-bank` (заменен на `t-bank-junior` / `t-puteshestviya-oteli`), `/store/yandex-travel` (заменен на `yandeks-puteshestviya`), `/store/alfa-bank`, `/store/kion-ru`, `/store/vtb`, `/store/contented`, `/store/superstep-ru`.
  - **Стратегия:** Для ключевых брендов с аналогами настроить точечный постоянный 301/308 редирект в `next.config.ts`. Для безнадежно ушедших офферов (например `contented`, `superstep-ru`) отдавать честный **410 Gone**, чтобы ускорить удаление из базы краулера Яндекса.

### 3.3. Географические страницы (`/gorod/`)
- В LOW_DEMAND попали 4 хабовых города: `/gorod/moskva`, `/gorod/spb`, `/gorod/samara`, `/gorod/ekaterinburg`.
- **Проблема генерации ценности:** При проверке выяснилось, что на страницах `/gorod/moskva/dostavka-produktov`, `/gorod/spb/dostavka-produktov` и `/gorod/samara/dostavka-produktov` выводится **абсолютно идентичный список предложений** (федеральные офферы без географической фильтрации).
- Робот Яндекса распознает это как гео-дорвеи (попытка размножить одну категорию на 9 городов без локального контента).
- В `sitemap.ts` уже внедрена защита: гео-категории добавляются только при `list.length >= 3`. Однако хабы городов `/gorod/[city]` присутствуют в sitemap и индексируются.
- **Стратегия:** **NEEDS REVIEW**. Не удалять 4 основных города, но наполнить уникальным гео-введением и локальными акциями; тонкие подкатегории городов держать закрытыми.

### 3.4. Категории и коллекции
- **Категории (18 URL в LOW_DEMAND):**
  - **9 URL отдают HTTP 404:** Это старые URL до внедрения таксономии (`/category/dostavka-edy`, `/category/finansy-i-banki`, `/category/krasota-i-kosmetika`, `/category/marketplejsy` и др.). В `categoryTaxonomy.ts` есть функция `canonicalCategorySlug`, но в `next.config.ts` не было прописано серверных 308 редиректов для старых путей, поэтому робот получает 404.
  - **9 URL отдают HTTP 200:** `/category/odezhda-i-obuv`, `/category/dostavka-produktov`, `/category/vse-dlya-doma`, `/category/elektronika-i-tehnika`, `/category/raznoe`, `/category/tsvety` и др. Они имеют статус LOW_DEMAND из-за малого числа активных купонов в момент последнего обхода.
- **Подборки (6 URL в LOW_DEMAND):**
  - Все 6 подборок отдают 200 OK (`first-order`, `food-delivery`, `exclusive`, `vecher-kino`, `krasota-i-parfyum`, `marketpleysy`). Они являются статическими агрегаторами. При снижении числа купонов в фиде страница выглядит тонкой.

### 3.5. Информационные статьи (`/sovety/[slug]`)
- В LOW_DEMAND находятся 34 статьи (все отдают 200 OK, кроме `/sovety/pyaterochka-dostavka-55`, отдающей 308).
- Объем контента каждой статьи превышает 200 КБ — это подробные лонгриды.
- **Причина LOW_DEMAND:** Яндекс оценивает коммерческий интент сайта как каталога скидок. Информационные статьи на общие темы (например, «Как экономить на ЖКХ», «Бюджет студента») не получают поисковых сигналов и кликов (CTR ~ 0), а внутренние ссылки на них идут только из сквозного блока футера и страницы `/sovety`.
- **Стратегия:** Статьи НЕ удалять. Разбить на когорты: статьи с привязкой к брендам (Озон, ВкусВилл, Лавка) снабдить активными виджетами промокодов; общеобразовательные статьи усилить перелинковкой на релевантные категории каталога.

### 3.6. Аудит Sitemap.xml
Анализ живого sitemap (`https://promofact.ru/sitemap.xml`, 265 URL):
- **Всего URL в sitemap:** 265.
- **SEARCHABLE в Вебмастере:** 54 URL.
- **LOW_DEMAND в Вебмастере:** 68 URL (33 статьи, 15 магазинов, 9 категорий, 6 подборок, 4 города, 1 html-sitemap).
- **Еще не вошли в выгрузку / обходятся:** 143 URL (преимущественно гео-категории `/gorod/[city]/[cat]`).
- **HTTP статус в sitemap:**
  - 264 URL отдают **HTTP 200**.
  - 1 URL отдает **HTTP 308**: `https://promofact.ru/category/knigi` (перенаправляет на `/category/onlayn-obrazovanie`).
- **Canonical:** Все 265 URL имеют self-canonical (расхождений нет).
- **Robots в sitemap:** Все 265 URL отдают `index, follow` (в sitemap нет `noindex` страниц).

---

## 4. Реестр всех 156 LOW_DEMAND URL

| URL | Тип | Статус Вебмастера | HTTP | Canonical | Robots Meta | В Sitemap | Офферов | Внутренние ссылки | Уникальность контента | Рекомендация | SEO Риск |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| `https://promofact.ru/actions/1-sentyabrya` | `/actions/[slug]` | LOW_DEMAND | 308 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (HTTP 308) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/actions/leto-2026` | `/actions/[slug]` | LOW_DEMAND | 308 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (HTTP 308) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/actions/puteshestviya` | `/actions/[slug]` | LOW_DEMAND | 308 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (HTTP 308) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/category/dostavka-edy` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/dostavka-produktov` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/dostavka-produktov` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/elektronika-i-tehnika` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/elektronika-i-tehnika` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/finansy-i-banki` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/finansy-i-keshbek` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/internet-magaziny` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/kino-i-teatr` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/krasota-i-kosmetika` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/marketplejsy` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/odezhda-i-obuv` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/odezhda-i-obuv` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/puteshestviya-i-turizm` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/puteshestviya-i-turizm` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/raznoe` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/raznoe` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/razvlecheniya` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/razvlecheniya` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/tsvety` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/tsvety` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/ukrasheniya` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/ukrasheniya` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/vse-dlya-doma` | `/category/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/category/vse-dlya-doma` | `index, follow` | YES | 0 | Header, MegaMenu, Footer | PARTIAL (Aggregator of brand coupons) | **IMPROVE (Core category hub, needs offers replenishment)** | HIGH |
| `https://promofact.ru/category/yuvelirnye-izdeliya` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/category/zootovary` | `/category/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **REDIRECT** | LOW |
| `https://promofact.ru/collections/exclusive` | `/collections/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/collections/exclusive` | `index, follow` | YES | 0 | Footer, VisualCategoryTiles | PARTIAL (Thematic collection) | **IMPROVE (Core collection hub, refresh active coupons)** | MEDIUM |
| `https://promofact.ru/collections/first-order` | `/collections/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/collections/first-order` | `index, follow` | YES | 0 | Footer, VisualCategoryTiles | PARTIAL (Thematic collection) | **IMPROVE (Core collection hub, refresh active coupons)** | MEDIUM |
| `https://promofact.ru/collections/food-delivery` | `/collections/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/collections/food-delivery` | `index, follow` | YES | 0 | Footer, VisualCategoryTiles | PARTIAL (Thematic collection) | **IMPROVE (Core collection hub, refresh active coupons)** | MEDIUM |
| `https://promofact.ru/collections/krasota-i-parfyum` | `/collections/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/collections/krasota-i-parfyum` | `index, follow` | YES | 0 | Footer, VisualCategoryTiles | PARTIAL (Thematic collection) | **IMPROVE (Core collection hub, refresh active coupons)** | MEDIUM |
| `https://promofact.ru/collections/marketpleysy` | `/collections/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/collections/marketpleysy` | `index, follow` | YES | 0 | Footer, VisualCategoryTiles | PARTIAL (Thematic collection) | **IMPROVE (Core collection hub, refresh active coupons)** | MEDIUM |
| `https://promofact.ru/collections/vecher-kino` | `/collections/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/collections/vecher-kino` | `index, follow` | YES | 0 | Footer, VisualCategoryTiles | PARTIAL (Thematic collection) | **IMPROVE (Core collection hub, refresh active coupons)** | MEDIUM |
| `https://promofact.ru/gorod/ekaterinburg` | `/gorod/[city]` | LOW_DEMAND | 200 | `https://promofact.ru/gorod/ekaterinburg` | `index, follow` | YES | 0 | Footer (8 top cities) | LOW (Repeats federal offers) | **NEEDS REVIEW (Geo doorway risk, needs unique local content)** | MEDIUM |
| `https://promofact.ru/gorod/moskva` | `/gorod/[city]` | LOW_DEMAND | 200 | `https://promofact.ru/gorod/moskva` | `index, follow` | YES | 0 | Footer (8 top cities) | LOW (Repeats federal offers) | **NEEDS REVIEW (Geo doorway risk, needs unique local content)** | MEDIUM |
| `https://promofact.ru/gorod/samara` | `/gorod/[city]` | LOW_DEMAND | 200 | `https://promofact.ru/gorod/samara` | `index, follow` | YES | 0 | Footer (8 top cities) | LOW (Repeats federal offers) | **NEEDS REVIEW (Geo doorway risk, needs unique local content)** | MEDIUM |
| `https://promofact.ru/gorod/spb` | `/gorod/[city]` | LOW_DEMAND | 200 | `https://promofact.ru/gorod/spb` | `index, follow` | YES | 0 | Footer (8 top cities) | LOW (Repeats federal offers) | **NEEDS REVIEW (Geo doorway risk, needs unique local content)** | MEDIUM |
| `https://promofact.ru/sitemap-html` | `другое (/sitemap-html)` | LOW_DEMAND | 200 | `https://promofact.ru/sitemap-html` | `index, follow` | YES | 0 | Footer | NO | **KEEP (HTML sitemap for users/bots)** | ZERO |
| `https://promofact.ru/sovety/besplatnye-uslugi-i-lgoty` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/besplatnye-uslugi-i-lgoty` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/byudzhet-dlya-studenta` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/byudzhet-dlya-studenta` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/cashbek-bankov-2026` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/cashbek-bankov-2026` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/cashbek-na-azs` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/cashbek-na-azs` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/chernaya-pyatnica-2026` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/chernaya-pyatnica-2026` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/chto-takoe-promokod` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/chto-takoe-promokod` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/deti-so-skidkoy` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/deti-so-skidkoy` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekonomia-na-puteshestviyah-avto` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekonomia-na-puteshestviyah-avto` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekonomim-na-apteke` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekonomim-na-apteke` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekonomim-na-dostavke-edy` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekonomim-na-dostavke-edy` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekonomim-na-kosmetike-i-parfyumerii` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekonomim-na-kosmetike-i-parfyumerii` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekonomim-na-puteshestviyah-i-biletah` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekonomim-na-puteshestviyah-i-biletah` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekonomim-na-svyazi` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekonomim-na-svyazi` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekonomim-na-zhkh` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekonomim-na-zhkh` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ekspress-dostavka-skidki` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ekspress-dostavka-skidki` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/kak-ekonomit-na-produktah` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/kak-ekonomit-na-produktah` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/kak-ekonomit-v-internete` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/kak-ekonomit-v-internete` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/kak-kopit-dengi` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/kak-kopit-dengi` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/keshbek-na-produkty` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/keshbek-na-produkty` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/laifhaki-shoppinga-na-marketpleysah` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/laifhaki-shoppinga-na-marketpleysah` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/ne-pereplychivat-na-rasprodazhah` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/ne-pereplychivat-na-rasprodazhah` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/podarochnye-sertifikaty-skidki` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/podarochnye-sertifikaty-skidki` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/podpiski-so-skidkoy` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/podpiski-so-skidkoy` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/promokody-na-taksi-i-karshering` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/promokody-na-taksi-i-karshering` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/promokody-na-tehniku` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/promokody-na-tehniku` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/promokody-ozon-2026` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/promokody-ozon-2026` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/pyaterochka-dostavka-55` | `/sovety/[slug]` | LOW_DEMAND | 308 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (HTTP 308) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/sovety/semnyy-byudzhet-10-privychek` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/semnyy-byudzhet-10-privychek` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/skidki-na-knigi` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/skidki-na-knigi` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/skidki-na-lekarstva` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/skidki-na-lekarstva` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/skidki-na-mebel-i-tovary-dlya-doma` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/skidki-na-mebel-i-tovary-dlya-doma` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/skidki-na-odezhdu-i-obuv` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/skidki-na-odezhdu-i-obuv` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/vozvrat-tovara-i-skidka` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/vozvrat-tovara-i-skidka` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/sovety/vybrat-vygodnyy-promokod` | `/sovety/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/sovety/vybrat-vygodnyy-promokod` | `index, follow` | YES | 0 | /sovety hub, LatestTips | YES (Unique editorial article) | **IMPROVE / MERGE (Editorial review, enhance commercial intent)** | MEDIUM |
| `https://promofact.ru/store/afisha-yandex-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/afisha-yandex-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/afisha-yandex-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/agni` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/alfa-bank` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/alfa-bank/ALFACASH` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/befree-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/colla-gen-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/contented` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/cozy-home` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/cozy-home` | `index, follow` | YES | 1 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/ebidoebi/BL7516PF` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/farfor` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/farfor` | `index, follow` | YES | 4 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/finn-flare-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/finn-flare-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/insperia-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/irnby` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/irnby` | `index, follow` | YES | 1 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/iv-roshe/YRNM290` | `/store/[slug]/[code]` | LOW_DEMAND | 200 | `https://promofact.ru/store/iv-roshe` | `index, follow` | NO | 0 | HeaderSearch | NO (Single coupon duplicate of store) | **REDIRECT / NOINDEX (Canonical points to parent store, remove link from HeaderSearch)** | LOW |
| `https://promofact.ru/store/justfood` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/kassir-ru` | `/store/[slug]` | LOW_DEMAND | 307 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (HTTP 307) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/store/kassir-ru/PPM165` | `/store/[slug]/[code]` | LOW_DEMAND | 307 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (Single coupon duplicate of store) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/store/kinopoisk/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 200 | `https://promofact.ru/store/kinopoisk/repeat-order` | `noindex, follow` | NO | 1 | StoreIntentTabs | NO (Subset/duplicate of store) | **NOINDEX (Already noindex, remove follow from StoreIntentTabs)** | LOW |
| `https://promofact.ru/store/kion-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/kion-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/kopirka-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/kopirka-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/kvantastika-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/lazurit-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/librederm` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/librederm` | `index, follow` | YES | 1 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/m-kosmetik-novoe-prilozhenie/KRF411A6JON6` | `/store/[slug]/[code]` | LOW_DEMAND | 308 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (Single coupon duplicate of store) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/store/m-kosmetik-novoe-prilozhenie/PK31A3MQY` | `/store/[slug]/[code]` | LOW_DEMAND | 308 | `(none)` | `index, follow` | NO | 0 | No direct nav | NO (Single coupon duplicate of store) | **REDIRECT (clean sitemap/links)** | ZERO |
| `https://promofact.ru/store/magnit-dostavka` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/magnit-dostavka` | `index, follow` | YES | 1 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/maksavit-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/maksavit-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/mirsushi-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/mongolshop-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/moretut` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/moretut/MORETUT` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/muzloto-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/netologiya` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/netprint/ALL30_6P3BRXJY` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/ochkarik-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/ochkarik-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/ochkarik-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/otello` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/otello` | `index, follow` | YES | 0 | Category, OtherStores, Search | NO | **KEEP (Neutral state, do not 410 known brands)** | MEDIUM |
| `https://promofact.ru/store/otello/HOCHU-D8AP` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/otp-bank` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/otp-bank/OTPBANK` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/pikabu-promokody-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/pikabu-promokody-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/plati-po-miru/SALEADS2026` | `/store/[slug]/[code]` | LOW_DEMAND | 200 | `https://promofact.ru/store/plati-po-miru` | `index, follow` | NO | 0 | HeaderSearch | NO (Single coupon duplicate of store) | **REDIRECT / NOINDEX (Canonical points to parent store, remove link from HeaderSearch)** | LOW |
| `https://promofact.ru/store/plati-po-miru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 200 | `https://promofact.ru/store/plati-po-miru/repeat-order` | `noindex, follow` | NO | 1 | StoreIntentTabs | NO (Subset/duplicate of store) | **NOINDEX (Already noindex, remove follow from StoreIntentTabs)** | LOW |
| `https://promofact.ru/store/premier` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/premier` | `index, follow` | YES | 1 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/pyaterochka/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 200 | `https://promofact.ru/store/pyaterochka/first-order` | `noindex, follow` | NO | 0 | StoreIntentTabs | NO (Subset/duplicate of store) | **NOINDEX (Already noindex, remove follow from StoreIntentTabs)** | LOW |
| `https://promofact.ru/store/riv-gosh` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/riv-gosh` | `index, follow` | YES | 0 | Category, OtherStores, Search | NO | **KEEP (Neutral state, do not 410 known brands)** | MEDIUM |
| `https://promofact.ru/store/riv-gosh/PFQ8W3XMT` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/riv-gosh/PFQ9GLR25` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/samokat/KID429RRLJ` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/seneca-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/skysmart-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/snapstick-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/sokolov-offline` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/sokolov-offline` | `index, follow` | YES | 0 | Category, OtherStores, Search | NO | **KEEP (Neutral state, do not 410 known brands)** | MEDIUM |
| `https://promofact.ru/store/sokolov-offline/T67AWWN8` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/start-ru/pf5m0tdcgqx` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/sunlight-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 200 | `https://promofact.ru/store/sunlight-ru/first-order` | `noindex, follow` | NO | 3 | StoreIntentTabs | NO (Subset/duplicate of store) | **NOINDEX (Already noindex, remove follow from StoreIntentTabs)** | LOW |
| `https://promofact.ru/store/superstep-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/t-bank` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/t-bank/TBANKBLACK` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/tanukifamily/15AV1474` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/tanukifamily/VA2231` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/tehnopark` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/tehnopark` | `index, follow` | YES | 0 | Category, OtherStores, Search | NO | **KEEP (Neutral state, do not 410 known brands)** | MEDIUM |
| `https://promofact.ru/store/tutoronline` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/vk-mesta` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/vk-mesta/VKMESTA` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/vkusvill-dostavka` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/vkusvill-dostavka` | `index, follow` | YES | 5 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/vseinstrumenti-ru/VSEINSTRUMENTI` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/vtb` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/vtb/VTBPRIVILEGE` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/winline-ru` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/winline-ru/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/winline-ru/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Subset/duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/yandeks-afisha` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/yandeks-afisha` | `index, follow` | YES | 5 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/yandeks-lavka` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/yandeks-lavka` | `index, follow` | YES | 4 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/yandex-eda` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/yandex-eda` | `index, follow` | YES | 3 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/yandex-eda/EDA20` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/yandex-market/first-order` | `/store/[slug]/first-order` | LOW_DEMAND | 200 | `https://promofact.ru/store/yandex-market/first-order` | `noindex, follow` | NO | 0 | StoreIntentTabs | NO (Subset/duplicate of store) | **NOINDEX (Already noindex, remove follow from StoreIntentTabs)** | LOW |
| `https://promofact.ru/store/yandex-market/repeat-order` | `/store/[slug]/repeat-order` | LOW_DEMAND | 200 | `https://promofact.ru/store/yandex-market/repeat-order` | `noindex, follow` | NO | 0 | StoreIntentTabs | NO (Subset/duplicate of store) | **NOINDEX (Already noindex, remove follow from StoreIntentTabs)** | LOW |
| `https://promofact.ru/store/yandex-plus` | `/store/[slug]` | LOW_DEMAND | 200 | `https://promofact.ru/store/yandex-plus` | `index, follow` | YES | 1 | Category, OtherStores, Search | YES (Brand store hub) | **IMPROVE (Keep index, optimize metadata, add FAQ)** | HIGH (Active commercial brand!) |
| `https://promofact.ru/store/yandex-plus/PLUS30` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |
| `https://promofact.ru/store/yandex-travel` | `/store/[slug]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (HTTP 404) | **410 / REDIRECT** | LOW |
| `https://promofact.ru/store/yandex-travel/TRAVEL15` | `/store/[slug]/[code]` | LOW_DEMAND | 404 | `(none)` | `index, follow` | NO | 0 | Legacy / dead link in crawler memory | NO (Single coupon duplicate of store) | **410 / NO ACTION** | ZERO |

---

## 5. Безопасный поэтапный план реализации (Implementation Plan)

### Wave 1: Очевидные технические ошибки и гигиена sitemap (Минимальный / нулевой риск)
- **Масштаб:** ~15–20 URL.
- **Действия:**
  1. Исправить ошибку в `src/app/sitemap.ts`: исключить редиректный слаг `category/knigi`, чтобы карта сайта отдавала только 200 OK.
  2. В `next.config.ts` добавить постоянные 308 редиректы для устаревших ненормализованных категорий, отдающих 404 (`/category/dostavka-edy` -> `/category/dostavka-produktov`, `/category/finansy-i-banki` -> `/category/raznoe`, `/category/krasota-i-kosmetika` -> `/category/kosmetika-i-parfyumeriya`, `/category/marketplejsy` -> `/category/marketpleysy` и др.).
  3. Добавить 308 редиректы для переименованных брендов (`/store/yandex-travel` -> `/store/yandeks-puteshestviya`, `/store/t-bank` -> `/store/t-bank-junior`).
- **SEO-риск:** **Нулевой**. Сохраняет поисковый вес и ликвидирует 404 ошибки краулера.
- **Rollback plan:** Откат правок в `next.config.ts` и `sitemap.ts` через git revert.

### Wave 2: Очистка краулингового бюджета от тонких дублей (Низкий риск)
- **Масштаб:** 51 URL (`/first-order`, `/repeat-order`, `/[code]`).
- **Действия:**
  1. В компоненте `StoreIntentTabs.tsx` убрать прямые ссылки `<Link href=...>` для вкладок `/first-order` и `/repeat-order`, заменив их на клиентскую фильтрацию или скрыв ссылки тегом `rel="nofollow"`.
  2. В `HeaderSearch.tsx` заменить ссылки на страницы одиночных купонов `/store/[slug]/[code]` на прямые ссылки на родительский магазин `/store/[slug]` с якорем или автокопированием.
  3. Для страниц одиночных купонов `src/app/store/[slug]/[code]/page.tsx` отдать `robots: { index: false, follow: true }` либо 301 на страницу магазина.
- **SEO-риск:** **Крайне низкий**. Эти страницы не приносят органического трафика и уже признаны Яндексом малополезными дублями.
- **Rollback plan:** Восстановление разметки ссылок в компонентах.

### Wave 3: Контентная реанимация и ручная оценка (Средний риск)
- **Масштаб:** 48 URL (34 статьи `/sovety/`, 15 ключевых магазинов без купонов, 4 города).
- **Действия:**
  1. **Магазины Группы A:** Никаких 410! Обогатить контентом: добавить блоки «Как получить скидку без промокода», кешбэк-советы, FAQ (по образцу PR #30) и альтернативные магазины из той же категории.
  2. **Статьи `/sovety/`:** Провести аудит по показам в Вебмастере. Статьи с нулевым потенциалом перелинковать с целевыми коммерческими категориями каталога.
  3. **Гео-страницы `/gorod/`:** Добавить локализованный контент для 4 ключевых городов, исключить дублирование федеральных подборок под видом региональных.
- **SEO-риск:** **Средний**. Требует поэтапного мониторинга в Вебмастере с шагом в 14 дней.
- **Rollback plan:** Сохранение структуры URL без удаления страниц.

---

**Аудит завершён. Изменения в кодовую базу и настройки продакшена НЕ вносились.**