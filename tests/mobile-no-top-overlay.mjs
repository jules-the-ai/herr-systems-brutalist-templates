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
   assert.equal(await p.locator('.safari-top-tint').count(),0);
   assert.equal(await p.locator('.global-header').evaluate(el=>getComputedStyle(el).position),'static');
   await p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));assert((await p.locator('.global-header').boundingBox()).y<0);
   const overlays=await p.evaluate(()=>[...document.body.querySelectorAll('*')].filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.position==='fixed' && s.display!=='none' && s.visibility!=='hidden' && r.top===0 && r.width>=innerWidth*.8 && r.height>0;}).map(el=>el.className));
   assert.deepEqual(overlays,[],`No fixed top-edge strips ${route} ${theme}/${top}`);
   assert.equal(await p.locator('.mobile-nav').evaluate(el=>getComputedStyle(el).position),'fixed');
  }
 }
 console.log('PASS: all 18 routes/both themes, zero and 59px safe-area insets: no tint element or fixed top-edge strip, non-sticky mastheads and fixed bottom navigation retained. Native Safari tint remains unverified.');
}finally{await b.close();}
