import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();const errors=[];
 page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 async function checkIcons() {
  const icons=await page.locator('.mobile-nav-art').evaluateAll(async imgs=>{
   await Promise.all(imgs.map(i=>i.decode()));
   return imgs.map(i=>{const s=getComputedStyle(i),r=i.getBoundingClientRect();return {w:r.width,h:r.height,display:s.display,visibility:s.visibility,opacity:s.opacity,bg:s.backgroundColor,loaded:i.naturalWidth>0};});
  });
  assert.equal(icons.length,4);
  assert(icons.every(i=>i.w===24&&i.h===24&&i.loaded&&i.display!=='none'&&i.visibility==='visible'&&i.opacity==='1'&&i.bg==='rgb(17, 42, 83)'));
 }
 for(const width of [320,390,640])for(const theme of ['dark','light'])for(const route of ['/', '/about/', '/blog/', '/services/', '/case-studies/', '/contact/', '/pricing/']) {
  await page.setViewportSize({width,height:844});await page.goto(base+route);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await checkIcons();
  await page.locator('.mobile-nav summary').click();await checkIcons();
  const summary=await page.locator('.mobile-nav summary').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
  assert.deepEqual(summary,{bg:'rgb(213, 255, 72)',color:'rgb(22, 7, 61)'});
  assert(await page.locator('.mobile-nav details a[href="/blog/"]').isVisible());
  if(width===390&&route==='/about/') await page.screenshot({path:`/tmp/herr-mobile-art-about-${theme}.png`});
  await page.locator('.mobile-nav summary').press('Escape');await checkIcons();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 for(const selector of ['.mobile-nav > a:first-child', '.mobile-nav summary']) {
  await page.goto(base+'/');await page.locator(selector).focus();await checkIcons();
  const r=await page.locator(selector).boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await checkIcons();await page.mouse.up();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 7 routes × 3 mobile widths × both themes; four loaded 24×24 images remain visible through default, open, current-route, focus, and pressed states; no overflow or missing assets.');
} finally {await browser.close();}
