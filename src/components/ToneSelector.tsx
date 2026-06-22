import type { Lang, Tone } from "../types";
import { TONE_LABELS, TONE_EMOJI } from "../i18n";

const TONES: Tone[] = ["calm", "normal", "happy", "playful"];

interface Props {
  value: Tone;
  lang: Lang;
  onChange: (tone: Tone) => void;
}

export function ToneSelector({ value, lang, onChange }: Props) {
  return (
    <div className="tones" role="radiogroup" aria-label="tone">
      {TONES.map((tone) => (
        <button
          key={tone}
          type="button"
          role="radio"
          aria-checked={value === tone}
          className={"tone" + (value === tone ? " tone--active" : "")}
          onClick={() => onChange(tone)}
          title={TONE_LABELS[tone][lang]}
        >
          <span aria-hidden>{TONE_EMOJI[tone]}</span>
          <span className="tone__label">{TONE_LABELS[tone][lang]}</span>
        </button>
      ))}
    </div>
  );
}
