# Ord

Independent static word game for `https://krois.dk/ord/`. Keep all source, dictionaries, icons, tests, and service-worker caches independent of sibling projects.

- Source: `public/`; build and preview utilities: `scripts/`; tests: `tests/`.
- Use Node.js 24 and `npm ci`.
- `npm test` checks game rules and dictionary data; `npm run build` emits `dist/`; `npm run test:browser` checks Chromium and iPhone WebKit.
- `npm run dev` serves source at `/ord/`; `npm run preview` serves production output.
- Keep the service worker scoped to `/ord/`. Keep progress and statistics browser-local.
- Preserve dictionary provenance and included licenses. Do not add external runtime assets.
- Publication uses a verified source SHA pinned in sibling `krois-site/releases.json`. Publish only with explicit authorization.
