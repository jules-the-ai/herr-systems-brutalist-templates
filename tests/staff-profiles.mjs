import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const profiles=JSON.parse(readFileSync('src/data/staff.json','utf8'));
const base=process.env.HERR_TEST_URL||'http://127.0.0.1:8096';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 for(const width of [320,390,721,1024,1440])for(const theme of ['dark','light'])for(const person of profiles){
  await page.setViewportSize({width,height:1000});await page.goto(base+`/about/team/${person.slug}/`);
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior='auto';},theme);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('h1').textContent(),person.name);
  assert.equal(await page.locator('.site-shell > main').count(),1);
  assert(await page.locator('.profile-demo').isVisible());assert((await page.locator('.profile-demo').textContent()).includes('fictional'));
  assert.equal(await page.locator('.profile-skills li').count(),8);assert.equal(await page.locator('.profile-approach li').count(),3);
  assert.equal(await page.locator('.profile-section').count(),4);
  assert.equal(await page.locator('.profile-other-people>div:last-child>a').count(),2);
  const portrait=page.locator('.profile-portrait img');await portrait.evaluate(i=>i.decode());assert(await portrait.isVisible());
  const box=await portrait.boundingBox();assert(Math.abs(box.width/box.height-6/7)<.01);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px ${theme} ${person.slug}`);
  if(width<=720){const content=await page.locator('.profile-story').boundingBox();assert(content.x>=14);assert(content.x+content.width<=width-14);}
  const broken=await page.locator('a[href^="#"]').evaluateAll(links=>links.map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1))));assert.deepEqual(broken,[]);
  const menu=await page.locator('.mobile-nav > a, .mobile-nav > button').allTextContents();assert.deepEqual(menu,['Services','Work','Contact','More']);
  await page.locator('.profile-hero-actions a[href="#profile-skills"]').click();assert.equal(new URL(page.url()).hash,'#profile-skills');
  await page.goto(base+`/about/team/${person.slug}/`);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  if(person.slug==='alex-morgan'&&(width===390||width===1440))await page.screenshot({path:`/tmp/herr-staff-${width}-${theme}.png`,fullPage:true});
 }
 for(const person of profiles){
  await page.goto(base+'/about/');await page.locator(`.staff-card a[href="/about/team/${person.slug}/"]`).click();await page.waitForURL(base+`/about/team/${person.slug}/`);assert.equal(await page.locator('h1').textContent(),person.name);
  const next=await page.locator('.profile-other-people>div:last-child>a').first().getAttribute('href');await page.locator('.profile-other-people>div:last-child>a').first().click();await page.waitForURL(base+next);
 }
 await page.goto(base+'/about/team/alex-morgan/');await page.setViewportSize({width:390,height:844});await page.locator('[data-menu-open]').click();assert(await page.locator('#site-menu').isVisible());await page.keyboard.press('Escape');
 await page.locator('.profile-connect a').click();await page.waitForURL(base+'/contact/');
 assert.deepEqual(errors,[]);console.log('PASS: three linked demo staff profiles, five widths, both themes, portrait ratios, biographies/skills/approach, fragment links, offcanvas, contact path, and zero asset/JS errors');
}finally{await browser.close();}
