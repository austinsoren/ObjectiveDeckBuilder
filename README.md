# Batman Objective Deck Builder, Character Archive & Compendium v0.4.0

A database-free static web application for building and playing Batman Miniature Game Objective decks, browsing recovered Third Edition character cards, and searching the BMG3 Compendium v1.4.

## GitHub Pages deployment

This build deliberately keeps all artwork outside `index.html`. No individual file is close to GitHub's 25 MB browser-upload limit.

1. Create or open a GitHub repository.
2. Add the **contents** of this folder to the repository root. Do not upload the release ZIP itself.
3. Commit and push with GitHub Desktop or Git. The repository contains many small image files, so this is more reliable than uploading through the browser one batch at a time.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, then select the repository's main branch and `/ (root)`.
6. Open the Pages URL after deployment finishes.

The included `.nojekyll` file tells GitHub Pages to serve the asset folders as ordinary static files.

## Run locally

- Double-click `index.html`; or
- Run `START_SERVER.bat` on Windows; or
- Run `./START_SERVER.sh` on macOS/Linux.

There is no server-side code, database, package installation, or build step.

## File layout

- `index.html` — application markup only.
- `styles.css` — visual styling.
- `app.js` — deck builder, play screen, Compendium, and tooltip behavior.
- `data/cards-data.js` — card metadata loaded by the browser.
- `data/reference-data.js` — parsed Compendium reference loaded by the browser.
- `data/character-data.js` — recovered character-card metadata loaded by the browser.
- `data/*.json` — editable/exportable source copies of the metadata.
- `cards/` — full-resolution Objective card images, one file per unique card design.
- `thumbs/` — smaller WebP Objective images used in the card library.
- `characters/` — cropped, full-resolution character-card screenshots grouped by crew.
- `character-thumbs/` — smaller WebP character images used in the archive grid.
- `tools/import_character_screenshots.py` — reusable phone-chrome crop and pixel-deduplication utility.

## Deck builder and play mode

- Exactly 20 cards in the normal Objective deck.
- General cards cannot outnumber affiliation cards.
- No more than 10 cards may be single-card designs.
- Printed multi-copy cards are fixed bundles.
- Character Objectives are additional cards validated against crew model Name/Alias and Rank.
- Play mode shuffles the physical cards, draws four, supports the one opening mulligan, and handles the Recount discard/shuffle/replacement sequence.


## Character card archive

- New **Character Cards** page with search, crew, base-size, and sorting controls.
- The first recovered set contains seven unique Spades cards.
- Black phone/status-bar regions were removed from every screenshot.
- Two Jack of Spades source screenshots were pixel-identical; only one asset is retained.
- Character aliases, base sizes, reputation, funding, and printed statistics were visually transcribed.
- Traits and weapon rules are shown as chips. Exact Compendium matches retain the existing hover tooltip and click-through behavior.
- Full images are stored separately from thumbnails and compressed as high-quality WebP to keep the static deployment practical.
- The card image remains the source of truth where recovered metadata is incomplete.

## Compendium reference

- 591 searchable entries parsed from all 40 pages of BMG3 Compendium v1.4.
- Core rules, traits, weapon special rules, templates, effects, and crew equipment sections.
- Objective cards display linked rule chips where their recovered rules text credibly mentions a Compendium entry.
- Hovering or focusing a rule chip opens a definition tooltip. In v0.3.1, that tooltip is mounted inside any active modal dialog so it remains above card details and play-screen overlays.
- Clicking a chip opens the full Compendium entry.

## Metadata note

Card text was recovered from card artwork using OCR, so the card image remains the source of truth. Compendium text preserves the supplied PDF terminology and includes its original page references.
