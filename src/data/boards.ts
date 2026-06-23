import type { Board } from "../types";

/**
 * Iris core vocabulary. Each tile carries an ARASAAC search keyword so it shows
 * the familiar clinical pictogram, with an emoji as the offline/no-match
 * fallback. Keywords are single, common terms — multi-word/apostrophe phrases do
 * not resolve in ARASAAC. Content is original and generic — no personal data.
 */

const phrase = (id: string, keyword: string, emoji: string, nl: string, en: string, fr: string) =>
  ({ id, kind: "phrase" as const, keyword, emoji, label: { nl, en, fr } });

const word = (id: string, keyword: string, emoji: string, nl: string, en: string, fr: string) =>
  ({ id, kind: "word" as const, keyword, emoji, label: { nl, en, fr } });

export const HOME: Board = {
  id: "home",
  title: { nl: "Start", en: "Home", fr: "Accueil" },
  emoji: "💬",
  accent: "indigo",
  tiles: [
    { id: "sos", kind: "phrase", urgent: true, keyword: "help", emoji: "🆘", accent: "alert",
      label: { nl: "Help mij, kom alsjeblieft!", en: "Help me, please come!", fr: "Aidez-moi, venez vite !" } },
    { id: "to-greet", kind: "board", to: "greet", keyword: "greeting", emoji: "👋", label: { nl: "Hallo", en: "Hello", fr: "Bonjour" }, accent: "sky" },
    { id: "to-needs", kind: "board", to: "needs", keyword: "want", emoji: "🙏", label: { nl: "Ik wil", en: "I need", fr: "Je veux" }, accent: "amber" },
    { id: "to-comfort", kind: "board", to: "comfort", keyword: "pain", emoji: "🩺", label: { nl: "Pijn & comfort", en: "Pain & comfort", fr: "Douleur & confort" }, accent: "alert" },
    { id: "to-feel", kind: "board", to: "feel", keyword: "feeling", emoji: "💚", label: { nl: "Gevoel", en: "Feelings", fr: "Émotions" }, accent: "emerald" },
    { id: "to-reply", kind: "board", to: "reply", keyword: "answer", emoji: "💭", label: { nl: "Antwoord", en: "Reply", fr: "Réponse" }, accent: "violet" },
    { id: "to-people", kind: "board", to: "people", keyword: "family", emoji: "👨‍👩‍👧", label: { nl: "Mensen", en: "People", fr: "Personnes" }, accent: "rose" },
    { id: "to-build", kind: "board", to: "build", keyword: "puzzle", emoji: "🧩", label: { nl: "Zinnen bouwen", en: "Build", fr: "Composer" }, accent: "teal" },
  ],
};

