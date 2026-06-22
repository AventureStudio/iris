import type { Lang, Tone } from "../types";
import { LANG_BCP47 } from "../i18n";

/**
 * Single voice engine over the browser SpeechSynthesis API.
 * No backend, no API key. Emotion is delivered as prosody (rate + pitch),
 * leaving the spoken text unchanged — the message stays predictable and the
 * tone is "how" it is said, not "what" is said.
 */

interface ToneProsody {
  rate: number;
  pitch: number;
}

const TONE_PROSODY: Record<Tone, ToneProsody> = {
  calm: { rate: 0.85, pitch: 0.9 },
  normal: { rate: 1.0, pitch: 1.0 },
  happy: { rate: 1.08, pitch: 1.25 },
  playful: { rate: 1.15, pitch: 1.4 },
};

let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (typeof speechSynthesis === "undefined") return;
  cachedVoices = speechSynthesis.getVoices();
}

if (typeof speechSynthesis !== "undefined") {
  refreshVoices();
  speechSynthesis.onvoiceschanged = refreshVoices;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices.length === 0) refreshVoices();
  return cachedVoices;
}

function pickVoice(lang: Lang, preferredName: string): SpeechSynthesisVoice | undefined {
  const voices = listVoices();
  if (preferredName) {
    const exact = voices.find((v) => v.name === preferredName);
    if (exact) return exact;
  }
  const bcp = LANG_BCP47[lang];
  return (
    voices.find((v) => v.lang === bcp) ||
    voices.find((v) => v.lang.startsWith(lang)) ||
    undefined
  );
}

export interface SpeakOptions {
  lang: Lang;
  tone: Tone;
  voiceName: string;
}

/** Speak text, cancelling anything currently playing (monotonic — last call wins). */
export function speak(text: string, opts: SpeakOptions): void {
  if (typeof speechSynthesis === "undefined" || !text.trim()) return;
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(opts.lang, opts.voiceName);
  if (voice) u.voice = voice;
  u.lang = LANG_BCP47[opts.lang];

  const prosody = TONE_PROSODY[opts.tone];
  u.rate = prosody.rate;
  u.pitch = prosody.pitch;

  speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}
