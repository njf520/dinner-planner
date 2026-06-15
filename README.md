# Belly Up

A personal recipe rolodex, cocktail book, and grocery shopping list — built as a
single-file Progressive Web App (PWA) with no framework and no build step.

Live app: https://njf520.github.io/dinner-planner/

## Features

- **Add recipes three ways**: paste a URL, snap/upload a photo of a cookbook page,
  or type ingredients in manually
- **AI parsing**: Anthropic's Claude (Sonnet) extracts name, servings, time,
  difficulty, tags, and ingredients, converting all measurements to American units
- **Cocktails supported** alongside food recipes (oz-based amounts, glass/garnish
  as ingredients)
- **Shopping list**: combines ingredients across all "planned" recipes, grouped by
  grocery store aisle in a fixed walking order; also viewable per-recipe
- **Ingredient actions**: "I have this" (strikethrough, skip on this trip) and
  "Got it" (checked off while shopping)
- **Serving multiplier**: scale any recipe ½×, 1×, 2×, or 3× with friendly fractions
- **Last-made tracking**: stamped when you tap "Done shopping"; sort recipes by
  longest-ago or never-made
- **Search & tag filters**
- **Auto-update banner**: checks the live GitHub Pages copy on load and prompts to
  reload when a newer version is deployed
- **Backup/restore**: export/import all recipe data as a dated JSON file
- **Cloud backup (GitHub)**: recipes and source photos are automatically mirrored
  to this GitHub repo (`data/backup.json` + `images/`), so a browser wipe or
  reinstall doesn't lose anything — see "Cloud backup" below
- **Debug log** (Settings → View log): records what happened during URL/photo
  imports, useful for diagnosing missing ingredients

## Tech stack

- Single file (`index.html`) — all HTML, CSS, and JavaScript inline
- No framework, no build step, no dependencies beyond Google Fonts
- **Recipe data**: `localStorage`, key `dinner_planner_v5`
- **Source images**: IndexedDB, database `planplate_images`, store `images`
  (keyed by recipe id) — kept out of `localStorage` to avoid quota errors
- **AI parsing**: calls the Anthropic Messages API directly from the browser using
  a user-supplied API key (stored only in `localStorage`, model
  `claude-sonnet-4-20250514`)
- **URL fetching**: tries a few public CORS proxies in sequence to grab page text;
  falls back to Claude's own knowledge of the URL for JS-heavy sites
- Hosted on GitHub Pages, installable as a PWA (manifest + icons)

## Project structure

```
index.html      All markup, styles, and app logic
manifest.json   PWA manifest (name, icons, theme)
icon-192.png    App icon
icon-512.png    App icon
README.md       This file
```

## Development & deployment

There is no build step — `index.html` is the deployed artifact.

1. Edit `index.html` locally
2. **Bump the `VERSION` constant** near the top of the `<script>` block (and the
   `#version-display` text in the header) — the in-app auto-update banner compares
   this string against the live copy to detect new deploys
3. Upload/commit `index.html` to the `dinner-planner` GitHub repo, replacing the
   existing file
4. GitHub Pages serves the new version within ~60 seconds
5. Installed PWA clients will see an "Update available" banner and can reload to
   pick up the change

## Data model

Each recipe object looks roughly like:

```json
{
  "id": 1718000000000,
  "name": "Chicken Piccata",
  "emoji": "🍽️",
  "servings": 4,
  "time": "45 min",
  "difficulty": "medium",
  "tags": ["italian", "weeknight"],
  "notes": "Double the capers next time",
  "source": "https://example.com/recipe",
  "lastMade": 1718500000000,
  "sourceImages": ["data:image/jpeg;base64,..."],
  "ingredients": [
    { "name": "chicken breast", "amount": "1 lb", "unit": "lb", "notes": null }
  ]
}
```

Notes on ingredients:

- `amount` always includes the unit text (e.g. `"1½ oz"`), with `unit` also stored
  separately for reference
- "Or" alternatives (e.g. "basil or parsley") are consolidated into a single
  ingredient, with the options recorded in `notes`

Top-level app state (`dinner_planner_v5` in `localStorage`):

```json
{
  "recipes": [ /* recipe objects, sourceImages omitted — see IndexedDB */ ],
  "planned": [1718000000000],
  "checkedItems": { "ing_chickenbreast": true },
  "haveItems": { "ing_oliveoil": true }
}
```

## Backups

Recipe data (excluding photos) can be exported from **Settings → Export recipes**
as `dinner-backup-YYYY-MM-DD.json`. Import the same file from **Settings → Import
recipes** to restore — duplicates are skipped by id and name. Since recipes live
in browser storage, clearing site data will permanently delete them, so export
regularly.
