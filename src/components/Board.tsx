import type { Board as BoardModel, Tile as TileModel, Lang } from "../types";
import { Tile } from "./Tile";

interface Props {
  board: BoardModel;
  lang: Lang;
  dwellMs: number;
  onSelect: (tile: TileModel) => void;
}

export function Board({ board, lang, dwellMs, onSelect }: Props) {
  return (
    <div className="board" key={board.id}>
      {board.tiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          lang={lang}
          dwellMs={dwellMs}
          accent={board.accent}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
