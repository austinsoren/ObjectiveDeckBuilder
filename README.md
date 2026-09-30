# Batman Objective Deck Builder, Character Archive & Compendium v0.4.0

A database-free static web application for building and playing Batman Miniature Game Objective decks, browsing recovered Third Edition character cards, and searching the BMG3 Compendium v1.4.

## File layout

- `index.html` — application markup only.
- `styles.css` — visual styling.
- `app.js` — deck builder, play screen, Compendium, and tooltip behavior.
- `data/cards-data.js` — card metadata loaded by the browser.
- `data/reference-data.js` — parsed Compendium reference loaded by the browser.
- `data/character-data.js` — recovered character-card metadata loaded by the browser.
- `data/equipment-data.js` — structured crew equipment lists (generated; edit `tools/build_equipment_data.py` and re-run it).
- `data/*.json` — editable/exportable source copies of the metadata.
- `cards/` — full-resolution Objective card images, one file per unique card design.
- `thumbs/` — smaller WebP Objective images used in the card library.
- `characters/` — cropped, full-resolution character-card screenshots grouped by crew.
- `character-thumbs/` — smaller WebP character images used in the archive grid.
- `tools/import_character_screenshots.py` — reusable phone-chrome crop and pixel-deduplication utility.
- `tools/build_equipment_data.py` — hand-transcribed crew equipment lists; writes `data/equipment-data.json` and `.js`.

## Deck builder and play mode

- Exactly 30 cards in the normal Objective deck.
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

## Crew equipment

- **Equipment** page (also reachable from the ⚙ button on each Crew Builder roster row) for buying equipment for the models on the active roster.
- Lists are transcribed from screenshots of the official BMG app's equipment lists (not stored in the repo): Police, Joker, Penguin, Bane, Court of Owls, Riddler, Mr. Freeze, League of Assassins, Birds of Prey, Organized Crime (Crime Family and Two Face) and Scarecrow. The Batman list still comes from Compendium v1.4 p.35 until an official-app screenshot is added. Crews without a list — The Cult, Spades, Suicide Squad, Watchmen, Who Laughs — can pick any list manually.
- Henchmen and Free Agents buy by default; other ranks, named models, or trait holders (Cop, Plant, Nightmare, Bot, Arkham Asylum Dr.) only where the item says so. Crew-wide limits (0-2 etc.), "only when X is in the crew" prerequisites, Penguin's Iceberg Lounge options (Boss needs the trait; only one may be taken), one of each item per model, and no duplicate traits are enforced. +Movement / +Endurance items adjust the printed stats on the loadout sheet.
- Equipment $ and Rep costs are added to the crew totals. Traits granted by equipment are highlighted in green with the item they came from (roster, Equipment page, play-mode crew panel), and are printed — tagged "Equipment: …" — on both the proxy-sheet rules page and the half-page loadouts, alongside an Equipment section with every item's cost and text.
- Equipment is saved with the crew and carried in share links and JSON/text exports.
- Not automated (text only): Venom Laboratory's Venom Dose discount, Smuggler pricing, and crew-wide effects such as Batman Inc.'s one-Bat-Armor limit. Traits missing from the compendium index (e.g. Joker's Gas, the Scarecrow Nightmare traits) show as unlinked chips.

## Compendium reference

- 591 searchable entries parsed from all 40 pages of BMG3 Compendium v1.4.
- Core rules, traits, weapon special rules, templates, effects, and crew equipment sections.
- Objective cards display linked rule chips where their recovered rules text credibly mentions a Compendium entry.
- Hovering or focusing a rule chip opens a definition tooltip. In v0.3.1, that tooltip is mounted inside any active modal dialog so it remains above card details and play-screen overlays.
- Clicking a chip opens the full Compendium entry.

## Metadata note

Card text was recovered from card artwork using OCR, so the card image remains the source of truth. Compendium text preserves the supplied PDF terminology and includes its original page references.
