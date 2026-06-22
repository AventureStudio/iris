import { useEffect, useState } from "react";
import { resolvePicto } from "../lib/arasaac";

interface Props {
  keyword: string;
  emoji: string;
}

/**
 * Shows the ARASAAC pictogram for a keyword; falls back to the emoji while
 * loading, when offline, or when no pictogram matches.
 */
export function Symbol({ keyword, emoji }: Props) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    resolvePicto(keyword).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [keyword]);

  if (src) {
    return <img className="sym-img" src={src} alt="" loading="lazy" draggable={false} />;
  }
  return <span className="sym-emoji" aria-hidden>{emoji}</span>;
}
