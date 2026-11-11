import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.HERR_TEST_URL || "http://192.168.0.129:8105";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const posts = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") posts.push(r.url());
  });
  for (const width of [320, 375, 1440])
    for (const theme of ["dark", "light"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/pricing/");
      if (theme === "light")
        await page
          .getByRole("button", { name: "Switch to light theme", exact: true })
          .click();
      for (const service of [
        "web",
        "hosting",
        "agentic",
        "consulting",
        "contract",
      ])
        await page.locator(`[name=service][value=${service}]`).check();
      for (const group of await page.locator("[data-service-options]").all()) {
        assert.equal(await group.isVisible(), true);
        assert.equal(await group.isDisabled(), false);
      }
      await page.locator("#hosting").selectOption("managed");
      await page.locator("#consulting-hours").fill("3");
      await page.locator("#consulting-hours").dispatchEvent("change");
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Expanded estimator overflow at ${width}/${theme}`,
      );
      await page
        .getByRole("button", { name: "Reset selections", exact: true })
        .click();
      await page.waitForTimeout(40);
      assert.equal(await page.locator("#project-total").innerText(), "$0");
      assert.equal(
        await page.locator("[data-service-options=web]").isVisible(),
        false,
      );
    }
  for (const service of [
    "web-design",
    "development",
    "hosting",
    "agentic-setups",
    "consulting",
    "contract-work",
  ]) {
    await page.goto(base + "/services/" + service + "/");
    const item = page.locator(".detail-subtype").first();
    await item.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert.equal(await item.evaluate((e) => e.open), true);
  }
  await page.goto(base + '/pricing/');
  await page.locator('[name=service][value=consulting]').check();
  await page.locator('#quote-name').fill('Preview quote test');
  await page.locator('#quote-email').fill('preview@example.com');
  await page.locator('#quote-message').fill('Valid sample request; verify no delivery.');
  await page.locator('[data-submit-button]').click();
  assert.match(await page.locator('[data-submit-status]').innerText(), /not been sent|not connected/i);
  assert.deepEqual(posts, []);
  const offline = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 900 },
    }),
    p = await offline.newPage();
  const unsafe = [];
  p.on("request", (r) => {
    if (r.method() !== "GET") unsafe.push(r.url());
  });
  for (const route of ["/contact/", "/pricing/"]) {
    await p.goto(base + route);
    await p.locator("form").evaluate((f) => f.submit());
    await p.waitForTimeout(40);
    assert.ok(p.url().endsWith(route));
    assert.equal(await p.locator("[data-submit-button]").isDisabled(), true);
  }
  assert.deepEqual(unsafe, []);
  console.log(
    "Expanded estimator: all services, both themes, 3 widths, reset. All service disclosures keyboard tested. No-JS forms: zero submissions.",
  );
  await offline.close();
} finally {
  await browser.close();
}
