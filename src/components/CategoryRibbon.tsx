import type { Lang } from "../types";
import { BOARDS } from "../data/boards";
import { useDwell } from "../hooks/useDwell";

// Direct jumps so an eyes-only user reaches any board without going Home first.
const ORDER = ["home", "greet", "needs", "comfort", "feel", "reply", "people", "build"];

interface Props {
  lang: Lang;
  currentBoard: string;
  dwellMs: number;
  onJump: (boardId: string) => void;
}

function RibbonButton(props: {
  emoji: string;
  label: string;
  active: boolean;
  dwellMs: number;
  onFire: () => void;
}) {
  const { progress, handlers } = useDwell(props.dwellMs, props.onFire);
  return (
    <button
      type="button"
      className={"iconbtn ribbon-btn" + (props.active ? " ribbon-btn--active" : "")}
      aria-label={props.label}
      aria-current={props.active}
      {...handlers}
    >
      <span className="action__fill" style={{ transform: `scaleY(${progress})` }} aria-hidden />
      <span aria-hidden>{props.emoji}</span>
    </button>
  );
}

export function CategoryRibbon({ lang, currentBoard, dwellMs, onJump }: Props) {
  return (
    <nav className="ribbon" aria-label="categories">
      {ORDER.map((id) => {
        const b = BOARDS[id];
        if (!b) return null;
        return (
          <RibbonButton
            key={id}
            emoji={b.emoji}
            label={b.title[lang]}
            active={currentBoard === id}
            dwellMs={dwellMs}
            onFire={() => onJump(id)}
          />
        );
      })}
    </nav>
  );
}
