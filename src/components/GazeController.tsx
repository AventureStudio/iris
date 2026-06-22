import { useEffect, useRef, useState } from "react";
import { GazeTracker, type GazeConfig } from "../lib/gaze";

interface Props {
  enabled: boolean;
  dwellMs: number;
  config: GazeConfig;
  /** Bumping this value triggers a recenter of the gaze origin. */
  recenterNonce: number;
  showPreview: boolean;
}

type Status = "off" | "loading" | "running" | "denied" | "error";

export function GazeController({ enabled, dwellMs, config, recenterNonce, showPreview }: Props) {
  const [status, setStatus] = useState<Status>("off");
  const [dot, setDot] = useState<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<GazeTracker | null>(null);
  const cfgRef = useRef({ dwellMs, config });

  // Keep live config available to the running loop without restarting it.
  useEffect(() => {
    cfgRef.current = { dwellMs, config };
  }, [dwellMs, config]);

  useEffect(() => {
    if (trackerRef.current) trackerRef.current.recenter();
  }, [recenterNonce]);

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      return;
    }

    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    const tracker = new GazeTracker();
    trackerRef.current = tracker;

    // Per-target dwell bookkeeping.
    let curTarget: Element | null = null;
    let dwellStart = 0;
    let suppressed: Element | null = null;

    const clearHighlight = () => {
      document.querySelectorAll(".gaze-target").forEach((el) => el.classList.remove("gaze-target"));
    };

    const loop = () => {
      const video = videoRef.current;
      if (!cancelled && video && video.readyState >= 2) {
        const pt = tracker.detect(
          video,
          performance.now(),
          window.innerWidth,
          window.innerHeight,
          cfgRef.current.config,
        );
        if (pt) {
          setDot(pt);
          const hit = document.elementFromPoint(pt.x, pt.y);
          const target = hit?.closest("button:not(:disabled)") ?? null;

          if (target !== curTarget) {
            clearHighlight();
            curTarget = target;
            dwellStart = performance.now();
            setProgress(0);
            if (target !== suppressed) suppressed = null;
            if (target) target.classList.add("gaze-target");
          } else if (target && target !== suppressed) {
            const p = Math.min(1, (performance.now() - dwellStart) / cfgRef.current.dwellMs);
            setProgress(p);
            if (p >= 1) {
              (target as HTMLElement).click();
              suppressed = target; // don't refire until gaze leaves and returns
              setProgress(0);
            }
          }
        } else {
          setDot(null);
          if (curTarget) {
            clearHighlight();
            curTarget = null;
            setProgress(0);
          }
        }
      }
      if (!cancelled) raf = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        setStatus("loading");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) return;
        await tracker.init();
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setStatus("running");
        raf = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
        setStatus(denied ? "denied" : "error");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearHighlight();
      setDot(null);
      setProgress(0);
      stream?.getTracks().forEach((t) => t.stop());
      tracker.close();
      trackerRef.current = null;
    };
  }, [enabled]);

  return (
    <>
      {/* Hidden capture element; the preview thumbnail mirrors it when shown. */}
      <video
        ref={videoRef}
        className={"gaze-video" + (showPreview && status === "running" ? " gaze-video--show" : "")}
        playsInline
        muted
      />

      {enabled && status !== "running" && (
        <div className="gaze-status" role="status">
          {status === "loading" && "📷 Camera laden…"}
          {status === "denied" && "📷 Cameratoegang geweigerd"}
          {status === "error" && "📷 Camera niet beschikbaar"}
        </div>
      )}

      {dot && (
        <div className="gaze-dot" style={{ left: dot.x, top: dot.y }} aria-hidden>
          <svg viewBox="0 0 48 48" className="gaze-ring">
            <circle className="gaze-ring__bg" cx="24" cy="24" r="20" />
            <circle
              className="gaze-ring__fg"
              cx="24"
              cy="24"
              r="20"
              style={{ strokeDashoffset: 125.6 * (1 - progress) }}
            />
          </svg>
        </div>
      )}
    </>
  );
}
