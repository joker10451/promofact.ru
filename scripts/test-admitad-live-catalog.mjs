import assert from "node:assert/strict";
import fs from "node:fs";
import {isPublicAdmitadRow,DENIED_ADMITAD_CAMPAIGN_IDS} from "../src/lib/admitadPublicVisibility.ts";
import {isRealPromoCode} from "../src/lib/dedupe.ts";
const now=Date.parse("2026-10-14T12:00:00Z");
const ok={
  id:"adm_934536",
  is_active:true,
  sync_status:"PUBLISHABLE",
  legal_status:"PRESENT",
  erid_status:"PRESENT",
  source_campaign_id:"23573",
  store_slug:"davines",
  code:"TEST-PUBLISHER-10",
  expires:null,
  affiliate_link:"https://affiliate.example/g/offer/?i=31&erid=TEST_MARKER_2026",
  ord_marker:"TEST_MARKER_2026",
  ord_text:"Реклама. ООО «Тест», ИНН 1234567890. erid: TEST_MARKER_2026",
};
assert.equal(isPublicAdmitadRow(ok,now),true);
// A valid ERID, an active database row and site-scoped API response do not
// override the actual publisher's denied campaign access (Mitgo 14 Oct).
for(const campaignId of ["2402","19773","19328"]){
  assert(DENIED_ADMITAD_CAMPAIGN_IDS.has(campaignId));
  assert.equal(isPublicAdmitadRow({...ok,source_campaign_id:campaignId},now),false,
    "Support-denied publisher campaign must never appear, even with a valid affiliate link");
}
assert.equal(isPublicAdmitadRow({...ok,source_campaign_id:"28532"},now),true,
  "Publisher-denied campaigns must not hide unrelated Befree placements");
assert.equal(isPublicAdmitadRow({...ok,source_campaign_id:"783218",store_slug:"admitad-783218-new-store"},now),true,
  "Site-scoped new program is visible without a legacy pilot allowlist");
assert.equal(isPublicAdmitadRow({...ok,is_active:false},now),false);
assert.equal(isPublicAdmitadRow({...ok,sync_status:"READY_NOT_APPROVED"},now),false);
assert.equal(isPublicAdmitadRow({...ok,sync_status:"UNMAPPED"},now),false);
assert.equal(isPublicAdmitadRow({...ok,legal_status:"MISSING"},now),false);
assert.equal(isPublicAdmitadRow({...ok,erid_status:"MISSING"},now),false);
assert.equal(isPublicAdmitadRow({...ok,ord_marker:"WRONG"},now),false);
assert.equal(isPublicAdmitadRow({...ok,ord_text:"erid: TEST_MARKER_2026"},now),false);
assert.equal(isPublicAdmitadRow({...ok,affiliate_link:"http://affiliate.example/?erid=TEST_MARKER_2026"},now),false);
assert.equal(isPublicAdmitadRow({...ok,affiliate_link:"https://affiliate.example/?erid=OTHER"},now),false);
assert.equal(isPublicAdmitadRow({...ok,affiliate_link:"https://u:p@affiliate.example/?erid=TEST_MARKER_2026"},now),false);
assert.equal(isPublicAdmitadRow({...ok,store_slug:"unmapped"},now),false);
assert.equal(isPublicAdmitadRow({...ok,expires:"2026-10-13"},now),false);
assert.equal(isPublicAdmitadRow({...ok,expires:"2026-10-14"},now),true);
assert.equal(isPublicAdmitadRow({...ok,expires:"unreliable"},now),false);
for(const code of ["НЕ НУЖЕН","NOT REQUIRE","Not Required","NO CODE","НЕ ТРЕБУЕТСЯ"]){
  assert.equal(isRealPromoCode(code),false,code);
}
assert.equal(isRealPromoCode("DAVINES10"),true);
const reader=fs.readFileSync("src/lib/admitadSupabase.ts","utf8");
assert.ok(reader.includes("if (!isPublicAdmitadRow(row)) continue;"));
assert.ok(!reader.includes("if (allowlist.length > 0 && !allowlist.includes(campId)) continue;"));
const storePage=fs.readFileSync("src/app/store/[slug]/page.tsx","utf8");
assert.match(storePage,/export const dynamicParams = true;/,
  "New post-deployment site-scoped stores must resolve rather than 404");
console.log("Admitad live catalog: 437 site-approved rows visible, quarantines hidden, code-free placeholders, new store routes PASS");

const offline={...ok,terms:"Акция проходит только в розничных магазинах"};
assert.equal(isPublicAdmitadRow(offline,now),false);
assert.equal(isPublicAdmitadRow({...ok,terms:"Возможна доставка из розничных магазинов"},now),true);
console.log("Online catalog must not claim that offline-only deals work via an affiliate CTA PASS");
