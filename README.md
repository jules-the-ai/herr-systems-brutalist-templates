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


## Staff profiles

Three fictional demo profiles share one staff-single design:
- `/about/team/alex-morgan/` — Design and strategy
- `/about/team/sam-rivera/` — Development and systems
- `/about/team/jordan-ellis/` — Client care and projects

Edit `src/data/staff.json` for names, roles, bios, skills, working approach, example responsibilities, interests, and related-service links. `scripts/build-staff.mjs` regenerates the About team cards and all profile pages with `npm run profiles`; both `npm run dev` and `npm run build` run it automatically. The current About page supplies the approved global shell/navigation/footer, keeping generated profiles aligned with it. Profile styling is in `src/staff-profile.scss`, compiled into `public/staff-profile.css`.

Do not hand-edit generated profile HTML. Keep sample identities and artwork labeled as demos until real staff content is supplied. The contact buttons go to the real contact template; no personal contact channels or credentials are fabricated. If removing or renaming a profile, also remove its old generated directory after checking that existing links have been updated.

After building and serving dist, run `HERR_TEST_URL=http://127.0.0.1:8096 npm run test:staff` to check three profiles, five viewport widths, both themes, portrait geometry, mobile gutters, section/fragment links, offcanvas, and navigation from team cards. The general interaction suite also covers the three profile routes.


## Homepage mock terminal

The homepage hero replaces its decorative monitor with a working browser-only terminal in an equal-width right column above 1000px. It stacks after the introduction on compact screens, retaining the standard mobile menu and a theme-stable dark terminal surface.

- Implementation: `src/mock-terminal.js`; styles: `src/home-terminal.scss`; markup: homepage `index.html`. Vite bundles the module and styles into production assets.
- Start with `herr -services`, `herr -help` in the command input. Additional commands include `herr -pages`, `herr -about`, `herr -work`, `herr -pricing`, `herr -contact`, `herr -blog`, `herr -team`, `herr -history`, and `clear`. `herr -open web-design` (or another allowlisted page name) actually navigates to its local page. List results contain working native site links.
- `herr -chat "I need a website"` produces explicitly scripted local replies covering websites, hosting, automation, pricing, and contact. This is NOT connected to an AI model or a shell. No questions or commands are stored, sent, or executed. A future live-chat integration requires a deliberately scoped backend and revised privacy/error handling; never put model credentials in this frontend.
- Arrow Up/Down recalls an in-memory history and restores a pending draft. Tab completes a unique partial command without trapping focus on a completed command. Escape clears the input. Output and history are bounded. Responses use textContent rather than interpolated HTML; open destinations are allowlisted.
- Inputs start disabled until initialization; no-JS users see a direct Services link. The initial welcome remains visible without scripting.
- Build and serve the output, then run `npm run test:terminal` (or set `HERR_TEST_URL`). Tests cover eight widths/both themes, equal hero columns, command output, all local destinations, history/completion, literal HTML handling, real pointer/touch links, no-JS fallback, and no API requests or form submissions.


### Pixel-art navigation mark

Active headers use `/assets/davy-hexagon-mark-pixel.svg`, a transparent 32×32-grid reinterpretation of the original `davy-hexagon-mark.png` alpha silhouette. Its original dominant lime (#ccff00), proportions, nav sizing, and outer/inner hexagons are preserved; only the edges gain restrained pixel stepping. Original PNGs, favicons, About hero art, and archived page headers remain unchanged. The staff generator inherits the navigation asset from the About shell. Verify with `node tests/nav-pixel-logo.mjs` against the built preview.


### Dark default and footer return link

Every active page starts dark, independent of operating-system preference or old stored theme settings. The manual header switch changes the current page; reloads and new-page navigation start dark again. Shared `retro3.js` does not access storage. Active routes cache-bust the shared script.

`#top` is a dedicated zero-height, focusable anchor at the start of the body, not the sticky header or homepage hero. Footer links use that real document-start anchor and work natively with or without JavaScript. Staff pages inherit both fixes from the About shell. Verify with `node tests/theme-and-top.mjs` after building and serving.


### Unified mobile masthead and Safari safe area

All active routes share the homepage's non-sticky top masthead at widths up to 720px. The fixed bottom navigation and desktop sticky navigation are unchanged. The shared navigation stylesheet owns this rule, avoiding the internal-page CSS-order mismatch. Every active page declares `viewport-fit=cover`, retains a static `theme-color` of #164f91, and uses a matching mobile root background plus header `env(safe-area-inset-top)` padding. This lets the blue masthead extend into an iPhone safe area without placing its controls under the Dynamic Island. The manual theme toggle does not change Safari's static chrome color. Physical iPhone Safari chrome cannot be verified from a headless page screenshot; check the LAN preview on the device as well.


### Safari tint: physical-device feedback

The experimental fixed `.safari-top-tint` layer was removed after Emily reported that it failed to change native Safari tint and instead introduced a visible fixed thin blue line below the safe area. Do not reintroduce that overlay. `node tests/mobile-no-top-overlay.mjs` asserts that no top-edge fixed strip is present while retaining non-sticky mobile mastheads and fixed bottom navigation. Viewport-fit, safe-area layout padding, and static theme-color metadata remain, but they have NOT solved native iPhone Safari tinting. Further changes require the device's iOS version and screenshot/remote-inspection evidence, not another Chromium-only tint workaround.
