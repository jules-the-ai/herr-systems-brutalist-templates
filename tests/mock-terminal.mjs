import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base = process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser = await chromium.launch({headless:true});
const errors=[];const submissions=[];const transports=[];
try {
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 page.on('request',r=>{if(r.method()==='POST')submissions.push(r.url());if(['fetch','xhr','websocket'].includes(r.resourceType()))transports.push(r.url());});
 const input=page.locator('#terminal-command');const log=page.locator('.terminal-output');
 async function run(command){await input.fill(command);await input.press('Enter');}
 for(const width of [320,390,720,800,1000,1001,1024,1440])for(const theme of ['dark','light']){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/');await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior="auto";},theme);await page.evaluate(()=>document.fonts.ready);
  assert(await input.isEnabled());assert.equal(await page.locator('.monitor').count(),0);
  assert((await log.textContent()).includes('herr -services'));assert.equal(await page.locator('.hero-terminal').count(),1);
  const terminal=await page.locator('.hero-terminal').boundingBox(),copy=await page.locator('.hero-copy').boundingBox();
  if(width>1000){assert(Math.abs(terminal.width-copy.width)<1);assert(terminal.x>copy.x+copy.width);}
  else assert(terminal.y>=copy.y+copy.height);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${theme}`);
  assert(await log.evaluate(el=>el.scrollWidth<=el.clientWidth));
  await page.locator('[data-terminal-command="herr -services"]').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));const scroll=await page.evaluate(()=>scrollY);await page.locator('[data-terminal-command="herr -services"]').click();assert.equal(await log.locator('.terminal-entry:last-child a').count(),6);assert.equal(await page.evaluate(()=>scrollY),scroll);
  await run('herr -chat "I need a website"');assert((await log.locator('.terminal-entry:last-child').textContent()).includes('scripted demo'));
  if([390,1440].includes(width)){await page.reload();await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior="auto";},theme);await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await page.screenshot({path:`/tmp/herr-terminal-${width}-${theme}.png`,fullPage:true});}
 }
 await page.goto(base+'/');
 for(const [command,count] of [['herr -services',6],['herr -pages',7],['herr -about',2],['herr -work',3],['herr -pricing',1],['herr -contact',1],['herr -blog',1],['herr -team',3]]){
  await run(command);assert.equal(await log.locator('.terminal-entry:last-child a').count(),count,command);
  const hrefs=await log.locator('.terminal-entry:last-child a').evaluateAll(as=>as.map(a=>a.getAttribute('href')));
  for(const href of hrefs){const response=await page.request.get(base+href);assert.equal(response.status(),200,href);}
 }
 for(const [question,expected] of [['pricing','70/hour'],['hosting','backups'],['automate a workflow','human checkpoint'],['hello','curious human'],['talk to a human','contact'],['what is the moon made of','tiny scripted brain']]){
  await run('herr -chat '+question);assert((await log.locator('.terminal-entry:last-child').textContent()).includes(expected),question);
 }
 await run('herr -chat <img src=x onerror="window.terminalInjected=true">');assert.equal(await log.locator('img').count(),0);assert.equal(await page.evaluate(()=>window.terminalInjected),undefined);
 await run('rm -rf /');assert((await log.locator('.terminal-entry:last-child').textContent()).includes('not a system shell'));
 await run('herr -open javascript:alert(1)');assert.equal(page.url(),base+'/');assert((await log.locator('.terminal-entry:last-child').textContent()).includes('Unknown destination'));
 await run('herr --services');assert.equal(await log.locator('.terminal-entry:last-child a').count(),6);
 await input.fill('unfinished draft');await input.press('ArrowUp');assert.equal(await input.inputValue(),'herr --services');await input.press('ArrowDown');assert.equal(await input.inputValue(),'unfinished draft');
 await input.fill('herr -serv');await input.press('Tab');assert.equal(await input.inputValue(),'herr -services ');await input.press('Tab');assert.equal(await page.locator('.terminal-form button').evaluate(el=>el===document.activeElement),true);
 await run('herr -history');assert((await log.locator('.terminal-entry:last-child').textContent()).includes('herr --services'));
 await run('clear');assert.equal(await log.locator('.terminal-entry').count(),1);
 await run('herr -help');assert((await log.locator('.terminal-entry:last-child').textContent()).includes('herr -open name'));
 for(let i=0;i<45;i++)await run(`herr -chat hello ${i}`);assert((await log.locator('.terminal-entry').count())<=40);
 const storageKeys=await page.evaluate(()=>Object.keys(localStorage));assert(!storageKeys.some(k=>/terminal|chat|command/.test(k)));assert.deepEqual(submissions,[]);assert.deepEqual(transports,[]);
 await run('herr -open web-design');await page.waitForURL(base+'/services/web-design/');
 await page.goto(base+'/');await run('herr -services');await log.locator('a[href="/services/#hosting"]').click();await page.waitForURL(base+'/services/#hosting');
 const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await touch.goto(base+'/');await touch.locator('[data-terminal-command="herr -services"]').tap();assert.equal(await touch.locator('.terminal-entry:last-child a').count(),6);await touch.locator('.terminal-entry:last-child a').first().tap();await touch.waitForURL(base+'/services/web-design/');await touch.close();
 const fallback=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await fallback.goto(base+'/');assert(await fallback.locator('.terminal-no-js a').isVisible());assert(await fallback.locator('#terminal-command').isDisabled());await fallback.locator('.terminal-no-js a').click();await fallback.waitForURL(base+'/services/');await fallback.close();
 assert.deepEqual(errors,[]);console.log('PASS: terminal half-width/stacked layouts at eight widths in both themes; all mock commands, scripted chat, safe navigation, literal HTML, history, Tab exit, bounded log, real pointer/touch links, no-JS fallback, no POSTs, and no console/asset errors.');
}finally{await browser.close();}
