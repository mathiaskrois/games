import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = root + "dist";
// This fixed build directory contains only this project's disposable output.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(root + "public", output, { recursive: true });
async function list(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(entry => entry.isDirectory()
    ? list(directory + "/" + entry.name, prefix + entry.name + "/")
    : prefix + entry.name));
  return paths.flat();
}
const assets = (await list(output)).filter(name => name !== "sw.js").sort();
const hash = createHash("sha256");
for (const name of assets) hash.update(name).update(await readFile(output + "/" + name));
const template = await readFile(root + "public/sw.js", "utf8");
hash.update(template);
const version = hash.digest("hex").slice(0, 12);
const worker = template.replace("__BUILD__", version).replace(JSON.stringify("__ASSETS__"), JSON.stringify(assets));
await writeFile(output + "/sw.js", worker);
console.log(`Built Krois Games at /games/ (${version}).`);
