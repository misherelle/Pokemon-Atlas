# From Playground to Marketplace

## The Rise and Impact of the Pokemon Trading Card Game

This project is now structured as a lightweight multi-page React site with separate pages for overview, timeline, data story, and collecting systems.

### Project structure

- `src/App.jsx`: simple hash-based page router
- `src/pages/`: page-level content
- `src/components/`: reusable UI pieces like the hero, charts, and layout
- `src/data/siteData.js`: starter content and placeholder chart data
- `src/styles/`: split styling files for theme, layout, components, and page-level rules
- `public/images/`: placeholder visuals you can replace with your own Pokemon images

### Current pages

- `#/` overview
- `#/history` timeline and cultural rise
- `#/market` data story and value trends
- `#/collection` rarity, grading, and comparison systems
- `#/cards` card examples and sale context
- `#/game` Price Guess card value game

### TCGplayer API

`#/game` uses a local Vite API route so the TCGplayer private key stays out of the browser. Copy `.env.example` to `.env.local`, add your existing TCGplayer keys, then restart `npm run dev`.

```bash
TCGPLAYER_PUBLIC_KEY=your_public_key
TCGPLAYER_PRIVATE_KEY=your_private_key
TCGPLAYER_API_VERSION=v1.39.0
```

If keys are not configured, the game runs with demo card data.

### Notes

- The palette now follows your lavender-to-cream gradient reference: `#acc0f9` to `#fdf1ed`.
- A floating back-to-top button appears after scrolling so navigation stays manageable on longer pages.
- The current image files can be swapped with your own scans, screenshots, or Pokemon art later.

### Run locally

```bash
npm run dev
```

### Checks

```bash
npm run build
npm run lint
```
