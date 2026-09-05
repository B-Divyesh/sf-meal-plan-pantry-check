# Check recipes against your pantry — review 1

## Verdict: PASS

**PASS.** Implementation candidate `5ffb41276d964a71dc430330bdfd1ae3cca661e4` has **zero findings** and **zero untested public claims**. No product code was changed during this review.

- Work order: `meal-plan-pantry-check-review-1`
- Live URL: <https://meal-plan-pantry-check.sociobot.in/>
- Reviewed: 2026-09-05 UTC
- Implementation reviewed: `5ffb41276d964a71dc430330bdfd1ae3cca661e4`
- Documentation baseline: `ac95a58c6284cb69771e3c545f4f48bb6187ead1`
- Finding count: **0**
- Untested claim count: **0**

The commits after `5ffb412` change only `.factory` reports. The fresh build matched all 22 deployed non-map files, so the live product is the reviewed implementation.

## First screen and demo

Fresh Chromium contexts opened the live root at 390 × 844 and 1440 × 1000 before scrolling.

| Check | Result |
|---|---|
| Job | **Check recipes against your pantry** is the single h1. |
| Audience | “For home cooks with personal recipes who want one list based only on pantry items they confirm.” |
| First action | **Try it with sample data**. Its bottom was 402 px on phone and 319 px on desktop, inside both first viewports. |
| Plain facts | Recipes stay in this browser; works offline after the first visit; four recipes are free and unlimited recipes cost $9 once. |
| One-click sample | Opened `/demo` with lemon herb pasta, black bean tacos, and roast vegetable bowls. |
| Populated result | The sample produced 14 pantry lines. Confirming spaghetti marked it “In pantry · subtracted” and produced 13 shopping lines. Lemons showed a 2-each contribution from Lemon herb pasta. |
| Persistent label | “Demo — sample data, nothing is saved” remained visible through recipes, pantry check, and shopping list. |
| Reset and exit | Removing one sample left two recipes; **Reset demo** restored three. **Start for real** opened an empty real planner with no sample copied. |
| Isolation | A fresh direct demo opened no IndexedDB database, made no external request, and did not use a pre-seeded real license. Demo changes stayed in memory. |
| Offline | After one online visit, `/demo` reloaded offline with its label, offline notice, and all three recipes. |

The phone and desktop roots had no horizontal overflow, console error, page error, or third-party request. Evidence screenshots are in `/work/.evidence/review-1/`.

## Clean candidate checks

The checks ran from a detached clean checkout of documentation commit `ac95a58`, whose product files are identical to implementation commit `5ffb412`.

| Command | Result |
|---|---|
| `npm ci` | PASS — 163 packages installed, 0 vulnerabilities. |
| `npm test` | PASS — 12/12 Vitest tests. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS. |
| `npm run build` | PASS — `dist/index.html` produced. JS was 29.82 KB raw / 11.15 KB gzip; CSS was 18.24 KB raw / 4.66 KB gzip. |
| `npm run test:e2e` | PASS — 27/27 Playwright tests. |
| `npm run verify:live` | PASS — 22 live files matched, unknown route returned 404, invalid license returned the expected result, and rate limiting returned 29 × 200 plus 31 × 429 with `Retry-After`. |

The browser suite covers normal planning, unit normalization, uncertain lines, serving scaling, pantry subtraction, arithmetic, exports, persistence, invalid input, the 0.25 serving boundary, malformed imports, deletion recovery, free limits, rejected and restored licenses, keyboard focus, phone targets, reduced motion, offline reload, and service-worker updates.

## Declared claims

Every command in `.factory/claims.json` ran separately after the clean install. Each command selected exactly one tagged test and passed.

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

The live page, legal pages, README, manifest, and offline page were cross-checked against the registry. Their public promises map to these 13 outcome tests. No claim is missing, false, incomplete, or untested.

## Billing and entitlement