export const BOARDS: Record<string, Board> = {
  home: HOME,

  greet: {
    id: "greet", emoji: "👋", accent: "sky",
    title: { nl: "Hallo", en: "Hello", fr: "Bonjour" },
    tiles: [
      phrase("g-hi", "hello", "👋", "Hallo!", "Hello!", "Bonjour !"),
      phrase("g-welcome", "happy", "🤗", "Fijn dat je er bent.", "Good to see you.", "Content de te voir."),
      phrase("g-name", "name", "🙋", "Hoe heet je?", "What is your name?", "Comment tu t'appelles ?"),
      phrase("g-howru", "greeting", "🌞", "Hoe gaat het?", "How are you?", "Comment ça va ?"),
      phrase("g-bye", "goodbye", "👋", "Tot ziens!", "Goodbye!", "Au revoir !"),
      phrase("g-wait", "wait", "⏳", "Wacht even, alsjeblieft.", "One moment, please.", "Un instant, s'il te plaît."),
    ],
  },

  needs: {
    id: "needs", emoji: "🙏", accent: "amber",
    title: { nl: "Ik wil", en: "I need", fr: "Je veux" },
    tiles: [
      phrase("n-drink", "drink", "🥤", "Ik wil iets drinken.", "I would like a drink.", "Je voudrais boire."),
      phrase("n-eat", "eat", "🍎", "Ik heb honger.", "I am hungry.", "J'ai faim."),
      phrase("n-rest", "sleep", "🛏️", "Ik wil rusten.", "I would like to rest.", "Je veux me reposer."),
      phrase("n-music", "music", "🎵", "Zet muziek aan.", "Put on some music.", "Mets de la musique."),
      phrase("n-out", "outside", "🌳", "Ik wil naar buiten.", "I want to go outside.", "Je veux sortir."),
      phrase("n-help", "help", "🆘", "Ik heb hulp nodig.", "I need help.", "J'ai besoin d'aide."),
    ],
  },

  comfort: {
    id: "comfort", emoji: "🩺", accent: "alert",
    title: { nl: "Pijn & comfort", en: "Pain & comfort", fr: "Douleur & confort" },
    tiles: [
      phrase("c-pain", "pain", "🤕", "Ik heb pijn.", "I am in pain.", "J'ai mal."),
      phrase("c-breath", "breathing", "🫁", "Ik kan moeilijk ademen.", "I have trouble breathing.", "J'ai du mal à respirer."),
      phrase("c-hot", "hot", "🥵", "Ik heb het te warm.", "I am too hot.", "J'ai trop chaud."),
      phrase("c-cold", "cold", "🥶", "Ik heb het te koud.", "I am too cold.", "J'ai trop froid."),
      phrase("c-move", "position", "🛏️", "Ik wil anders liggen.", "Please reposition me.", "Repositionnez-moi."),
      phrase("c-toilet", "toilet", "🚽", "Ik moet naar het toilet.", "I need the toilet.", "J'ai besoin des toilettes."),
      phrase("c-itch", "itch", "🖐️", "Het jeukt.", "I have an itch.", "Ça me démange."),
      phrase("c-fear", "scared", "😨", "Ik ben bang.", "I feel scared.", "J'ai peur."),
      phrase("c-cramp", "cramp", "🦵", "Ik heb kramp.", "I have a cramp.", "J'ai une crampe."),
    ],
  },

  feel: {
    id: "feel", emoji: "💚", accent: "emerald",
    title: { nl: "Gevoel", en: "Feelings", fr: "Émotions" },
    tiles: [
      phrase("f-good", "good", "😊", "Ik voel me goed.", "I feel good.", "Je me sens bien."),
      phrase("f-happy", "happy", "😄", "Ik ben blij.", "I am happy.", "Je suis content."),
      phrase("f-tired", "tired", "😴", "Ik ben moe.", "I am tired.", "Je suis fatigué."),
      phrase("f-sad", "sad", "😢", "Ik ben verdrietig.", "I feel sad.", "Je suis triste."),
      phrase("f-angry", "angry", "😠", "Ik ben boos.", "I am angry.", "Je suis en colère."),
      phrase("f-love", "love", "❤️", "Ik hou van je.", "I love you.", "Je t'aime."),
    ],
  },

  reply: {
    id: "reply", emoji: "💭", accent: "violet",
    title: { nl: "Antwoord", en: "Reply", fr: "Réponse" },
    tiles: [
      phrase("r-yes", "yes", "✅", "Ja.", "Yes.", "Oui."),
      phrase("r-no", "no", "❌", "Nee.", "No.", "Non."),
      phrase("r-maybe", "doubt", "🤔", "Misschien.", "Maybe.", "Peut-être."),
      phrase("r-thanks", "thanks", "🙏", "Dank je wel.", "Thank you.", "Merci."),
      phrase("r-again", "repeat", "🔁", "Kun je dat herhalen?", "Can you say that again?", "Tu peux répéter ?"),
      phrase("r-dontknow", "unknown", "🤷", "Ik weet het niet.", "I don't know.", "Je ne sais pas."),
    ],
  },

  people: {
    id: "people", emoji: "👨‍👩‍👧", accent: "rose",
    title: { nl: "Mensen", en: "People", fr: "Personnes" },
    tiles: [
      word("p-i", "me", "🙋", "ik", "I", "je"),
      word("p-you", "you", "👉", "jij", "you", "tu"),
      word("p-mom", "mother", "👩", "mama", "mom", "maman"),
      word("p-dad", "father", "👨", "papa", "dad", "papa"),
      word("p-friend", "friend", "🧑‍🤝‍🧑", "vriend", "friend", "ami"),
      word("p-helper", "carer", "🧑‍⚕️", "begeleider", "carer", "aidant"),
    ],
  },

  build: {
    id: "build", emoji: "🧩", accent: "teal",
    title: { nl: "Zinnen bouwen", en: "Build", fr: "Composer" },
    tiles: [
      word("b-i", "me", "🙋", "ik", "I", "je"),
      word("b-want", "want", "✨", "wil", "want", "veux"),
      word("b-drink", "drink", "🥤", "drinken", "drink", "boire"),
      word("b-eat", "eat", "🍎", "eten", "eat", "manger"),
      word("b-go", "go", "🚶", "gaan", "go", "aller"),
      word("b-now", "now", "⏰", "nu", "now", "maintenant"),
      word("b-please", "please", "🙏", "alsjeblieft", "please", "s'il te plaît"),
      word("b-more", "more", "➕", "meer", "more", "plus"),
      word("b-music", "music", "🎵", "muziek", "music", "musique"),
      word("b-outside", "outside", "🌳", "buiten", "outside", "dehors"),
      word("b-cold", "cold", "❄️", "koud", "cold", "froid"),
      word("b-warm", "hot", "🔥", "warm", "warm", "chaud"),
    ],
  },
};
