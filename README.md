# Herr Systems Templates

A retro-signal local-business site template for Herr Systems. The homepage shell is preserved in `index.html`. Service routes in `public/services/` reuse that same header, footer, theme script, and `public/retro3.css` shell stylesheet; Vite copies those static routes into `dist/`.

## Pages

- `/` — homepage
- `/about/` — About page with story, principles, staff headshots, approach, and contact. Edit `public/about/index.html` and `src/about.scss` (compiled to `public/about.css`).
- `/services/` — main service directory, with exterior billboard
- `/services/billboard/` — retained preview URL for the approved exterior-billboard design. Shared billboard styles live in `src/services-billboard.scss` and compile to `public/services-billboard.css`. Reduced-motion preferences disable the slow pixel drift.
- `/services/web-design/` — business-focused service detail template; edit the content here and layout in `src/service-detail.scss` (compiled to `public/service-detail.css`). Reuses the approved billboard, shell, header, footer, and original design illustration.
- `/archive/services-contained/` — preserved older directory with its intro inside the shell.
- `/archive/web-design-original/` — preserved previous Web Design template.

## Editing styles

The site uses a two-stage SCSS + Tailwind v4 pipeline:

- Make custom component/layout changes in `src/styles.scss`.
- Use Tailwind utilities directly in HTML where useful; Tailwind's entry lives in `src/styles.css`.
- The service directory’s layout is edited in `src/services.scss`; the styles task compiles it to `public/services.css`. Bump its stylesheet query in `public/services/index.html` when changing directory styling.
- `src/generated.css` is a generated Sass artifact and intentionally ignored.
- Original service illustrations live in `public/assets/services/` as editable pixel-grid SVGs. Each has a 192 × 144 viewBox, `preserveAspectRatio="xMidYMid meet"`, and crisp-edge rendering. The directory displays them with proportional width and automatic height; do not assign independent fixed heights.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` compiles SCSS, runs Tailwind/Vite, and writes a deployable multi-page site to `dist/`.

## Archived logo source

`assets/davy-hexagon-mark.png` is the cropped hexagon mark from Emily’s archived davy.in logo: https://web.archive.org/web/20190117154612im_/http://davy.in/images/logo_small.png

## Staff preview

The About page uses explicitly labeled sample profiles, not real staff claims. Replace staff names, roles, bios, and `public/assets/about/headshot-*.svg` with actual details and photos. Photos use a 6:7 desktop crop and square mobile crop with `object-fit: cover`; adjust `object-position` per image as needed. Remove the STAFF PREVIEW label, preview note, and HEADSHOT overlays when final content is ready. All preview illustrations are original local SVGs.

## Blog templates

- `/blog/` — featured story plus two article cards.
- `/blog/a-clearer-website/` — full article template with top featured image, caption, byline, reading-time label, contents navigation, pull quote, takeaway, and author block.
- `/blog/start-small-with-automation/` and `/blog/what-good-hosting-should-cover/` — additional sample articles so every index card opens a real page.

Edit static content in `public/blog/` and component styles in `src/blog.scss` (compiled to `public/blog.css`). These are demonstration editorial entries for the template, not a CMS or automated publishing system. Reading times are editorial labels. To add a post, copy an article directory, update its title/description, breadcrumb, copy, metadata, contents links, and card on the index. Replace the article-cover image src/alt and matching index image with your own image; 1200 × 630 is recommended. Images have explicit dimensions and responsive sizing. Remove the entire `figure.article-cover` when a post has no featured image; no empty image container or script depends on it. The committed SVG illustrations are original and locally served. Shared shell files and archived designs are unchanged apart from navigation links on active pages.

## Case studies

`/case-studies/` lists three fictional concept projects; each card has a complete detail page. `/case-studies/maple-street-workshop/` is the lead example. Homepage previews appear immediately before the contact section. Edit `public/case-studies/`, `src/case-studies.scss`, and original SVG interface illustrations in `public/assets/case-studies/`. All concept/client-status disclosures are deliberate: replace them only with verified project details and authorized client assets. Do not turn proposed outcomes into measured results or add invented testimonials. The single-page structure covers brief, discovery, decisions, before/proposed comparison, interface example, mobile behavior, technical boundaries, test plan, handoff, evaluation, and lessons. New Work links are in desktop navigation and replace the mobile Home slot to retain five usable slots; the global logo still links home.

## Contact / message desk

`/contact/` keeps the global header, site shell, footer, and theme script, with a distinct internal message-desk layout. Edit `public/contact/index.html`, `src/contact.scss`, and `public/contact.js`. Contact menus across active pages point here. Email uses the existing site address, `hello@herrsystems.com`; verify the mailbox before a real launch. The phone number `(314) 555-0142` is a clearly labeled reserved fictional preview number: replace both its visible text and `tel:` destination before launch. No actual business phone was supplied.

The form is a functioning client-side email-draft builder, not a server-side delivery endpoint. It validates required fields and email format, prepares a reviewable draft, then offers an explicit mailto link and copy/manual-copy fallback. Nothing is automatically sent, posted, logged, or stored by the form. No secrets or contact data are placed in this website’s query string or local storage. Editing any field invalidates the prepared draft. Without JavaScript the builder stays disabled and the direct email link remains available. Connect and verify a server-side endpoint (validation, abuse controls, delivery errors, retention/privacy policy) before changing this flow into direct web submission; never display “message sent” unless delivery actually succeeds.


## Card and link interactions

Current templates load `public/interactions.css` after page styles. Archived designs are intentionally unchanged. `data-interactive-card` opts a card into the neon edge glow; mark its primary native anchor with `data-card-link` to stretch its hit area over the entire card. Keep that link static-positioned and avoid positioned ancestors between it and its card, so its pseudo-element is anchored to the card. No click-handler JavaScript or nested anchors are needed; Enter, modifier-click, and the browser context menu still work. Staff preview cards link to the contact page rather than invented staff profiles. Multi-link navigation panels retain their individual destinations.

The homepage case-study grid becomes a native horizontal scroll-snap slider at 800px and below. Cards are `66.6667vw` wide, exposing the next study. The focusable track supports keyboard scrolling and displays a swipe hint. The case-study index retains its existing responsive grid. Reduced-motion preferences remove card movement and transitions. Normal text links shift to lime on dark surfaces or a readable dark green on light surfaces.

Run browser regression checks (Node 20+):

```bash
npm ci
npx playwright install chromium
npm test
```

The test builds production output, temporarily starts Vite preview on loopback port 4198, and checks all 14 current routes in both themes at mobile/tablet/desktop sizes, card hit targets, hover/focus styling, actual card navigation, keyboard scrolling, mobile next-card previews, reduced motion, and asset/JavaScript errors. To test another running preview, set `HERR_TEST_URL` to its origin.


## Pricing estimator and navigation

`/pricing/` is a client-side estimator using the approved page shell. The confirmed hourly rate is $70; the calculator’s fixed-scope feature prices and monthly plans are illustrative samples, not automatic quotes or guaranteed discounts.

- Pricing model: `public/pricing-calculator.js` (pure calculation with bounded template counts and deduplicated features).
- UI: `public/pricing/index.html`, `public/pricing.js`, `src/pricing.scss`.
- When changing sample prices, update the visible option labels and calculator model together.
- No selections are submitted or persisted. The quote button opens an encoded, reviewable email draft. It does not send email.
- Monthly hosting/support is shown separately and never added to the one-time project total. External subscriptions, usage, processing, domains, taxes, and unscoped work are excluded.
- Shared desktop navigation is Services (All services + six services), Work, Pricing, About (About us + Blog), Contact. Mobile retains four slots: Services, Work, Contact, More. More opens a modal offcanvas drawer with Home, All services, Work, Pricing, About us, Blog, Contact, and six individual service links. Native dialog semantics, explicit keyboard focus wrapping, backdrop/Escape/close dismissal, scroll locking, and viewport-change cleanup are handled by navigation.js. Without JavaScript, a footer link list provides a fallback.
- Native details dropdowns work without JavaScript; `public/navigation.js` adds Escape, outside-click, and focus dismissal. Source styles are `src/navigation.scss`.
- Run `npm run build`, serve `dist/` via the existing preview, then `HERR_TEST_URL=http://127.0.0.1:8096 npm run test:pricing` and `HERR_TEST_URL=http://127.0.0.1:8096 npm run test:services`. `npm test` starts its own preview for the general interaction suite.

The estimator counts reusable page templates (distinct layouts), not individual content pages. Multiple pages sharing a template are not charged as additional templates. Content entry/migration and custom functionality are scoped separately.

Navigation regression: `HERR_TEST_URL=http://127.0.0.1:8096 node tests/navigation.mjs` verifies actual desktop dropdown destinations and mobile drawer touch destinations, modal focus, scroll lock, dismissal, and same-page service anchors. `node tests/mobile-navigation-art.mjs` verifies compact artwork states.
