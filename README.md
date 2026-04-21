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

### Notes

- The palette now follows your lavender-to-cream gradient reference: `#acc0f9` to `#fdf1ed`.
- A floating back-to-top button appears after scrolling so navigation stays manageable on longer pages.
- The current image files are placeholders designed to be swapped with your own scans, screenshots, or Pokemon art later.
- The chart data is still starter placeholder data and should be replaced with sourced values for the final version.

### Run locally

```bash
npm run dev
```

### Checks

```bash
npm run build
npm run lint
```
