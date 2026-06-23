import { useEffect, useRef, useState } from "react";
import { GazeTracker } from "../lib/gaze";
import {
  gazeToPoint,
  resolveTarget,
  dwellables,
  fitCalibration,
  type Pt,
  type GazeCalibration,
  type CalSample,
} from "../lib/gazeHitTest";

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
  calibrateNonce: number;
  calibration: GazeCalibration | null;
  onCalibrated: (cal: GazeCalibration | null) => void;
  showPreview: boolean;
}

type Status = "off" | "loading" | "running" | "denied" | "error";

const HYSTERESIS_FRAMES = 3;
const LOST_FACE_FRAMES = 12;

// 9-point (3×3) calibration grid + per-point timings.
const CAL_TARGETS: Array<[number, number]> = [
  [0.5, 0.5],
  [0.12, 0.12], [0.5, 0.12], [0.88, 0.12],
  [0.12, 0.5], [0.88, 0.5],
  [0.12, 0.88], [0.5, 0.88], [0.88, 0.88],
];
const SETTLE_MS = 600;
const COLLECT_MS = 750;

export function GazeController({
  enabled,
  dwellMs,
  config,
  recenterNonce,
  calibrateNonce,
  calibration,
  onCalibrated,
  showPreview,
}: Props) {
  const [status, setStatus] = useState<Status>("off");
  const [dot, setDot] = useState<Pt | null>(null);
  const [progress, setProgress] = useState(0);
  const [calStep, setCalStep] = useState(-1);
  const [calProgress, setCalProgress] = useState(0);
  const [showDrift, setShowDrift] = useState(false);
  const driftShownRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<GazeTracker | null>(null);

  const cfgRef = useRef({ dwellMs, config, calibration });
  const onCalibratedRef = useRef(onCalibrated);
  const calRef = useRef({ x: 0, y: 0 });
  const recenterRef = useRef(false);

  const calActiveRef = useRef(false);
  const calStepRef = useRef(0);
  const calStepStartRef = useRef(0);
  const calSamplesRef = useRef<CalSample[]>([]);

  useEffect(() => {
    cfgRef.current = { dwellMs, config, calibration };
  }, [dwellMs, config, calibration]);
  useEffect(() => {
    onCalibratedRef.current = onCalibrated;
  }, [onCalibrated]);

  useEffect(() => {
    if (recenterNonce > 0) recenterRef.current = true;
  }, [recenterNonce]);

  useEffect(() => {
    if (calibrateNonce > 0 && trackerRef.current?.ready) {
      calActiveRef.current = true;
      calStepRef.current = 0;
      calStepStartRef.current = 0;
      calSamplesRef.current = [];
      setCalStep(0);
      setCalProgress(0);
    }
  }, [calibrateNonce]);

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

    let focus: HTMLElement | null = null;
    let pending: HTMLElement | null = null;
    let pendingCount = 0;
    let dwellAccum = 0; // focused, eyes-open time (ms) — pauses on blink/loss
    let lostFace = 0;
    let suppressed: HTMLElement | null = null;
    let lastNow = performance.now();
    let driftFrames = 0;
    let driftNull = 0;

    // Only push state when it visibly changes (avoid 60fps re-renders).
    let lastDot: Pt | null = null;
    let lastProg = 0;
    const pushDot = (p: Pt | null) => {
      if (!p && !lastDot) return;
      if (p && lastDot && Math.abs(p.x - lastDot.x) < 1.5 && Math.abs(p.y - lastDot.y) < 1.5) return;
      lastDot = p;
      setDot(p);
    };
    const pushProg = (v: number) => {
      if (Math.abs(v - lastProg) < 0.02 && v !== 0 && v !== 1) return;
      lastProg = v;
      setProgress(v);
    };

    const setHighlight = (el: HTMLElement | null) => {
      document.querySelectorAll(".gaze-target").forEach((n) => n.classList.remove("gaze-target"));
      el?.classList.add("gaze-target");
    };

    const runCalibration = (gaze: { x: number; y: number }, now: number) => {
      if (calStepStartRef.current === 0) calStepStartRef.current = now;
      const elapsed = now - calStepStartRef.current;
      const [tx, ty] = CAL_TARGETS[calStepRef.current];
      if (elapsed >= SETTLE_MS && elapsed < SETTLE_MS + COLLECT_MS) {
        calSamplesRef.current.push({ gx: gaze.x, gy: gaze.y, tx, ty });
        setCalProgress((elapsed - SETTLE_MS) / COLLECT_MS);
      } else if (elapsed >= SETTLE_MS + COLLECT_MS) {
        const next = calStepRef.current + 1;
        if (next >= CAL_TARGETS.length) {
          const model = fitCalibration(calSamplesRef.current);
          calActiveRef.current = false;
          setCalStep(-1);
          setCalProgress(0);
          onCalibratedRef.current(model);
        } else {
          calStepRef.current = next;
          calStepStartRef.current = 0;
          setCalStep(next);
          setCalProgress(0);
        }
      } else {
        setCalProgress(0);
      }
    };

    const loop = () => {
      const video = videoRef.current;
      if (!cancelled && video) {
        const now = performance.now();
        const dt = Math.min(100, now - lastNow);
        lastNow = now;
        const frame = tracker.detect(video, now);

        if (calActiveRef.current) {
          pushDot(null);
          setHighlight(null);
          if (frame.hasFace && !frame.eyesClosed) runCalibration(frame.gaze, now);
          else if (calStepStartRef.current !== 0) calStepStartRef.current += dt; // pause on blink/loss
        } else if (!frame.hasFace) {
          lostFace += 1;
          if (lostFace >= LOST_FACE_FRAMES && focus) {
            pushDot(null);
            focus = null;
            pending = null;
            pendingCount = 0;
            dwellAccum = 0;
            setHighlight(null);
            pushProg(0);
          }
        } else {
          lostFace = 0;
          if (recenterRef.current) {
            calRef.current = { x: frame.gaze.x, y: frame.gaze.y };
            recenterRef.current = false;
          }

          const { config: cfg, calibration: cal } = cfgRef.current;
          const pt = gazeToPoint(frame.gaze.x, frame.gaze.y, {
            sensitivity: cfg.sensitivity,
            calX: calRef.current.x,
            calY: calRef.current.y,
            invertX: cfg.invertX,
            invertY: cfg.invertY,
            calibration: cal,
          });
          pushDot(pt);

          const target = resolveTarget(pt, dwellables());

          // Drift watch: if the gaze keeps landing on nothing, suggest recalibration.
          driftFrames += 1;
          if (!target) driftNull += 1;
          if (driftFrames >= 900) {
            if (!driftShownRef.current && driftNull / driftFrames > 0.55 && !cfgRef.current.calibration) {
              driftShownRef.current = true;
              setShowDrift(true);
              window.setTimeout(() => setShowDrift(false), 8000);
            }
            driftFrames = 0;
            driftNull = 0;
          }

          if (target === pending) {
            pendingCount += 1;
          } else {
            pending = target;
            pendingCount = 1;
          }
          if (target !== focus && (pendingCount >= HYSTERESIS_FRAMES || target === null)) {
            focus = target;
            dwellAccum = 0;
            setHighlight(focus);
            if (focus !== suppressed) suppressed = null;
          }

          // Advance dwell only while eyes are open — a blink never fires.
          if (focus && focus !== suppressed) {
            if (!frame.eyesClosed) dwellAccum += dt;
            const p = Math.min(1, dwellAccum / cfgRef.current.dwellMs);
            pushProg(p);
            if (p >= 1) {
              if (focus.isConnected && focus.offsetParent !== null) focus.click();
              suppressed = focus;
              dwellAccum = 0;
              pushProg(0);
            }
          } else {
            pushProg(0);
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
        recenterRef.current = true;
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
      calActiveRef.current = false;
      setCalStep(-1);
      stream?.getTracks().forEach((t) => t.stop());
      tracker.close();
      trackerRef.current = null;
    };
  }, [enabled]);

  const calibrating = calStep >= 0;
  const target = calibrating ? CAL_TARGETS[calStep] : null;

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

      {showDrift && !calibrating && (
        <div className="drift-hint" role="status">
          🎯 Moeite met richten? Kalibreer opnieuw via instellingen.
        </div>
      )}

      {calibrating && target && (
        <div className="cal-overlay" role="dialog" aria-label="calibration">
          <p className="cal-hint">👁️ Kijk naar de stip · {calStep + 1}/{CAL_TARGETS.length}</p>
          <div
            className="cal-target"
            style={{ left: `${target[0] * 100}%`, top: `${target[1] * 100}%` }}
          >
            <svg viewBox="0 0 56 56" className="cal-ring">
              <circle className="cal-ring__bg" cx="28" cy="28" r="24" />
              <circle
                className="cal-ring__fg"
                cx="28"
                cy="28"
                r="24"
                style={{ strokeDashoffset: 150.8 * (1 - calProgress) }}
              />
            </svg>
            <span className="cal-dot" />
          </div>
        </div>
      )}

      {dot && !calibrating && (
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
