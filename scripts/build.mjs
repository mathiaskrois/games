import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = root + "dist";
// This fixed build directory contains only this project's disposable output.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(root + "public", output, { recursive: true });
const assets = (await readdir(output)).filter(name => name !== "sw.js").sort();
const hash = createHash("sha256");
for (const name of assets) hash.update(name).update(await readFile(output + "/" + name));
const version = hash.digest("hex").slice(0, 12);
const worker = (await readFile(root + "public/sw.js", "utf8")).replace("__BUILD__", version).replace(JSON.stringify("__ASSETS__"), JSON.stringify(assets));
await writeFile(output + "/sw.js", worker);
console.log(`Built independent Ord app at /ord/ (${version}).`);
