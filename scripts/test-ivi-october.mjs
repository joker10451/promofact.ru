import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { getCustomCoupons } from "../src/lib/customCoupons.ts";
import { getActivePromoBanners } from "../src/lib/promoBanners.ts";

const code = "begrnta7swiz";
const link = "https://ivi1.prfl.me/sites/xpmis8?erid=2RanynVXhiB";
const marker = "2RanynVXhiB";
const now = new Date("2026-10-15T18:00:00+03:00").getTime();

const coupons = getCustomCoupons(now).filter(c => c.store.slug === "ivi");
assert.equal(coupons.length, 1, "Show one current Ivi editorial coupon");
const coupon = coupons[0];
assert.equal(coupon.promocode.code, code);
assert.equal(coupon.promocode.expires, "2026-12-31");
assert.equal(coupon.promocode.isFirstOrderOnly, true);
assert.equal(coupon.affiliate.link, link);
assert.equal(coupon.affiliate.ordMarker, marker);
assert.ok(coupon.affiliate.ordText.includes("erid: " + marker));
assert.ok(coupon.promocode.terms.includes("автоматически продлевается на 30 дней"));
assert.ok(coupon.promocode.terms.includes("банковской карты"));

const banners = getActivePromoBanners({storeSlug:"ivi",now}).filter(b => b.id === "ivi-35-days-2026");
assert.equal(banners.length, 1);
const banner = banners[0];
assert.equal(banner.code, code);
assert.equal(banner.link, link);
assert.equal(banner.creativeOnly, true);
assert.equal(banner.image, "/images/ivi-35-days-oct2026.webp");
assert.deepEqual([banner.imageWidth,banner.imageHeight],[1100,785]);
assert.equal(banner.endsAt, "2026-12-31");
assert.equal(banner.maxDisplayWidth,1100);
assert.ok(banner.ordText.includes("erid: " + marker));
assert.ok(banner.ordText.includes("автоматическое продление"));
for (const text of ["Околоточный","Монолог фармацевта","Адский шеф","Розы и грехи",
                   "begrnta7swiz","xpmis8?erid=2RanynVXhiB","банковской карты","18+"]) {
  assert.ok(banner.exactCopy.includes(text), "Ad copy missing: " + text);
}
assert.ok(!banner.exactCopy.includes("_____"), "No blank promo placeholder");

const path = "public/images/ivi-35-days-oct2026.webp";
const image = fs.readFileSync(path);
assert.equal(image.subarray(0,4).toString("ascii"),"RIFF");
assert.equal(image.subarray(8,12).toString("ascii"),"WEBP");
assert.ok(image.length > 20000 && image.length < 120000,
  "Original advertiser creative should be an optimized standalone WebP");
const digest = createHash("sha1")
  .update(Buffer.from("blob " + image.length + "\0")).update(image).digest("hex");
assert.equal(digest,"e91803006f3459213facaf178ab3b196a6bc403b",
  "Keep original supplied creative instead of replacing it with unrelated art");

const merged = fs.readFileSync("src/lib/perfluence.ts","utf8");
assert.ok(merged.includes('if (c.store.slug === "ivi")') &&
 merged.includes('c.promocode.code.trim().toLowerCase() === "begrnta7swiz"'),
 "An older static Perfluence snapshot may not reintroduce FILM35 or its old tracking link");
assert.ok(!banner.link.includes("source=js-widget"));
assert.ok(!coupon.promocode.code.toUpperCase().includes("FILM35"));
console.log("IVI OCTOBER 2026: original creative, rotated coupon, ERID, terms and safe old-code suppression PASS");
