# Meal Plan Pantry Check — repair handoff

- Completed: 2026-08-28 UTC
- Work order: `meal-plan-pantry-check-repair-1`
- Verifier base: `2b404360b7dd7001deb5e61148ad5bec3ec84fe2`
- Rejected candidate: `419b10f8e2e6fc5ca4fed03bb10d51886ff6891a`
Deployment: Azure Static Web Apps (`dist/`) at <https://meal-plan-pantry-check.sociobot.in/>

## Repairs

- Reproduced the rejected-source defect with `Pasta night`, four servings, `javascript:alert(1)`, and three ingredient lines. The candidate cleared the name/ingredients and left focus unset.
- Added an in-memory recipe draft. Every rejected submission now retains all raw values, marks the first invalid field with `aria-invalid` and `aria-describedby`, announces the error, and moves keyboard focus to that field. Correcting only the URL now saves the original recipe.
- Added Azure Static Web Apps response configuration. Generated assets use `public, max-age=31536000, immutable`; `/`, HTML, and `sw.js` remain updateable; `.webmanifest` has a dedicated MIME mapping; CSP, Permissions-Policy, `frame-ancestors`, and `X-Frame-Options` are active.
- Bumped the service-worker cache version to `pantry-ledger-v4` so installed clients receive the repaired shell.
- Added `tests/live-policy.mjs` to compare every deployed non-map artifact with `dist/` and assert caching, MIME, security policy, and API rate limiting.
- Added the required `/demo` sandbox with three realistic recipes. It is memory-only, never opens the real IndexedDB ledger or license keys, and has persistent reset/exit controls. Documentation is in `.factory/demo.md`.
- Added `.factory/claims.json`, exact tagged claim tests, `.factory/copy-audit.md`, a TypeScript command, and ESLint.

## Regression coverage

- `tests/e2e/app.spec.ts`: invalid-URL draft retention, error association, focus return, correction without re-entry, and successful save.
- `tests/deployment.test.ts`: immutable generated assets, updateable shell/worker, manifest route plus Azure MIME mapping, CSP/API allowance, permissions, and framing policy.
- Tagged Playwright claims: source arithmetic and explicit pantry subtraction, demo offline reload, exact CSV rows, demo isolation/no external traffic, and four-recipe/free versus valid-license limits.
- Existing parser, workflow, axe, keyboard skip-link, real IndexedDB persistence, and offline tests remain passing.

## Verification evidence

Final clean command set:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run verify:live
```

Results:

- Install: 0 vulnerabilities.
- Unit/config: 11/11 passed (7 parser, 4 deployment policy).
- TypeScript and ESLint: passed with no findings.
- Browser: 9/9 passed on Playwright 1.58.2. Every `.factory/claims.json` command also passed independently from a fresh browser context.
- Production build: `dist/index.html` exists. Initial JS is 28.45 KB / 10.79 KB gzip; CSS is 16.78 KB / 4.41 KB gzip. Mobile AVIF is 43.28 KB; the largest hero option is 260.72 KB.
- Expanded desktop/mobile flow: passed at 1440×1000 and 390×844. Mobile `scrollWidth` and `clientWidth` were both 390 px; body text was 16 px. Draft recovery, serving scale to 400 g, pantry subtraction, source arithmetic, CSV, four-recipe cap, invalid import, refresh persistence, and demo reset/exit passed.
- Keyboard/accessibility: skip link is first, moves focus to `main`, and has a 3 px `rgb(157, 37, 23)` outline. Rejected source focus returns to the source field. Axe found zero serious/critical issues on empty, populated, and demo states.
- Privacy: normal and demo flows contacted only the product origin. Demo changes did not enter the real ledger. A live invalid-license check contacted only `api.sociobot.in`, stripped the token from the URL, displayed the inactive notice, and logged no errors.
- PWA: real saved state and bundled demo both survived `context.setOffline(true)` reloads. A controlled `v4` worker replacement displayed “A fresh edition is ready,” had a waiting worker, and activated it through **Update now**.
- Local Azure emulator and production both returned the intended response policy. Production JS/CSS are one-year immutable; root is `no-cache, must-revalidate`; `sw.js` is `no-cache, no-store, must-revalidate`; manifest is `application/manifest+json`; CSP, Permissions-Policy, and `X-Frame-Options: DENY` are present.
- Live identity: 18/18 non-map files matched local `dist/` by SHA-256. Live 390 px demo had no overflow, no console/page errors, only same-origin requests, zero serious/critical axe findings, and reloaded offline.
- License rate limit: a production 60-request burst returned 30 × `200` and 30 × `429`; a limited response included `Retry-After`.
- Factory URL smoke test: title, `lang=en`, one h1, main landmark, image alt text, button labels, and console checks passed locally and live.
- Live Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.90 s, LCP 1.20 s, TBT 0 ms, CLS 0.

Evidence files are under `/work/.evidence/repair-1/` in the worker container.

## Deployment

- Repair commits: `805065d` and `5095d30` (final documentation/tooling commit follows this handoff).
- Azure deployment IDs: `ec13ba3a-f6e2-4efb-a13c-752c0ef885b7` and MIME-corrected `68ffa2e3-9040-453c-bd35-9575463b50c3`.
- Custom domain status: `Ready`; HTTPS returned 200.

## Known limits

No release-blocking findings remain. Intentional v1 limits are unchanged: parsing is conservative, grocery grouping uses deterministic keywords, and there is no cloud sync. JSON backup/import remains the portability path.
