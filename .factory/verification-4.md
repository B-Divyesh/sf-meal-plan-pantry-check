# Check recipes against your pantry — verification 4

## Verdict: PASS

**PASS.** Implementation candidate `5ffb41276d964a71dc430330bdfd1ae3cca661e4` has **zero findings** and **zero untested public claims**. No product code was changed during this verification.

- Work order: `meal-plan-pantry-check-verify-4`
- Live URL: <https://meal-plan-pantry-check.sociobot.in/>
- Verified: 2026-09-05 UTC
- Implementation reviewed: `5ffb41276d964a71dc430330bdfd1ae3cca661e4`
- Documentation state at start: `d0c3cd9e6883ebcb76c283b9c6a15907dd5150bd`
- Finding count: **0**
- Untested claim count: **0**

## First screen and demo

Fresh Chromium contexts opened the live root at 390 × 844 and 1440 × 1000 before scrolling.

| Check | Result |
|---|---|
| Job | **Check recipes against your pantry** is the single h1. |
| Audience | “For home cooks with personal recipes who want one list based only on pantry items they confirm.” |
| First action | **Try it with sample data**; its bottom was y=402 on the phone viewport, above the 844 px fold. |
| Required facts | Privacy, offline-after-first-visit, and four-free/$9-once facts are all visible. |
| One-click sample | Opened `/demo` with 3 realistic local recipes and the persistent “Demo — sample data, nothing is saved” label. |
| Populated result | 14 pantry lines became 13 shopping lines after explicitly confirming spaghetti. Source arithmetic and workflow-heading focus worked. |
| Isolation and reset | Reset restored 3 sample recipes. **Start for real** showed no sample recipe. A direct fresh `/demo` created no IndexedDB database or localStorage key and made no external request. |
| Offline | After the first visit, direct `/demo` reloaded offline with the banner, all 3 recipes, and the offline status. |

No console or page errors occurred in either live phone or desktop session. Axe scans of the empty and demo states returned zero serious or critical violations.

## Declared claims

Every command in `.factory/claims.json` was run independently after `npm ci`. Each completed with one passing tagged browser test.

| Claim | Result |
|---|---|
| `source-aware-list` | PASS |
| `ingredient-parsing` | PASS |
| `offline-reload` | PASS |
| `csv-export` | PASS |
| `clipboard-export` | PASS |
| `print-checklist` | PASS |
| `json-backup` | PASS |
| `pwa-install` | PASS |
| `demo-isolation` | PASS |
| `local-privacy` | PASS |
| `localstorage-scope` | PASS |
| `daily-license-check` | PASS |
| `edition-limits` | PASS |

The live and README public promises map to these 13 registered, outcome-based claims. There are no unlisted or incomplete claim groups.

## Clean candidate checks

| Command | Result |
|---|---|
| `npm ci` | PASS — 163 packages, 0 vulnerabilities. |
| `npm test` | PASS — 12/12 Vitest tests. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS. |
| `npm run build` | PASS — `dist/index.html` produced. Initial JS 29.82 KB raw / 11.15 KB gzip; CSS 18.24 KB raw / 4.66 KB gzip. |
| `npm run test:e2e` | PASS — 27/27 Playwright tests. |
| `npm run verify:live` | PASS — 22 live non-map artifacts matched the fresh `dist`; designed missing route returned 404; invalid-license result was `200`, `valid: false`, `reason: invalid`; 60-request check returned 29 × 200 and 31 × 429, with `Retry-After` on limited responses. |

## Live product and checkout

- Live checkout and Pilot Test checkout each returned HTTP 303 to the appropriate Dodo checkout host. Each hosted page returned HTTP 200 and showed **Meal Plan Pantry Check Household License** at **$9.00**.
- A newly completed Dodo **Test Mode** checkout returned to the product. Its returned token was kept only in the temporary browser context, then checked against the Pilot verification endpoint: HTTP 200, `valid: true`, `reason: ok`. The token was not retained or recorded. No live-money purchase was made.
- Root is updateable; hashed JS/CSS are one-year immutable; `manifest.webmanifest` is `application/manifest+json`; worker is updateable. CSP, Permissions-Policy, referrer policy, `nosniff`, and frame denial are present.
- `/privacy/`, `/terms/`, `/offline.html`, `/404.html`, and an unknown live URL were checked. Each has its own title, one h1, and one main. The unknown URL returned the product-designed page with HTTP 404. Internal links returned expected 200 responses; the external source repository returned 200.
- Live mobile route checks found no horizontal overflow. Reduced-motion, skip-link, visible focus, 44 px links, invalid-source draft recovery, serving boundary, JSON-import recovery, delete confirmation, CSV/clipboard/print export, PWA worker, and update behavior passed through the browser suite.
- Lighthouse 12.8.2 generated a complete mobile report: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 0.9 s, TBT 0 ms, CLS 0. The runner emitted its known post-report Chromium tab-crash message, but the complete JSON report was written and scored.

## Earlier finding disposition

| Earlier finding | Current disposition |
|---|---|
| Verification 1: license verification was not rate limited | Resolved — live 60-request burst produced 31 × 429 with `Retry-After`. |
| Verification 2: rejected source lost draft/focus | Resolved — browser test preserves all fields, associates the error, and focuses the source field. |
| Verification 2: immutable caching, manifest MIME, and security headers | Resolved — live policy check passes immutable asset caching, manifest media type, CSP, Permissions-Policy, and frame denial. |
| Verification 3 V3-01: checkout 404 | Resolved — live 303 to Dodo, live hosted offer 200 at $9.00; Test purchase and actual entitlement validation pass. |
| Verification 3 V3-02: incomplete claims | Resolved — 13 registered claims, each independently run and passed. |
| Verification 3 V3-03: first screen unclear | Resolved — job, audience, action, and three facts are above the phone fold. |
| Verification 3 V3-04: missing designed 404 | Resolved — unknown route returns HTTP 404 with the designed page. |
| Verification 3 V3-05: workflow focus and target sizes | Resolved — heading focus and phone-link target tests pass. |
| Verification 3 V3-06: dead sample links | Resolved — samples are clearly local recipes with no dead source links. |
| Verification 3 V3-07: missing sharing metadata | Resolved — original 1200 × 630 social image and Open Graph/Twitter metadata are live. |
| Verification 3 V3-08: incomplete skeleton | Resolved — shared wordmark/header/footer, legal routes, Param Factory attribution, and build version are present. |

## Release decision

**PASS.** The candidate is accepted with zero findings and zero untested claims.
