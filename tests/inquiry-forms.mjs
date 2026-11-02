import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser = await chromium.launch({headless:true});
try {
 const page = await browser.newPage();
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 for (const route of ['/contact/', '/pricing/']) {
  const quote = route.includes('pricing');
  await page.goto(base+route);
  const form = page.locator('[data-inquiry-form]');
  const button = page.locator('[data-submit-button]');
  const status = page.locator('[data-submit-status]');
  if (quote) await page.locator('[name=service][value=web]').check();
  const fill = async () => {
   await form.locator('[name=name]').fill('  Test User  ');
   await form.locator('[name=email]').fill('test@example.com');
   await form.locator('[name=message]').fill('<script>literal text, never executed</script>');
  };
  await form.locator('[name=name]').fill('   ');
  await button.click();
  assert(await form.locator('[data-form-errors]').isVisible());
  if(quote) assert.equal(await form.locator('[data-form-errors]').evaluate(e=>getComputedStyle(e).gridColumn),'1 / -1');
  assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-form-errors')),true);
  await fill();
  await form.locator('[name=email]').fill('not-an-email'); await button.click();
  assert.equal(await form.locator('[name=email]').getAttribute('aria-invalid'),'true');
  await fill();
  let posts=[];
  const onRequest = r=>{if(r.method()==='POST')posts.push(r);}; page.on('request',onRequest);
  await button.click(); assert.equal(await status.getAttribute('data-state'),'unavailable');
  assert.equal(posts.length,0);
  assert.equal(await form.locator('[name=message]').inputValue(),'<script>literal text, never executed</script>');
  await form.evaluate(f=>f.dataset.endpointEnabled='true');
  let received=[]; let mode='success'; let release;
  await page.route('**/api/inquiries', async r=>{
   received.push(r.request().postDataJSON());
   if(mode==='network') return r.abort('failed');
   if(mode==='timeout') return; // Intentionally unresolved: exercise the real 15s abort.
   if(mode==='pending') await new Promise(resolve=>{release=resolve;});
   const status=mode==='rate'?429:mode==='server'?500:200;
   await r.fulfill({status, contentType: mode==='html'?'text/html':'application/json',body:mode==='html'?'<html>Not a Worker</html>':JSON.stringify({ok:mode!=='false'})});
  });
  await button.click(); await page.waitForFunction(()=>document.querySelector('[data-submit-status]').dataset.state==='success');
  const payload = received.at(-1);
  assert.equal(payload.schemaVersion,1); assert.equal(payload.kind,quote?'quote':'contact');
  assert.equal(payload.contact.name,'Test User'); assert.equal(payload.contact.email,'test@example.com');
  assert.equal(payload.message,'<script>literal text, never executed</script>');
  if(quote) {assert(payload.services.includes('web'));assert(payload.estimate.total>0);}
  if(!quote) {
   mode='timeout'; const before=received.length;
   await button.click();
   await page.waitForFunction(()=>document.querySelector('[data-submit-status]').dataset.state==='error',{},{timeout:20000});
   assert.equal(received.length,before+1); assert(await button.isEnabled());
   assert.equal(await form.locator('[name=email]').inputValue(),'test@example.com');
  }

  for (mode of ['html','false','server','rate','network']) {
   await button.click(); await page.waitForFunction(()=>document.querySelector('[data-submit-status]').dataset.state==='error');
   assert(await button.isEnabled()); assert.equal(await form.locator('[name=email]').inputValue(),'test@example.com');
  }
  mode='pending'; const before=received.length;
  await button.click(); await page.waitForFunction(()=>document.querySelector('[data-submit-button]').disabled);
  await form.evaluate(f=>{f.requestSubmit();f.requestSubmit();});
  await page.waitForTimeout(100); assert.equal(received.length,before+1);
  await form.locator('[name=message]').fill('A newer unsent edit');
  release(); await page.waitForFunction(()=>document.querySelector('[data-submit-status]').dataset.state==='success');
  assert.equal(await form.locator('[name=message]').inputValue(),'A newer unsent edit');
  assert.equal(await form.locator('[name=message]').evaluate(e=>localStorage.getItem(e.name)),null);
  await form.evaluate(f=>f.action='https://example.org/not-allowed');
  const count=posts.length; await button.click(); assert.equal(await status.getAttribute('data-state'),'error'); assert.equal(posts.length,count);
  await page.unroute('**/api/inquiries'); page.off('request',onRequest);
  for(const width of [320,390,800,1440]) for(const theme of ['dark','light']) {
   await page.setViewportSize({width,height:1000}); await page.goto(base+route);
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} ${width} ${theme}`);
   if(width===390||width===1440) await page.screenshot({path:`/tmp/herr-form-${quote?'quote':'contact'}-${width}-${theme}.png`,fullPage:true});
  }
  console.log(`PASS ${route}: required/whitespace/email validation, unconfigured guard, JSON request, explicit acknowledgement, 429/500/network/HTML errors, duplicate suppression, edit preservation, origin guard, responsive themes.`);
 }
 const context=await browser.newContext({javaScriptEnabled:false}); const p=await context.newPage();
 for(const route of ['/contact/','/pricing/']) {
  await p.goto(base+route);assert(await p.locator('[data-submit-button]').isDisabled());
  assert(await p.locator('main noscript a[href^="mailto:"]').first().isVisible());
 }
 await context.close();assert.deepEqual(errors,[]);
 console.log('PASS no-JS fallback, no client exceptions. Delivery responses above are intercepted test fixtures, not a live Worker.');
} finally {await browser.close();}
