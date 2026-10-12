import assert from "node:assert/strict";
import { compareCouponEridSources, inspectCouponErid } from "../src/lib/admitadEridDiagnostics.ts";

// API and dashboard use the same affiliate tracking route and coupon code,
// but the ERID may differ; this is NOT a stale DB cache.
const dashboard = "MvGzQC98w3Z1gMq1mSxTgEET";
const olderApi = "2bL9aMPo2e49hMef4rrUCgKjJQ";
const shared = {
  id: 942125,
  promocode: "TKPRDM-UYVG1GJO",
  goto_link: `https://dkfrh.com/g/va69o33134c7dde8999c9ebcee8c5e/?i=31&erid=${olderApi}`,
};
const list = {...shared, is_tracking_promo_code:true};
const detail = {...shared, is_tracking_promo_code:true};
const diff = compareCouponEridSources(list,detail,dashboard);
assert.equal(diff.listMatchesDashboard,false);
assert.equal(diff.detailMatchesDashboard,false);
assert.equal(diff.listMatchesDetail,true);
assert.equal(diff.sameTrackingRoute,true);
assert.equal(diff.sameCouponCode,true);
assert.equal(diff.listInternalConflict,false);
assert.equal(diff.detailInternalConflict,false);

const newApi = {...shared, goto_link:`https://dkfrh.com/g/va69o33134c7dde8999c9ebcee8c5e/?i=31&erid=${dashboard}`};
const switched = compareCouponEridSources(list,newApi,dashboard);
assert.equal(switched.listMatchesDetail,false);
assert.equal(switched.detailMatchesDashboard,true);
assert.equal(switched.sameTrackingRoute,true);

const same = compareCouponEridSources(newApi,newApi,dashboard);
assert.equal(same.listMatchesDetail,true);
assert.equal(same.listMatchesDashboard,true);
assert.equal(same.detailMatchesDashboard,true);

const internal = inspectCouponErid({...newApi, description:`Реклама. erid: ${olderApi}`});
assert.notEqual(internal.urlErid,internal.descriptionErid);
assert.equal(compareCouponEridSources({...newApi,description:`erid: ${olderApi}`},newApi,dashboard).listInternalConflict,true);

const missing=compareCouponEridSources(null,newApi,dashboard);
assert.equal(missing.list.found,false);
assert.equal(missing.listMatchesDetail,false);
assert.equal(inspectCouponErid({goto_link:"not-a-url"}).urlErid,null);
assert.equal(inspectCouponErid({goto_link:"https://example.com?foo=bar"}).urlErid,null);
console.log("ERID source comparison: separated dashboard, coupon list, coupon detail; drift checks PASS");
