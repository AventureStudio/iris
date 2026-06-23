// Build-time: download the ARASAAC pictogram for every tile keyword into
// public/arasaac/<slug>.png, so the app serves symbols from its own origin
// (no third-party runtime dependency / CORS / rate limits). Re-run when the
// vocabulary changes:  node scripts/fetch-pictos.mjs
//
// ARASAAC pictograms are CC BY-NC-SA 4.0 (Sergio Palao / ARASAAC / Gob. Aragón).
// They are bundled as third-party assets under that license, not relicensed.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public", "arasaac");
const SEARCH = "https://api.arasaac.org/api/pictograms/en/search";
const STATIC = "https://static.arasaac.org/pictograms";

export const slug = (k) => k.toLowerCase().replace(/['’]/g, "").trim().replace(/[^a-z0-9]+/g, "-");

function keywords() {
  const src = readFileSync(join(root, "src", "data", "boards.ts"), "utf8");
  const set = new Set();
  // Object-literal tiles: `keyword: "..."`
  for (const m of src.matchAll(/keyword:\s*"([^"]+)"/g)) set.add(m[1]);
  // Helper calls: phrase(id, "<keyword>", ...) / word(id, "<keyword>", ...)
  for (const m of src.matchAll(/\b(?:phrase|word)\("[^"]+",\s*"([^"]+)"/g)) set.add(m[1]);
  return [...set];
}

async function searchOne(term) {
  const res = await fetch(`${SEARCH}/${encodeURIComponent(term)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const id = Array.isArray(data) && data[0]?._id;
  return typeof id === "number" ? id : null;
}

async function resolveId(keyword) {
  const norm = keyword.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, " ").trim();
  let id = await searchOne(norm);
  if (!id && norm.includes(" ")) {
    for (const tok of norm.split(" ")) {
      if (tok.length < 2) continue;
      id = await searchOne(tok);
      if (id) break;
    }
  }
  return id;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const kws = keywords();
  let ok = 0;
  const missing = [];
  for (const kw of kws) {
    const file = join(OUT, `${slug(kw)}.png`);
    if (existsSync(file)) { ok++; continue; }
    const id = await resolveId(kw);
    if (!id) { missing.push(kw); continue; }
    const img = await fetch(`${STATIC}/${id}/${id}_300.png`);
    if (!img.ok) { missing.push(kw); continue; }
    writeFileSync(file, Buffer.from(await img.arrayBuffer()));
    ok++;
    console.log(`  ${kw} -> ${id}`);
  }
  console.log(`\nBundled ${ok}/${kws.length} pictograms into public/arasaac/`);
  if (missing.length) console.log(`Missing (will use runtime fetch / emoji): ${missing.join(", ")}`);
}

main();
