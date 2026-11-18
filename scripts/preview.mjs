import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";
const root = resolve(fileURLToPath(new URL("../", import.meta.url)), process.argv[2] || "dist");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  const folder = url.pathname === "/" ? "/games/" : /^\/(?:games(?:\/(?:ord|2048|sudoku|snake))?|ord)$/.test(url.pathname) ? url.pathname + "/" : null;
  if (folder) { response.writeHead(302, { Location: folder }); response.end(); return; }
  const legacy = url.pathname.startsWith("/ord/");
  if (!legacy && !url.pathname.startsWith("/games/")) { response.writeHead(404); response.end(); return; }
  try {
    const directory = legacy ? resolve(root, "../hosting/ord") : root;
    const slug = decodeURIComponent(url.pathname.slice(legacy ? 5 : 7));
    const path = resolve(directory, slug + (!slug || slug.endsWith("/") ? "index.html" : ""));
    if (!path.startsWith(directory + sep)) { response.writeHead(403); response.end(); return; }
    const data = await readFile(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
server.listen(Number(process.env.PORT || 4174), "127.0.0.1", () => console.log(`Krois Games preview: http://127.0.0.1:${server.address().port}/games/`));
