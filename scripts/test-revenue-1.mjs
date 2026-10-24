import assert from "node:assert/strict";
import fs from "node:fs";
import {
  normalizeAdmitadAction, aggregateAdmitadActions, revenueDateParam,
  verifyAdmitadPage, examinePerfluenceFeed, safePublicPreview,
  safeRevenueFailure,
} from "./revenue-1-core.mjs";

const base={
  action_id:101,advcampaign_id:28532,action_type:"sale",status:"approved",
  currency:"RUB",payment:"120.35",paid:0,subid:"store_coupon",subid2:"1032",
  subid3:"promofact",subid4:"private-click-id",order_id:"sensitive-order-id",
  promocode:"do-not-log-me",
};
const examples=[
  base,
  {...base,action_id:102,status:"pending",payment:"30.10",action_type:"lead",paid:0,subid3:null},
  {...base,action_id:103,status:"declined",payment:"20.00",paid:0},
  {...base,action_id:104,status:"approved_but_stalled",payment:"14.80",paid:0},
  {...base,action_id:105,status:"new_remote_state",payment:"9.99",paid:0},
  {...base,action_id:106,currency:"EUR",payment:7.10,paid:1},
  {...base,action_id:107,currency:"RUB",payment:-1.50,paid:1},
  base, // duplicate page record must not count twice
];
const clean=normalizeAdmitadAction(base);
assert.equal(clean.sourceTag,"promofact");
const personalCodeAction = normalizeAdmitadAction({
  ...base, action_id: 108, subid3: "PERSONAL_CODE_OVERRIDE",
  subid1: "promofact:store",
});
assert.equal(personalCodeAction.sourceTag,"promofact",
  "Personal coupon override of SubID3 must not erase publisher attribution");
const unrelatedAction = normalizeAdmitadAction({
  ...base, action_id: 109, subid3: "PERSONAL_CODE_OVERRIDE", subid1: "store",
});
assert.equal(unrelatedAction.sourceTag,"unattributed",
  "Old pageType-only SubID1 cannot by itself prove source");
assert.deepEqual(Object.keys(clean).sort(),[
  "campaignId","cents","currency","id","kind","paid","sourceTag","state",
].sort());
assert(!JSON.stringify(clean).includes("private-click-id"));
assert(!JSON.stringify(clean).includes("sensitive-order-id"));
assert(!JSON.stringify(clean).includes("do-not-log-me"));

const report=aggregateAdmitadActions(examples);
assert.deepEqual(Object.keys(report.currencies),["EUR","RUB"]);
assert.equal(report.currencies.RUB.actions,6);
assert.equal(report.currencies.RUB.sales,5);
assert.equal(report.currencies.RUB.leads,1);
assert.equal(report.currencies.RUB.approved,118.85);
assert.equal(report.currencies.RUB.pending,30.1);
assert.equal(report.currencies.RUB.declined,20);
assert.equal(report.currencies.RUB.stalled,14.8);
assert.equal(report.currencies.RUB.unknown,9.99);
assert.equal(report.currencies.RUB.taggedActions,5);
assert.equal(report.currencies.RUB.untaggedActions,1);
assert.equal(report.currencies.EUR.approved,7.1);
assert.equal(report.currencies.EUR.paidActions,1);
assert.equal(report.campaigns.length,2);
assert(!JSON.stringify(report).includes("private-click-id"));
assert.throws(()=>aggregateAdmitadActions([...examples,{
  ...base,action_id:101,status:"declined",
}]),/REVENUE_CONFLICTING_ACTION_ID/);
assert.throws(()=>normalizeAdmitadAction({...base,payment:"1 000 руб"}),
  /REVENUE_INVALID_AMOUNT/);
assert.throws(()=>normalizeAdmitadAction({...base,currency:""}),/REVENUE_INVALID_CURRENCY/);
assert.throws(()=>normalizeAdmitadAction({...base,action_id:undefined}),/REVENUE_INVALID_ACTION_ID/);
assert.throws(()=>normalizeAdmitadAction({...base,advcampaign_id:null}),/REVENUE_INVALID_CAMPAIGN/);
assert.equal(revenueDateParam("2026-10-16"),"16.10.2026");
assert.throws(()=>revenueDateParam("2026-02-30"),/REVENUE_INVALID_DATE/);
assert.throws(()=>revenueDateParam("2026-13-30"),/REVENUE_INVALID_DATE/);
assert.equal(verifyAdmitadPage({results:[base],_meta:{count:1}},100,0),1);
assert.throws(()=>verifyAdmitadPage({results:[],_meta:{count:1}},100,0),
  /REVENUE_PAGE_INCOMPLETE/);
assert.throws(()=>verifyAdmitadPage({results:[],_meta:{count:6000}},100,0),
  /REVENUE_INVALID_PAGE_META/);
assert.throws(()=>verifyAdmitadPage([{results:[]}],100,0),/REVENUE_INVALID_PAGE/);
assert.equal(examinePerfluenceFeed({data:[{fee:"150 ₽",promocode:"PRIVATE"}]})
  .approvedCommission,null);
assert.equal(examinePerfluenceFeed({data:[]}).paidCommission,null);
assert.throws(()=>examinePerfluenceFeed({data:null}),
  /REVENUE_PERFLUENCE_FEED_SCHEMA_UNKNOWN/);
const safe=JSON.stringify(safePublicPreview(report));
const suspiciousPaid=aggregateAdmitadActions([{...base,action_id:999,
  status:"pending",paid:1}]);
assert.equal(suspiciousPaid.currencies.RUB.paidActions,0,
  "Pending action must never count as a paid approved action");
assert(!safe.includes("118.85")&&!safe.includes("120.35")&&!safe.includes("1032"));
assert.equal(safeRevenueFailure(new Error("Unauthorized: Bearer abc-secret")),
 "REVENUE_UNEXPECTED_ERROR");

const runner=fs.readFileSync("scripts/revenue-1-preview.mjs","utf8");
const workflow=fs.readFileSync(".github/workflows/revenue-1-preview.yml","utf8");
assert.match(runner,/scopes:"statistics"/);
assert.match(runner,/statistics\/actions\//);
assert.match(runner,/searchParams\.set\("website",websiteId\)/);
assert.match(runner,/REVENUE_1_PRIVATE_REPORT/);
assert.match(runner,/GITHUB_ACTIONS !== "true"/);
assert.match(runner,/REVENUE_1_FAILED/);
assert.ok(!runner.includes("getSupabaseAdmin")&&!runner.includes("service_role"));
assert.match(workflow,/workflow_dispatch:/);
assert.ok(!workflow.includes("schedule:"));
assert.match(workflow,/REVENUE_1_PRIVATE_REPORT: 'false'/);
assert.ok(!workflow.includes("SUPABASE_SERVICE_ROLE_KEY"));
console.log("REVENUE-1: official statuses, dedupe, multi-currency, attribution, sensitive redaction and no-write gates PASS");
