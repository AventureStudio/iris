import type { Lang } from "../types";
import { t } from "../i18n";
import { useDwell } from "../hooks/useDwell";

interface Word {
  emoji: string;
  text: string;
}

interface Props {
  words: Word[];
  lang: Lang;
  dwellMs: number;
  onSpeak: () => void;
  onClear: () => void;
  onRemove: (index: number) => void;
}

function DwellButton(props: {
  className: string;
  label: string;
  emoji: string;
  dwellMs: number;
  disabled?: boolean;
  onFire: () => void;
}) {
  const { progress, handlers } = useDwell(props.dwellMs, () => {
    if (!props.disabled) props.onFire();
  });
  return (
    <button
      type="button"
      className={props.className}
      aria-label={props.label}
      disabled={props.disabled}
      {...handlers}
    >
      <span className="action__fill" style={{ transform: `scaleY(${progress})` }} aria-hidden />
      <span aria-hidden>{props.emoji}</span> {props.label}
    </button>
  );
}

/** A composed word; dwelling on it removes it from the phrase. */
function Chip(props: { word: Word; dwellMs: number; onRemove: () => void }) {
  const { progress, handlers } = useDwell(props.dwellMs, props.onRemove);
  return (
    <button type="button" className="chip" aria-label={`verwijder ${props.word.text}`} {...handlers}>
      <span className="chip__fill" style={{ transform: `scaleY(${progress})` }} aria-hidden />
      <span aria-hidden>{props.word.emoji}</span> {props.word.text}
      <span className="chip__x" aria-hidden>✕</span>
    </button>
  );
}

export function PhraseBar({ words, lang, dwellMs, onSpeak, onClear, onRemove }: Props) {
  const empty = words.length === 0;
  return (
    <div className="phrasebar" role="region" aria-label="phrase">
      <div className="phrasebar__words">
        {empty ? (
          <span className="phrasebar__placeholder">{t("emptyPhrase", lang)}</span>
        ) : (
          words.map((w, i) => (
            <Chip key={i} word={w} dwellMs={dwellMs} onRemove={() => onRemove(i)} />
          ))
        )}
      </div>
      <div className="phrasebar__actions">
        <DwellButton
          className="action action--speak"
          emoji="🔊"
          label={t("speak", lang)}
          dwellMs={dwellMs}
          disabled={empty}
          onFire={onSpeak}
        />
        <DwellButton
          className="action action--clear"
          emoji="🧹"
          label={t("clear", lang)}
          dwellMs={dwellMs}
          disabled={empty}
          onFire={onClear}
        />
      </div>
    </div>
  );
}
