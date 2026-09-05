# Verify meal plans against pantry items — verification 3

## Verdict: FAIL

**FAIL.** The implementation candidate has **8 findings**: 1 high, 4 medium, and 3 low. There are **8 unregistered or untested public claim groups**. A successful command suite does not make this product a PASS.

- Work order: `meal-plan-pantry-check-verify-3`
- Live URL: <https://meal-plan-pantry-check.sociobot.in/>
- Verified: 2026-09-05 UTC
- Candidate checkout and documentation SHA: `92ec7b2ccb41a609c1be689dffeb209a60ad1a31`
- Last deploy-affecting implementation SHA: `5095d3083620e5cb86274b8c5592a718a959b555`
- Finding count: **8**
- Untested claim count: **8**

No product code was changed during this verification.

## What the first screen says

Before scrolling on a fresh 390 × 844 phone viewport:

- Job: combine recipes, set servings, and remove only pantry items the user confirms.
- Audience: **not stated**. The intended audience can only be inferred from the README.
- First action: **Try it with sample data**. It is visible before scrolling at CSS y=689–735.

The first action passes. The missing audience and product-name headline are finding V3-03.

## Findings

| ID | Severity | Finding and evidence | Required resolution |
|---|---|---|---|
| V3-01 | High | **The paid checkout is broken.** A fresh Chromium click on **Buy once for $9** navigated to `https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/checkout` and received HTTP `404` with `{"error":"enabled factory product","status":404}`. This is an unexpected broken user path, not the deliberate site 404. Evidence: `/work/.evidence/verification-3/checkout-404.png` and `checkout-response.txt`. | Enable the live factory product checkout for this slug, verify the hosted checkout shows the stated $9 one-time purchase, and add an end-to-end claim test that follows the live/demo-safe checkout boundary. |
| V3-02 | Medium | **The claims contract is incomplete.** `@claim:source-aware-list` passes without changing planned servings or asserting a scaled numeric total, although its claim says amounts are scaled. `@claim:edition-limits` only checks a checkout href and mocks a valid verification result, so it passed while checkout returned 404. Eight public claim groups have no dedicated entry and tagged test: parser uncertainty/unit normalization; clipboard export; print export; complete JSON export/import; PWA installation; real-ledger privacy/no third-party runtime traffic; localStorage contents; and once-daily license verification. | Register each public claim in `.factory/claims.json` with one complete tagged test. Make compound tests assert every promised outcome and test checkout far enough to reject a 404. |
| V3-03 | Medium | **The first screen does not follow the plain-words contract.** Its h1 is the product name, `Meal Plan Pantry Check`, rather than a job headline. It does not name the audience or present the required privacy/offline/price facts together. Mood copy such as `An honest list for the week ahead`, `Recipes in. Certainty out.`, `Stays in your pantry.`, and `The cupboard wins.` is explicitly disallowed. `.factory/copy-audit.md` incorrectly marks this copy as passing. | Use a job headline of at most nine words, name the audience in the next sentence, show three short facts, and replace mood headings with section names that state their purpose. Update the copy audit. |
| V3-04 | Medium | **There is no designed 404 route.** Both `/this-page-does-not-exist-verification-3` and `/404.html` return HTTP `200` and render the ordinary app. `public/404.html` and a `responseOverrides.404` rule are absent. | Add the required product-styled 404 page with a way home and configure the host to return HTTP 404 for unknown routes. |
| V3-05 | Medium | **Changing workflow steps loses keyboard focus.** Activating **Pantry check** by keyboard renders the correct view, but `document.activeElement` becomes `BODY`. The new heading is not focused or announced; the only live region contains unchanged status content. On the phone, several visible links also miss the 44 px target baseline, including Terms at 33 × 14, Privacy at 39 × 14, and footer links at 35–43 × 20. | Move focus to the new view heading or main region and announce the view change. Give compact links a 44 px touch area without reducing visual density. Add keyboard and target-size regression tests. |
| V3-06 | Low | **Two demo source links are dead and the sample URLs are placeholders.** `https://example.com/lemon-pasta` and `https://example.com/bean-tacos` each return HTTP 404. The sample therefore does not provide realistic working source links. | Use stable, permitted source pages that return 200, or label these as local sample recipes and omit the links. Crawl demo links in CI. |
| V3-07 | Low | **Required sharing metadata is missing.** The root has no Open Graph title/description/image and no Twitter card metadata. There is no 1200 × 630 product image reference. | Add the required Open Graph and Twitter metadata using the product's original art. |
| V3-08 | Low | **The required site skeleton is incomplete.** The app header has no wordmark link to home, legal routes use a different header, and the footer omits **Built by Param Factory** and a version/build id. | Use the standard consistent header/footer across routes while preserving this product's visual identity. |

## Declared claims

Every command below was run independently from a clean detached checkout after `npm ci`.

