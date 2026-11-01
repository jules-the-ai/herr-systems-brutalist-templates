import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.HERR_TEST_URL||'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 for(const width of [320,390,800,1440])for(const theme of ['dark','light']){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/services/web-design/');await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior='auto';},theme);
  const items=page.locator('.detail-subtype');assert.equal(await items.count(),6);
  assert.equal(await page.locator('.detail-subtype-list').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<=720?1:2);
  for(let i=0;i<6;i++){
   const item=items.nth(i);await item.locator('summary').click();assert.equal(await item.evaluate(d=>d.open),true);assert(await item.locator('p').isVisible());
   assert.equal(await item.locator('a').getAttribute('href'),'#project');await item.locator('summary').press('Enter');assert.equal(await item.evaluate(d=>d.open),false);
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const names=await items.locator('summary').allTextContents();
  const global=await page.locator('.global-header, .mobile-nav, #site-menu').allTextContents();
  assert(names.every(name=>!global.join(' ').includes(name)),'No subtype in global menus');
  await items.first().locator('summary').click();await items.first().locator('a').click();assert.equal(new URL(page.url()).hash,'#project');assert(await page.locator('#project-title').isVisible());
  await page.locator('.detail-subtypes').scrollIntoViewIfNeeded();
  if(width===1440||width===390)await page.screenshot({path:`/tmp/herr-service-subtypes-${width}-${theme}.png`});
  console.log(`PASS ${width}px ${theme}: six accessible disclosures, responsive columns, working inquiry links, no global menu changes or overflow`);
 }
 const context=await browser.newContext({javaScriptEnabled:false});const fallback=await context.newPage();await fallback.goto(base+'/services/web-design/');await fallback.locator('.detail-subtype summary').first().click();assert.equal(await fallback.locator('.detail-subtype').first().evaluate(d=>d.open),true);await context.close();
 assert.deepEqual(errors,[]);console.log('PASS native no-JS interaction; no missing assets or script errors');
}finally{await browser.close();}
