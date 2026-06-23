import type { Lang, Tone } from "../types";
import type { GazeCalibration } from "./gazeHitTest";

export interface Settings {
  lang: Lang;
  /** Dwell duration in milliseconds before a tile fires. */
  dwellMs: number;
  tone: Tone;
  /** Preferred SpeechSynthesis voice name, or "" for the browser default. */
  voiceName: string;
  /** Webcam eye/head tracking (MediaPipe). */
  gazeEnabled: boolean;
  gazeSensitivity: number;
  gazeInvertX: boolean;
  gazeInvertY: boolean;
  gazePreview: boolean;
  /** Multi-point calibration model (gaze → screen), or null = use sensitivity. */
  gazeCalibration: GazeCalibration | null;
  /** Use ElevenLabs (via /api/tts) instead of the browser voice. */
  useElevenLabs: boolean;
}

const KEY = "iris.settings.v1";

export const DEFAULTS: Settings = {
  lang: "nl",
  dwellMs: 1200,
  tone: "normal",
  voiceName: "",
  gazeEnabled: false,
  gazeSensitivity: 3,
  gazeInvertX: true,
  gazeInvertY: false,
  gazePreview: true,
  gazeCalibration: null,
  useElevenLabs: false,
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
