import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";
const root = resolve(fileURLToPath(new URL("../", import.meta.url)), process.argv[2] || "dist");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/" || url.pathname === "/ord") { response.writeHead(302, { Location: "/ord/" }); response.end(); return; }
  if (!url.pathname.startsWith("/ord/")) { response.writeHead(404); response.end(); return; }
  try {
    const path = resolve(root, decodeURIComponent(url.pathname.slice(5)) || "index.html");
    if (!path.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
    const data = await readFile(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
server.listen(Number(process.env.PORT || 4174), "127.0.0.1", () => console.log(`Ord preview: http://127.0.0.1:${server.address().port}/ord/`));