| Claim | Declared command | Command result | Verification result |
|---|---|---|---|
| `source-aware-list` | `npm run test:e2e -- --grep @claim:source-aware-list` | PASS — 1 test | **FAIL — incomplete.** The test does not change servings or assert scaled arithmetic. A separate live check confirmed the implementation scales 400 g to 800 g at 8 servings, but the declared claim test remains incomplete. |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS — 1 test | PASS — a fresh live demo context reloaded offline with its banner, sample, and active worker. |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS — 1 test | PASS — the header and one row per visible shopping line were asserted. |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | PASS — 1 test | PASS — direct `/demo` opened three recipes with no IndexedDB database, localStorage key, or external request; reset restored three and real mode stayed empty. |
| `edition-limits` | `npm run test:e2e -- --grep @claim:edition-limits` | PASS — 1 test | **FAIL — false end-to-end.** The free cap and mocked valid license pass, but the live purchase link returns 404. |

The eight public claim groups in V3-02 are not registered with complete dedicated tests. Therefore `untested_claim_count` is 8.

## Clean checkout and build evidence

Clean checkout: `/tmp/meal-plan-verify3.lLUrPP` at `92ec7b2ccb41a609c1be689dffeb209a60ad1a31`.

| Command | Result |
|---|---|
| `npm ci` | PASS — 163 packages installed, 0 vulnerabilities. |
| `npm test` | PASS — 11/11 Vitest tests. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS. |
| `npm run build` | PASS — `dist/index.html` produced. JS 28.45 KB / 10.79 KB gzip; CSS 16.78 KB / 4.41 KB gzip. |
| `npm run test:e2e` | PASS — 9/9 Playwright tests. |
| Five individual `.factory/claims.json` commands | All commands completed, with the two acceptance failures explained above. |
| `npm run verify:live` | PASS — 18 live artifacts matched; fresh burst returned 30 × 200 and 30 × 429. A limited response included `Retry-After`. |
| `/opt/fleet/lib/verify-url.sh <live> <evidence>` | PASS — title, `lang=en`, one h1, main, alt text, button names, and zero console errors. |

## Live workflow evidence

- Desktop 1440 × 1000 and phone 390 × 844 were opened in new Chromium contexts. There was no horizontal overflow and body text was 16 px.
- One-click demo: three recipes loaded. The banner persisted in Recipes, Pantry check, Shopping list, and after reload. Reset restored all three recipes. Start for real opened an empty real ledger.
- Populated output: 14 consolidated pantry lines became 13 shopping lines after one explicit pantry confirmation. Source arithmetic showed `Lemon herb pasta — 400 g`. Changing its plan to 8 servings produced 800 g spaghetti.
- Draft recovery: the invalid `javascript:` source kept the title, four servings, source, and three ingredient lines; it set `aria-invalid`, associated the error, and focused the source input. Correcting only the URL saved the recipe.
- Boundaries and recovery: servings clamped to 0.25; the four-recipe free cap passed locally; refresh kept the recipe; edit worked; cancelled delete kept it; confirmed delete removed it; malformed import showed a useful recovery message.
- Data tools: JSON export contained all three sample recipes and imported them after explicit confirmation in an isolated context. Clipboard output contained grouped list text. Print invoked the browser print path. CSV passed its dedicated claim.
- Privacy: normal and direct-demo flows made no external requests. Direct `/demo` created no IndexedDB database or localStorage key. No analytics, ad, font-CDN, or recipe-content request appeared.
- Offline/update: live `/demo` reloaded offline with the sample and banner. A controlled local service-worker version change created a waiting worker, displayed **A fresh edition is ready**, activated through **Update now**, and retained the demo.
- Accessibility: live axe scans on empty and populated demo states returned zero violations. Reduced-motion emulation produced `scroll-behavior: auto` and 0.01 ms transitions/animations. Skip-link focus and the repaired invalid-source focus passed. V3-05 records the remaining navigation-focus and touch-target failures.
- Legal/routes: `/privacy/`, `/terms/`, and `/offline.html` return 200 with distinct titles, one h1, one main, and a way home. V3-04 records the missing 404.
- Static PWA: manifest MIME, icons, service worker, offline shell, immutable bundles, updateable HTML/worker, CSP, Permissions-Policy, frame denial, and CORS for the product origin passed.
- This is a static local-first PWA. Tenant isolation, server restart persistence, database health, and shared backend checks do not apply. The only product backend boundary is license billing/verification; its rate limit passes and checkout fails as V3-01.

## Earlier finding disposition

| Earlier finding | Current disposition |
|---|---|
| License verification accepted unlimited bursts | Resolved — the clean `verify:live` burst returned exactly 30 × 200 and 30 × 429; a 429 included `Retry-After`. |
| Rejected source cleared the recipe and lost focus | Resolved — all values remain, error association is present, and focus returns to the source field. |
| Hashed assets were cached for only 30 seconds | Resolved — generated JS/CSS return one-year immutable caching. |
| Manifest used `application/octet-stream` | Resolved — live type is `application/manifest+json`. |
| CSP, Permissions-Policy, and framing protection absent | Resolved — all are live; CSP includes `frame-ancestors 'none'` and the host sends `X-Frame-Options: DENY`. |

## Deployment and performance

- All 18 non-map build artifacts match production byte for byte.
- Root cache: `no-cache, must-revalidate`.
- Worker cache: `no-cache, no-store, must-revalidate`.
- Generated JS/CSS: `public, max-age=31536000, immutable`.
- Fresh live Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0.
- Evidence: `/work/.evidence/verification-3/`.

## Release decision

Do not accept this candidate. Repair V3-01 through V3-08, add complete claim tests, deploy, and run a fresh independent verification.