- Production checkout returned HTTP 303 to `checkout.dodopayments.com`. The hosted page returned HTTP 200 and showed **Meal Plan Pantry Check Household License** at **$9.00**.
- Pilot checkout returned HTTP 303 to `test.checkout.dodopayments.com`. The hosted page returned HTTP 200 and showed the same named $9 offer in Test Mode.
- A new Dodo Test-mode checkout used the documented test card. It returned to the product, stored the returned token locally, removed it from the address, and the Pilot verification endpoint returned HTTP 200 with `valid: true` and `reason: ok`.
- The temporary browser context was closed and the token was neither recorded nor retained. No live-money purchase was made.
- Free planning, accessibility, pantry safety, and all exports remain available without payment. A mocked valid-license consumer test saved five recipes and a rejected-license test kept paid behavior locked.

## Accessibility, routes, privacy, and performance

- Axe scanned `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html` at 390 × 844 and 1440 × 1000. All ten scans returned zero violations at every impact level.
- Each reviewed page has `lang=en`, one h1, one main, a header, a footer, a skip link, and a route-specific title. Workflow changes move keyboard focus to the new heading. Visible compact links and the clickable wrappers around checkboxes and file input meet the 44 px target baseline.
- Reduced-motion mode uses effectively instant animation and `scroll-behavior: auto`. Keyboard skip, form-error focus, dialog recovery, and named controls passed.
- `/privacy/`, `/terms/`, `/offline.html`, and `/404.html` returned 200. A random missing path returned the product-designed page with HTTP 404. Every internal link and the public source link returned 200.
- The privacy page explains local IndexedDB data, license checks, deletion through browser controls, export, and the public repository contact path. Normal planning and the direct demo made no external request. There are no analytics, ads, CDN fonts, or remote recipe requests.
- The manifest, controlling service worker, offline fallback, short-lived HTML/worker caching, immutable hashed assets, CSP, frame denial, permissions policy, referrer policy, and manifest MIME type passed.
- Lighthouse 12.8.2 completed with Performance 100, Accessibility 100, Best Practices 100, and SEO 100. FCP and LCP were 0.9 s, total blocking time was 10 ms, and CLS was 0.

This is a static local-first PWA. Backend tenant isolation, server restart persistence, application database health, and SQLite on `/data` do not apply. The only server boundary used by the product is Sociobot billing; its public checkout, invalid-token handling, CORS, no-store response, and rate limit were checked without accessing shared credentials or databases.

## Earlier finding disposition

| Earlier finding | Current evidence |
|---|---|
| Verification 1: license verification had no rate limit | Resolved — the fresh 60-request burst returned 31 × 429 with `Retry-After`. |
| Verification 1–2: hashed caching, manifest MIME, CSP, permissions, and frame policy | Resolved — live policy checks pass and the deployment matches the candidate. |
| Verification 2: rejected source erased the draft and lost focus | Resolved — the full draft persists, the error is associated, and focus moves to the source field. |
| Verification 3 V3-01: checkout returned 404 | Resolved — both modes return 303 to the correct Dodo host; both named offers show $9, and a new Test entitlement validates. |
| Verification 3 V3-02: incomplete claims | Resolved — all 13 registered claim commands pass independently and cover every public promise. |
| Verification 3 V3-03: unclear first screen and mood copy | Resolved — the job, audience, action, and three facts are above the phone fold in plain words. |
| Verification 3 V3-04: no designed 404 | Resolved — a random missing path returns the designed page with HTTP 404. |
| Verification 3 V3-05: workflow focus and small links | Resolved — keyboard heading focus and 44 px phone targets pass. |
| Verification 3 V3-06: dead sample links | Resolved — the three samples are labelled local recipes and contain no placeholder links. |
| Verification 3 V3-07: missing sharing metadata | Resolved — live Open Graph/Twitter metadata uses the original 1200 × 630 product image. |
| Verification 3 V3-08: incomplete shared skeleton | Resolved — header, wordmark, footer, legal links, Param Factory credit, and version are present. |

## Review decision

**PASS — zero findings and zero untested claims.** No repair or deployment is required.
