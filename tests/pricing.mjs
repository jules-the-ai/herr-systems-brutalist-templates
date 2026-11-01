import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { calculateEstimate, FEATURES } from '../public/pricing-calculator.js';
const keys = Object.keys(FEATURES);
let combinations = 0;
for (let templates = 1; templates <= 20; templates++) for (const design of ['standard', 'custom']) {
  for (let mask = 0; mask < 128; mask++) for (const [hosting, monthly] of [['none', 0], ['hosting', 35], ['managed', 70]]) {
    const features = keys.filter((key, i) => mask & (1 << i));
    const result = calculateEstimate({ templates, design, features, hosting });
    const expected = 280 + (templates - 1) * 70 + (design === 'custom' ? 350 : 0) + features.reduce((sum, key) => sum + FEATURES[key].price, 0);
    assert.equal(result.total, expected); assert.equal(result.monthly, monthly); combinations++;
  }
}
assert.equal(calculateEstimate({templates: -10}).templates, 1);
assert.equal(calculateEstimate({templates: 200}).templates, 20);
assert.equal(calculateEstimate({templates: 'bad'}).templates, 5);
assert.equal(calculateEstimate({features:['ai','ai','invalid','__proto__'],hosting:'__proto__'}).total, 980);
console.log(`PASS ${combinations} estimator combinations, bounds, duplicate and invalid inputs`);
const base = process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser = await chromium.launch({headless:true});
try {
 const page = await browser.newPage(); const errors = []; const posts = [];
 page.on('pageerror', error => errors.push(error.message));
 page.on('response', r => {if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);});
 page.on('request', r => {if(r.method() === 'POST') posts.push(r.url());});
 for(const width of [320,390,640,800,1440]) for(const theme of ['dark','light']) {
  await page.setViewportSize({width,height:1000});
  await page.goto(base+'/pricing/'); await page.evaluate(t=>document.documentElement.dataset.theme=t, theme);
  assert(await page.locator('#estimate-controls').isEnabled());
  assert.equal(await page.locator('#project-total').textContent(), '$560');
  await page.locator('[value=ecommerce]').check(); await page.locator('[value=ai]').check();
  assert.equal(await page.locator('#project-total').textContent(), '$1,680');
  assert.equal(await page.locator('#mobile-project-total').textContent(), '$1,680');
  await page.locator('[name=design][value=custom]').check();
  await page.locator('#template-count').focus(); await page.keyboard.press('Home');
  assert.equal(await page.locator('#template-count-output').textContent(),'1 page template');
  assert.equal(await page.locator('#project-total').textContent(), '$1,750');
  await page.keyboard.press('End');
  assert.equal(await page.locator('#project-total').textContent(), '$3,080');
  await page.locator('#hosting').selectOption('managed');
  assert.equal(await page.locator('#monthly-total').textContent(), '$70 / month');
  assert.equal(await page.locator('#project-total').textContent(), '$3,080');
  const mail = new URL(await page.locator('#request-estimate').getAttribute('href'));
  const body = mail.searchParams.get('body');
  assert(body.includes('Ecommerce: $700')); assert(body.includes('AI Automation: $420'));
  assert(body.includes('One-time sample estimate: $3,080')); assert(body.includes('$70/month')); assert(body.includes('\n'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `No overflow ${width} ${theme}`);
  await page.locator('.reset-estimate').click();
  await page.waitForFunction(()=>document.querySelector('#project-total').textContent==='$560');
  assert.equal(await page.locator('#monthly-total').textContent(),'$0 / month');
  assert.equal(await page.locator('input[type=checkbox]:checked').count(),0);
  if(width<=720) {
    const menu=page.locator('.mobile-nav');
    assert.equal(await menu.locator(':scope > a, :scope > details').count(),4);
    assert.equal(await menu.locator('a[href="/pricing/"]').count(),0);
    assert.equal(await menu.locator(':scope > a[href="/blog/"]').count(),0);
    const tops=await menu.locator(':scope > a, :scope > details').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));
    assert.equal(new Set(tops).size,1);
    await menu.locator('summary').click();
    assert(await menu.locator('a[href="/blog/"]').isVisible());
    await menu.locator('summary').press('Escape');
    assert.equal(await menu.locator('details').evaluate(d=>d.open),false);
    await menu.locator('summary').click(); await menu.locator('a[href="/blog/"]').click();
    await page.waitForURL(base+'/blog/');
  } else {
    const nav=page.locator('.global-nav');
    assert.equal(await nav.locator(':scope > a[href="/"]').count(),0);
    assert.equal(await nav.locator(':scope > a[href="/pricing/"]').count(),1);
    assert.equal(await nav.locator(':scope > a[href="/blog/"]').count(),0);
    await nav.locator('summary').focus(); await page.keyboard.press('Enter');
    assert(await nav.locator('a[href="/blog/"]').isVisible());
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),'/about/');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),'/blog/');
    await page.keyboard.press('Escape'); assert.equal(await nav.locator('details').evaluate(d=>d.open),false);
    await nav.locator('summary').click(); await page.locator('#pricing-title').click();
    assert.equal(await nav.locator('details').evaluate(d=>d.open),false);
  }
  await page.goto(base+'/pricing/'); await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  if(width===1440||width===390) await page.screenshot({path:`/tmp/herr-pricing-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS ${width}px ${theme}: live controls, reset, quote draft, mobile/desktop navigation, no overflow`);
 }
 // All active shell templates share the new navigation; no duplicate current-page flags.
 const routes = ['/', '/services/', '/services/web-design/', '/about/', '/blog/', '/blog/a-clearer-website/', '/case-studies/', '/case-studies/maple-street-workshop/', '/contact/', '/pricing/'];
 for(const route of routes) {
  await page.goto(base+route);
  assert.equal(await page.locator('.global-nav > a[href="/pricing/"]').count(),1);
  assert.equal(await page.locator('.mobile-nav > a, .mobile-nav > details').count(),4);
  assert.equal(await page.locator('.global-nav details a[href="/blog/"]').count(),1);
 }
 await page.goto(base+'/');
 assert((await page.locator('.home-pricing').innerText()).includes('$70'));
 assert.equal(await page.locator('.home-pricing a').getAttribute('href'),'/pricing/');
 const noJS = await browser.newContext({javaScriptEnabled:false}); const fallback=await noJS.newPage();
 await fallback.goto(base+'/pricing/'); assert(await fallback.locator('noscript').isVisible());
 assert(await fallback.locator('#template-count').isDisabled());
 await fallback.setViewportSize({width:1440,height:1000});await fallback.locator('.global-nav summary').click();
 assert(await fallback.locator('.global-nav details a[href="/blog/"]').isVisible());
 await noJS.close();
 assert.deepEqual(errors,[]); assert.deepEqual(posts,[]);
 console.log('PASS shared navigation, homepage pricing link, no-JS fallback, zero failed requests/JS errors/POSTs');
} finally {await browser.close();}
