# Visual thesis: The Pantry Ledger

## Direction and rationale

Meal Plan Pantry Check is a **monochrome typographic broadsheet**: part Sunday food section, part household ledger. Consolidating recipes is an editorial act—many small sources become one accountable edition—so the interface uses ruled columns, datelines, folio numbers, and annotated totals instead of app-dashboard cards. It feels considered and domestic, but never nostalgic enough to obscure the job.

The single light treatment is deliberate. Warm newsprint gives the checklist a familiar paper affordance and makes an offline, local record feel tangible. A high-contrast ink palette keeps every state legible without relying on color.

## Palette

- `--paper: #f3efe4` — pantry-label/newsprint ground.
- `--sheet: #fffdf7` — raised working sheets.
- `--ink: #171714` — body and primary rules; 15.7:1 on paper.
- `--ink-soft: #56544d` — secondary copy; 6.7:1 on paper.
- `--rule: #9b978a` — large controls and dividers; paired with text where state matters.
- `--signal: #9d2517` — editorial red pencil for action, warning, and focus; 7.0:1 on paper.
- `--confirmed: #2f5940` — pantry-confirmed marks; 7.1:1 on paper, always paired with a check/label.
- `--danger: #8a1c16` — destructive copy and errors.

No gradients. Subtle paper grain is a hand-authored CSS pattern, not a downloaded texture.

## Typography

- Display/editorial: Georgia, `Times New Roman`, serif. Its compact capitals and old-style curves make headings read like a food-page masthead without a font download.
- Utility/data: `Arial Narrow`, `Roboto Condensed`, Arial, sans-serif. Uppercase labels and tabular figures create the ledger voice.
- Scale: 12 / 14 / 16 / 20 / 32 / clamp(46–84) px. Body never below 16 px; supporting legal copy may use 14 px.
- Measures: prose maxes at 68 characters; numerical quantities use tabular figures.

Using system families keeps the first visit small, fast, and private; no third-party font request occurs.

## Spacing and composition

- 4 px base rhythm; primary steps 8, 12, 16, 24, 32, 48, 64.
- Desktop: 12-column editorial grid, with the working flow occupying eight columns and a persistent issue index/status rail occupying four.
- Mobile at 390 px: columns stack, the issue rail becomes a compact dateline, tables become source-aware list rows, and actions stay in document flow so nothing hides beneath a bar.
- Borders are 1 px editorial rules. Thick 3 px rules mark only major transitions. Corners are 0–2 px—paper does not look like a pile of rounded SaaS cards.
- All controls are at least 44 px tall with 8 px between adjacent targets.

## Interaction grammar

- The workflow is a three-part edition: **Recipes → Pantry check → Shopping list**. A numbered folio shows where the user is and which step is complete.
- Adding a recipe creates a new “source clipping.” Ingredients preserve their entered text; parsed quantity/unit/name appear immediately beneath it. Ambiguous lines receive a visible red-pencil “Check parsing” annotation and remain editable.
- Pantry confirmation is explicit per consolidated ingredient. Nothing is subtracted by inference. A struck line plus “In pantry” label is the only removed state.
- Every shopping row shows its source recipe contributions on demand, making the arithmetic auditable.
- Deletions require a specific confirmation; shopping checks are reversible with one click.

## Motion policy

- New clippings and status notices enter with a 180 ms opacity + 6 px upward settle, reflecting paper placed on a desk.
- View changes use a 160 ms crossfade; pantry ticks draw no looping animation.
- Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling are disabled and state changes are instantaneous. Meaning and depth remain through rules, scale, and contrast.

## Original asset plan and provenance

The hero is a generated monochrome editorial still life: a top-down pantry shelf, recipe clippings, measuring spoon, and a heavy pencil line connecting recipe quantities to a grocery checklist. It clarifies consolidation and explicit checking without depicting functionality the app lacks. A hand-authored SVG “PC” pantry-stamp supplies PWA icons; it is original and deterministic.

### Prompt sheet

- Use case: stylized-concept
- Subject: overhead still life of three torn recipe clippings, small pantry jars, measuring spoon, pencil check marks, and a grocery ledger; ingredients visually flow from separate clippings into one list.
- World/materials: 1950s newspaper food desk, uncoated newsprint, graphite, ink, glass jars, linen shadow.
- Light/lens: soft north-window light, overhead 50 mm editorial still-life framing, deep focus.
- Palette words: warm bone paper, carbon black, graphite grey, one restrained oxblood pencil accent.
- Composition: landscape, central diagonal ledger line, generous clear paper around objects; no readable words.
- Negative list: no people, hands, brands, logos, interface mockups, packaging labels, legible text, watermark, gradient, saturated color, glossy stock photography, impossible utensils.

Generation command: `/opt/fleet/lib/gen-image.sh` using the factory image deployment, 1536×1024, high quality. Generated 2026-08-28. The selected image is original generated material for this product; prompt metadata is stored beside the source. Distribution is covered by the project MIT license.

Delivery formats: responsive 960 px and 1536 px AVIF/WebP, plus a 960 px JPEG fallback. Mobile AVIF is 44 KB; desktop AVIF is 128 KB. Mobile WebP is 89 KB; desktop WebP is 255 KB. All keep explicit 3:2 intrinsic dimensions.
