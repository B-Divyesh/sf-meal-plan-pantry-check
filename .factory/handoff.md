# Meal Plan Pantry Check — repair 2 handoff

## Status

**PASS candidate.** All eight findings in `verification-3.md` are repaired. The final implementation was deployed and checked cold at <https://meal-plan-pantry-check.sociobot.in> on 2026-09-05 UTC.

- Work order: `meal-plan-pantry-check-repair-2`
- Deployed implementation SHA: `5ffb41276d964a71dc430330bdfd1ae3cca661e4`
- Version: `1.1.0`
- Documentation state: this handoff is a report-only commit after the deployed implementation; its exact SHA is available from `git log -1 --format=%H -- .factory/handoff.md`.

## Finding disposition

| Finding | Result |
|---|---|
| V3-01 checkout returned 404 | Resolved. Live checkout returns 303 to `checkout.dodopayments.com`; the hosted offer returns 200 and shows the exact Household License at $9.00. A Dodo Test purchase returned a license without a real charge. The token was not logged or retained. Both test and production verification returned 200, `valid: true`, `reason: ok`. |
| V3-02 incomplete claims | Resolved. `.factory/claims.json` now declares 13 public claim groups. Each has exactly one outcome-based `@claim` test, and every declared command passed independently from a clean checkout. |
| V3-03 unclear first screen | Resolved. The h1 is “Check recipes against your pantry.” The next sentence names home cooks with personal recipes. The sample action and privacy, offline, and price facts are visible before scrolling at 390×844. Mood copy was removed and `.factory/copy-audit.md` was replaced. |
| V3-04 missing 404 | Resolved. Unknown live URLs return HTTP 404 with the product-styled page, clear h1, and return action. |
| V3-05 lost focus and small links | Resolved. Workflow changes focus the new view heading. All visible links measured at least 44×44 CSS pixels on the phone routes tested. |
| V3-06 dead sample links | Resolved. Samples are explicitly local recipes and contain no placeholder source links. |
| V3-07 missing share metadata | Resolved. Open Graph and Twitter metadata use an original 1200×630 product image. The 180×180 Apple touch icon is also linked. |
| V3-08 incomplete site skeleton | Resolved. App, legal, offline, and 404 pages use the same wordmark/header and product/footer structure, including Privacy, Terms, Param Factory, and version copy. |

The earlier draft-preservation, manifest MIME, immutable caching, security header, and rate-limit repairs remain passing.

## Clean verification

A detached checkout of `5ffb412` ran on Node 22.23.2 with a fresh `npm ci`:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

- Install: 163 packages, zero vulnerabilities.
- Unit/policy: 12/12 passed.
- Type check and ESLint: passed.
- Browser: 27/27 passed.
- Build: `dist/index.html` produced. Initial JS is 29.82 KB raw / 11.15 KB gzip. CSS is 18.24 KB raw / 4.66 KB gzip.
- Every command in `.factory/claims.json` was then run separately from that checkout: 13/13 passed.
- Playwright axe scans found zero serious or critical violations. Keyboard focus, 44 px targets, reduced motion, phone/desktop overflow, form errors, offline reload, and service-worker update activation passed.

Full clean output: `/work/.evidence/repair-2/final-clean.log`.

## Production verification

- Deployment completed to the existing `sf-meal-plan-pantry-check` static site. The first attempt was rejected before upload because Azure normalizes duplicate `/demo` routes; the manifest was corrected, regression-tested, committed, and then deployed successfully.
- `npm run verify:live` matched all 22 non-map `dist` artifacts to production.
- Root and worker remain updateable; generated JS/CSS are one-year immutable; the manifest is `application/manifest+json`.
- The designed unknown route returns 404. CSP, Permissions-Policy, frame denial, referrer policy, and `nosniff` are live with no inline-script/style exception.
- A live invalid-license check returned 200, `valid: false`, `reason: invalid`, with product-origin CORS and `no-store`.
- A 60-request verification burst returned 29 × 200 and 31 × 429; limited responses included `Retry-After`.
- `verify-url.sh` found the expected title, `lang=en`, one h1, one main, complete image alt text, labeled buttons, and zero console errors.
- Fresh 390×844 and 1440×1000 contexts had no overflow or console errors. The phone first action was above the fold.
- The one-click demo loaded 3 recipes, 14 pantry lines, and 13 shopping lines after one pantry confirmation. The demo label survived view changes and reload. Reset restored 3 samples; Start for real opened 0 recipes. Planning made no external request.
- A fresh offline demo reload retained its banner and sample. Reduced motion yielded automatic scrolling and near-zero animation duration.
- Lighthouse 12.8.2 produced a complete mobile report: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.0 s, TBT 0 ms, CLS 0. The Lighthouse process reported its known Chromium tab-crash shutdown error after writing the complete JSON report.

Evidence is under `/work/.evidence/repair-2/`. Public billing metadata is `/work/.evidence/billing-offer.json`; the catalog description is mirrored at `/work/.evidence/catalog-description.txt`.

## Known gaps

- No live-money purchase was made. The live hosted offer and exact price were checked, while entitlement was proven with a no-charge Dodo Test purchase and real verification responses.
- This is a static local-first PWA. Backend tenant isolation, server restart persistence, database health, and server replicas do not apply. User state remains in browser IndexedDB.

## Next step

Run an independent verification against deployed SHA `5ffb412`. No product repair remains known from this work order.
