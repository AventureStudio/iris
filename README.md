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
- **Multilingual** — Dutch / English / French.
- **Accessibility-first** — large high-contrast targets, smooth non-flashing
  animations, `prefers-reduced-motion` support, ARIA labels.

## Roadmap (Phase 2)

- **Listen mode** — a partner speaks → on-device VAD + transcription → an LLM
  proposes context-aware replies. Requires a serverless AI proxy + key.
- **Meet mode** — webcam → vision model suggests conversation openers.
- **Webcam gaze** — on-device eye-gaze via MediaPipe Face Landmarker (Apache-2.0),
  so no dedicated eye-tracker hardware is needed.

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

**Symbols** are Unicode **emoji** (no proprietary or non-commercial pictogram set),
so the whole project is freely usable, including commercially.

This project is licensed **MIT** (see [LICENSE](./LICENSE)).

### Provenance

Iris is an **independent, clean-room implementation** written from a functional
design. It does **not** copy code from any AGPL-licensed hackathon project; it
reuses only ideas and architecture (which are not protected by copyright), built
on permissively licensed dependencies. This keeps Iris cleanly MIT.
