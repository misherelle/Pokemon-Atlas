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

### PokéWallet API

`#/game` uses `/api/pokewallet/pool`, `/api/pokewallet/status`, and `/api/pokewallet/images?id=...`, which are Vercel-ready serverless functions. The PokéWallet key stays on the server and is never exposed to React.

For local setup, copy `.env.example` to `.env.local`, add your PokéWallet key, then restart `npm run dev`.

```bash
POKEWALLET_API_KEY=your_key
POKEWALLET_MIN_PRICE=20
POKEWALLET_POOL_SIZE=15
POKEWALLET_CACHE_MINUTES=10
POKEWALLET_MAX_HOURLY_REQUESTS=90
POKEWALLET_SEARCHES_PER_REFRESH=8
POKEWALLET_MAX_CARDS_PER_QUERY=3
POKEWALLET_IMAGE_CACHE_MINUTES=60
POKEWALLET_ENGLISH_ONLY=true
POKEWALLET_SEARCH_QUERIES=all-pokemon
```

For Vercel:

1. Push this repo to GitHub.
2. In Vercel, choose Add New -> Project and import the GitHub repo.
3. Keep the defaults: Framework Preset `Vite`, Build Command `npm run build`, Output Directory `dist`.
4. Add the PokéWallet values in Project Settings -> Environment Variables.
5. Deploy. If you edit an env var later, redeploy so the new value is used.

The game builds a 15-card pool from PokéWallet at most once every 10 minutes. By default, `POKEWALLET_SEARCH_QUERIES=all-pokemon` samples from a built-in list of 1,025 Pokémon names, with a few high-value search terms mixed in so the $20 filter still finds cards. It filters out sealed products like packs, boxes, tins, displays, collections, and non-English set patterns. The browser then compares cards from that cached pool, so normal play does not call the price API on every guess.

The API code follows PokéWallet's documented key flow:

- `GET https://api.pokewallet.io/search` for card and price data
- `GET https://api.pokewallet.io/images/:id` through a server proxy for card images

If keys are not configured or live prices are unavailable, the game shows a setup message. `POKEWALLET_MIN_PRICE` controls the minimum live price for cards in the pool.

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
