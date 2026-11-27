import assert from "node:assert/strict";
import { getAllStores } from "../src/lib/perfluence.ts";
import { LEGACY_STORE_REDIRECTS } from "../src/lib/legacyRedirects.ts";
import { carriesOverduePlacement } from "../src/lib/overduePlacements.ts";

assert.equal(LEGACY_STORE_REDIRECTS.sberbank, "/store/debetovaya-sberkarta",
  "Duplicate /store/sberbank must 301-redirect to canonical /store/debetovaya-sberkarta");

const stores = await getAllStores();
const sberkartaStore = stores.find((s) => s.slug === "debetovaya-sberkarta");
assert.ok(sberkartaStore && sberkartaStore.coupons.length >= 1, "Canonical debetovaya-sberkarta must exist in feed");
const sbercard = sberkartaStore.coupons[0];
assert.equal(sbercard.affiliate.ordMarker, "2RanykaY4Us");
assert.ok(sbercard.affiliate.link.includes("sberbank1.prfl.me/sites/7nue8j?erid=2RanykaY4Us"));
assert.ok(sbercard.affiliate.ordText.includes("erid: 2RanykaY4Us"));
assert.ok(sbercard.affiliate.ordText.includes("ПАО Сбербанк"));

const premierStore = stores.find((s) => s.slug === "premier");
assert.ok(premierStore && premierStore.coupons.length >= 1, "PREMIER must stay active from Perfluence feed");
for (const c of premierStore.coupons) {
  assert.equal(carriesOverduePlacement(c), false, "PREMIER feed offer must not use overdue ERID");
  assert.ok(c.affiliate.ordMarker && c.affiliate.ordText.includes(`erid: ${c.affiliate.ordMarker}`));
  assert.ok(c.affiliate.link.includes("/sites/"), `PREMIER site offer must use /sites/ link, got ${c.affiliate.link}`);
}
assert.ok(
  premierStore.coupons.some((c) => c.promocode.code === "yrgm69y3" && c.affiliate.ordMarker === "2RanymRJo7A"),
  "PREMIER must expose promofact.ru code yrgm69y3 with erid 2RanymRJo7A",
);
assert.ok(
  premierStore.coupons.some((c) => c.promocode.code === "" && c.affiliate.ordMarker === "2RanynPoPjz"),
  "PREMIER must expose promofact.ru 70-day link offer with erid 2RanynPoPjz",
);

console.log("SberCard (canonical) and PREMIER Perfluence feed ERID and legal checks PASS");
