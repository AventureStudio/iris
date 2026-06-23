import { useEffect, useState } from "react";
import { resolvePicto, localPicto } from "../lib/arasaac";

interface Props {
  keyword: string;
  emoji: string;
}

type Stage = "local" | "remote" | "emoji";

/**
 * Pictogram resolution, most reliable first:
 *  1. local bundled asset (/arasaac/<slug>.png, our own origin)
 *  2. ARASAAC runtime fetch (covers any keyword not bundled)
 *  3. emoji fallback
 */
export function Symbol({ keyword, emoji }: Props) {
  const [stage, setStage] = useState<Stage>("local");
  const [src, setSrc] = useState<string>(localPicto(keyword));

  useEffect(() => {
    setStage("local");
    setSrc(localPicto(keyword));
  }, [keyword]);

  if (stage !== "emoji" && src) {
    return (
      <img
        className="sym-img"
        src={src}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => {
          if (stage === "local") {
            // Bundled asset missing → try ARASAAC at runtime.
            setStage("remote");
            resolvePicto(keyword).then((url) => setSrc(url || ""))
              .catch(() => setSrc(""));
          } else {
            setStage("emoji");
          }
        }}
      />
    );
  }
  return <span className="sym-emoji" aria-hidden>{emoji}</span>;
}
