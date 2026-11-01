import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const routes=['/','/services/','/services/billboard/','/services/web-design/','/case-studies/','/case-studies/maple-street-workshop/','/case-studies/fieldnote-operations/','/case-studies/northline-community/','/about/','/about/team/alex-morgan/','/about/team/sam-rivera/','/about/team/jordan-ellis/','/pricing/','/blog/','/blog/a-clearer-website/','/blog/start-small-with-automation/','/blog/what-good-hosting-should-cover/','/contact/'];
const b=await chromium.launch({headless:true});
try{
 const p=await b.newPage({viewport:{width:390,height:852},isMobile:true,hasTouch:true});const errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const cdp=await p.context().newCDPSession(p);
 for(const width of [320,390,720])for(const top of (width===390?[0,59]:[0]))for(const theme of ['dark','light']){
  await p.setViewportSize({width,height:852});await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top,left:0,right:0,bottom:top?34:0}});
  let home;
  for(const route of routes){
   await p.goto(base+route);await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior='auto';},theme);await p.evaluate(()=>document.fonts.ready);
   assert((await p.locator('meta[name=viewport]').getAttribute('content')).includes('viewport-fit=cover'));
   assert.equal(await p.locator('meta[name=theme-color]').getAttribute('content'),'#164f91');
   const snapshot=await p.locator('.global-header').evaluate(header=>{
    const props=selector=>{const el=header.querySelector(selector),style=getComputedStyle(el),rect=el.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,font:style.font,padding:style.padding,gap:style.gap}};
    const style=getComputedStyle(header);return {position:style.position,padding:style.paddingTop,height:header.offsetHeight,background:style.backgroundColor,rootBackground:getComputedStyle(document.documentElement).backgroundColor,inner:props('.header-inner'),logo:props('.logo'),toggle:props('.theme-toggle'),desktopNav:getComputedStyle(header.querySelector('.global-nav')).display};
   });
   assert.equal(snapshot.position,'static');assert.equal(snapshot.padding,`${top}px`);assert.equal(snapshot.background,'rgb(22, 79, 145)');assert.equal(snapshot.rootBackground,snapshot.background);assert.equal(snapshot.desktopNav,'none');
   if(!home)home=snapshot;else assert.deepEqual(snapshot,home,`Header matches homepage ${route} ${width}/${top}/${theme}`);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));assert((await p.locator('.global-header').boundingBox()).y+snapshot.height<0,'Top masthead scrolls fully away');
   const bottom=p.locator('.mobile-nav');assert.equal(await bottom.evaluate(el=>getComputedStyle(el).position),'fixed');assert(Math.abs((await bottom.boundingBox()).y+(await bottom.boundingBox()).height-852)<1);
   await p.locator('[data-menu-open]').tap();assert(await p.locator('#site-menu').evaluate(el=>el.open));assert((await p.locator('.site-menu-close').boundingBox()).y>=Math.max(28,top));await p.locator('[data-menu-close]').tap();await p.waitForFunction(()=>!document.querySelector('#site-menu').open);
   const toggle=p.locator('[data-theme-toggle]');await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await toggle.tap();assert.equal(await p.locator('meta[name=theme-color]').getAttribute('content'),'#164f91');
   if(width===390)if(top===59)if(['/','/about/'].includes(route)){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`/tmp/herr-mobile-safearea-${route==='/'?'home':'about'}-${theme}.png`});}
  }
 }
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,bottom:0,left:0,right:0}});await p.setViewportSize({width:1440,height:1000});
 for(const route of ['/','/about/']){await p.goto(base+route);assert.equal(await p.locator('.global-header').evaluate(el=>getComputedStyle(el).position),'sticky');assert(await p.locator('.global-nav').isVisible());}
 assert.deepEqual(errors,[]);console.log('PASS: all 18 routes have identical non-sticky mobile mastheads, fixed bottom navigation, consistent blue root/meta/header, 59px/34px simulated safe-area clearance, usable drawer/theme toggle, no overflow; desktop sticky navigation preserved. Actual iPhone Safari chrome still requires device verification.');
}finally{await b.close();}
