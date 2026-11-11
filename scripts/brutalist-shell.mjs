const links = [
  ["Services", "/services/"],
  ["Work", "/case-studies/"],
  ["Pricing", "/pricing/"],
  ["About", "/about/"],
  ["Blog", "/blog/"],
  ["Templates", "/templates/"],
];
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char],
  );
export function renderPage({
  title = "Herr Systems",
  description = "A retro-brutalist Herr Systems template exploration.",
  body = "",
  bodyClass = "",
  scripts = [],
}) {
  const nav = links
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("");
  const hasClosingCTA =
    /class="[^"]*(?:contact panel|blog-bottom|case-next|profile-connect)/.test(
      body,
    );
  const contact =
    bodyClass.includes("contact-page") ||
    bodyClass.includes("home-page") ||
    hasClosingCTA
      ? ""
      : `<section class="contact" id="site-contact"><div class="contact-top"><span>GOT A PROJECT? AN IDEA? A VERY OLD WEBSITE?</span><span>LET’S SORT IT OUT. ↙</span></div><h2>LET’S MAKE<br>SOMETHING <span>WORK.</span></h2><div class="contact-bottom"><p>Tell us what you’re working on.<br>We’ll help you figure out what comes next.</p><a class="button dark" href="/contact/">LET’S TALK ABOUT IT <span>↗</span></a></div></section>`;
  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#171916"><meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><title>${escape(title)} // Herr Systems — Brutalist concept</title><link rel="icon" type="image/png" href="/assets/mark.png"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="stylesheet" href="/brutalist.css?v=2"><link rel="stylesheet" href="/brutalist-pages.css?v=2"><script src="/brutalist.js?v=1" defer></script></head><body class="${escape(bodyClass)}"><div id="top" tabindex="-1"></div><a class="skip" href="#main">Skip to content</a><div class="preview-note">DESIGN EXPLORATION / TEMPLATE SAMPLES <span>NOT THE LIVE WEBSITE</span></div><header class="masthead"><a class="brand" href="/" aria-label="Herr Systems home"><span class="brand-mark" aria-hidden="true">H↗</span><span>HERR<br>SYSTEMS</span></a><nav aria-label="Main navigation">${nav}</nav><div class="header-actions"><button class="theme" type="button" aria-label="Switch to light theme" title="Switch theme">◐</button><a class="small-cta" href="/contact/">LET’S TALK ↗</a></div><details class="mobile-menu"><summary>EXPLORE THE SITE <span aria-hidden="true">+</span></summary><nav aria-label="Mobile navigation"><a href="/">Home</a>${nav}<a href="/contact/">Contact</a></nav></details></header>${body.includes("<main") ? body : `<main id="main">${body}</main>`}${contact}<footer><a class="footer-brand" href="/">HERR SYSTEMS<span>TECHNOLOGY, WITH A LITTLE PERSONALITY.</span></a><div><span>UNION, MO + REMOTE</span><a href="#top">BACK TO TOP ↑</a></div><nav class="footer-links" aria-label="Footer navigation"><a href="/">Home</a>${nav}<a href="/contact/">Contact</a></nav><p>DESIGN CONCEPT / NOT THE LIVE SITE / FORM DELIVERY DISCONNECTED</p></footer>${scripts.map((src) => (typeof src === "string" ? `<script src="${escape(src)}" defer></script>` : `<script type="module" src="${escape(src.src)}"></script>`)).join("")}</body></html>`;
}
