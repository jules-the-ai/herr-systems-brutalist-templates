import assert from "node:assert/strict";
import { verifyPalette } from "./brutalist-palette.mjs";

export async function verifyNavigation(browser, origin) {
  const errors=[];
  async function verifyCapabilities(page,width,theme){
    assert.equal(await page.locator("html").getAttribute("data-theme"),theme);
    const styles=await page.evaluate(()=>{
      const section=document.querySelector(".services"), next=document.querySelector(".work"), heading=section.querySelector(".section-heading"), hero=document.querySelector(".hero-band");
      const cs=getComputedStyle(section), body=getComputedStyle(document.body), card=getComputedStyle(section.querySelector(".service"));
      return {bg:cs.backgroundColor,fg:cs.color,bodyBg:body.backgroundColor,bodyFg:body.color,border:card.borderRightColor,left:heading.getBoundingClientRect().left,nextLeft:next.getBoundingClientRect().left+parseFloat(getComputedStyle(next).paddingLeft),outerLeft:section.getBoundingClientRect().left,topGap:section.getBoundingClientRect().top-hero.getBoundingClientRect().bottom};
    });
    assert.equal(styles.bg,styles.bodyBg,`Capabilities background ${width}/${theme}`);
    assert.equal(styles.fg,styles.bodyFg);assert.equal(styles.border,styles.bodyFg);
    assert.ok(Math.abs(styles.left-styles.nextLeft)<1,`Shared content gutters ${width}/${theme}: ${JSON.stringify(styles)}`);
    assert.ok(Math.abs(styles.topGap)<1,`No double top spacing: ${JSON.stringify(styles)}`);
  }
  const p=await browser.newPage();
  p.on("pageerror", e=>errors.push(e.message));
  const load=async (route,theme)=>{
    await p.goto(origin+route);
    if(theme==="light") await p.getByRole("button",{name:"Switch to light theme",exact:true}).click();
    await p.evaluate(()=>document.fonts.ready);
  };
  const closed=async()=>{
    await p.waitForFunction(()=>!document.querySelector("#site-menu").open && document.querySelector("[data-menu-open]").getAttribute("aria-expanded")==="false");
    assert.equal(await p.evaluate(()=>document.documentElement.classList.contains("site-menu-open")),false);
  };
  try {
    for(const width of [320,375,720,800]) for(const theme of ["dark","light"]){
      await p.setViewportSize({width,height:900}); await load("/",theme);
      const nav=p.getByRole("navigation",{name:"Mobile navigation",exact:true});
      assert.deepEqual(await nav.locator(":scope > *").allTextContents(),["Services","Work","Contact","More"]);
      assert.equal(await nav.locator("img,svg").count(),0);
      assert.equal(await p.locator(".masthead > nav").isVisible(),false);
      assert.equal(await p.locator(".preview-note,.mobile-menu").count(),0);
      assert.equal(await p.locator(".masthead a[href=\"/templates/\"],#site-menu a[href=\"/templates/\"]").count(),0);
      const boxes=await nav.locator(":scope > *").evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,bottom:r.bottom}}));
      assert.ok(boxes.every(r=>Math.abs(r.y-boxes[0].y)<1 && Math.abs(r.bottom-900)<1));
      await verifyCapabilities(p,width,theme);
      const opener=nav.getByRole("button",{name:"More",exact:true});
      await opener.click(); await p.waitForTimeout(200);
      assert.equal(await p.locator("#site-menu").evaluate(e=>e.matches(":modal")),true);
      assert.equal(await opener.getAttribute("aria-expanded"),"true");
      assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).overflow),"hidden");
      assert.equal(await p.locator("#site-menu nav a").count(),13);
      // Modal focus containment and explicit first/last wrap.
      await p.locator(".brand").evaluate(e=>e.focus());
      assert.equal(await p.evaluate(()=>document.querySelector("#site-menu").contains(document.activeElement)),true);
      await p.locator("[data-menu-close]").focus(); await p.keyboard.press("Shift+Tab");
      assert.equal(await p.evaluate(()=>document.activeElement=== [...document.querySelectorAll("#site-menu a")].at(-1)),true);
      await p.keyboard.press("Tab");
      assert.equal(await p.locator("[data-menu-close]").evaluate(e=>e===document.activeElement),true);
      const y=await p.evaluate(()=>scrollY);await p.mouse.wheel(0,300);await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>scrollY),y);
      await verifyPalette(p,{route:"/ open mobile drawer",width,theme});
      // Check the stable signal surface as well as individual text contrast.
      const colors=await p.locator("#site-menu").evaluate(e=>({bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e).color}));
      assert.deepEqual(colors,{bg:"rgb(39, 46, 228)",fg:"rgb(242, 242, 233)"});
      await p.keyboard.press("Escape");await closed();assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
      await opener.click();await p.locator("[data-menu-close]").click();await closed();
      await opener.click();await p.waitForTimeout(200);await p.mouse.click(5,100);await closed();
      await opener.click();await p.getByRole("navigation",{name:"All pages",exact:true}).getByRole("link",{name:"Blog",exact:true}).click();assert.ok(p.url().endsWith("/blog/"));
      await p.getByRole("navigation",{name:"Mobile navigation",exact:true}).getByRole("link",{name:"Contact",exact:true}).click();assert.ok(p.url().endsWith("/contact/"));
      assert.equal(await p.locator(".mobile-nav a[href=\"/contact/\"]").getAttribute("aria-current"),"page");
      await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(150);
      const clear=await p.evaluate(()=>document.querySelector("footer").getBoundingClientRect().bottom <= document.querySelector(".mobile-nav").getBoundingClientRect().top+1);assert.ok(clear,"Footer clear of bottom nav");
      await p.locator("[data-menu-open]").click();await p.setViewportSize({width:1024,height:900});await closed();
      assert.equal(await p.locator(".brand").evaluate(e=>e===document.activeElement),true);
    }
    for(const width of [801,1024,1440,1920]) for(const theme of ["dark","light"]){
      await p.setViewportSize({width,height:900});await load("/",theme);
      const desktop=p.getByRole("navigation",{name:"Main navigation",exact:true});
      assert.deepEqual(await desktop.locator("a").allTextContents(),["Services","Work","Pricing","About","Blog","Contact"]);
      assert.equal(await p.locator(".mobile-nav").isVisible(),false);
      assert.equal(await p.locator(".brand-tools .theme").count(),1);
      assert.equal(await desktop.locator("a").first().evaluate(e=>getComputedStyle(e).fontSize),"16px");
      await verifyCapabilities(p,width,theme);
      const alignment=await p.evaluate(()=>({nav:document.querySelector(".masthead > nav").getBoundingClientRect().right,header:document.querySelector(".masthead").getBoundingClientRect().right}));
      assert.ok(Math.abs(alignment.nav-alignment.header)<1,`Right-aligned desktop nav ${width}/${theme}: ${JSON.stringify(alignment)}`);
      await p.evaluate(()=>scrollTo({top:600,behavior:"instant"}));await p.waitForTimeout(50);
      const sticky=await p.locator(".masthead-band").evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {top:r.top,left:r.left,right:r.right,width:document.documentElement.clientWidth,bg:s.backgroundColor,border:s.borderBottomColor,borderWidth:s.borderBottomWidth}});
      assert.equal(sticky.top,0);assert.equal(sticky.left,0);assert.equal(sticky.right,sticky.width);assert.equal(sticky.bg,"rgb(39, 46, 228)");assert.equal(sticky.border,"rgb(242, 242, 233)");assert.equal(sticky.borderWidth,"1px");
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Desktop overflow at ${width}`);
      await desktop.getByRole("link",{name:"Contact",exact:true}).click();assert.ok(p.url().endsWith("/contact/"));
    }
    // Every service destination is reachable through real drawer links.
    await p.setViewportSize({width:375,height:900});
    for(const slug of ["web-design","development","hosting","agentic-setups","consulting","contract-work"]){
      await load("/", "dark");await p.locator("[data-menu-open]").click();await p.locator(`#site-menu a[href="/services/${slug}/"]`).click();assert.ok(p.url().endsWith(`/services/${slug}/`));
    }
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});const offline=await nojs.newPage();
    await offline.goto(origin+"/");assert.ok(await offline.locator(".mobile-fallback").isVisible());assert.equal(await offline.locator("[data-menu-open]").isDisabled(),true);await offline.locator(".mobile-fallback a[href=\"/pricing/\"]").click();assert.ok(offline.url().endsWith("/pricing/"));await nojs.close();
    assert.deepEqual(errors,[]);
    console.log("Navigation: text-only fixed mobile bar; modal focus/Escape/backdrop/close/resize, service and page links, no-JS fallback; desktop sticky header, palette, menu size and capabilities gutters passed in both themes.");
  } finally {await p.close();}
}
