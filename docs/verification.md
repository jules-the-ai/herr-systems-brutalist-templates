# Verification and preview boundary

The new site is a separate design sample library, not a deployment of herrsystems.com.

## Executed checks

`npm test` successfully returned:

```text
Generated 23 brutalist internal sample pages from reusable source fragments.
Pricing model: 32 service combinations, deduplication, scope isolation, monthly separation, and bounds passed.
Expanded estimator: all services, both themes, 3 widths, reset. All service disclosures keyboard tested. No-JS forms: zero submissions.
{
  "pages": 24,
  "viewportThemeChecks": 240,
  "errors": [],
  "posts": [],
  "interactions": "passed"
}
```

The route matrix uses 320, 375, 720, 1024 and 1440px widths in dark and light modes. Screenshots and the full JSON report are generated under ignored `tests/results/`. Tests serve the build on an automatically chosen loopback port and tear it down afterward.

Visual inspection covered service details, light article, mobile contact, pricing, mobile About, template directory, a mobile case study, and a desktop staff profile. The main automated suite uses Chromium. An additional Firefox smoke run passed all 24 pages at 375px and 1440px in both themes (96 checks, no page errors or horizontal overflow). WebKit is unavailable on this host; physical iPhone Safari/native toolbar rendering is not claimed.

The shared renderer suppresses duplicate generic closing CTAs on pages that already have a purposeful contact/next-story/profile CTA. Original local anchor IDs are preserved, and duplicate document IDs are tested.

## Production isolation

- Source history is retained from jules-the-ai/herr-systems-templates.
- The new origin is jules-the-ai/herr-systems-brutalist-templates.
- Upstream push URL is explicitly disabled in the local clone.
- The production checkout is untouched; its pre-existing untracked static/css/ directory remains unmodified.
- The only new GitHub Actions workflow builds/tests and uploads verification artifacts; it does not deploy.
- No domain, Pages deployment, CMS, Worker or backend is connected.
- Contact/quote samples have explicit disconnected notices, delivery flags set false and native non-submitting form methods. Tests confirmed zero submissions even with JavaScript disabled.

## Preview

Temporary LAN server: http://192.168.0.129:8105/
All page samples: http://192.168.0.129:8105/templates/
Local source: /home/syzygy/herr-systems-brutalist-templates
The initial one-page concept remains separately available on port 8104.

## Revised blue-surface palette

The current `npm test` matrix additionally checks computed text/background contrast on every visible hero and emphasis panel, theme state, lime hero accents, the lighter warm-paper body, and absence of blue shadows behind lime buttons. Hero and estimate CTA hover/focus states are exercised in both themes. Normal copy must meet 4.5:1 and large text 3:1. All 240 route/width/theme combinations passed. Screenshots were visually inspected for desktop home in both themes, mobile light About, and desktop light pricing. A separate LAN-served smoke check populated all five service groups with managed hosting and verified the estimate text and CTA states in both themes. This revision was tested in Chromium; the earlier Firefox smoke above is historical, not a claim of rerunning Firefox for this palette update.

## Edge-to-edge menu and hero

The shared renderer now places the masthead and first main section in full-width blue bands, with constrained inner content. The hero stays inside the main landmark; remaining content retains its original maximum width and responsive gutters. The Chromium matrix now includes 1920px: 24 pages at six widths in both themes, 288 checks, all passed with no browser errors or POSTs. Computed checks assert viewport-edge band geometry, zero gap between menu and hero, preserved body container, and header/hero foreground contrast. A separate mobile smoke exercised expanded-menu contrast and actual Pricing navigation in both themes. Visual inspection covered wide light homepage, mobile light About, and desktop dark Pricing.
