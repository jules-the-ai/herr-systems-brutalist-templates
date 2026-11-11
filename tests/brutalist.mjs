import { verifyNavigation } from "./brutalist-navigation.mjs";
import { verifyPalette } from "./brutalist-palette.mjs";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve("dist"),
  results = [],
  pages = [],
  faults = [],
  posts = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "archive") continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name === "index.html")
      pages.push(
        "/" +
          path
            .relative(root, file)
            .replaceAll(path.sep, "/")
            .replace(/index\.html$/, ""),
      );
  }
}
await walk(root);
pages.sort();
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    let file = path.resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://local").pathname),
    );
    if (!file.startsWith(root + path.sep) && file !== root)
      throw Error("Outside root");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => faults.push(e.message));
  page.on("request", (req) => {
    if (req.method() === "POST") posts.push(req.url());
    if (!req.url().startsWith(origin) && !req.url().startsWith("data:"))
      faults.push("External request: " + req.url());
  });
  page.on("response", (res) => {
    if (res.status() >= 400) faults.push(`${res.status()} ${res.url()}`);
  });
  const index = new Map();
  await mkdir("tests/results", { recursive: true });
  for (const route of pages) {
    for (const width of [320, 375, 720, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(origin + route);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map(async (image) => {
            image.loading = "eager";
            try {
              await image.decode();
            } catch {}
          }),
        );
      });
      for (const theme of ["dark", "light"]) {
        if (theme === "light")
          await page
            .getByRole("button", { name: "Switch to light theme", exact: true })
            .click();
        const data = await page.evaluate(() => ({
          route: location.pathname,
          width: innerWidth,
          theme: document.documentElement.dataset.theme,
          overflow: document.documentElement.scrollWidth > innerWidth,
          h1: document.querySelectorAll("main h1").length,
          main: document.querySelectorAll("main#main").length,
          oldCSS: [...document.querySelectorAll("link[rel=stylesheet]")].some(
            (e) => /retro3|navigation\.css|interactions\.css/.test(e.href),
          ),
          formSafe: [...document.forms].every(
            (e) => e.dataset.endpointEnabled === "false",
          ),
          images: [...document.images]
            .filter((e) => !e.complete || !e.naturalWidth)
            .map((e) => e.src),
          ids: [...document.querySelectorAll("[id]")].map((e) => e.id),
          links: [...document.querySelectorAll("a[href]")].map((e) =>
            e.getAttribute("href"),
          ),
        }));
        assert.equal(
          data.overflow,
          false,
          `Overflow: ${route} ${width} ${theme}`,
        );
        assert.equal(data.theme, theme, `Theme: ${route} ${width}`);
        assert.equal(data.h1, 1, `h1: ${route}`);
        assert.equal(data.main, 1, `main: ${route}`);
        assert.equal(data.oldCSS, false, `Old shell: ${route}`);
        assert.equal(data.formSafe, true, `Unsafe form: ${route}`);
        assert.deepEqual(data.images, [], `Broken image: ${route}`);
        assert.equal(
          new Set(data.ids).size,
          data.ids.length,
          "Duplicate IDs: " + route,
        );
        await verifyPalette(page, { route, width, theme });
        results.push({ route, width, theme });
        index.set(route, data);
        if ([375, 1440].includes(width))
          await page.screenshot({
            path: `tests/results/${route.replaceAll("/", "_") || "home"}-${width}-${theme}.png`,
            fullPage: true,
          });
      }
    }
  }
  for (const [route, data] of index) {
    for (const raw of data.links) {
      if (/^(mailto:|tel:|https?:|javascript:)/.test(raw)) continue;
      const link = new URL(raw, origin + route);
      if (link.origin !== origin) continue;
      const target = index.get(link.pathname);
      if (!target) {
        if (link.pathname.startsWith("/archive/")) continue;
        let file = path.join(root, link.pathname);
        assert.ok(
          await stat(file).catch(() => null),
          `Missing destination ${route} -> ${raw}`,
        );
        continue;
      }
      if (link.hash)
        assert.ok(
          target.ids.includes(decodeURIComponent(link.hash.slice(1))),
          `Missing fragment ${route} -> ${raw}`,
        );
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(origin + "/");
  await page.locator("[data-menu-open]").click();
  await page
    .getByRole("navigation", { name: "All pages" })
    .getByRole("link", { name: "Blog", exact: true })
    .click();
  assert.ok(page.url().endsWith("/blog/"));
  await page.locator("[data-menu-open]").click();
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#site-menu").evaluate((e) => e.open),
    false,
  );
  await page.goto(origin + "/contact/");
  const contact = page.locator("[data-inquiry-form]");
  await contact.locator("[name=name]").fill("Local preview");
  await contact.locator("[name=email]").fill("preview@example.com");
  await contact.locator("[name=message]").fill("Testing the sample only.");
  await contact.locator("[data-submit-button]").click();
  await page.waitForTimeout(100);
  assert.match(
    await page.locator("[data-submit-status]").innerText(),
    /not been sent|not connected/i,
  );
  await page.goto(origin + "/pricing/");
  const service = page.locator("[name=service][value=web]");
  await service.check();
  await page.locator("[name=templates]").focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 7; i++) await page.keyboard.press("ArrowRight");
  const total = await page.locator("#project-total").innerText();
  assert.notEqual(total, "$0");
  await page.locator("[name=service][value=hosting]").check();
  assert.equal(
    await page.locator("[data-service-options=hosting]").isVisible(),
    true,
  );
  await service.uncheck();
  assert.equal(
    await page.locator("[data-service-options=web]").isVisible(),
    false,
  );
  assert.deepEqual(posts, [], "Preview sent POST requests");
  assert.deepEqual(faults, [], "Browser errors");
  await verifyNavigation(browser, origin);
  process.env.HERR_TEST_URL = origin;
  await import("./brutalist-expanded.mjs");
  await writeFile(
    "tests/results/verification.json",
    JSON.stringify(
      {
        pages,
        viewports: results.length,
        errors: faults,
        posts,
        interactionChecks: [
          "mobile navigation",
          "Escape dismissal",
          "contact disconnected zero POST",
          "pricing service switching",
          "template total update",
        ],
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        pages: pages.length,
        viewportThemeChecks: results.length,
        errors: faults,
        posts,
        interactions: "passed",
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
