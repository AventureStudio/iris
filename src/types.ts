export type Lang = "nl" | "en" | "fr";

export type Tone = "calm" | "normal" | "happy" | "playful";

/** A localized string: one entry per supported language. */
export type Localized = Record<Lang, string>;

/**
 * A tile on a board.
 * - "phrase" tiles speak their full text immediately (low-latency, caregiver-auditable).
 * - "word"  tiles append to the phrase bar so longer utterances can be composed.
 * - "board" tiles navigate into a sub-board.
 */
export interface Tile {
  id: string;
  kind: "phrase" | "word" | "board";
  emoji: string;
  label: Localized;
  /** For kind === "board": id of the board to open. */
  to?: string;
  /** Accent color key for the tile; falls back to the board accent. */
  accent?: string;
}

export interface Board {
  id: string;
  title: Localized;
  emoji: string;
  accent: string;
  tiles: Tile[];
}
