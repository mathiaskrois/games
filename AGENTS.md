# Krois Games

- Use Node.js 24 and `npm ci`. Run `npm test`, `npm run build`, and focused Chromium and iPhone WebKit checks with `npm run test:browser`.
- Static source is in `public/`. Give each game its own route and reuse shared controls, localization, and styles.
- Keep the service worker scoped to `/games/` and preserve existing saved-game keys, dictionary attribution, and the `/ord/` compatibility files.
- Publish verified commits through the `games` release pin in sibling `krois-site`. Publishing requires explicit authorization.
