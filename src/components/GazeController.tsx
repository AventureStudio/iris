import { useEffect, useRef, useState } from "react";
import { GazeTracker } from "../lib/gaze";
import { gazeToPoint, resolveTarget, dwellables, type Pt } from "../lib/gazeHitTest";

interface GazeConfig {
  sensitivity: number;
  invertX: boolean;
  invertY: boolean;
}

interface Props {
  enabled: boolean;
  dwellMs: number;
  config: GazeConfig;
  recenterNonce: number;
  showPreview: boolean;
}

type Status = "off" | "loading" | "running" | "denied" | "error";

const HYSTERESIS_FRAMES = 3;
const LOST_FACE_FRAMES = 12;

export function GazeController({ enabled, dwellMs, config, recenterNonce, showPreview }: Props) {
  const [status, setStatus] = useState<Status>("off");
  const [dot, setDot] = useState<Pt | null>(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<GazeTracker | null>(null);

  // Live config + calibration the loop reads without restarting.
  const cfgRef = useRef({ dwellMs, config });
  const calRef = useRef({ x: 0, y: 0 });
  const recenterRef = useRef(false);

  useEffect(() => {
    cfgRef.current = { dwellMs, config };
  }, [dwellMs, config]);

  useEffect(() => {
    if (recenterNonce > 0) recenterRef.current = true;
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

    // Dwell state.
    let focus: HTMLElement | null = null;
    let pending: HTMLElement | null = null;
    let pendingCount = 0;
    let dwellStart = 0;
    let lostFace = 0;
    let suppressed: HTMLElement | null = null;

    const setHighlight = (el: HTMLElement | null) => {
      document.querySelectorAll(".gaze-target").forEach((n) => n.classList.remove("gaze-target"));
      el?.classList.add("gaze-target");
    };

    const loop = () => {
      const video = videoRef.current;
      if (!cancelled && video) {
        const frame = tracker.detect(video, performance.now());

        if (!frame.hasFace) {
          lostFace += 1;
          if (lostFace >= LOST_FACE_FRAMES) {
            setDot(null);
            if (focus) {
              focus = null;
              pending = null;
              pendingCount = 0;
              setHighlight(null);
              setProgress(0);
            }
          }
        } else {
          lostFace = 0;

          if (recenterRef.current) {
            calRef.current = { x: frame.gaze.x, y: frame.gaze.y };
            recenterRef.current = false;
          }

          const { config: cfg } = cfgRef.current;
          const pt = gazeToPoint(frame.gaze.x, frame.gaze.y, {
            sensitivity: cfg.sensitivity,
            calX: calRef.current.x,
            calY: calRef.current.y,
            invertX: cfg.invertX,
            invertY: cfg.invertY,
          });
          setDot(pt);

          const target = resolveTarget(pt, dwellables());

          // Hysteresis: a new target must persist before stealing focus.
          if (target === pending) {
            pendingCount += 1;
          } else {
            pending = target;
            pendingCount = 1;
          }
          if (target !== focus && (pendingCount >= HYSTERESIS_FRAMES || target === null)) {
            focus = target;
            dwellStart = performance.now();
            setHighlight(focus);
            if (focus !== suppressed) suppressed = null;
          }

          if (focus && focus !== suppressed) {
            const p = Math.min(1, (performance.now() - dwellStart) / cfgRef.current.dwellMs);
            setProgress(p);
            if (p >= 1) {
              focus.click();
              suppressed = focus; // hold until gaze leaves and returns
              setProgress(0);
            }
          } else {
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
        recenterRef.current = true; // centre on first frame
        setStatus("running");
        raf = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        const denied =
          e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
        setStatus(denied ? "denied" : "error");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      setHighlight(null);
      setDot(null);
      setProgress(0);
      stream?.getTracks().forEach((t) => t.stop());
      tracker.close();
      trackerRef.current = null;
    };
  }, [enabled]);

  return (
    <>
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
