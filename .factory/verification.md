# Independent verification — FAIL

**Work order:** `meal-plan-pantry-check-verify-1`  
**Candidate:** `419b10f8e2e6fc5ca4fed03bb10d51886ff6891a`  
**Live URL:** <https://meal-plan-pantry-check.sociobot.in/>  
**Verified:** 2026-08-28 (UTC)

## Verdict

**FAIL.** The client product and deployment are otherwise in good working order, but the production Sociobot license-verification endpoint did not rate limit the required burst. This is a mandatory acceptance check for a product with a server-side unlock endpoint.

## Blocking defect

| Severity | Evidence | Required resolution |
|---|---|---|
| High | `GET https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=<unique-token>`: 50 requests completed sequentially in 3.4 s all returned `200`; a subsequent 100-request burst at concurrency 25 likewise returned **100 × `200`**. No response returned `429` or a `Retry-After` header. | Apply a rate limit to the verification endpoint that returns `429` and a meaningful `Retry-After`; then repeat this check and record the first observed threshold. This belongs to the Sociobot API/deployment boundary, not the PWA source. |

## Other defects / release observations

| Severity | Evidence | Required resolution |
|---|---|---|
| Medium | The live HTML, service worker, hashed JS, CSS, manifest, legal pages, icons, and image assets all use `Cache-Control: public, must-revalidate, max-age=30`. Hashed JS/CSS are not long-lived immutable assets. | Configure immutable, long-lived caching for content-hashed assets; keep HTML and `sw.js` short-lived/revalidated. |
| Low | The live manifest is served as `application/octet-stream` rather than a web-manifest JSON type. Chromium still registered the service worker and rendered the app during this check. | Serve `/manifest.webmanifest` as `application/manifest+json` (or `application/json`) with an appropriate charset. |
| Low | The live response has HSTS, Referrer-Policy, `nosniff`, and DNS-prefetch control, but no Content-Security-Policy, Permissions-Policy, or frame-ancestors/X-Frame-Options policy was observed. | Add appropriate static-host response policies; preserve the permitted Sociobot API and checkout origins in CSP. |

## Fresh local verification

Performed from the clean candidate checkout after `npm ci` (60 packages audited; 0 vulnerabilities):

| Check | Result |
|---|---|
| `npm test` | PASS — 7/7 Vitest parser tests. |
| Type checking | PASS — `tsc --noEmit` is included in `npm run build`. No separate lint script is declared. |
| `npm run build` | PASS — generated `dist/`. Initial JS: 26.44 KB (10.17 KB gzip); CSS: 16.31 KB (4.34 KB gzip), within the 200 KB / 50 KB budgets. |
| `npm run test:e2e` | PASS — 4/4 Playwright tests: source-aware list, axe serious/critical scan, keyboard skip path, and saved offline reload. |
| Expanded desktop workflow | PASS — empty-submit and invalid-URL recovery; two source-linked recipes; serving scaling; simple mass/volume normalization; uncertainty annotation for `salt to taste`; explicit pantry subtraction; source arithmetic; shopping completion; refresh persistence; CSV export; 0.25 serving floor; four-recipe free limit; invalid JSON-import recovery. |
| Accessibility | PASS — `lang=en`, one h1, main landmark, image alt text, axe returned zero serious/critical violations on populated and empty flows. At 390 px, sequential Tab reached skip link, folio controls, link, all form controls, CTA, and restore summary; each had a 3 px `rgb(157, 37, 23)` focus outline. |
| Responsive / visual | PASS — inspected 1440×1000 and 390×844 renderings. The mobile document measured `scrollWidth=390`, `clientWidth=390`, and 16 px body text; no horizontal overflow or clipped controls observed. |
| Reduced motion | PASS — reduced-motion emulation gave `scroll-behavior: auto` and 0.01 ms animation duration. |
| Console/page errors | PASS — none during expanded local flow or fresh live load/license restoration. |
| PWA offline | PASS — saved recipe remained visible after `context.setOffline(true)` and reload with an active service worker. |
| PWA update | PASS — a controlled versioned-worker test produced the in-app “A fresh edition is ready. Update now” message and activated the replacement worker after activation. |

## Live deployment, privacy, and browser-policy evidence

- Every file in local `dist/` had the same SHA-256 digest as its corresponding live path, including HTML, JS, CSS, worker, manifest, legal pages, icons, and imagery. The live deployment therefore matches candidate `419b10f` exactly.
- Fresh live page load made requests only to `meal-plan-pantry-check.sociobot.in`; no analytics, font CDN, ad, or recipe-content request was observed. Restoring a deliberately invalid license added only `api.sociobot.in`, produced the expected “License no longer active” notice, and no console/page error.
- License verification permits the production app origin (`Access-Control-Allow-Origin: https://meal-plan-pantry-check.sociobot.in`), uses `Cache-Control: no-store`, and returned the expected invalid-token JSON response. No sign-in flow is present, so the Entra tenant requirement is not applicable.
- Live root headers observed: HTTPS, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`; caching and missing-policy observations are listed above.
- The app stores planning data in IndexedDB, keeps only license/verdict values in localStorage, exposes JSON/CSV export, and does not send recipe data to the network in normal use. Privacy and terms pages are live and linkable.

## Retest command set

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

After the API rate-limit and host-cache changes, repeat the production burst check against the verification endpoint, preserve the first `429` response headers, and update this report with the observed threshold and `Retry-After` value.
