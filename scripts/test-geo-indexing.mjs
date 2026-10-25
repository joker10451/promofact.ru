import assert from "node:assert/strict";
import { selectGeoOffers } from "../src/lib/geoIndexing.ts";

const offer = (region, categorySlug = "onlayn-kinoteatry") => ({
  store: { categorySlug }, promocode: { region },
});
const national = ["", "ru", "россия", " Вся Россия ", "РФ"].map(r => offer(r));
assert.equal(selectGeoOffers(national, "Москва").offers.length, 5);
assert.equal(selectGeoOffers(national, "Москва").indexable, false);
const local = [...national, offer("Москва, Казань")];
assert.equal(selectGeoOffers(local, "Москва").indexable, true);
assert.equal(selectGeoOffers(local, "Казань").local.length, 1);
assert.equal(selectGeoOffers(local, "Самара").indexable, false);
assert.equal(selectGeoOffers([offer("Москва")], "Москва").indexable, false);
assert.equal(selectGeoOffers([...national, offer("Новая Москва")], "Москва").indexable, true);
assert.equal(selectGeoOffers([...national, offer("Москваленд")], "Москва").indexable, false);
assert.equal(selectGeoOffers(local, "Москва", "dostavka-produktov").offers.length, 0);
assert.equal(selectGeoOffers([...national, offer("Санкт-Петербург")], "Санкт-Петербург").indexable, true);
console.log("Geo indexing: national duplicates excluded, local offers preserved, region boundaries checked");
