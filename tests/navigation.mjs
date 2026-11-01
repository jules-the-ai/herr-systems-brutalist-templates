import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 for(const width of [1440,390])for(const theme of ['dark','light'])for(const destination of ['/about/','/blog/'])for(const blurOnPress of [true,false]) {
  await page.setViewportSize({width,height:1000});await page.goto(base+'/');
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const menu=page.locator(width>720?'.global-nav details':'.mobile-nav details');
  await menu.locator('summary').click();
  if(blurOnPress) await page.evaluate(()=>{
   // Reproduce pointer interaction where an anchor does not acquire focus:
   // focus leaves summary for body (relatedTarget=null) before mouseup/click.
   document.addEventListener('mousedown',event=>{
    if(event.target.closest('.nav-submenu a')) {event.preventDefault();document.activeElement.blur();}
   },true);
  });
  const bounds=await menu.locator(`a[href="${destination}"]`).boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await page.mouse.down();await page.waitForTimeout(100);await page.mouse.up();
  await page.waitForTimeout(150);
  assert.equal(new URL(page.url()).pathname,destination,`Pointer activation ${width}px ${theme} blurOnPress=${blurOnPress}`);
  console.log(`PASS ${width}px ${theme} ${destination} pointer blur=${blurOnPress}`);
 }
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:1000});await page.goto(base+'/');
  const menu=page.locator(width>720?'.global-nav details':'.mobile-nav details');
  await menu.locator('summary').focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),'/about/');
  await page.keyboard.press('Enter');await page.waitForURL(base+'/about/');
  await menu.locator('summary').focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');await page.waitForURL(base+'/blog/');
  await menu.locator('summary').click();await page.keyboard.press('Escape');assert.equal(await menu.evaluate(d=>d.open),false);
  await menu.locator('summary').click();await page.locator('.logo').click();assert.equal(await menu.evaluate(d=>d.open),false);
  await menu.locator('summary').focus();await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  assert.equal(await menu.evaluate(d=>d.open),false,'Tab leaving submenu dismisses it');
 }
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const mobile=await touch.newPage();
 for(const destination of ['/about/','/blog/']) {
  await mobile.goto(base+'/');await mobile.locator('.mobile-nav summary').tap();
  await mobile.locator(`.mobile-nav details a[href="${destination}"]`).tap();await mobile.waitForURL(base+destination);
 }
 await touch.close();console.log('PASS keyboard navigation, Escape, outside click, Tab dismissal, mobile touch destinations');
} finally {await browser.close();}
