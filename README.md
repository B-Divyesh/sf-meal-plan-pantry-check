# Meal Plan Pantry Check

An offline-first household utility that turns selected recipes into one explainable shopping list. It scales servings, normalizes simple units, shows every recipe’s contribution, and subtracts an ingredient only after the user explicitly confirms it is in the pantry.

Live: <https://meal-plan-pantry-check.sociobot.in>

## Who it is for

People with a small personal recipe collection who want reliable quantities without maintaining a full inventory system, uploading recipe content, or trusting an opaque generated list.

## What v1 does

- Pastes structured ingredient lines and flags amounts it cannot parse confidently.
- Selects recipes and scales each recipe to the planned serving count.
- Consolidates compatible mass and volume units with source-by-source arithmetic.
- Requires explicit pantry confirmation before removing an ingredient.
- Groups the final checklist and exports it as CSV, printable paper, or clipboard text.
- Stores the ledger in IndexedDB and supports complete JSON export/import.
- Installs as a PWA and reloads the saved plan without a network connection.
- Offers a useful four-recipe free edition; a one-time $9 household license unlocks unlimited saved recipes through Sociobot billing.

It deliberately does not scrape recipe URLs, provide nutrition advice, order groceries, track barcodes, or generate recipes.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

`npm run build` is the deployment command. It produces the static site at `dist/`, with `dist/index.html` at its root. The browser suite pins Playwright 1.58.2 and covers the core planning flow, axe accessibility checks, and an offline reload.

## Data and billing

Recipes and planning state never leave the browser. A license token is the only application value kept in localStorage; it is verified at most daily with `https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify`. Checkout is hosted by Sociobot/Dodo. No analytics, advertising cookies, third-party runtime scripts, or CDN fonts are used.

See [the source brief](.factory/brief.json), [visual system](.factory/design.md), [privacy policy](public/privacy/index.html), and [terms](public/terms/index.html).

## Deployment

Upload the contents of `dist/` to any static host with HTTPS. Preserve `sw.js` at the origin root and serve unknown navigation paths with `index.html`; the checked-in `/privacy/` and `/terms/` documents are emitted as concrete HTML paths. Infrastructure, DNS, and billing product registration are handled outside this repository.

## License

MIT — see [LICENSE](LICENSE).
