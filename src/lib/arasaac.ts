/**
 * ARASAAC pictogram resolver — the same open symbol library the hackathon apps
 * use, so a familiar user keeps the visuals they already recognise.
 *
 * IMPORTANT (licensing): ARASAAC pictograms are CC BY-NC-SA 4.0 (author: Sergio
 * Palao / ARASAAC / Gobierno de Aragón) — non-commercial + share-alike. They are
 * NOT MIT. Iris's *code* is MIT; the pictograms are third-party assets displayed
 * under their own license, attributed in the README and the in-app credit. A
 * commercial adopter swaps this provider for an emoji/CC0/owned symbol set
 * (the rest of the app is unchanged — that is the whole point of this seam).
 */

const STATIC_BASE = "https://static.arasaac.org/pictograms";
const SEARCH_BASE = "https://api.arasaac.org/api/pictograms";

// keyword -> resolved image URL ("" means "no picto, use the emoji fallback").
const cache = new Map<string, Promise<string>>();

function imageUrl(id: number): string {
  return `${STATIC_BASE}/${id}/${id}_300.png`;
}

async function searchOne(term: string): Promise<string> {
  // Searching a fixed language (English) keeps the chosen picto stable across
  // UI languages — the symbol stays the same one the user has learned.
  const res = await fetch(`${SEARCH_BASE}/en/search/${encodeURIComponent(term)}`);
  if (!res.ok) return "";
  const data: unknown = await res.json();
  if (!Array.isArray(data) || data.length === 0) return "";
  const id = (data[0] as { _id?: number })?._id;
  return typeof id === "number" ? imageUrl(id) : "";
}

async function lookup(keyword: string): Promise<string> {
  // Normalize: lowercase, drop apostrophes, collapse spaces. ARASAAC only
  // resolves single common terms, so fall back word-by-word for phrases.
  const norm = keyword.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, " ").trim();
  try {
    let hit = await searchOne(norm);
    if (!hit && norm.includes(" ")) {
      for (const token of norm.split(" ")) {
        if (token.length < 2) continue;
        hit = await searchOne(token);
        if (hit) break;
      }
    }
    return hit;
  } catch {
    return "";
  }
}

export function resolvePicto(keyword: string): Promise<string> {
  const key = keyword.trim().toLowerCase();
  if (!key) return Promise.resolve("");
  let hit = cache.get(key);
  if (!hit) {
    hit = lookup(key);
    cache.set(key, hit);
  }
  return hit;
}
