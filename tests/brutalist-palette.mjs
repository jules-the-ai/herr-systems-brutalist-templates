import assert from "node:assert/strict";

// Inspect real computed text/surface pairs, including inherited metadata and
// estimator content. This deliberately does not infer contrast from CSS tokens.
export async function verifyPalette(page, {route, width, theme}) {
  const context = `${route} ${width} ${theme}`;
  const result = await page.evaluate(() => {
    const blue = "rgb(39, 46, 228)", lime = "rgb(191, 255, 68)";
    const surfaces = [...document.querySelectorAll(".masthead-band,.hero,.page-intro,.rate,.estimate-summary,.mobile-estimate,.detail-fit,.profile-skill-panel,.profile-facts,.case-callout,.article-takeaway,.detail-process-panel,.post-feature")];
    const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
    const luminance = color => {
      const rgb = color.match(/[\d.]+/g).slice(0,3).map(Number).map(n => {n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4});
      return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722;
    };
    const contrast = (a,b) => {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    const failures = [], ratios = [];
    for (const surface of surfaces.filter(visible)) {
      if (getComputedStyle(surface).backgroundColor !== blue) failures.push(`Not blue: ${surface.className}`);
      if (getComputedStyle(surface).boxShadow !== "none") failures.push(`Offset panel shadow: ${surface.className}`);
      const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
      for (let node; (node = walker.nextNode());) {
        const e = node.parentElement;
        if (!node.textContent.trim() || !visible(e) || e.closest("svg,script,style")) continue;
        const s = getComputedStyle(e);
        let bg = "rgba(0, 0, 0, 0)";
        for (let a=e;a;a=a.parentElement) {
          bg = getComputedStyle(a).backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)") break;
        }
        const ratio=contrast(s.color,bg), large=parseFloat(s.fontSize)>=24 || (parseFloat(s.fontSize)>=18.66 && Number(s.fontWeight)>=700);
        ratios.push(ratio);
        if (ratio < (large ? 3 : 4.5)) failures.push(`${e.className || e.tagName}: ${node.textContent.trim().slice(0,70)} (${ratio.toFixed(2)}:1; ${s.color} on ${bg})`);
      }
    }
    for (const e of document.querySelectorAll("main .button")) {
      if (visible(e) && getComputedStyle(e).backgroundColor === lime && getComputedStyle(e).boxShadow.includes("39, 46, 228")) failures.push("Blue offset shadow behind lime button");
    }
    for (const e of document.querySelectorAll("main .service-entry")) {
      if (visible(e) && getComputedStyle(e).boxShadow !== "none") failures.push("Offset shadow behind service card");
    }
    const logo = document.querySelector(".masthead .brand-mark img");
    if (!logo || !logo.complete || !logo.naturalWidth || !logo.getAttribute("src").endsWith("/davy-hexagon-mark-pixel.svg")) failures.push("Missing live-site logo asset");
    if (logo) {
      const r=logo.getBoundingClientRect();
      if (Math.abs(r.width-r.height)>1 || r.width<40 || r.width>48) failures.push("Incorrect logo proportions");
      if (getComputedStyle(logo.parentElement).borderWidth !== "0px") failures.push("Obsolete boxed logo treatment");
    }
    const headerBand = document.querySelector(".masthead-band");
    const heroBand = document.querySelector("main>.hero-band");
    for (const e of [headerBand, heroBand]) {
      if (!e) { failures.push("Missing full-bleed band"); continue; }
      const r = e.getBoundingClientRect();
      if (Math.abs(r.left) > 1 || Math.abs(r.right - document.documentElement.clientWidth) > 1)
        failures.push(`Inset blue band: ${e.className} ${r.left}..${r.right}`);
      if (getComputedStyle(e).backgroundColor !== blue) failures.push(`Non-blue band: ${e.className}`);
    }
    if (headerBand && heroBand && Math.abs(headerBand.getBoundingClientRect().bottom - heroBand.getBoundingClientRect().top) > 1)
      failures.push("Gap between menu and hero");
    const content = document.querySelector("main>.page-content");
    if (!content || content.getBoundingClientRect().width > 1801) failures.push("Body content lost its container");
    const hero = document.querySelector(".hero,.page-intro");
    if (document.body.classList.contains("home-page")) {
      if (document.querySelector(".ticker") || document.querySelector("main").textContent.includes("DESIGN WITH INTENT")) failures.push("Homepage ticker remains");
      if (!document.querySelector(".page-content>:first-child")?.matches(".services")) failures.push("Services must follow homepage hero");
    } else {
      for (const e of [document.querySelector(".masthead"), hero]) {
        if (getComputedStyle(e).borderBottomWidth !== "0px") failures.push(`Hero divider remains: ${e.className}`);
      }
    }
    const title = document.querySelector(".hero .fun,.page-intro h1");
    return {failures, minimum:Math.min(...ratios), hero:!!hero, title:getComputedStyle(title).color, theme:document.documentElement.dataset.theme, background:getComputedStyle(document.body).backgroundColor};
  });
  assert.equal(result.theme, theme, context);
  assert.ok(result.hero, `Missing hero: ${context}`);
  assert.equal(result.title, "rgb(191, 255, 68)", `Hero accent: ${context}`);
  if (theme === "light") assert.equal(result.background,"rgb(242, 242, 233)",`Paper: ${context}`);
  assert.deepEqual(result.failures, [], `Palette contrast: ${context}`);
  // Exercise real pointer and keyboard states, not only default declarations.
  for (const button of await page.locator(".hero .button,.page-intro .button,.estimate-summary .button").all()) {
    if (!await button.isVisible()) continue;
    for (const state of ["hover","focus"]) {
      if (state === "hover") await button.hover(); else await button.focus();
      await page.waitForTimeout(170);
      const styles=await button.evaluate(e=>{const s=getComputedStyle(e);return {bg:s.backgroundColor,fg:s.color,shadow:s.boxShadow}});
      assert.equal(styles.bg,"rgb(191, 255, 68)", `${state} button fill: ${context}`);
      assert.equal(styles.fg,"rgb(23, 25, 22)", `${state} button ink: ${context}`);
      assert.equal(styles.shadow,"none", `${state} button shadow: ${context}`);
    }
  }
  await page.mouse.move(0,0);
  await page.evaluate(()=>{document.activeElement?.blur(); window.scrollTo(0,0)});
}
