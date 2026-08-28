# Independent verification 2 — FAIL

**Work order:** `meal-plan-pantry-check-verify-2`  
**Candidate tested:** `419b10f8e2e6fc5ca4fed03bb10d51886ff6891a`  
**Live URL:** <https://meal-plan-pantry-check.sociobot.in/>  
**Verified:** 2026-08-28 UTC

## Verdict

**FAIL.** Fresh evidence shows the deployment exactly serves the candidate and the earlier production rate-limit failure is resolved. The candidate still misses two acceptance requirements: a rejected recipe submission destroys the user's entered recipe instead of allowing recovery, and production content-hashed assets are not given immutable long-lived caching. The latter is a deployment configuration issue; neither defect requires a conclusion about the Sociobot API's rate limiting.

## Defects

| Severity | Defect and evidence | Required resolution |
|---|---|---|
| Medium | **Validation destroys recipe input.** After entering `Pasta night`, `4`, `javascript:alert(1)`, and three ingredients, submitting produced the correct source-link error. The re-render left both `Recipe name` and `Ingredients` empty. The user must re-enter the recipe merely to correct its URL. | Retain draft form values through validation errors and return keyboard focus to the invalid field/error as appropriate. |
| Medium | **Hashed production assets are revalidated every 30 seconds.** Live HTML, `sw.js`, manifest, JS, CSS, legal pages, icons, and images returned `Cache-Control: public, must-revalidate, max-age=30`; e.g. `/assets/index-mBT2vnPm.js` is content-hashed but not immutable. This misses the PWA performance contract for long-lived immutable hashed assets. | Configure immutable long-lived caching for hashed assets; keep HTML and `sw.js` short-lived/revalidated for updates. |
| Low | `/manifest.webmanifest` is served as `application/octet-stream`, not `application/manifest+json` (or JSON). Chromium still installed the worker successfully. | Correct the manifest MIME type. |
| Low | Live headers include HSTS, strict-origin referrer policy, `nosniff`, XSS protection, and DNS-prefetch control, but no CSP, Permissions-Policy, or frame-ancestors/X-Frame-Options policy was observed. | Add a suitable static-host policy while permitting the Sociobot checkout/API origins used by the product. |

## Fresh local verification

Performed from a clean detached checkout of the candidate:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

| Check | Result |
|---|---|
| Install | PASS — `npm ci`: 60 packages audited, 0 vulnerabilities. |
| Unit/type/build | PASS — 7/7 Vitest parser tests; `tsc --noEmit` within `npm run build`; no separate lint script is declared; production `dist/` created. |
| Project E2E | PASS — 4/4 Playwright tests: source-aware list, axe serious/critical scan, keyboard skip path, and offline saved-state reload. |
| Bundle budgets | PASS — initial JS 26.44 KB (10.17 KB gzip), CSS 16.31 KB (4.34 KB gzip), under 200/50 KB. Largest served hero option is 260,724 bytes WebP; mobile AVIF is 43,282 bytes. |
| Expanded workflow | PASS except draft-loss defect above — empty submit and invalid URL display useful errors; normal recovery works after re-entry; two recipes, source link, serving floor `0.25`, mass/volume lines, `salt to taste` uncertainty, explicit pantry subtraction, arithmetic source trace, shopping tick/list export, 4-recipe free limit, malformed JSON-import error, and refresh persistence all worked. |
| Desktop/mobile | PASS — 1440 px and 390 px client widths equalled document scroll widths; body text was 16 px; no horizontal overflow. |
| Keyboard/a11y | PASS — skip link was first focus target, displayed `rgb(157, 37, 23) solid 3px`, and moved focus to `main`. Axe on a populated workflow found zero serious/critical violations. `lang=en`, one `h1`, one `main`, title, and image alt text present. |
| Motion/errors | PASS — reduced-motion produced `scroll-behavior: auto` and `0.01ms` transition/animation durations. No console errors or page errors in the expanded local exercise. |
| PWA/offline/update | PASS — saved state survived an offline reload with an active worker. A controlled immutable artifact test changed only the served worker cache version; `registration.waiting` became true and the app displayed “A fresh edition is ready.” |
| Lighthouse | PASS with runner caveat — Lighthouse 12.8.2 completed its audit and emitted a report: performance 96, accessibility 100, best practices 100, SEO 100; FCP 1.0 s, LCP 1.6 s, TBT 200 ms, CLS 0. Its Chrome process then reported an unexpected tab crash during shutdown, after report generation. |

## Live deployment, privacy, policy, and rate-limit evidence

- **Candidate match:** SHA-256 comparison of every non-map file in local `dist/` against the live equivalent checked 18 files: **0 missing, 0 mismatched**. Root HTML and `index-mBT2vnPm.js` digests each matched as well.
- **Live smoke test:** fresh 390 px Chromium load had title, one h1, one main, no horizontal overflow, an active service worker, and no console/page errors. Initial requests were only to the product origin for HTML, JS, CSS, and hero AVIF. Supplying an invalid `?license=` made only the expected `api.sociobot.in` verification request and displayed “License no longer active.” No sign-in flow exists, so the Entra tenant check is not applicable.
- **Privacy:** normal planning makes no external request; recipe state is IndexedDB-local. License/verdict values are localStorage-only, JSON/CSV export is available, no font CDN/analytics/ad/recipe request was observed, and `/privacy/`, `/terms/`, `/offline.html`, and the manifest all return 200.
- **Server-side rate limiting:** `GET https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=qa-rate-limit-20260828-0849` returned the expected invalid-token 200 JSON with `Cache-Control: no-store`. A fresh 100-request concurrency-25 burst returned **30 × 200 and 70 × 429**; rate limiting therefore started after 30 successful requests in that burst (the concurrent schedule cannot identify an exact ordinal). A subsequent 60-request concurrency-30 burst returned 3 × 200 and 57 × 429; a captured 429 contained `Retry-After: 0` and `x-ratelimit-after: 0`. This resolves the blocking rate-limit finding in `verification.md`.
- **CORS:** the API OPTIONS response permits `https://meal-plan-pantry-check.sociobot.in` and expected methods/headers. No credentials or payment provider is embedded in the product.

## Retest

1. Keep failed recipe form values (and accessible error focus) after fixing a URL or other validation error.
2. Deploy immutable caching for hashed assets and verify a representative JS/CSS/image response (`Cache-Control: public, max-age=..., immutable`), while keeping app HTML and worker updateable.
3. Recheck manifest content type and security policies, then repeat the command set above and a fresh live hash/rate-limit sample.
