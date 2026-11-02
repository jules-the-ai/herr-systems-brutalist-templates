import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.HERR_TEST_URL || 'http://127.0.0.1:8096';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const [width, columns] of [[320, 1], [390, 1], [640, 1], [720, 1], [800, 2], [1024, 3], [1440, 3]]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ['dark', 'light']) {
      for (const route of ['/', '/services/', '/services/web-design/']) {
        await page.goto(base + route);
        await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow: ${route} ${width}`);
        if (route === '/') {
          assert.equal(await page.locator('.service-grid article').count(), 6);
          assert.equal(await page.locator('.side-column').count(), 0);
          assert(!(await page.locator('main').innerText()).includes('QUICK LINKS'));
          assert.equal(await page.locator('.all-services-link').getAttribute('href'), '/services/');
          assert.equal(await page.locator('.service-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), columns);
          const images = await page.locator('.service-grid img').evaluateAll(async imgs => {
            await Promise.all(imgs.map(i => i.decode()));
            return imgs.map(i => ({ w: i.getBoundingClientRect().width, h: i.getBoundingClientRect().height }));
          });
          assert.equal(images.length, 6);
          assert(images.every(i => i.w === 88 && i.h === 66));
          for(const card of await page.locator('.home-services .service-grid article').all()) {
            const layout=await card.evaluate(e=>{
              const image=e.querySelector('img').getBoundingClientRect();
              const texts=[...e.querySelectorAll('h3,p,a')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,b:r.bottom,r:r.right};});
              const r=e.getBoundingClientRect();
              return {imageRight:image.right,imageBottom:image.bottom,texts,right:r.right,bottom:r.bottom};
            });
            if(width<=720) {
              assert(layout.texts.every(t=>t.x>=layout.imageRight+15),'All copy beside the art');
              assert(layout.texts.every(t=>t.r<=layout.right && t.b<=layout.bottom),'Card copy stays inside');
              assert(layout.texts[0].b<=layout.texts[1].y && layout.texts[1].b<=layout.texts[2].y,'Title/copy/link retain reading order');
            } else assert(layout.texts[0].y>=layout.imageBottom,'Desktop art stays above title');
          }

          for (const slug of ['consulting', 'contract-work']) {
            await page.locator(`.service-grid a[href="/services/#${slug}"]`).click();
            await page.waitForURL(`**/services/#${slug}`);
            assert.equal(await page.locator(`#${slug}`).count(), 1);
            await page.goto(base + '/');
          }
          await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
          await page.locator('.home-services').scrollIntoViewIfNeeded();
          if (width === 1440 || width === 390) await page.screenshot({ path: `/tmp/herr-services-home-${width}-${theme}.png` });
        } else if (route === '/services/') {
          assert.equal(await page.locator('.service-entry').count(), 6);
          assert((await page.locator('.directory-heading').innerText()).includes('06 SERVICES'));
          await page.locator('#consulting img').evaluate(i => i.decode());
          await page.locator('#contract-work img').evaluate(i => i.decode());
        } else {
          assert.equal(await page.locator('.detail-sidebar .mini-panel').count(), 1);
          const geometry = await page.locator('.detail-sidebar').evaluate(side => {
            const fit = side.querySelector('.detail-fit').getBoundingClientRect();
            const links = side.querySelector('.mini-panel').getBoundingClientRect();
            return { width: side.getBoundingClientRect().width, fitBottom: fit.bottom, linksTop: links.top,
              copyWidth: side.previousElementSibling.getBoundingClientRect().width };
          });
          assert(geometry.linksTop >= geometry.fitBottom);
          if (width >= 800) { assert(geometry.width <= 280); assert(geometry.copyWidth > geometry.width); }
          assert.equal(await page.locator('.detail-sidebar a').first().getAttribute('href'), '#project');
          if (width === 1440) { await page.locator('.detail-overview').scrollIntoViewIfNeeded(); await page.screenshot({ path: `/tmp/herr-services-detail-${theme}.png` }); }
        }
      }
      console.log(`PASS ${width}px ${theme}: ${columns} homepage columns, six services, valid destinations, sidebar below fit panel`);
    }
  }
} finally { await browser.close(); }
