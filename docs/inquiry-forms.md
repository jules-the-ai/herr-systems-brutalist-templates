# Contact and quote forms: Cloudflare Worker handoff

The contact and pricing routes now contain real POST forms, not mailto draft builders. Delivery is deliberately OFF: both forms have `action="/api/inquiries"`, `method="post"`, and `data-endpoint-enabled="false"`. Valid submission currently reports that delivery is not connected; it sends no network request. Direct email remains available. No Worker, email provider, credentials, database, or Cloudflare account was configured by this change.

## Files and frontend behavior

- `public/inquiry-form.js` shares required/whitespace/email/length validation, focused error summaries, pending/duplicate guards, success, rate-limit and failure states between both forms.
- `public/contact.js` maintains the message character count.
- `public/pricing-calculator.js` calculates illustrative estimates, filters features against selected services, and bounds numeric input. Only selected service options appear in the quote snapshot.
- Forms initialize their submit buttons with JavaScript; no-JS visitors receive a direct-email alternative. No personal information or project selections are persisted to cookies, localStorage, or query strings by these scripts.
- Inputs remain intact after failure or success. The request is a snapshot; edits made while it is pending are not overwritten. A pending request is not cancelled by editing/resetting the form.

## Request contract

Enable a same-origin Worker route at `/api/inquiries` (or change both form actions to the deployed same-origin path). Requests use POST, Content-Type application/json, Accept application/json. Redirects are rejected. Timeout is 15 seconds; a timeout is an uncertain outcome, not proof that the backend failed. No automatic retries are performed.

```json
{
  "schemaVersion": 1,
  "kind": "contact",
  "contact": {
    "name": "Example Person",
    "email": "person@example.com",
    "business": "Example Organization",
    "website": "example.com"
  },
  "topic": "web",
  "message": "Project details"
}
```

Quote requests use `kind: "quote"` and additionally include `services`, `options`, and `estimate` from the pricing form's `buildInquiryPayload()`. Service keys: `web`, `hosting`, `agentic`, `consulting`, `contract`. See that function and the pure model for the exact option keys and normalized estimate shape. Estimates are advisory client data, NEVER authoritative invoices or prices accepted by the server. Recalculate from trusted rules if the backend needs pricing.

Success MUST return a 2xx JSON response with `{ "ok": true }` only after the inquiry is durably accepted (for example into a queue or acknowledged by a delivery provider). The UI says "received", not "delivered to an inbox". Static-host HTML fallback, a generic 200 response, `{ "ok": false }`, invalid JSON, redirects, and any non-2xx response are NOT success. Use 400/422 for validation, 429 for throttling, and 5xx for server failures. Do not echo submitted text or provider errors into HTML. Response bodies are not rendered as HTML by the frontend.

## Before enabling

1. Deploy and test a Worker with server-side JSON size limits; schema/type/length checks (name100, email254, business150, website300, message3000); trimmed required name/email/message; allowed topic/service/option keys; numeric bounds; and at least one selected service for quotes. Client validation is bypassable.
2. Add rate limits and deliberate anti-abuse measures (Turnstile if needed), origin checks, and delivery monitoring. A frontend endpoint flag or an origin header alone is not authorization or spam protection. Keep email-provider secrets only in Worker bindings. Never use an untrusted email address as an arbitrary From header; validate Reply-To and prevent header injection. Escape template content.
3. Decide retention, privacy notice, logging/redaction, provider ownership, duplicate/idempotency handling, and what constitutes durable receipt. Timeouts or ambiguous network errors may already have accepted a message; design the server to avoid duplicate processing.
4. Test actual receipt, provider failure, malformed payloads, spam limits, 429s, timeouts, oversized requests, and retry semantics in a staging environment. Browser tests use intercepted fixtures and are not proof of real email delivery.
5. Update public delivery/privacy copy on BOTH pages and set `data-endpoint-enabled="true"` on both forms only after verification. Keep the Worker same-origin; cross-origin actions are intentionally rejected by this frontend.
6. Verify the real mailbox and replace the clearly fictional phone preview before launch. No private Cloudflare credentials are needed in this repository.

## Tests

Build and serve `dist/` via the existing Vite preview. Run:

```
npm run build
HERR_TEST_URL=http://127.0.0.1:8096 node tests/inquiry-forms.mjs
HERR_TEST_URL=http://127.0.0.1:8096 npm run test:pricing
```

The form suite covers validation, the disabled endpoint guard, JSON payloads, acknowledged success versus HTML/false acknowledgements, HTTP/network failures, the real 15-second client timeout without automatic retry, duplicate in-flight submissions, preserved edits, same-origin guard, no-JS fallback, and narrow/wide layouts in both themes. All simulated delivery responses are intercepted Playwright test fixtures, never a claim that a live Worker was deployed.
