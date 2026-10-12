import assert from "node:assert/strict";
import { parseCampaignIds, validateRetainsActiveCampaigns } from "./check-admitad-sync-preflight.mjs";

assert.deepEqual([...parseCampaignIds("26110, 25224 ,28532")],["26110","25224","28532"]);
for (const invalid of ["","  ","26110,","26110,,25224","26110,26110","26110;25224","foo","26110, foo"]) {
  assert.throws(() => parseCampaignIds(invalid), /APPROVAL_LIST/);
}
const good = validateRetainsActiveCampaigns(
  "26110,25224,28532",["26110","25224","26110"],3,3,
);
assert.deepEqual(good,{approvedCount:3,retainedCampaignCount:2,activeRows:3});
assert.throws(() => validateRetainsActiveCampaigns("28532",["26110"],1,1),
  /PREVIOUSLY_ACTIVE_CAMPAIGN_EXCLUDED/);
assert.throws(() => validateRetainsActiveCampaigns("26110,28532",["26110"],1,2),
  /ACTIVE_SNAPSHOT_COUNT_MISMATCH/);
assert.throws(() => validateRetainsActiveCampaigns("26110",[""],1,1),
  /ACTIVE_CAMPAIGN_ID_INVALID/);
console.log("Admitad sync preflight unit tests PASS");
