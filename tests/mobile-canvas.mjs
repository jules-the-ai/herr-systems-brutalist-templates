import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const routes=['/','/services/','/services/billboard/','/services/web-design/','/case-studies/','/case-studies/maple-street-workshop/','/case-studies/fieldnote-operations/','/case-studies/northline-community/','/about/','/about/team/alex-morgan/','/about/team/sam-rivera/','/about/team/jordan-ellis/','/pricing/','/blog/','/blog/a-clearer-website/','/blog/start-small-with-automation/','/blog/what-good-hosting-should-cover/','/contact/'];
const b=await chromium.launch({headless:true});
try{
 const p=await b.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const cdp=await p.context().newCDPSession(p);
 for(const top of [0,59]){
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top,left:0,right:0,bottom:top?34:0}});
  for(const route of routes)for(const theme of ['dark','light']){
   await p.goto(base+route);await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior='auto';},theme);
   const canvas=await p.evaluate(()=>({root:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor,bodyImage:getComputedStyle(document.body).backgroundImage}));
   assert.equal(canvas.body,'rgb(22, 79, 145)','Safari canvas must use blue on BODY, not only html/meta');assert.equal(canvas.root,canvas.body);assert.equal(canvas.bodyImage,'none');
   assert.equal(await p.locator('body > .page-surface').count(),1);
   assert.equal(await p.locator('.page-surface').evaluate(el=>getComputedStyle(el).backgroundColor),theme==='dark'?'rgb(22, 7, 61)':'rgb(234, 245, 255)');
   assert.equal(await p.locator('.page-surface #main').count(),1);assert.equal(await p.locator('.page-surface .global-footer').count(),1);
   assert.equal(await p.locator('body > .global-header').count(),1);assert.equal(await p.locator('.safari-top-tint').count(),0);
   await p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));assert((await p.locator('.global-header').boundingBox()).y<0);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
 }
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,left:0,right:0,bottom:0}});await p.setViewportSize({width:1440,height:1000});await p.goto(base+'/');assert.equal(await p.locator('.page-surface').evaluate(el=>getComputedStyle(el).display),'contents');
 console.log('PASS: all 18 routes, both themes, zero/59px insets: actual mobile body and root canvas blue, purple/light page surface preserved, one wrapper, non-sticky nav, no tint overlay or overflow; desktop wrapper adds no box. Native Safari confirmation still needed.');
}finally{await b.close();}
