import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const routes=['/','/services/','/services/billboard/','/services/web-design/','/case-studies/','/case-studies/maple-street-workshop/','/case-studies/fieldnote-operations/','/case-studies/northline-community/','/about/','/about/team/alex-morgan/','/about/team/sam-rivera/','/about/team/jordan-ellis/','/pricing/','/blog/','/blog/a-clearer-website/','/blog/start-small-with-automation/','/blog/what-good-hosting-should-cover/','/contact/'];
const b=await chromium.launch({headless:true});
// Poll from Node: injected timer/RAF polling may stall when JavaScript is disabled.
async function atTop(page){
 for(let i=0;i<80;i++){
  if((await page.evaluate(()=>scrollY))<=1)return;
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.fail('Page did not return to document start');
}

try {
 for(const width of [390,1440]){
  const context=await b.newContext({viewport:{width,height:1000},colorScheme:'light'});
  await context.addInitScript(()=>localStorage.setItem('herr-systems-retro-theme','light'));
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const route of routes){
   await p.goto(base+route);assert.equal(await p.locator('html').getAttribute('data-theme'),'dark',route);
   const toggle=p.locator('[data-theme-toggle]');assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   await toggle.click();assert.equal(await p.locator('html').getAttribute('data-theme'),'light');assert.equal(await toggle.getAttribute('aria-pressed'),'false');
   await p.reload();assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');
   assert.equal(await p.locator('#top').count(),1);assert.equal(await p.locator('body > div#top').count(),1);
   await p.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
   await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));assert(await p.evaluate(()=>scrollY>100));
   await p.locator('footer a[href="#top"]').click();await p.waitForFunction(()=>scrollY<=1);assert.equal(new URL(p.url()).hash,'#top');
   await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await p.locator('footer a[href="#top"]').evaluate(el=>el.focus({preventScroll:true}));await p.keyboard.press('Enter');await p.waitForFunction(()=>scrollY<=1);
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 const nojs=await b.newPage({javaScriptEnabled:false,viewport:{width:390,height:1000}});
 for(const route of ['/','/about/']){
  await nojs.goto(base+route);assert.equal(await nojs.locator('html').getAttribute('data-theme'),'dark');
  await nojs.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});});
  await nojs.locator('footer a[href="#top"]').click();await atTop(nojs);
 }
 await nojs.close();
 // Natural smooth-scroll smoke checks, independent of the animation-free matrix.
 for(const javaScriptEnabled of [true,false]){
  const smooth=await b.newPage({javaScriptEnabled,viewport:{width:390,height:1000}});
  for(const route of ['/','/about/','/pricing/']){
   await smooth.goto(base+route);await smooth.evaluate(()=>document.fonts.ready);
   await smooth.locator('footer a[href="#top"]').click();
   await atTop(smooth);await smooth.waitForTimeout(1200);
   assert((await smooth.evaluate(()=>scrollY))<=1,`Natural smooth return ${route}`);
  }
  await smooth.close();
 }
 console.log('PASS: 18 routes at mobile/desktop widths start dark despite saved light/OS light; manual switch and dark reload verified; unique document-start anchor returns to scrollY 0 by click/Enter and without JavaScript.');
}finally{await b.close();}
