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
- **Offline support**: a service worker caches the app shell, so it loads and
  works (against locally stored data) without a network connection
- **Multi-device sync warning**: if recipes were synced from another device
  since this one last synced, you'll get a heads-up so you can check for
  conflicts
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
  `claude-sonnet-4-6`)
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
3. **Bump `CACHE_NAME` in `sw.js`** to match — this is how the service worker
   discards old cached assets and serves the new ones offline
4. Upload/commit `index.html` and `sw.js` to the `dinner-planner` GitHub repo,
   replacing the existing files
5. GitHub Pages serves the new version within ~60 seconds
6. Installed PWA clients will see an "Update available" banner and can reload to
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

## Installing the app

Belly Up is a Progressive Web App — no app store needed. Just visit the link in a
browser and add it to your home screen.

### Android (Chrome)

1. Open **Chrome** and go to **https://njf520.github.io/dinner-planner/**
2. A popup should appear saying "Add Belly Up to Home screen" — tap **Install** or **Add**
   - If no popup appears: tap the **⋮ menu** (top right) → **Add to Home screen** → **Add**
3. The app icon will appear on your home screen — tap it to open
4. On first launch, you'll be asked **"Add Nick's recipes?"** — tap it to start with
   a copy of Nick's collection, or choose **Start empty** to begin from scratch

### iOS (Safari)

1. Open **Safari** and go to **https://njf520.github.io/dinner-planner/**
   - It must be Safari — Chrome/Firefox on iOS don't support "Add to Home Screen"
2. Tap the **Share button** (the square with an arrow at the bottom of the screen)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** in the top right
5. The app icon will appear on your home screen — tap it to open
6. On first launch, you'll be asked **"Add Nick's recipes?"** — tap it to start with
   a copy of Nick's collection, or choose **Start empty** to begin from scratch

### After installing

- Your recipes are saved locally on your phone and backed up automatically — no
  account or login needed
- The app works offline once installed
- Updates are detected automatically; you'll see a banner when a new version is
  available, or tap the "Belly Up" title to check manually

## Backups

Recipe data (excluding photos) can be exported from **Settings → Export recipes**
as `dinner-backup-YYYY-MM-DD.json`. Import the same file from **Settings → Import
recipes** to restore — duplicates are skipped by id and name. Since recipes live
in browser storage, clearing site data will permanently delete them, so export
regularly.
