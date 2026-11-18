# Ord

A personal, phone-ready word game for **https://krois.dk/ord/**. Five letters, six chances, unlimited new words. Includes English and Danish play, touch and physical keyboards, correct repeated-letter scoring, animated reveals and win celebrations, replay after either result, reduced-motion support, and separate saved games and statistics per language.

This is an independent project. Its source, build, dictionaries, icons, browser storage, and `/ord/` service worker do not depend on WordWin. The existing WordWin solver keeps its own route and worker.

## Development

Use Node.js 24:

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium webkit
npm run test:browser
```

Development and production preview run at `http://127.0.0.1:4174/ord/`. `npm run preview` serves the built `dist/` output. The production worker caches the complete game and both dictionaries for offline use after the first successful visit. The source preview deliberately does not cache assets.

Tests cover duplicate-letter scoring, dictionary provenance, answer validity, English and Danish games, language switching, saved progress, stats, wins, losses, replay, reduced motion, small phone layouts, and Chromium offline reload. WebKit's offline-emulation navigation limitation means that one test is skipped for WebKit.

## Data and privacy

Everything runs on the current device, with no account, analytics, or backend. Saved games use the browser-local `krois-ord-v1` key. Search indexing is discouraged with `noindex`; this static app does not require authentication.

English guesses use a checked-in snapshot of the [Tab Atkins word list](https://github.com/tabatkins/wordle-list), with the MIT license in `public/english-license.txt`. Danish guesses are the exact five-letter normalized forms from Dansk Sprognævn's COR1 1.5.1.0 / Retskrivningsordbogen 5.1. `public/danish-source.json` records the original source, processing rules, counts, and checksums. Both dictionaries ship with Ord, with no runtime downloads from external services. Answers come from smaller, checked dictionary-backed pools; the previous answer is excluded from the next draw.

Ord has its own branding and is independent of The New York Times.

## Publishing

Source is intended for the independent `mathiaskrois/ord` repository. After source checks pass, pin its full commit SHA as `ord` in sibling `krois-site/releases.json`. The publisher builds this project and mounts its public output at `/ord/`. Keep all other source pins and existing routes unchanged. Publishing requires explicit authorization.
