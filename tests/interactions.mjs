import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const base = process.env.HERR_TEST_URL || 'http://127.0.0.1:4198';
const server = process.env.HERR_TEST_URL ? null : spawn(process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4198', '--strictPort'],
  { stdio: 'inherit' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server?.exitCode != null) throw new Error('Preview server exited');
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert(ready, 'Preview server ready');
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
  const routes = ['/', '/services/', '/services/billboard/', '/services/web-design/',
    '/case-studies/', '/case-studies/maple-street-workshop/',
    '/case-studies/fieldnote-operations/', '/case-studies/northline-community/',
    '/about/', '/pricing/', '/blog/', '/blog/a-clearer-website/',
    '/blog/start-small-with-automation/', '/blog/what-good-hosting-should-cover/', '/contact/'];
  const cardCounts = { '/': 9, '/services/': 6, '/services/billboard/': 4,
    '/case-studies/': 3, '/about/': 3, '/blog/': 3 };
  let checked = 0;
  for (const width of [390, 800, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['dark', 'light']) {
      for (const route of routes) {
        await page.goto(base + route);
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        assert.equal(await page.locator('link[href*="interactions.css"]').count(), 1);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page overflow: ${route} ${width}`);
        const cards = page.locator('[data-interactive-card]');
        assert.equal(await cards.count(), cardCounts[route] || 0, `Expected card coverage: ${route}`);
        for (let i = 0; i < await cards.count(); i++) {
          const card = cards.nth(i);
          await card.scrollIntoViewIfNeeded();
          await page.waitForTimeout(60);
          const result = await card.evaluate(c => {
            const primary = c.querySelector('[data-card-link]');
            const rect = c.getBoundingClientRect();
            // Test card padding, artwork, and copy, not merely the visible CTA.
            const points = [[rect.x + 8, rect.y + 8], [rect.right - 8, rect.bottom - 8],
              [rect.x + rect.width / 2, rect.y + rect.height / 2]];
            const visible = points.filter(([x,y]) => x > 0 && x < innerWidth && y > 80 && y < innerHeight - 90);
            return { primary: !!primary, hits: visible.map(([x,y]) => document.elementFromPoint(x,y)?.closest('a')?.href === primary?.href) };
          });
          assert(result.primary && result.hits.length > 0 && result.hits.every(Boolean), `Whole-card anchor hit area: ${route} #${i} ${width}`);
          checked++;
        }
      }
    }
  }
  // Filled CTA hover/focus must retain a full-card overlay and readable text.
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const theme of ['dark', 'light']) {
    await page.goto(base + '/blog/');
    await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
    const feature = page.locator('.post-feature');
    const featureLink = feature.locator('[data-card-link]');
    for (const state of ['hover', 'focus']) {
      if (state === 'hover') await feature.hover();
      else { await page.mouse.move(0, 0); await featureLink.focus(); }
      await page.waitForTimeout(350);
      const style = await featureLink.evaluate(a => {
        const s = getComputedStyle(a);
        const luminance = color => {
          const values = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => {
            v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
          });
          return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
        };
        const fg = luminance(s.color), bg = luminance(s.backgroundColor);
        return { transform: s.transform, filter: s.filter,
          contrast: (Math.max(fg,bg) + .05) / (Math.min(fg,bg) + .05) };
      });
      assert.equal(style.transform, 'none', `CTA containment: ${theme} ${state}`);
      assert.equal(style.filter, 'none', `CTA filter: ${theme} ${state}`);
      assert(style.contrast >= 4.5, `CTA contrast: ${theme} ${state}`);
    }
    await feature.click({ position: { x: 8, y: 8 } });
    await page.waitForURL(base + '/blog/a-clearer-website/');
  }
  // Verify navigation by clicking plain card padding and keyboard activation.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  const service = page.locator('.service-grid article').first();
  await service.hover();
  await page.waitForTimeout(300);
  assert.equal(await service.evaluate(c => getComputedStyle(c, '::before').opacity), '0.5');
  await service.click({ position: { x: 8, y: 8 } });
  await page.waitForURL(base + '/services/web-design/');
  await page.goto(base);
  const primary = page.locator('.service-grid [data-card-link]').first();
  await primary.focus();
  assert.equal(await primary.evaluate(a => getComputedStyle(a, '::after').outlineStyle), 'solid');
  await page.keyboard.press('Enter');
  await page.waitForURL(base + '/services/web-design/');
  for (const theme of ['dark', 'light']) {
    await page.goto(base);
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const selector of ['.case-home-heading > a', '.hero .plain-link']) {
      const link = page.locator(selector);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(220);
      const before = await link.evaluate(a => getComputedStyle(a).color);
      await link.hover();
      await page.waitForTimeout(220);
      const after = await link.evaluate(a => getComputedStyle(a).color);
      assert.notEqual(before, after, `Text-link hover: ${theme} ${selector}`);
    }
  }
  for (const width of [320, 390, 600, 768, 800]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(base);
    const track = page.locator('.home-case-studies .case-grid');
    await track.scrollIntoViewIfNeeded();
    const layout = await track.evaluate(c => {
      const [first, second] = c.children;
      return { width: first.getBoundingClientRect().width, top1: first.offsetTop,
        top2: second.offsetTop, secondLeft: second.getBoundingClientRect().left,
        viewport: innerWidth, scroll: c.scrollWidth > c.clientWidth };
    });
    assert(Math.abs(layout.width - width * 2 / 3) < 1, 'Two-thirds viewport card width');
    assert.equal(layout.top1, layout.top2, 'Cards do not stack');
    assert(layout.secondLeft < width && layout.scroll, 'Next card preview and horizontal scrolling');
    await track.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    assert(await track.evaluate(c => c.scrollLeft > 0), 'Keyboard scroll works');
    const navTops = await page.locator('.mobile-nav > a, .mobile-nav > button').evaluateAll(a => a.map(x => x.getBoundingClientRect().top));
    if (width <= 720) assert.equal(new Set(navTops).size, 1, 'Mobile nav stays one row');
  }
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(base);
  const touchTrack = touchPage.locator('.home-case-studies .case-grid');
  await touchTrack.scrollIntoViewIfNeeded();
  const bounds = await touchTrack.boundingBox();
  const y = Math.max(110, Math.min(600, bounds.y + 100));
  const cdp = await touchContext.newCDPSession(touchPage);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y }] });
  for (let x = 280; x >= 70; x -= 30) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await touchPage.waitForTimeout(30);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touchPage.waitForTimeout(600);
  assert(await touchTrack.evaluate(c => c.scrollLeft > 0), 'Real touch swipe scrolls');
  assert.equal(new URL(touchPage.url()).pathname, '/', 'Swiping does not activate a card link');
  await touchTrack.locator('.case-card').nth(1).tap({ position: { x: 8, y: 8 } });
  await touchPage.waitForURL(base + '/case-studies/fieldnote-operations/');
  await touchContext.close();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.locator('.service-grid article').first().hover();
  assert.equal(await page.locator('.service-grid article').first().evaluate(c => getComputedStyle(c).transform), 'none');
  assert.deepEqual(errors, [], 'No JS errors or failed asset requests');
  console.log(`PASS: ${routes.length} routes, both themes, 3 viewport sizes, ${checked} card checks; slider, hover, keyboard, reduced motion, and asset checks.`);
} finally {
  await browser?.close();
  server?.kill();
}
