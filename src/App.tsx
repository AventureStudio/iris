import { useCallback, useEffect, useMemo, useState } from "react";
import type { Tile as TileModel } from "./types";
import { BOARDS } from "./data/boards";
import { Board } from "./components/Board";
import { PhraseBar } from "./components/PhraseBar";
import { ToneSelector } from "./components/ToneSelector";
import { Settings } from "./components/Settings";
import { GazeController } from "./components/GazeController";
import { CategoryRibbon } from "./components/CategoryRibbon";
import { loadSettings, saveSettings, type Settings as SettingsModel } from "./lib/settings";
import { speak, speakUrgent, stopSpeaking, beep } from "./lib/speech";
import { t, TONE_EMOJI } from "./i18n";

interface ComposedWord {
  emoji: string;
  text: string;
}

export default function App() {
  const [settings, setSettings] = useState<SettingsModel>(loadSettings);
  const [stack, setStack] = useState<string[]>(["home"]);
  const [words, setWords] = useState<ComposedWord[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [recenterNonce, setRecenterNonce] = useState(0);
  const [calibrateNonce, setCalibrateNonce] = useState(0);

  const boardId = stack[stack.length - 1];
  const board = BOARDS[boardId] ?? BOARDS.home;
  const atHome = stack.length === 1;

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    document.documentElement.lang = settings.lang;
  }, [settings.lang]);

  const patchSettings = useCallback(
    (patch: Partial<SettingsModel>) => setSettings((s) => ({ ...s, ...patch })),
    [],
  );

  const say = useCallback(
    (text: string, urgent = false) => {
      const opts = {
        lang: settings.lang,
        tone: settings.tone,
        voiceName: settings.voiceName,
        useElevenLabs: settings.useElevenLabs,
      };
      if (urgent) speakUrgent(text, opts);
      else speak(text, opts);
      setFlash(text);
      window.setTimeout(() => setFlash((f) => (f === text ? null : f)), 1600);
    },
    [settings.lang, settings.tone, settings.voiceName, settings.useElevenLabs],
  );

  const onSelect = useCallback(
    (tile: TileModel) => {
      if (tile.kind === "board" && tile.to) {
        setStack((s) => [...s, tile.to!]);
      } else if (tile.kind === "phrase") {
        say(tile.label[settings.lang], tile.urgent);
      } else if (tile.kind === "word") {
        setWords((w) => [...w, { emoji: tile.emoji, text: tile.label[settings.lang] }]);
        beep();
      }
    },
    [say, settings.lang],
  );

  const removeWord = useCallback((index: number) => {
    setWords((w) => w.filter((_, i) => i !== index));
  }, []);

  const goBack = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const jumpTo = useCallback((boardId: string) => {
    setStack(boardId === "home" ? ["home"] : ["home", boardId]);
  }, []);

  const speakPhrase = useCallback(() => {
    if (words.length === 0) return;
    say(words.map((w) => w.text).join(" "));
  }, [words, say]);

  const title = useMemo(() => board.title[settings.lang], [board, settings.lang]);

  return (
    <div className="app">
      <header className="topbar">
        <button
          type="button"
          className="iconbtn"
          onClick={goBack}
          disabled={atHome}
          aria-label={t("back", settings.lang)}
        >
          ← {atHome ? "" : t("back", settings.lang)}
        </button>

        <h1 className="topbar__title">
          <span aria-hidden>{board.emoji}</span> {atHome ? t("appName", settings.lang) : title}
        </h1>

        <div className="topbar__right">
          <button
            type="button"
            className="iconbtn iconbtn--stop"
            onClick={() => stopSpeaking()}
            aria-label="stop"
          >
            ⏹️
          </button>
          <button
            type="button"
            className={"iconbtn" + (settings.gazeEnabled ? " iconbtn--on" : "")}
            onClick={() => patchSettings({ gazeEnabled: !settings.gazeEnabled })}
            aria-label={t("eyeTracking", settings.lang)}
            aria-pressed={settings.gazeEnabled}
          >
            👁️
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => setShowSettings(true)}
            aria-label={t("settings", settings.lang)}
          >
            ⚙️
          </button>
        </div>
      </header>

      <div className="toolbar">
        <span className="toolbar__hint">{t("tapOrGaze", settings.lang)}</span>
        <ToneSelector
          value={settings.tone}
          lang={settings.lang}
          onChange={(tone) => patchSettings({ tone })}
        />
      </div>

      <CategoryRibbon
        lang={settings.lang}
        currentBoard={boardId}
        dwellMs={settings.dwellMs}
        onJump={jumpTo}
      />

      <main className="content">
        <Board board={board} lang={settings.lang} dwellMs={settings.dwellMs} onSelect={onSelect} />
      </main>

      <PhraseBar
        words={words}
        lang={settings.lang}
        dwellMs={settings.dwellMs}
        onSpeak={speakPhrase}
        onClear={() => setWords([])}
        onRemove={removeWord}
      />

      {flash && (
        <div className="flash" role="status">
          <span aria-hidden>{TONE_EMOJI[settings.tone]}</span> {flash}
        </div>
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onChange={patchSettings}
          onRecenter={() => setRecenterNonce((n) => n + 1)}
          onCalibrate={() => {
            setShowSettings(false); // overlay needs the full screen
            setCalibrateNonce((n) => n + 1);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <GazeController
        enabled={settings.gazeEnabled}
        dwellMs={settings.dwellMs}
        config={{
          sensitivity: settings.gazeSensitivity,
          invertX: settings.gazeInvertX,
          invertY: settings.gazeInvertY,
        }}
        recenterNonce={recenterNonce}
        calibrateNonce={calibrateNonce}
        calibration={settings.gazeCalibration}
        onCalibrated={(cal) => patchSettings({ gazeCalibration: cal })}
        showPreview={settings.gazePreview}
      />
    </div>
  );
}
