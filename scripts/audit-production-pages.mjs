/**
 * Read-only browser audit against ACTUAL production, never local E2E fixtures.
 * Does not click affiliate links, copy codes, or submit orders.
 * Run with: node scripts/audit-production-pages.mjs
 */
import {chromium} from "playwright";
import fs from "node:fs";
import path from "node:path";

const ORIGIN = "https://promofact.ru";
const SHOTS = path.resolve("audit-screenshots/live");
const CASES = [
  {route:"/",name:"home",h1:null,needsOffer:false},
  {route:"/catalog",name:"catalog",h1:/каталог|купоны|промокоды/i,needsOffer:true},
  {route:"/store/davines",name:"davines",h1:/davines/i,needsOffer:true,promo:"ДАВИНЕС130"},
  {route:"/store/admitad-29791-hollyshop",name:"hollyshop",h1:/hollyshop/i,needsOffer:true,noCode:true},
  {route:"/store/admitad-25914-yandex",name:"practicum",h1:/практикум|яндекс/i,needsOffer:true,noCode:true},
];

function state(status, route, device, message, extras={}) {
  const object = {status, route, device, message, ...extras};
  console.log("LIVE_AUDIT " + JSON.stringify(object));
  return object;
}
function fail(message, failures, route, device) {
  failures.push({route, device, message});
  state("FAIL",route,device,message);
}
async function main() {
  fs.mkdirSync(SHOTS,{recursive:true});
  const browser = await chromium.launch({headless:true});
  const findings=[];
  const captures=[];
  try {
    for(const [device, viewport] of Object.entries({
      desktop:{width:1365,height:768},
      mobile:{width:390,height:844},
    })) {
      const context = await browser.newContext({
        viewport, deviceScaleFactor:1, locale:"ru-RU", timezoneId:"Europe/Moscow",
      });
      for(const item of CASES) {
        const page = await context.newPage();
        const pageErrors=[];
        page.on("pageerror", e=>pageErrors.push(String(e?.message||e).slice(0,180)));
        const url = ORIGIN + item.route;
        try {
          const response = await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
          const code=response?.status() ?? 0;
          const route=item.route;
          if(code !== 200) {
            fail("HTTP "+code,findings,route,device);
            await page.close();
            continue;
          }
          await page.locator("main").first().waitFor({state:"visible",timeout:15000});
          await page.locator("h1").first().waitFor({state:"visible",timeout:10000});
          await page.waitForTimeout(550);
          const heading=(await page.locator("h1").first().innerText()).trim().slice(0,180);
          if(item.h1 && !item.h1.test(heading)) fail("Wrong H1: "+heading,findings,route,device);
          const cards=page.locator('main article').filter({has: page.locator('a[href^="/store/"]')});
          const cardCount=await cards.count();
          if(item.needsOffer && cardCount===0) fail("No visible coupon cards",findings,route,device);
          if(item.promo) {
            const text=await page.locator("main").innerText();
            if(!text.includes(item.promo)) fail("Expected Davines code not found",findings,route,device);
          }
          const details=await page.evaluate(()=>{
            const offers=[...document.querySelectorAll("main article")].filter(e=>e.querySelector('a[href^="/store/"]'));
            const placeholders=["NOT REQUIRE","NOT REQUIRED","НЕ НУЖЕН"];
            const fakeCodes=offers.flatMap(a=>[...a.querySelectorAll('[title*="копировать промокод"], [aria-label*="Промокод для ручного копирования"]')])
              .filter(el=>placeholders.includes((el.textContent||el.value||"").trim().toUpperCase()))
              .length;
            const affiliateAnchors=offers.flatMap(a=>[...a.querySelectorAll('a[rel*="sponsored"]')]);
            const unsafe=affiliateAnchors.filter(a=>{
              try {
                const u=new URL(a.href,location.origin);
                if(u.origin===location.origin && u.pathname.startsWith("/go/")) return false;
                return u.protocol!=="https:" || !u.searchParams.has("erid");
              }catch{return true;}
            }).length;
            return {
              width:document.documentElement.scrollWidth,viewport:window.innerWidth,
              fakeCodes,affiliateAnchors:affiliateAnchors.length,unsafe,
              title:document.title.slice(0,130)
            };
          });
          if(details.fakeCodes)fail("Placeholder shown as copyable code: "+details.fakeCodes,findings,route,device);
          if(details.unsafe)fail("Offer sponsored link lacks HTTPS+ERID: "+details.unsafe,findings,route,device);
          if(item.needsOffer && details.affiliateAnchors===0) fail("No sponsored affiliate CTA found",findings,route,device);
          if(details.width>details.viewport+18)fail("Mobile/desktop horizontal overflow "+details.width+" > "+details.viewport,findings,route,device);
          if(pageErrors.length)fail("Client JS error: "+pageErrors.join("; "),findings,route,device);
          const shot=path.join(SHOTS,item.name+"-"+device+".png");
          await page.screenshot({path:shot,animations:"disabled",fullPage:false});
          captures.push(shot);
          state("PASS",route,device,"Page loaded; inspected coupons, UI and links",{
            h1:heading,cards:cardCount,sponsored:details.affiliateAnchors,
            pageWidth:details.width,viewport:details.viewport
          });
        }catch(e){
          fail("Browser/navigation issue: "+String(e?.message||e).slice(0,220),findings,item.route,device);
        }finally {
          if(!page.isClosed())await page.close().catch(()=>{});
        }
      }
      await context.close();
    }
  }finally {
    await browser.close();
  }
  state(findings.length?"FAIL":"PASS","summary","both",
    findings.length+" findings; "+captures.length+" screenshots");
  if(findings.length) {
    console.error("LIVE_AUDIT_FINDINGS "+JSON.stringify(findings));
    process.exitCode=1;
  }
}
main().catch(e=>{console.error("LIVE_AUDIT_FATAL",String(e?.message||e).slice(0,400));process.exitCode=1;});
