import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try {
 const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,800,1440])for(const theme of ['dark','light']){
  await p.setViewportSize({width,height:1000});
  for(const route of ['/','/about/','/about/team/alex-morgan/','/services/web-design/','/contact/']){
   await p.goto(base+route);await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const image=p.locator('.global-header .logo-mark img');await image.evaluate(i=>i.decode());
   assert.equal(await image.getAttribute('src'),'/assets/davy-hexagon-mark-pixel.svg');
   const rect=await image.boundingBox();assert.equal(rect.width,rect.height);assert(rect.width>=40);assert(rect.width<=56);
   await image.evaluate(i=>{i.src='/assets/davy-hexagon-mark.png';return i.decode();});
   assert.deepEqual(await image.boundingBox(),rect,'Original and pixel mark keep identical layout');
   await image.evaluate(i=>{i.src='/assets/davy-hexagon-mark-pixel.svg';return i.decode();});
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert((await p.locator('link[rel="icon"][type="image/png"]').getAttribute('href')).includes('davy-hexagon-mark'));
   if(route==='/' && [390,1440].includes(width)){await p.evaluate(()=>document.fonts.ready);await p.locator('.brand-tools').screenshot({path:`/tmp/herr-nav-pixel-${width}-${theme}.png`});}
  }
 }
 await p.locator('.logo').click();await p.waitForURL(base+'/');
 assert.deepEqual(errors,[]);
 for(const archive of ['public/archive/services-contained/index.html','public/archive/web-design-original/index.html'])assert(!readFileSync(archive,'utf8').includes('davy-hexagon-mark-pixel.svg'));
 const response=await p.request.get(base+'/assets/davy-hexagon-mark-pixel.svg');assert.equal(response.status(),200);assert((await response.text()).includes('shape-rendering="crispEdges"'));
 console.log('PASS: pixel nav logo decodes on five representative routes, four widths and both themes; exact original geometry preserved, home link works, archives unchanged, no overflow or script errors.');
}finally{await browser.close();}
