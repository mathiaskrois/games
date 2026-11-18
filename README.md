# Krois Games

This repository builds the game collection at https://krois.dk/games/. Ord, 2048, Mini Sudoku, and Snake share a bilingual interface and keep their progress and records in the browser.

## Develop

Use Node.js 24. Run `npm ci`, `npm test`, and `npm run build`. Serve source with `npm run dev` or production output with `npm run preview`, then open http://127.0.0.1:4174/games/. Install browser binaries with `npx playwright install chromium webkit` and run `npm run test:browser`.

Static pages and assets live in `public/`. The production build versions and precaches nested assets in a `/games/` service worker. The legacy page and retiring worker in `hosting/ord/` preserve old links to `/ord/`. Ord still reads the `krois-ord-v1` storage key, so games saved on the same origin carry over. Other games and the shared language have independent versioned storage keys.

Ord uses the bundled MIT-licensed Tab Atkins word list and exact five-letter normalized Danish forms from Dansk Sprognævn's Retskrivningsordbogen 5.1. The files in `public/ord/` include attribution, licensing, and Danish source checksums. No runtime assets or player data are sent to external services.

## Publish

Push and verify the source in `mathiaskrois/games`, then pin its full SHA in `krois-site/releases.json`. The publisher mounts `dist/` at `/games/` and `hosting/ord/` at `/ord/`. The publisher owns the custom domain.
