import type { Lang, Tone } from "../types";
import { LANG_BCP47 } from "../i18n";

/**
 * Voice engine. Two paths:
 *  - Browser SpeechSynthesis (default, no key).
 *  - ElevenLabs via the `/api/tts` serverless proxy (the API key lives in a
 *    Vercel env var and is never exposed to the client). On any proxy failure
 *    we fall back to SpeechSynthesis so speech never silently dies.
 *
 * Emotion is delivered as prosody: SpeechSynthesis varies rate/pitch; ElevenLabs
 * varies voice_settings (server-side). The spoken text is never rewritten.
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
  useElevenLabs: boolean;
}

// Monotonic guard so a newer utterance always cancels an older one.
let playId = 0;
let audioEl: HTMLAudioElement | null = null;

function speakBrowser(text: string, opts: SpeakOptions): void {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(opts.lang, opts.voiceName);
  if (voice) u.voice = voice;
  u.lang = LANG_BCP47[opts.lang];
  const p = TONE_PROSODY[opts.tone];
  u.rate = p.rate;
  u.pitch = p.pitch;
  speechSynthesis.speak(u);
}

async function speakEleven(text: string, opts: SpeakOptions, id: number): Promise<void> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, lang: opts.lang, tone: opts.tone }),
  });
  if (!res.ok) throw new Error("tts proxy " + res.status);
  const blob = await res.blob();
  if (id !== playId) return; // superseded while fetching
  const url = URL.createObjectURL(blob);
  if (audioEl) {
    audioEl.pause();
    const old = audioEl.src;
    audioEl = null;
    if (old.startsWith("blob:")) URL.revokeObjectURL(old);
  }
  const a = new Audio(url);
  audioEl = a;
  a.onended = a.onerror = () => URL.revokeObjectURL(url);
  await a.play();
}

export function speak(text: string, opts: SpeakOptions): void {
  if (!text.trim()) return;
  const id = ++playId;
  // Stop anything already playing on either path.
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }

  if (opts.useElevenLabs) {
    speakEleven(text, opts, id).catch(() => {
      if (id === playId) speakBrowser(text, opts);
    });
  } else {
    speakBrowser(text, opts);
  }
}

export function stopSpeaking(): void {
  playId++;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  if (audioEl) {
    audioEl.pause();
    const old = audioEl.src;
    audioEl = null;
    if (old.startsWith("blob:")) URL.revokeObjectURL(old);
  }
}

// Short non-speech confirmation tone (e.g. when a word is added to the phrase).
let audioCtx: AudioContext | null = null;
export function beep(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx ?? new Ctx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch {
    /* audio unavailable */
  }
}

/** Speak an urgent message, repeated a few times to attract attention. */
export function speakUrgent(text: string, opts: SpeakOptions): void {
  speak(text, opts);
  let n = 0;
  const iv = window.setInterval(() => {
    n += 1;
    if (n >= 3) {
      window.clearInterval(iv);
      return;
    }
    speak(text, opts);
  }, 1700);
}
