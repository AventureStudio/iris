# Iris — accessible AAC communication board

**Iris** is an open, gaze-driven Augmentative and Alternative Communication (AAC)
app for people who cannot speak or move freely but can hear and select with their
eyes (or a pointer/touch). It turns expression into **picking**: choose a tile,
and it is spoken aloud — with a chosen emotional tone.

This is **Phase 1**: the core engine plus the offline **Boards** mode. It runs
entirely in the browser with **no backend and no API keys**.

## Features

- **Dwell-to-select** — any tile fires after a gaze/pointer rests on it; a tap or
  click also fires immediately. Dwell time is configurable (0.6–4 s).
- **Spoken output** — browser `SpeechSynthesis`, no keys required.
- **Emotional tone** — Calm / Normal / Happy / Playful, delivered as prosody
  (the text stays the same; only delivery changes).
- **Category boards** — greetings, needs, feelings, replies, people.
- **Phrase builder** — chain core words and speak a composed sentence.
- **Webcam eye/head tracking** — on-device gaze via MediaPipe Face Landmarker
  (Apache-2.0); no dedicated eye-tracker hardware needed. The gaze cursor drives
  the same dwell selection. Sensitivity, axis inversion and recenter are
  adjustable. Loads lazily only when enabled.
- **ARASAAC pictograms** — the familiar open symbol library, with emoji fallback.
- **Natural voice (optional)** — ElevenLabs via a serverless proxy, with browser
  speech as the default and the automatic fallback.
- **Multilingual** — Dutch / English / French.
- **Accessibility-first** — large high-contrast targets, smooth non-flashing
  animations, `prefers-reduced-motion` support, ARIA labels.

## Configuration

ElevenLabs voice is **off by default** and only works once a key is set on the
deployment (the key never reaches the browser):

```bash
vercel env add ELEVENLABS_API_KEY production   # paste the token when prompted
vercel env add ELEVENLABS_VOICE_ID production   # optional; a default voice is used otherwise
```

Then enable "Natural voice" in Settings. Without a key, Iris uses the browser voice.

## Roadmap (Phase 2)

- **Listen mode** — a partner speaks → on-device VAD + transcription → an LLM
  proposes context-aware replies.
- **Meet mode** — webcam → vision model suggests conversation openers.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Stack & licensing

Pure client-side SPA: **React + TypeScript + Vite**. No backend in Phase 1.

| Dependency | License |
| --- | --- |
| react, react-dom | MIT |
| vite, @vitejs/plugin-react | MIT |
| typescript | Apache-2.0 |
| @mediapipe/tasks-vision | Apache-2.0 |

The **code** is licensed **MIT** (see [LICENSE](./LICENSE)).

### Symbol assets — read before commercial use

By default Iris displays **ARASAAC pictograms** (author: Sergio Palao · ARASAAC ·
Gobierno de Aragón), licensed **CC BY-NC-SA 4.0** — **non-commercial + share-alike**.
They are third-party assets fetched at runtime and shown under their own license;
they are **not** MIT and not covered by this repo's license.

- **Personal / non-commercial use** (e.g. an individual communicating): allowed by
  CC BY-NC-SA, with attribution.
- **Commercial use**: swap the symbol provider. The seam is a single module
  (`src/lib/arasaac.ts` + `src/components/Symbol.tsx`); point it at emoji (already
  the fallback), a CC0 set, or your own/licensed symbols. The MIT code is unchanged.

ElevenLabs (optional) is a paid third-party API reached through the server proxy.

### Provenance

Iris is an **independent, clean-room implementation** written from a functional
design. It does **not** copy code from any AGPL-licensed hackathon project; it
reuses only ideas and architecture (which are not protected by copyright), built
on permissively licensed dependencies. This keeps Iris cleanly MIT.
