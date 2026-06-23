import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";

/**
 * Webcam gaze tracker on MediaPipe Face Landmarker (Apache-2.0). Produces a
 * normalized attention vector in -1..1 (+x = subject's right, +y = up) combining
 * eye-look blendshapes with head yaw/pitch from the facial transformation matrix,
 * then light EMA smoothing. The screen mapping, hit-testing and dwell live in the
 * controller so this stays a pure signal source. No backend, no key — model and
 * WASM load lazily from the MediaPipe CDN.
 */

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export interface FaceFrame {
  hasFace: boolean;
  /** Attention vector, -1..1. */
  gaze: { x: number; y: number };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export class GazeTracker {
  private landmarker: FaceLandmarker | null = null;
  private lastVideoTime = -1;
  private lastTs = -1;
  private smooth = { x: 0, y: 0 };
  private cached: FaceFrame = { hasFace: false, gaze: { x: 0, y: 0 } };

  async init(): Promise<void> {
    if (this.landmarker) return;
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    const make = (delegate: "GPU" | "CPU") =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    try {
      this.landmarker = await make("GPU");
    } catch {
      this.landmarker = await make("CPU");
    }
  }

  get ready() {
    return this.landmarker !== null;
  }

  detect(video: HTMLVideoElement, tsMs: number): FaceFrame {
    if (!this.landmarker || video.readyState < 2) return this.cached;
    // Skip work when the camera frame hasn't advanced (RAF runs faster than FPS).
    if (video.currentTime === this.lastVideoTime) return this.cached;
    this.lastVideoTime = video.currentTime;
    if (tsMs <= this.lastTs) tsMs = this.lastTs + 1;
    this.lastTs = tsMs;

    let result: FaceLandmarkerResult;
    try {
      result = this.landmarker.detectForVideo(video, tsMs);
    } catch {
      return this.cached;
    }

    const cats = result.faceBlendshapes?.[0]?.categories;
    if (!cats || cats.length === 0) {
      this.cached = { hasFace: false, gaze: { x: 0, y: 0 } };
      return this.cached;
    }

    const b: Record<string, number> = {};
    for (const c of cats) b[c.categoryName] = c.score;

    const raw = this.computeGaze(b, result.facialTransformationMatrixes?.[0]?.data);
    // Light smoothing: responsive but de-jittered.
    this.smooth.x = this.smooth.x * 0.55 + raw.x * 0.45;
    this.smooth.y = this.smooth.y * 0.55 + raw.y * 0.45;
    this.cached = { hasFace: true, gaze: { x: this.smooth.x, y: this.smooth.y } };
    return this.cached;
  }

  private computeGaze(b: Record<string, number>, matrix?: Float32Array | number[]): { x: number; y: number } {
    const v = (k: string) => b[k] ?? 0;
    // Where the eyes point within the head.
    const right = v("eyeLookInLeft") + v("eyeLookOutRight");
    const left = v("eyeLookOutLeft") + v("eyeLookInRight");
    const up = v("eyeLookUpLeft") + v("eyeLookUpRight");
    const down = v("eyeLookDownLeft") + v("eyeLookDownRight");
    let x = (right - left) / 2;
    let y = (up - down) / 2;

    // Add head orientation so turning the head also steers (column-major 4x4).
    if (matrix && matrix.length >= 16) {
      const yaw = Math.atan2(matrix[8], matrix[10]);
      const pitch = Math.asin(clamp(-matrix[9], -1, 1));
      const QUARTER = Math.PI / 4; // ~45° = full deflection
      x += (yaw / QUARTER) * 0.55;
      y += (pitch / QUARTER) * 0.55;
    }

    return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
  }

  close(): void {
    try {
      this.landmarker?.close();
    } catch {
      /* ignore */
    }
    this.landmarker = null;
    this.lastVideoTime = -1;
  }
}
