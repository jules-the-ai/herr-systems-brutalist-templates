# Brutalist sample-page inventory

The source of truth for internal pages is `src/brutalist/pages/manifest.json` and the corresponding `content.html` fragments. Run `node scripts/build-brutalist.mjs` to render every internal route through `scripts/brutalist-shell.mjs`. Do not edit generated `public/**/index.html`, run the retired profile generator, or extract content from generated pages during builds. The root homepage is maintained separately.

## Complete active route inventory

| Route | Type / sample | Source fragment |
| --- | --- | --- |
| `/` | Homepage | `src/brutalist/home.html` |
| `/templates/` | Template directory | `src/brutalist/pages/templates/content.html` |
| `/services/` | Services directory | `src/brutalist/pages/services/content.html` |
| `/services/billboard/` | Billboard directory variant | `src/brutalist/pages/services/billboard/content.html` |
| `/services/web-design/` | Web design detail | `src/brutalist/pages/services/web-design/content.html` |
| `/services/development/` | Development detail | `src/brutalist/pages/services/development/content.html` |
| `/services/hosting/` | Hosting detail | `src/brutalist/pages/services/hosting/content.html` |
| `/services/agentic-setups/` | Agentic setups detail | `src/brutalist/pages/services/agentic-setups/content.html` |
| `/services/consulting/` | Consulting detail | `src/brutalist/pages/services/consulting/content.html` |
| `/services/contract-work/` | Contract work detail | `src/brutalist/pages/services/contract-work/content.html` |
| `/case-studies/` | Case-study directory | `src/brutalist/pages/case-studies/content.html` |
| `/case-studies/maple-street-workshop/` | Maple Street Workshop | `src/brutalist/pages/case-studies/maple-street-workshop/content.html` |
| `/case-studies/fieldnote-operations/` | Fieldnote Operations | `src/brutalist/pages/case-studies/fieldnote-operations/content.html` |
| `/case-studies/northline-community/` | Northline Community | `src/brutalist/pages/case-studies/northline-community/content.html` |
| `/blog/` | Blog index | `src/brutalist/pages/blog/content.html` |
| `/blog/a-clearer-website/` | A clearer website starts with better questions | `src/brutalist/pages/blog/a-clearer-website/content.html` |
| `/blog/start-small-with-automation/` | Start small. Automate something useful | `src/brutalist/pages/blog/start-small-with-automation/content.html` |
| `/blog/what-good-hosting-should-cover/` | What should good website hosting cover? | `src/brutalist/pages/blog/what-good-hosting-should-cover/content.html` |
| `/about/` | About page | `src/brutalist/pages/about/content.html` |
| `/about/team/alex-morgan/` | Alex Morgan / demo profile | `src/brutalist/pages/about/team/alex-morgan/content.html` |
| `/about/team/sam-rivera/` | Sam Rivera / demo profile | `src/brutalist/pages/about/team/sam-rivera/content.html` |
| `/about/team/jordan-ellis/` | Jordan Ellis / demo profile | `src/brutalist/pages/about/team/jordan-ellis/content.html` |
| `/pricing/` | Pricing estimator | `src/brutalist/pages/pricing/content.html` |
| `/contact/` | Contact / message desk | `src/brutalist/pages/contact/content.html` |

**24 active routes total:** 1 root homepage + 23 generated internal pages. Two legacy `/archive/` pages remain archived and unmodified; they are not active samples.

## Shared intro and content contract

- Every internal fragment contains exactly one `<main id="main">`, one `.page-intro`, a breadcrumb `.breadcrumbs`, a single `h1`, and an introductory `.lead`. Intros previously outside `main` now belong inside it.
- Existing body classes and content classes are retained, including `.service-detail`, `.detail-overview`, `.detail-subtype`, `.detail-process`, `.article-prose`, `.case-main`, `.profile-main`, `.message-desk`, and `.pricing-main`. Heading IDs, section IDs, accessibility attributes, form field names, and input values remain stable.
- New service pages share the web-design detail structure. Each adds unique overview copy, fit, five typical inclusions, four native subtype disclosures, three process steps, two FAQs, and a scoped project CTA.
- `/services/` and `/services/billboard/` link each service card to its local detail route rather than a mailto jump. Existing anchor IDs remain valid.
- `/templates/` links every active route, including the homepage, directory variants, all six service details, three case studies, three articles, and three fictional profiles.

## JavaScript and safety boundaries

- Only `/pricing/` loads `pricing.js?v=services-3` (module) and `inquiry-form.js?v=worker-ready-1` (module). The pricing module continues to import the untouched `pricing-calculator.js?v=services-3`.
- Only `/contact/` loads `inquiry-form.js?v=worker-ready-1` and `contact.js?v=worker-ready-1` with `defer`. Other internal pages require only the shared shell app script.
- Script metadata uses `{src, type: "module"}` objects for the pricing modules and URL strings for the deferred contact scripts, matching the shared renderer contract.
- Both forms keep `data-endpoint-enabled="false"` and their existing disabled submit controls. Their action is now `#` and their native method is `dialog`, which does not perform an HTTP form submission even with JavaScript disabled. The shared form handler prevents submission and reports disconnected delivery. Do not change the method to GET/POST or add an API endpoint without a separately authorized integration.
- Contact hooks: `#inquiry-form`, `#inquiry-topic`, `#inquiry-name`, `#inquiry-email`, `#inquiry-message`, `#message-count`, `#send-inquiry`, `[data-inquiry-form]`, `[data-form-errors]`, `[data-submit-button]`, `[data-submit-status]`.
- Pricing hooks: `#estimate-form`, `[data-service-options]`, `[name="service"]`, `#template-count-output`, `#estimate-lines`, `#scope-summary`, all original estimate outputs, quote fields, and associated submit/status controls are preserved.
- No existing form/calculator JavaScript is modified. No production API, analytics, deployment, or live-site change is introduced.

## Disclosures and asset caveats

Concept case-study and fictional-profile disclosures, demo phone labeling, disconnected-form notices, and sample-pricing caveats are preserved. New content does not introduce real clients, staff, measured results, or guaranteed outcomes. Existing illustrations remain asset references; all presentation comes from the shared brutalist stylesheet and internal-page stylesheet, not the legacy page CSS. The shared design contract uses blue `#272ee4` as the general accent and lime `#bfff44` only in CTA areas.

Archived pages are intentionally excluded from the generator and this active index. They can retain the original design.

## Verification performed

- `node --check scripts/build-brutalist.mjs` passes.
- `node scripts/build-brutalist.mjs` writes all 23 internal routes from fragments.
- HTML parsing verifies exactly one main, h1, shared intro, lead, and breadcrumb per fragment; all 17 original main-content texts remain present, and fragment IDs are unique.
- A real local Chromium run visits all 23 generated routes with no page errors, verifies the template index links every route, opens the native subtype disclosures on all five new services, exercises contact counting and the disconnected-delivery message, and verifies a dynamic pricing selection.
- JavaScript-disabled Chromium checks native `form.submit()` on both forms without navigation, API calls, or non-GET requests.
- Shared-shell integration caveat discovered: if the shell always appends its own `id="project"` CTA, that conflicts with the six service-detail fragments’ original project section. Resolved in the shared shell: an existing closing CTA suppresses the generic extra CTA; any appended CTA uses the unique `site-contact` ID. Fragments retain existing local anchors intentionally.
