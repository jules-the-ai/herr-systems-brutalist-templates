import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.HERR_TEST_URL||'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 for(const width of [320,390,800,1440])for(const theme of ['dark','light']) {
  await page.setViewportSize({width,height:1000});await page.goto(base+'/?v=pricing-art');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  assert.equal(await page.locator('.home-pricing .kicker').count(),0);
  assert(!(await page.locator('body').innerText()).includes('02 // STRAIGHTFORWARD PRICING'));
  const geometry=await page.locator('.home-pricing-art').evaluate(async img=>{
   await img.decode();const art=img.getBoundingClientRect(),headline=img.nextElementSibling.getBoundingClientRect(),parent=img.parentElement.getBoundingClientRect();
   return {width:art.width,height:art.height,bottom:art.bottom,headlineTop:headline.top,parentWidth:parent.width,naturalRatio:img.naturalWidth/img.naturalHeight};
  });
  assert.equal(geometry.naturalRatio,3);assert(Math.abs(geometry.width/geometry.height-3)<.01);
  assert(geometry.width<=420&&geometry.width<=geometry.parentWidth&&geometry.bottom<geometry.headlineTop);
  assert.equal(await page.locator('.home-pricing').evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(213, 255, 72)');
  assert.equal(await page.locator('#home-pricing-title').innerText(),'$70 / hour');
  assert.equal(await page.locator('.home-pricing a').getAttribute('href'),'/pricing/');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.home-pricing').scrollIntoViewIfNeeded();
  if(width===1440||width===390)await page.screenshot({path:`/tmp/herr-home-pricing-art-${width}-${theme}.png`});
  console.log(`PASS ${width}px ${theme}: proportional 3:1 artwork above rate, lime outline, removed kicker, no overflow`);
 }
} finally {await browser.close();}
