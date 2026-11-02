import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 const inspect=el=>{const s=getComputedStyle(el);return {appearance:s.appearance,fontSize:s.fontSize,padding:s.padding,borderRadius:s.borderRadius,bg:s.backgroundColor,color:s.color,scheme:s.colorScheme,minHeight:s.minHeight};};
 for(const width of [320,390,800,1440])for(const theme of ['dark','light']) {
  await page.setViewportSize({width,height:1000});
  await page.goto(base+'/contact/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.locator('.desk-select select').selectOption({index:1});
  const reference=await page.locator('.desk-select select').evaluate(inspect);
  await page.goto(base+'/pricing/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.locator('[name=service][value=web]').check();
  await page.locator('[name=service][value=hosting]').check();
  assert.deepEqual(await page.locator('#hosting').evaluate(inspect),reference);
  for(const value of ['hosting','managed']) {
   await page.locator('#hosting').selectOption(value);
   assert(await page.locator('#hosting').evaluate(el=>{const s=getComputedStyle(el);const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');ctx.font=s.font;return ctx.measureText(el.selectedOptions[0].textContent).width <= el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);}), 'Selected label and price fit without truncation');
  }
  await page.locator('#hosting').selectOption('hosting');
  const arrow=await page.locator('#hosting-options .pricing-select').evaluate(el=>({before:getComputedStyle(el,'::before').pointerEvents,after:getComputedStyle(el,'::after').pointerEvents,w:el.clientWidth,select:el.querySelector('select').getBoundingClientRect().width}));
  assert.equal(arrow.before,'none');assert.equal(arrow.after,'none');assert(Math.abs(arrow.w-arrow.select)<1);
  assert.equal(await page.locator('#template-count-output').textContent(),'5 page templates');
  assert((await page.locator('#template-explainer').innerText()).includes('one template, not ten'));
  await page.locator('#hosting').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert.equal(await page.locator('#hosting').inputValue(),'managed');assert.equal(await page.locator('#monthly-total').textContent(),'$70 / month');
  assert.equal(await page.locator('#hosting').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  assert.equal(await page.locator('#estimate-form').evaluate(f=>f.buildInquiryPayload().options.templates),5);
  if(theme==='light' && width<=720) {
   await page.waitForTimeout(400); // Let the shared theme/link transitions settle.
   const contrast=await page.locator('.mobile-estimate a').evaluate(e=>{
    const luminance=color=>{const rgb=color.match(/\d+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
    const a=luminance(getComputedStyle(e).color),b=luminance(getComputedStyle(e.parentElement).backgroundColor);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   });
   assert(contrast>=4.5,'Light-theme estimate link has readable contrast');
  }

  await page.locator('#hosting-options .pricing-select').scrollIntoViewIfNeeded();
  if(width===390||width===1440)await page.screenshot({path:`/tmp/herr-template-select-${width}-${theme}.png`});
  console.log(`PASS ${width}px ${theme}: exact contact select styling, keyboard selection, focus, template quote payload`);
 }
 await page.emulateMedia({forcedColors:'active'});
 assert.equal(await page.locator('#hosting').evaluate(el=>getComputedStyle(el).appearance),'auto');
 assert.equal(await page.locator('#hosting-options .pricing-select').evaluate(el=>getComputedStyle(el,'::after').display),'none');
 console.log('PASS forced-colors native select fallback');
} finally {await browser.close();}
