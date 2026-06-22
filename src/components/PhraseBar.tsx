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
}

function ActionButton(props: {
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

export function PhraseBar({ words, lang, dwellMs, onSpeak, onClear }: Props) {
  const empty = words.length === 0;
  return (
    <div className="phrasebar" role="region" aria-label="phrase">
      <div className="phrasebar__words">
        {empty ? (
          <span className="phrasebar__placeholder">{t("emptyPhrase", lang)}</span>
        ) : (
          words.map((w, i) => (
            <span className="chip" key={i}>
              <span aria-hidden>{w.emoji}</span> {w.text}
            </span>
          ))
        )}
      </div>
      <div className="phrasebar__actions">
        <ActionButton
          className="action action--speak"
          emoji="🔊"
          label={t("speak", lang)}
          dwellMs={dwellMs}
          disabled={empty}
          onFire={onSpeak}
        />
        <ActionButton
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
