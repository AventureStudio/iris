import type { Board } from "../types";

/**
 * Iris core vocabulary. Emoji-first so the symbol set is permissively licensed
 * (Unicode emoji) rather than tied to a non-commercial pictogram library.
 * Content is original and intentionally generic — no personal data.
 */

const phrase = (id: string, emoji: string, nl: string, en: string, fr: string) =>
  ({ id, kind: "phrase" as const, emoji, label: { nl, en, fr } });

const word = (id: string, emoji: string, nl: string, en: string, fr: string) =>
  ({ id, kind: "word" as const, emoji, label: { nl, en, fr } });

export const HOME: Board = {
  id: "home",
  title: { nl: "Start", en: "Home", fr: "Accueil" },
  emoji: "💬",
  accent: "indigo",
  tiles: [
    { id: "to-greet", kind: "board", to: "greet", emoji: "👋", label: { nl: "Hallo", en: "Hello", fr: "Bonjour" }, accent: "sky" },
    { id: "to-needs", kind: "board", to: "needs", emoji: "🙏", label: { nl: "Ik wil", en: "I need", fr: "Je veux" }, accent: "amber" },
    { id: "to-feel", kind: "board", to: "feel", emoji: "💚", label: { nl: "Gevoel", en: "Feelings", fr: "Émotions" }, accent: "emerald" },
    { id: "to-reply", kind: "board", to: "reply", emoji: "💭", label: { nl: "Antwoord", en: "Reply", fr: "Réponse" }, accent: "violet" },
    { id: "to-people", kind: "board", to: "people", emoji: "👨‍👩‍👧", label: { nl: "Mensen", en: "People", fr: "Personnes" }, accent: "rose" },
    { id: "to-build", kind: "board", to: "build", emoji: "🧩", label: { nl: "Zinnen bouwen", en: "Build", fr: "Composer" }, accent: "teal" },
  ],
};

export const BOARDS: Record<string, Board> = {
  home: HOME,

  greet: {
    id: "greet", emoji: "👋", accent: "sky",
    title: { nl: "Hallo", en: "Hello", fr: "Bonjour" },
    tiles: [
      phrase("g-hi", "👋", "Hallo!", "Hello!", "Bonjour !"),
      phrase("g-welcome", "🤗", "Fijn dat je er bent.", "Good to see you.", "Content de te voir."),
      phrase("g-name", "🙋", "Hoe heet je?", "What is your name?", "Comment tu t'appelles ?"),
      phrase("g-howru", "🌞", "Hoe gaat het?", "How are you?", "Comment ça va ?"),
      phrase("g-bye", "👋", "Tot ziens!", "Goodbye!", "Au revoir !"),
      phrase("g-wait", "⏳", "Wacht even, alsjeblieft.", "One moment, please.", "Un instant, s'il te plaît."),
    ],
  },

  needs: {
    id: "needs", emoji: "🙏", accent: "amber",
    title: { nl: "Ik wil", en: "I need", fr: "Je veux" },
    tiles: [
      phrase("n-drink", "🥤", "Ik wil iets drinken.", "I would like a drink.", "Je voudrais boire."),
      phrase("n-eat", "🍎", "Ik heb honger.", "I am hungry.", "J'ai faim."),
      phrase("n-rest", "🛏️", "Ik wil rusten.", "I would like to rest.", "Je veux me reposer."),
      phrase("n-music", "🎵", "Zet muziek aan.", "Put on some music.", "Mets de la musique."),
      phrase("n-out", "🌳", "Ik wil naar buiten.", "I want to go outside.", "Je veux sortir."),
      phrase("n-help", "🆘", "Ik heb hulp nodig.", "I need help.", "J'ai besoin d'aide."),
    ],
  },

  feel: {
    id: "feel", emoji: "💚", accent: "emerald",
    title: { nl: "Gevoel", en: "Feelings", fr: "Émotions" },
    tiles: [
      phrase("f-good", "😊", "Ik voel me goed.", "I feel good.", "Je me sens bien."),
      phrase("f-happy", "😄", "Ik ben blij.", "I am happy.", "Je suis content."),
      phrase("f-tired", "😴", "Ik ben moe.", "I am tired.", "Je suis fatigué."),
      phrase("f-pain", "🤕", "Ik heb pijn.", "I am in pain.", "J'ai mal."),
      phrase("f-sad", "😢", "Ik ben verdrietig.", "I feel sad.", "Je suis triste."),
      phrase("f-love", "❤️", "Ik hou van je.", "I love you.", "Je t'aime."),
    ],
  },

  reply: {
    id: "reply", emoji: "💭", accent: "violet",
    title: { nl: "Antwoord", en: "Reply", fr: "Réponse" },
    tiles: [
      phrase("r-yes", "✅", "Ja.", "Yes.", "Oui."),
      phrase("r-no", "❌", "Nee.", "No.", "Non."),
      phrase("r-maybe", "🤔", "Misschien.", "Maybe.", "Peut-être."),
      phrase("r-thanks", "🙏", "Dank je wel.", "Thank you.", "Merci."),
      phrase("r-again", "🔁", "Kun je dat herhalen?", "Can you say that again?", "Tu peux répéter ?"),
      phrase("r-dontknow", "🤷", "Ik weet het niet.", "I don't know.", "Je ne sais pas."),
    ],
  },

  people: {
    id: "people", emoji: "👨‍👩‍👧", accent: "rose",
    title: { nl: "Mensen", en: "People", fr: "Personnes" },
    tiles: [
      word("p-i", "🙋", "ik", "I", "je"),
      word("p-you", "👉", "jij", "you", "tu"),
      word("p-mom", "👩", "mama", "mom", "maman"),
      word("p-dad", "👨", "papa", "dad", "papa"),
      word("p-friend", "🧑‍🤝‍🧑", "vriend", "friend", "ami"),
      word("p-helper", "🧑‍⚕️", "begeleider", "carer", "aidant"),
    ],
  },

  build: {
    id: "build", emoji: "🧩", accent: "teal",
    title: { nl: "Zinnen bouwen", en: "Build", fr: "Composer" },
    tiles: [
      word("b-i", "🙋", "ik", "I", "je"),
      word("b-want", "✨", "wil", "want", "veux"),
      word("b-drink", "🥤", "drinken", "drink", "boire"),
      word("b-eat", "🍎", "eten", "eat", "manger"),
      word("b-go", "🚶", "gaan", "go", "aller"),
      word("b-now", "⏰", "nu", "now", "maintenant"),
      word("b-please", "🙏", "alsjeblieft", "please", "s'il te plaît"),
      word("b-more", "➕", "meer", "more", "plus"),
      word("b-music", "🎵", "muziek", "music", "musique"),
      word("b-outside", "🌳", "buiten", "outside", "dehors"),
      word("b-cold", "❄️", "koud", "cold", "froid"),
      word("b-warm", "🔥", "warm", "warm", "chaud"),
    ],
  },
};
