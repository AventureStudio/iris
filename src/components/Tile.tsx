import type { Tile as TileModel, Lang } from "../types";
import { useDwell } from "../hooks/useDwell";
import { Symbol } from "./Symbol";

interface Props {
  tile: TileModel;
  lang: Lang;
  dwellMs: number;
  accent: string;
  onSelect: (tile: TileModel) => void;
}

export function Tile({ tile, lang, dwellMs, accent, onSelect }: Props) {
  const { progress, handlers } = useDwell(dwellMs, () => onSelect(tile));
  const acc = tile.accent ?? accent;

  return (
    <button
      type="button"
      className="tile"
      data-accent={acc}
      aria-label={tile.label[lang]}
      aria-busy={progress > 0}
      {...handlers}
    >
      {/* Dwell fill grows from the bottom as the gaze rests. */}
      <span
        className="tile__fill"
        style={{ transform: `scaleY(${progress})` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      />
      <span className="tile__emoji">
        <Symbol keyword={tile.keyword} emoji={tile.emoji} />
      </span>
      <span className="tile__label">{tile.label[lang]}</span>
      {tile.kind === "board" && <span className="tile__chevron" aria-hidden>›</span>}
    </button>
  );
}
