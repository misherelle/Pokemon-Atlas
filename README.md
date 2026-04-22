# Pokémon Card Atlas

A small React project about Pokémon cards, collecting, and why some cards became so valuable.

Built for COMM-4470: Information Design class.

Live site: [pokemon-atlas.vercel.app](https://pokemon-atlas.vercel.app/)

## What This Is

This site is meant to be a visual guide, not a full database. It has a timeline, market charts, collecting notes, card examples, and a price guessing game that uses live card data.

The main idea is simple: show how Pokémon cards moved from a kids' game into a huge collector market.

## Pages

- **Home**: quick intro and a few big numbers
- **Timeline**: major Pokémon card moments from 1996 to 2026
- **Market**: simple charts about production and growth
- **Collecting**: rarity, grading, and why condition matters
- **Card Files**: a closer look at famous or expensive cards
- **Price Guess**: pick which card has the higher market price

## Price Guess

The game uses the PokéWallet API through Vercel serverless functions, so the API key stays private on the server.

It builds a pool of priced single cards, filters out sealed products, prefers English cards with working images, and then lets the user compare two cards at a time. The pool refreshes on real 10-minute clock marks, like `:00`, `:10`, `:20`, and so on.

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`, then add your PokéWallet key:

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
POKEWALLET_REQUIRE_IMAGES=true
POKEWALLET_IMAGE_CHECKS_PER_REFRESH=5
POKEWALLET_SEARCH_QUERIES=all-pokemon
```

Run the site:

```bash
npm run dev
```

## Vercel Setup

1. Push the project to GitHub.
2. Import it into Vercel.
3. Keep the Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add the same PokéWallet values in Vercel under Project Settings -> Environment Variables.
5. Redeploy after changing env vars, because Vercel needs a fresh deploy to use them.

## Project Files

- `src/App.jsx`: page routing
- `src/pages/`: the main pages
- `src/components/`: timeline, charts, layout, and shared UI
- `src/data/siteData.js`: timeline and page data
- `src/styles/`: theme and layout CSS
- `api/pokewallet/`: serverless API routes for the price game
- `public/images/`: local images and fallback artwork

## Checks

```bash
npm run lint
npm run build
```

## Notes

Some live card data can vary depending on what PokéWallet returns. The app tries to keep the game clean by filtering for single cards, English cards, and working images, but the fallback image is still there in case an API image is missing.
