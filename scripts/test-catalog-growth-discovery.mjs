import assert from "node:assert/strict";
import {summarizePublisherInventory,HOLD_REASONS} from "./catalog-growth-discovery.mjs";
const program=(id,status="active",connection_status="active")=>({id,status,connection_status});
const offer=(id,code,extra={})=>({
  campaign:{id},status:"active",promocode:code,
  date_start:"2026-10-01",date_end:"2026-10-31",
  goto_link:"https://affiliate.example/click?erid=REAL_MARKER",
  ...extra
});
const services={
  qualityGate:(c,p)=>({passed:c.status==="active"&&p.connection_status==="active"}),
  legalGate:c=>({eridStatus:c.noLegal?"MISSING":"PRESENT",
    legalInfoStatus:c.noLegal?"MISSING":"PRESENT",
    eridValue:c.noLegal?null:"REAL_MARKER"}),
  storeMapping:p=>({strategy:p.id===3?"UNMAPPED":"EXACT MATCH",
    canonicalSlug:p.id===3?"":"sample-shop"}),
};
const result=summarizePublisherInventory({
  programs:[program(1),program(2,"active","pending"),program(3)],
  coupons:[
    offer(1,"A"),
    offer(1,"A"), // repeated code: hold, not blindly duplicate
    offer(1,"B",{is_personal:true}),
    offer(1,"C",{date_end:"2026-10-12"}),
    offer(1,"D",{noLegal:true}),
    offer(1,"E",{goto_link:"https://affiliate.example/click?erid=wrong"}),
    offer(1,"F",{date_end:null}),
    offer(1,"G",{is_unique:true}),
    offer(1,"H",{exclusive:true}),
    offer(2,"I"),
    offer(3,"J"),
  ],...services,now:new Date("2026-10-13T12:00:00Z"),
  configuredAllowlist:["1"]
});
assert.equal(result.coupon_count,11);
assert.equal(result.technically_reviewable_for_manual_approval,1);
assert.equal(result.approved_for_publication,0);
assert.equal(result.db_writes,0);
assert.equal(result.publication_authorized,false);
assert.equal(result.top_programs[0].technically_reviewable,1);
assert.equal(result.top_programs[0].campaign_in_configured_allowlist,true);
assert.equal(result.hold_reason_counts.PERSONAL_OR_EXCLUSIVE,3);
assert.equal(result.hold_reason_counts.DUPLICATE_CODE_REVIEW,1);
assert.equal(result.hold_reason_counts.STORE_UNMAPPED,1);
assert.equal(result.hold_reason_counts.NO_EXPIRY_REVIEW,1);
assert.equal(result.hold_reason_counts.CONNECTION_INACTIVE,1);
assert.equal(result.hold_reason_counts.INVALID_DATES,1);
assert.equal(result.hold_reason_counts.AFFILIATE_OR_ERID_MISMATCH,2);
const str=JSON.stringify(result);
for(const secret of ["affiliate.example","REAL_MARKER","https://","promocode","api_secret_value"]) {
  assert.equal(str.includes(secret),false,"Report leaks restricted details");
}
assert.equal(HOLD_REASONS.length,9);
const empty=summarizePublisherInventory({programs:[],coupons:[offer(77,"TEST")],...services});
assert.equal(empty.unknown_campaign_offers,1);
assert.equal(empty.top_programs.length,0);
console.log("Catalog growth: classification, review-only, expiry, ERID, mapping, no-leak PASS");

import { matchesOfficialOrigin, prioritizePublicPrograms, PRIORITY_CANDIDATES } from "./catalog-growth-priority.mjs";
assert.equal(PRIORITY_CANDIDATES.length,3);
assert.equal(matchesOfficialOrigin("https://shop.megafon.ru/",["shop.megafon.ru"]),true);
assert.equal(matchesOfficialOrigin("https://shop.megafon.ru.evil.example/",["shop.megafon.ru"]),false);
assert.equal(matchesOfficialOrigin("http://shop.megafon.ru/",["shop.megafon.ru"]),false);
assert.equal(matchesOfficialOrigin("https://user:pass@shop.megafon.ru/",["shop.megafon.ru"]),false);
assert.equal(matchesOfficialOrigin("https://shop.megafon.ru:444/",["shop.megafon.ru"]),false);
assert.equal(matchesOfficialOrigin("https://www.globus.ru/",["globus.ru","www.globus.ru"]),true);
const latest=new Date("2026-10-13T13:00:00Z");
const connected=[
  {id:2402,status:"active",connection_status:"active",site_url:"https://shop.megafon.ru/"},
  {id:19773,status:"active",connection_status:"pending",site_url:"https://korston.ru/"},
  {id:19328,status:"active",connection_status:"active",site_url:"https://www.globus.ru/"}
];
const offers=[
  {campaign:{id:2402},promocode:"A",date_end:"2026-10-14",goto_link:"https://secret.example/click?erid=SENSITIVE"},
  {campaign:{id:2402},promocode:"A",date_end:"2026-10-12"},
  {campaign:{id:2402},promocode:"B",date_end:null},
  {campaign:{id:19773},promocode:"K",date_end:"2026-10-14"},
  {campaign:{id:19328},promocode:"G",date_end:"2026-10-13"},
];
const priority=prioritizePublicPrograms(connected,offers,latest);
assert.equal(priority[0].source_offers,3);
assert.equal(priority[0].date_end_not_past,1);
assert.equal(priority[0].no_expiry_date,1);
assert.equal(priority[0].unique_raw_code_values,2);
assert.equal(priority[0].official_origin_match,true);
assert.equal(priority[0].publisher_connected,true);
assert.equal(priority[0].publishable_now,0);
assert.equal(priority[1].publisher_connected,false);
assert.equal(priority[1].official_origin_match,true);
assert.equal(priority[2].date_end_not_past,1);
assert.equal(priority.every(p=>p.mapping_approved===false&&p.advertiser_coupon_placement_approved===false&&p.individual_coupon_ids_reviewed===false),true);
const wrongOrigin=prioritizePublicPrograms([
  {...connected[0],site_url:"https://shop.megafon.ru.evil.example"},
],offers,latest);
assert.equal(wrongOrigin[0].official_origin_match,false);
assert.equal(wrongOrigin[0].publishable_now,0);
const priorityJson=JSON.stringify(priority);
assert(!priorityJson.includes("secret.example"));
assert(!priorityJson.includes("SENSITIVE"));
assert(!priorityJson.includes("promocode"));
console.log("Priority program review: exact origin, date counts and no automatic approval PASS");
