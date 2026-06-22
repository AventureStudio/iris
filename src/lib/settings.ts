import type { Lang, Tone } from "../types";

export interface Settings {
  lang: Lang;
  /** Dwell duration in milliseconds before a tile fires. */
  dwellMs: number;
  tone: Tone;
  /** Preferred SpeechSynthesis voice name, or "" for the browser default. */
  voiceName: string;
}

const KEY = "iris.settings.v1";

export const DEFAULTS: Settings = {
  lang: "nl",
  dwellMs: 1200,
  tone: "normal",
  voiceName: "",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — settings stay in-memory for the session */
  }
}
