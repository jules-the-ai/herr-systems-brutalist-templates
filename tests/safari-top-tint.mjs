import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const routes=['/','/services/','/services/billboard/','/services/web-design/','/case-studies/','/case-studies/maple-street-workshop/','/case-studies/fieldnote-operations/','/case-studies/northline-community/','/about/','/about/team/alex-morgan/','/about/team/sam-rivera/','/about/team/jordan-ellis/','/pricing/','/blog/','/blog/a-clearer-website/','/blog/start-small-with-automation/','/blog/what-good-hosting-should-cover/','/contact/'];
const b=await chromium.launch({headless:true});
try{
 const p=await b.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const cdp=await p.context().newCDPSession(p);
 for(const top of [0,59]){
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top,right:0,bottom:top?34:0,left:0}});
  for(const route of routes)for(const theme of ['dark','light']){
   await p.goto(base+route);await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior='auto';},theme);
   const tint=p.locator('.safari-top-tint');assert.equal(await tint.count(),1,'A real opaque fixed top-edge layer must exist, not just html/meta color');
   const before=await tint.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {position:s.position,color:s.backgroundColor,opacity:s.opacity,events:s.pointerEvents,x:r.x,y:r.y,width:r.width,height:r.height,aria:el.getAttribute('aria-hidden')}});
   assert.deepEqual(before,{position:'fixed',color:'rgb(22, 79, 145)',opacity:'1',events:'none',x:0,y:0,width:393,height:Math.max(4,top),aria:'true'});
   assert.equal(await p.locator('.global-header').evaluate(el=>getComputedStyle(el).position),'static');
   assert.equal(await p.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),theme==='dark'?'rgb(22, 7, 61)':'rgb(234, 245, 255)','Existing page backdrop preserved');
   await p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));assert((await p.locator('.global-header').boundingBox()).y<0);
   assert.deepEqual(await tint.boundingBox(),{x:0,y:0,width:393,height:Math.max(4,top)},'Only the safe-area tint remains at the viewport edge');
   assert.equal(await p.evaluate(()=>document.elementFromPoint(100,1)?.classList.contains('safari-top-tint')),false,'Tint never steals input');
   assert.equal(await tint.getAttribute('tabindex'),null);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
 }
 await p.setViewportSize({width:1440,height:1000});await p.goto(base+'/');assert(await p.locator('.safari-top-tint').isHidden(),'Desktop unchanged');
 console.log('PASS: all 18 routes/both themes expose an opaque full-width fixed blue top tint at 4px or the simulated safe-area height; header still scrolls away, backdrop preserved, no input interception or overflow; tint hidden on desktop. Native Safari tint selection requires iPhone confirmation.');
}finally{await b.close();}
