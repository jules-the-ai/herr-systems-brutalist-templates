import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
const serviceLinks=['/services/','/services/web-design/','/services/#development','/services/#hosting','/services/#agentic-setups','/services/#consulting','/services/#contract-work'];
const siteLinks=['/','/services/','/case-studies/','/pricing/','/about/','/blog/','/contact/'];
try {
 const page=await browser.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 for(const theme of ['dark','light'])for(const [selector,destinations] of [['.about-dropdown',['/about/','/blog/']],['.services-dropdown',serviceLinks]])for(const destination of destinations)for(const blurOnPress of [true,false]) {
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const menu=page.locator('.global-nav '+selector);await menu.locator('summary').click();
  if(blurOnPress)await page.evaluate(()=>document.addEventListener('mousedown',event=>{if(event.target.closest('.nav-submenu a')){event.preventDefault();document.activeElement.blur();}},true));
  const r=await menu.locator(`a[href="${destination}"]`).boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(60);await page.mouse.up();
  await page.waitForURL(base+destination);
  if(destination.includes('#'))assert.equal(await page.locator(new URL(page.url()).hash).count(),1);
 }
 console.log('PASS both desktop dropdowns: every destination with normal and focus-loss pointer activation, both themes');
 for(const width of [320,390,640])for(const theme of ['dark','light']) {
  await page.setViewportSize({width,height:844});await page.goto(base+'/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  assert.deepEqual(await page.locator('.mobile-nav > a, .mobile-nav > button').allTextContents(),['Services','Work','Contact','More']);
  assert.equal(await page.locator('.mobile-nav details').count(),0);
  const more=page.locator('[data-menu-open]');await more.click();
  assert.equal(await more.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#site-menu').evaluate(d=>d.open),true);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden');
  assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-menu-close')),true);
  assert.equal(await page.locator('#site-menu a').count(),13);
  assert.deepEqual(await page.locator('.site-menu-links a').evaluateAll(a=>a.map(n=>n.getAttribute('href'))),siteLinks);
  assert.deepEqual(await page.locator('.site-menu-services a').evaluateAll(a=>a.map(n=>n.getAttribute('href'))),serviceLinks.slice(1));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#site-menu a').last().focus();await page.keyboard.press('Tab');
  assert(await page.evaluate(()=>document.querySelector('#site-menu').contains(document.activeElement)),'Tab remains inside modal');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[data-menu-open]').getAttribute('aria-expanded')==='false');assert.equal(await more.getAttribute('aria-expanded'),'false');assert(await more.evaluate(el=>el===document.activeElement));
  assert.notEqual(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden');
  await more.click();await page.locator('[data-menu-close]').click();await page.waitForFunction(()=>document.querySelector('[data-menu-open]').getAttribute('aria-expanded')==='false');assert.equal(await more.getAttribute('aria-expanded'),'false');
  await more.click();await page.mouse.click(1,400);await page.waitForFunction(()=>document.querySelector('[data-menu-open]').getAttribute('aria-expanded')==='false');assert.equal(await more.getAttribute('aria-expanded'),'false');
  await more.click();await page.setViewportSize({width:1440,height:1000});await page.waitForFunction(()=>!document.querySelector('#site-menu').open);assert.equal(await page.locator('#site-menu').evaluate(d=>d.open),false);
  console.log(`PASS ${width}px ${theme}: full link list, modal focus, backdrop, Escape, scroll lock, viewport dismissal`);
 }
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mobile=await context.newPage();
 for(const destination of [...siteLinks,...serviceLinks.slice(1)]) {
  await mobile.goto(base+'/');await mobile.locator('[data-menu-open]').tap();
  const link=mobile.locator(`#site-menu a[href="${destination}"]`).first();await link.scrollIntoViewIfNeeded();await link.tap();await mobile.waitForURL(base+destination);
 }
 await mobile.goto(base+'/services/');await mobile.locator('[data-menu-open]').tap();await mobile.locator('#site-menu a[href="/services/#hosting"]').tap();await mobile.waitForURL(base+'/services/#hosting');
 await mobile.waitForFunction(()=>!document.querySelector('#site-menu').open);assert.equal(await mobile.locator('[data-menu-open]').getAttribute('aria-expanded'),'false');
 await context.close();
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');
 await page.locator('.services-dropdown summary').click();await page.locator('.about-dropdown summary').click();assert.equal(await page.locator('.services-dropdown').evaluate(d=>d.open),false);
 await page.locator('.about-dropdown summary').press('Escape');assert.equal(await page.locator('.about-dropdown').evaluate(d=>d.open),false);
 await page.locator('.about-dropdown summary').focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');await page.keyboard.press('Enter');await page.waitForURL(base+'/about/');
 await page.locator('.about-dropdown summary').click();await page.locator('.logo').click();assert.equal(await page.locator('.about-dropdown').evaluate(d=>d.open),false);
 assert.deepEqual(errors,[]);console.log('PASS every mobile touch destination, same-page service anchors, desktop keyboard and dismissal, zero asset/JS errors');
} finally {await browser.close();}
