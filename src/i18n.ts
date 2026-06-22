import type { Lang, Tone } from "./types";

type UIKey =
  | "appName"
  | "back"
  | "speak"
  | "clear"
  | "settings"
  | "language"
  | "dwellTime"
  | "voice"
  | "tone"
  | "defaultVoice"
  | "close"
  | "home"
  | "emptyPhrase"
  | "tapOrGaze"
  | "seconds"
  | "eyeTracking"
  | "sensitivity"
  | "invertX"
  | "invertY"
  | "showPreview"
  | "recenter"
  | "elevenLabs";

export const UI: Record<UIKey, Record<Lang, string>> = {
  appName: { nl: "Iris", en: "Iris", fr: "Iris" },
  back: { nl: "Terug", en: "Back", fr: "Retour" },
  speak: { nl: "Zeg het", en: "Speak", fr: "Dire" },
  clear: { nl: "Wissen", en: "Clear", fr: "Effacer" },
  settings: { nl: "Instellingen", en: "Settings", fr: "Réglages" },
  language: { nl: "Taal", en: "Language", fr: "Langue" },
  dwellTime: { nl: "Verblijftijd", en: "Dwell time", fr: "Temps de fixation" },
  voice: { nl: "Stem", en: "Voice", fr: "Voix" },
  tone: { nl: "Toon", en: "Tone", fr: "Ton" },
  defaultVoice: { nl: "Standaardstem", en: "Default voice", fr: "Voix par défaut" },
  close: { nl: "Sluiten", en: "Close", fr: "Fermer" },
  home: { nl: "Start", en: "Home", fr: "Accueil" },
  emptyPhrase: { nl: "Kies woorden…", en: "Pick words…", fr: "Choisis des mots…" },
  tapOrGaze: {
    nl: "Kijk of tik om te kiezen",
    en: "Look or tap to choose",
    fr: "Regarde ou touche pour choisir",
  },
  seconds: { nl: "s", en: "s", fr: "s" },
  eyeTracking: { nl: "Oogbesturing (camera)", en: "Eye tracking (camera)", fr: "Suivi oculaire (caméra)" },
  sensitivity: { nl: "Gevoeligheid", en: "Sensitivity", fr: "Sensibilité" },
  invertX: { nl: "Spiegel horizontaal", en: "Invert horizontal", fr: "Inverser horizontal" },
  invertY: { nl: "Spiegel verticaal", en: "Invert vertical", fr: "Inverser vertical" },
  showPreview: { nl: "Cameravoorbeeld", en: "Camera preview", fr: "Aperçu caméra" },
  recenter: { nl: "Midden herijken", en: "Recenter", fr: "Recentrer" },
  elevenLabs: { nl: "Natuurlijke stem (ElevenLabs)", en: "Natural voice (ElevenLabs)", fr: "Voix naturelle (ElevenLabs)" },
};

export const TONE_LABELS: Record<Tone, Record<Lang, string>> = {
  calm: { nl: "Rustig", en: "Calm", fr: "Calme" },
  normal: { nl: "Gewoon", en: "Normal", fr: "Normal" },
  happy: { nl: "Blij", en: "Happy", fr: "Joyeux" },
  playful: { nl: "Speels", en: "Playful", fr: "Espiègle" },
};

export const TONE_EMOJI: Record<Tone, string> = {
  calm: "🌙",
  normal: "🙂",
  happy: "😄",
  playful: "😜",
};

export const LANG_LABELS: Record<Lang, string> = {
  nl: "Nederlands",
  en: "English",
  fr: "Français",
};

/** BCP-47 codes for SpeechSynthesis voice matching. */
export const LANG_BCP47: Record<Lang, string> = {
  nl: "nl-NL",
  en: "en-US",
  fr: "fr-FR",
};

export function t(key: UIKey, lang: Lang): string {
  return UI[key][lang];
}
