import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Dwell-to-select: a target fires after the pointer (mouse, touch-hold, or an
 * external eye-tracker that drives the cursor) rests on it for `dwellMs`.
 *
 * Returns props to spread on the target plus a 0..1 progress value to render a
 * fill/ring. A direct click/tap also fires immediately, so the same control
 * works with or without gaze hardware.
 */
export function useDwell(dwellMs: number, onFire: () => void) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const firedRef = useRef(false);

  const cancel = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    firedRef.current = false;
    setProgress(0);
  }, []);

  const tick = useCallback(
    (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / dwellMs);
      setProgress(p);
      if (p >= 1) {
        if (!firedRef.current) {
          firedRef.current = true;
          onFire();
        }
        cancel();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [dwellMs, onFire, cancel],
  );

  const begin = useCallback(() => {
    if (rafRef.current !== null) return;
    firedRef.current = false;
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Clean up on unmount.
  useEffect(() => cancel, [cancel]);

  const fireNow = useCallback(() => {
    cancel();
    onFire();
  }, [cancel, onFire]);

  return {
    progress,
    handlers: {
      onPointerEnter: begin,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onClick: fireNow,
    },
  };
}
