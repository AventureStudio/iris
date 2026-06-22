import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Webcam gaze/head-pointing tracker built on MediaPipe Face Landmarker
 * (Apache-2.0). It estimates a screen point from head pose (nose offset within
 * the face box) plus eye-look blendshapes, with EMA smoothing and a
 * recenter-able calibration origin. No backend, no API key — the model and WASM
 * load lazily from the MediaPipe CDN the first time tracking is enabled.
 */

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export interface GazeConfig {
  /** Higher = small movements travel further across the screen. */
  sensitivity: number;
  invertX: boolean;
  invertY: boolean;
}

export interface GazePoint {
  x: number;
  y: number;
}

export class GazeTracker {
  private landmarker: FaceLandmarker | null = null;
  private calX = 0;
  private calY = 0;
  private smX = 0.5;
  private smY = 0.5;
  private haveCalibration = false;
  private lastTs = -1;

  async init(): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    const make = (delegate: "GPU" | "CPU") =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });
    try {
      this.landmarker = await make("GPU");
    } catch {
      this.landmarker = await make("CPU");
    }
  }

  /** Force the next detected raw position to become the screen centre. */
  recenter(): void {
    this.haveCalibration = false;
  }

  private computeRaw(
    landmarks: { x: number; y: number }[],
    blend: Map<string, number>,
  ): { rx: number; ry: number } {
    const nose = landmarks[1];
    const lc = landmarks[234];
    const rc = landmarks[454];
    const top = landmarks[10];
    const chin = landmarks[152];

    const faceW = Math.hypot(rc.x - lc.x, rc.y - lc.y) || 1e-3;
    const faceH = Math.abs(chin.y - top.y) || 1e-3;
    const cx = (lc.x + rc.x) / 2;
    const cy = (top.y + chin.y) / 2;

    const headX = (nose.x - cx) / faceW;
    const headY = (nose.y - cy) / faceH;

    const b = (k: string) => blend.get(k) ?? 0;
    const eyeX =
      b("eyeLookOutLeft") + b("eyeLookInRight") -
      (b("eyeLookInLeft") + b("eyeLookOutRight"));
    const eyeY =
      b("eyeLookDownLeft") + b("eyeLookDownRight") -
      (b("eyeLookUpLeft") + b("eyeLookUpRight"));

    return {
      rx: headX * 2.2 + eyeX * 0.6,
      ry: headY * 2.2 + eyeY * 0.6,
    };
  }

  /** Detect one video frame; returns a smoothed screen point or null (no face). */
  detect(
    video: HTMLVideoElement,
    tsMs: number,
    width: number,
    height: number,
    cfg: GazeConfig,
  ): GazePoint | null {
    if (!this.landmarker) return null;
    // detectForVideo requires strictly increasing timestamps.
    if (tsMs <= this.lastTs) tsMs = this.lastTs + 1;
    this.lastTs = tsMs;

    const res = this.landmarker.detectForVideo(video, tsMs);
    if (!res.faceLandmarks?.length) return null;

    const blend = new Map<string, number>();
    const cats = res.faceBlendshapes?.[0]?.categories ?? [];
    for (const c of cats) blend.set(c.categoryName, c.score);

    const { rx, ry } = this.computeRaw(res.faceLandmarks[0], blend);

    if (!this.haveCalibration) {
      this.calX = rx;
      this.calY = ry;
      this.haveCalibration = true;
    }

    const k = cfg.sensitivity;
    const sx = cfg.invertX ? -1 : 1;
    const sy = cfg.invertY ? -1 : 1;
    let nx = 0.5 + sx * k * (rx - this.calX);
    let ny = 0.5 + sy * k * (ry - this.calY);
    nx = Math.min(1, Math.max(0, nx));
    ny = Math.min(1, Math.max(0, ny));

    // Exponential smoothing to tame jitter.
    const a = 0.35;
    this.smX = a * nx + (1 - a) * this.smX;
    this.smY = a * ny + (1 - a) * this.smY;

    return { x: this.smX * width, y: this.smY * height };
  }

  close(): void {
    try {
      this.landmarker?.close();
    } catch {
      /* ignore */
    }
    this.landmarker = null;
  }
}
