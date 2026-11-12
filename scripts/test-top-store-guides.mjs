import assert from "node:assert/strict";
const { getStoreBuyerGuide } = await import("../src/lib/storeBuyerGuides.ts");

for (const slug of ["flowwow", "pyaterochka", "tanukifamily", "vazhnaya-ryba", "yandeks-tsvety", "dodo-pizza", "samokat", "yandeks-lavka", "perekrestok-dostavka", "fmart", "tutu", "farfor", "vkusvill-dostavka", "poizon", "m-kosmetik", "kinopoisk", "yandex-eda", "letual", "zolotoe-yabloko", "podruzhka"]) {
  const g = getStoreBuyerGuide(slug);
  assert(g, "Missing guide for " + slug);
  assert(g.intro.length > 95 && g.checks.length >= 3, "Guide too thin: " + slug);
  const text = g.intro + g.checks.map((c) => c.title + c.explanation).join(" ");
  // Codes, percentages and prices go stale: they live in the offer cards, not in static copy.
  assert(!/\b[A-Za-zА-Яа-я]{2,}\d{2,}\b|\d+\s?%|\d[\d\s]*₽/u.test(text), "Static guide must not hard-code codes or figures: " + slug);
}
console.log("Top store guides: no hard-coded codes or figures PASS");
