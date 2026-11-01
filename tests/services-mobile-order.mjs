import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';const b=await chromium.launch({headless:true});
try{const p=await b.newPage();for(const width of [320,390,720,768,1440])for(const theme of ['dark','light']){
 await p.setViewportSize({width,height:1000});await p.goto(base+'/services/');await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await p.evaluate(()=>document.fonts.ready);
 const cards=p.locator('.service-entry');assert.equal(await cards.count(),6);
 for(const card of await cards.all()){
  const art=await card.locator('.service-art').boundingBox(),copy=await card.locator('.service-copy').boundingBox();
  if(width<=720){assert(art.y+art.height<=copy.y+1,'Mobile artwork must precede all card copy');assert.equal(await card.locator('.service-art').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');assert.equal(await card.locator('.service-art').evaluate(el=>getComputedStyle(el).borderBottomWidth),'1px');}
  else{assert(art.x>=copy.x+copy.width-1,'Desktop retains artwork to the right');assert.equal(await card.locator('.service-art').evaluate(el=>getComputedStyle(el).order),'0');}
 }
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await p.setViewportSize({width:390,height:1000});await p.goto(base+'/services/billboard/');const card=p.locator('.service-entry').first();assert((await card.locator('.service-art').boundingBox()).y>(await card.locator('.service-copy').boundingBox()).y,'Other variant unchanged');
 console.log('PASS: six mobile service cards show artwork above copy at 320/390/720px; desktop side-by-side order retained at 768/1440px; both themes, separator, no overflow, and variant preservation verified.');
}finally{await b.close();}
