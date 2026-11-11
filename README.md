# Herr Systems — Brutalist Templates

A separate, browsable design exploration derived from [jules-the-ai/herr-systems-templates](https://github.com/jules-the-ai/herr-systems-templates). This repository does **not** deploy to herrsystems.com and contains no production connection, CMS, credentials, or email backend.

## Design

The approved local concept extended across the page family: oversized VT323 pixel headings, DM Sans body copy, DM Mono labels, hard-edged geometry, off-white/charcoal surfaces, and blue `#272ee4` accents. Lime `#bfff44` is reserved for primary call-to-action areas. Pages load dark; the manual toggle changes the current page without storing a preference.

## Browse

Start at `/templates/` for the full sample directory. Samples cover the homepage; services directory and six service details; work directory and three substantial fictional case studies; About and three fictional staff profiles; blog and three articles; contact; and an interactive pricing estimator. The billboard route remains as a design sample. Demo staff, concept studies, and illustrative fixed-scope/monthly prices remain explicitly labeled.

See [page inventory](docs/page-inventory.md) for individual routes.

## Local setup

```sh
npm ci
npm run build
npm run preview -- --port 8105
```

Or serve the static output without Vite:

```sh
python3 -m http.server 8105 --bind 0.0.0.0 --directory /home/syzygy/herr-systems-brutalist-templates/dist
```

Temporary LAN preview: http://192.168.0.129:8105/
Full template directory: http://192.168.0.129:8105/templates/

## Edit and build

- `src/brutalist/home.html` — approved concept homepage body.
- `src/brutalist/pages/` — editable internal-page content fragments.
- `scripts/brutalist-shell.mjs` — shared document, navigation, CTA and footer.
- `scripts/build-brutalist.mjs` — internal sample generation.
- `public/brutalist.css` — shared shell and homepage design.
- `public/brutalist-pages.css` — internal-page design system.
- `public/brutalist.js` — manual theme and native mobile-menu behavior.
- `public/pricing-calculator.js`, `public/pricing.js` — inherited estimator model and interactions.
- `public/inquiry-form.js`, `public/contact.js` — inherited disconnected validation and contact interactions.

`npm run build` regenerates the root homepage and all active internal pages, then copies static assets into `dist/`. No deployment commands run. Generated internal `public/**/index.html` pages should not be hand-edited; change their source fragments instead. The original SCSS/Vite template assets and archived pages are retained as upstream reference, not loaded by the new active pages. Legacy design-specific tests are retained for reference; the supported suite is `npm test`.

## Verification

```sh
npx playwright install chromium
npm test
```

The test builds the exact static output, starts a temporary loopback server on an automatically chosen port, exercises active pages at five screen widths in both themes, checks internal destinations/fragments and assets, saves desktop/mobile screenshots, verifies theme switching/mobile navigation, and exercises disconnected contact and estimator controls. Reports live in ignored `tests/results/`.

## Safety boundary

- No production deployment workflow, custom domain, Pages publishing, Worker, or CMS is configured.
- Source repository remains a read-only upstream; pushes go only to this new repository.
- All forms have delivery disabled. JavaScript validates locally and reports that nothing was sent. No form details are stored. Direct email links explicitly open the user's mail app.
- Robots metadata and `robots.txt` request no indexing.
- Inherited fictional profiles/case studies and pricing samples are not claims about real clients, staff, or guaranteed outcomes.
- Existing archived designs are historical references and may retain their original colors.

## Provenance

Based on upstream commit `fcce399` with the shared source history retained. Homepage composition comes from the separately approved local retro-brutalist concept. Local display mockups are illustrations, not screenshots of client products. Reused original SVG assets come from the upstream template; font license notices ship with the local font files.
