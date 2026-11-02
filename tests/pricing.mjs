import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { calculateEstimate, FEATURES, SERVICES, HOURLY_RATE } from '../public/pricing-calculator.js';
const serviceKeys = Object.keys(SERVICES);
const featureKeys = Object.keys(FEATURES);
let combinations = 0;
assert.equal(HOURLY_RATE,70);
assert.deepEqual(calculateEstimate(), { services:[], options:{}, lines:[], total:0, monthly:0, support:'No hosting selected' });
for (let serviceMask=0;serviceMask<32;serviceMask++) {
 const services=serviceKeys.filter((key,i)=>serviceMask & (1<<i));
 for(let templates=1;templates<=20;templates++) for(const design of ['standard','custom']) for(let featureMask=0;featureMask<64;featureMask++) for(const hosting of ['hosting','managed']) {
  const features=featureKeys.filter((key,i)=>featureMask & (1<<i));
  const estimate=calculateEstimate({ services, templates, design, features, hosting, consultingHours:3, contractHours:7 });
  const valid=features.filter(key=>services.includes(FEATURES[key].service));
  const expected=(services.includes('web') ? 280+(templates-1)*70+(design==='custom'?350:0):0)+(services.includes('agentic')?420:0)+(services.includes('consulting')?210:0)+(services.includes('contract')?490:0)+valid.reduce((sum,key)=>sum+FEATURES[key].price,0);
  assert.equal(estimate.total,expected);
  assert.equal(estimate.monthly,services.includes('hosting')?(hosting==='managed'?70:35):0);
  assert.deepEqual(estimate.options.features || [],valid);
  assert(estimate.lines.every(line=>services.includes(line.service)));
  combinations++;
 }
}
for(const [key,service,fallback,max] of [['templates','web',5,20],['consultingHours','consulting',2,160],['contractHours','contract',4,160]]) {
 for(const [input,expected] of [[-10,1],[0,1],[1.6,2],[999,max],['12',12],['bad',fallback],[Infinity,fallback],[NaN,fallback],[null,fallback],[{},fallback],[[],fallback],[true,fallback],['',fallback],[' ',fallback]]) {
  assert.equal(calculateEstimate({services:[service],[key]:input}).options[key],expected);
 }
}
for (const bad of [null,undefined,42,'web',[],{}]) assert.equal(calculateEstimate(bad).total,0);
assert.equal(calculateEstimate({services:['agentic','agentic','__proto__'],features:['agentReview','agentReview','ecommerce','__proto__'],hosting:'managed'}).total,630);
assert.equal(calculateEstimate({services:'web',features:'ecommerce'}).total,0);
assert.equal(calculateEstimate({services:['hosting'],hosting:'__proto__'}).monthly,35);
assert.deepEqual(calculateEstimate({services:['hosting'],templates:20,features:featureKeys}).options,{hosting:'hosting'});
assert.equal(calculateEstimate({services:['consulting'],consultingFocus:'invalid'}).options.consultingFocus,'planning');
console.log(`PASS ${combinations} service/template/design/feature/hosting combinations, numeric bounds and stale-input filtering`);
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage(); const errors=[];const posts=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 const service=key=>page.locator(`[name=service][value=${key}]`);
 const payload=()=>page.locator('#estimate-form').evaluate(form=>form.buildInquiryPayload());
 for(const width of [320,390,640,800,1440]) for(const theme of ['dark','light']) {
  await page.setViewportSize({width,height:1000});await page.goto(base+'/pricing/');
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.waitForFunction(()=>typeof document.querySelector('#estimate-form').buildInquiryPayload==='function');
  assert.equal(await page.locator('#project-total').textContent(),'$0');
  assert.match(await page.locator('#scope-summary').textContent(),/Choose a service/);
  for(const key of serviceKeys) {
   assert(await page.locator(`#${key}-options`).isHidden());
   assert(await page.locator(`#${key}-options input, #${key}-options select`).first().isDisabled());
  }
  await service('consulting').focus();await page.keyboard.press('Space');
  assert(await page.locator('#consulting-options').isVisible());
  assert(await page.locator('#web-options').isHidden());
  assert.equal(await page.locator('#project-total').textContent(),'$140');
  await page.locator('#consulting-hours').fill('3');await page.locator('#consulting-focus').focus();await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('#project-total').textContent(),'$210');
  await service('contract').check();await page.locator('#contract-hours').fill('7');await page.locator('#contract-focus').focus();
  assert.equal(await page.locator('#project-total').textContent(),'$700');
  await service('hosting').check();await page.locator('#hosting').selectOption('managed');
  assert.equal(await page.locator('#monthly-total').textContent(),'$70 / month');
  assert.equal(await page.locator('#project-total').textContent(),'$700');
  await service('web').check();await page.locator('[value=ecommerce]').check();await page.locator('[name=design][value=custom]').check();
  await page.locator('#template-count').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('#template-count-output').textContent(),'1 page template');
  assert.equal(await page.locator('#project-total').textContent(),'$2,030');
  await page.keyboard.press('End');
  assert.equal(await page.locator('#project-total').textContent(),'$3,360');
  await service('agentic').check();await page.locator('[value=agentReview]').check();
  assert.equal(await page.locator('#project-total').textContent(),'$3,990');
  let data=await payload();assert.equal(data.estimate.total,3990);assert.equal(data.estimate.monthly,70);assert.equal(data.options.templates,20);assert.equal(data.services.length,5);
  await service('web').uncheck();
  assert.equal(await page.locator('#project-total').textContent(),'$1,330');
  data=await payload();assert(!('templates' in data.options));assert.deepEqual(data.options.features,['agentReview']);
  assert(await page.locator('#template-count').isDisabled());assert(await page.locator('#web-options').isHidden());
  await service('web').check();assert.equal(await page.locator('#template-count').inputValue(),'5');assert.equal(await page.locator('[value=ecommerce]').isChecked(),false);
  await service('hosting').uncheck();assert.equal(await page.locator('#monthly-total').textContent(),'$0 / month');assert(!('hosting' in (await payload()).options));
  await page.locator('#consulting-hours').fill('-10');await page.locator('#consulting-focus').focus();assert.equal(await page.locator('#consulting-hours').inputValue(),'1');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${theme}`);
  await page.locator('.reset-estimate').click();
  await page.waitForFunction(()=>document.querySelector('#project-total').textContent==='$0');
  assert.deepEqual((await payload()).services,[]);
  assert.equal(await page.locator('[name=service]:checked').count(),0);
  for(const key of serviceKeys) assert(await page.locator(`#${key}-options`).isHidden());
  await service('hosting').check();assert.equal(await page.locator('#project-total').textContent(),'$0');assert.equal(await page.locator('#monthly-total').textContent(),'$35 / month');
  assert.equal((await payload()).estimate.lines.length,0);
  await page.locator('#quote-name').fill('Test Client');await page.locator('#quote-email').fill('client@example.com');await page.locator('#quote-message').fill('Please scope this hosting request.');
  await page.locator('[data-submit-button]').click();
  assert.match(await page.locator('[data-submit-status]').textContent(),/not connected|not configured|unavailable|not enabled/i);
  assert.equal(await page.locator('#estimate-form').getAttribute('action'),'/api/inquiries');
  assert.equal(await page.locator('#estimate-form').getAttribute('method'),'post');
  if(width<=720) assert.equal(await page.locator('.mobile-estimate').evaluate(node=>getComputedStyle(node).position),'sticky');
  if(width===390 || width===1440) await page.screenshot({path:`/tmp/herr-pricing-services-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS ${width}px ${theme}: conditional groups, keyboard controls, resets, clean payload, isolated hosting, blocked delivery, no overflow`);
 }
 const context=await browser.newContext({javaScriptEnabled:false});const fallback=await context.newPage();await fallback.goto(base+'/pricing/');
 assert(await fallback.locator('.pricing-workbench noscript a[href^="mailto:"]').isVisible());
 assert(await fallback.locator('[name=service]').first().isDisabled());assert(await fallback.locator('[data-submit-button]').isDisabled());await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
 console.log('PASS no-JS email fallback, zero JS errors/failed requests/POSTs');
} finally {await browser.close();}
