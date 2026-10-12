import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const banners = fs.readFileSync("src/lib/promoBanners.ts", "utf8");
const page = fs.readFileSync("src/app/akcii/detskaya-sberkarta-10000-500/page.tsx", "utf8");
const home = fs.readFileSync("src/components/SberKidsPromoHome.tsx", "utf8");
const main = fs.readFileSync("src/app/page.tsx", "utf8");
const campaignId = "sber-kids-card-10000-500-2026";
const imagePath = "public/images/sber-kids-card-10000-500-2026.png";
const affiliateUrl = "https://sberbank1.prfl.me/sites/3k82zh?erid=2RanykawDwy";
const rulesUrl = "https://www.sberbank.ru/common/img/uploaded/cards/sberkarta_kids/pravila_akcii_bonus_osen.pdf";

// Exact user-provided image bytes: no substitutions, regenerations or retouching.
const png = fs.readFileSync(imagePath);
assert.equal(crypto.createHash("sha256").update(png).digest("hex"), "f06ec1a1df7d4602bf2b00b5d44234a1761d20d8c47b22a861d665e0b950c349");
assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
assert.ok(banners.includes('image: "/images/sber-kids-card-10000-500-2026.png"'));
assert.equal(banners.split(`id: "${campaignId}"`).length - 1, 1);

for (const source of [banners]) {
  assert.ok(source.includes(affiliateUrl), "Real publisher URL and ERID remain intact");
  assert.ok(source.includes(rulesUrl), "Sber official draw rules link is present");
  assert.ok(source.includes("sber.certificate@perfluence.io"), "Certificate support contact exists");
  assert.ok(source.includes("ПАО Сбербанк"), "Advertiser disclosed");
  assert.ok(source.includes("7707083893"), "Advertiser INN disclosed");
  assert.ok(source.includes("2RanykawDwy"), "ERID disclosed");
  assert.ok(source.includes('startsAt: "2026-10-12"'));
  assert.ok(source.includes('endsAt: "2026-10-31"'));
  assert.ok(source.includes("10 000 бонусов не гарантированы"), "Avoid implying 10k prize is guaranteed");
}
assert.ok(page.includes("<PromoBanner banner={campaign} />"), "Unedited official image + exactCopy rendered");
assert.ok(page.includes("<CampaignExpiryGate endsAt={campaign.endsAt}>"), "Expiry time guard");
assert.ok(page.includes("${SITE_URL}${route}"), "Dynamic canonical follows actual path");
assert.ok(page.includes("robots: { index: false, follow: true }"), "Short-lived promo landing is noindex");
assert.ok(page.includes("от 2 000 ₽"), "Draw needs card funding");
assert.ok(home.includes("src={campaign.image}"), "Homepage uses same original creative");
assert.ok(home.includes('href="/akcii/detskaya-sberkarta-10000-500"'), "Homepage teaser opens landing");
assert.ok(home.includes("<CampaignExpiryGate endsAt={campaign.endsAt}>"), "Homepage expires client-side");
assert.ok(main.includes("<SberKidsPromoHome />"), "Homepage placement is wired");
for (const file of ["src/lib/customCoupons.ts", "src/lib/stableStores.ts"]) {
  assert.ok(!fs.readFileSync(file, "utf8").includes(campaignId), "Campaign must not create a fabricated coupon");
}
console.log("Sber Kids exact original PNG, affiliate ERID, legal copy, expiry and home/landing wiring PASS");
