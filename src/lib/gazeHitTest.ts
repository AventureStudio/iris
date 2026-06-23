/**
 * Maps the normalized gaze vector to a viewport point and resolves which control
 * the user is looking at — by real bounding rects (works for grids and rows),
 * with a nearest-centre fallback so there is always a candidate to dwell on.
 */

export interface Pt {
  x: number;
  y: number;
}

/**
 * Quadratic map gaze(-1..1) → screen(0..1), fitted from multi-point calibration
 * on the basis [1, gx, gy, gx*gy, gx², gy²]:
 *   sx = kx·basis ,  sy = ky·basis
 * The cross and square terms correct webcam lens distortion and the
 * non-linearity of gaze toward the edges that a plain affine map cannot. It also
 * absorbs scale, offset and inversion, so the manual knobs are not needed once
 * calibrated.
 */
export interface GazeCalibration {
  kx: number[]; // length 6
  ky: number[]; // length 6
}

const basis = (gx: number, gy: number) => [1, gx, gy, gx * gy, gx * gx, gy * gy];
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const validCal = (c: GazeCalibration | null | undefined): c is GazeCalibration =>
  !!c && Array.isArray(c.kx) && c.kx.length === 6 && Array.isArray(c.ky) && c.ky.length === 6;

export interface MapOpts {
  sensitivity: number;
  calX: number;
  calY: number;
  invertX: boolean;
  invertY: boolean;
  calibration?: GazeCalibration | null;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function gazeToPoint(gx: number, gy: number, o: MapOpts): Pt {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (validCal(o.calibration)) {
    const b = basis(gx, gy);
    return {
      x: clamp01(dot(o.calibration.kx, b)) * W,
      y: clamp01(dot(o.calibration.ky, b)) * H,
    };
  }
  const gainX = 0.18 * o.sensitivity;
  const gainY = 0.14 * o.sensitivity;
  const sx = o.invertX ? -1 : 1;
  const sy = o.invertY ? -1 : 1;
  return {
    x: W / 2 + sx * (gx - o.calX) * gainX * W,
    y: H / 2 - sy * (gy - o.calY) * gainY * H,
  };
}

/** Solve a square system A·x = v by Gaussian elimination with partial pivoting. */
function solveLinear(A: number[][], v: number[]): number[] | null {
  const n = v.length;
  const M = A.map((row, i) => [...row, v[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-9) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  // After full elimination the system is diagonal: x[i] = M[i][n] / M[i][i].
  return M.map((row, i) => row[n] / row[i]);
}

export interface CalSample {
  gx: number;
  gy: number;
  tx: number; // target screen x, 0..1
  ty: number; // target screen y, 0..1
}

/**
 * Least-squares quadratic fit from calibration samples (gaze → normalized
 * screen) over the 6-term basis. Builds the 6x6 normal equations and solves.
 */
export function fitCalibration(samples: CalSample[]): GazeCalibration | null {
  if (samples.length < 6) return null;
  const N = 6;
  const A: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  const bx = new Array(N).fill(0);
  const by = new Array(N).fill(0);
  for (const s of samples) {
    const p = basis(s.gx, s.gy);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) A[i][j] += p[i] * p[j];
      bx[i] += p[i] * s.tx;
      by[i] += p[i] * s.ty;
    }
  }
  const kx = solveLinear(A, bx);
  const ky = solveLinear(A, by);
  if (!kx || !ky) return null;
  return { kx, ky };
}

/** All gaze-selectable controls currently on screen. */
export function dwellables(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      ".tile, .chip, .action:not([disabled]), .tone, .iconbtn:not([disabled]), .modal__close, .btn-secondary",
    ),
  );
}

// Gaze error grows toward the screen edges, so pad targets more out there.
function edgePad(v: number, limit: number): number {
  const d = Math.min(v, limit - v);
  return d < 90 ? 36 : d < 220 ? 24 : 16;
}

export function resolveTarget(pt: Pt, els: HTMLElement[]): HTMLElement | null {
  const padX = edgePad(pt.x, window.innerWidth);
  const padY = edgePad(pt.y, window.innerHeight);
  // 1) Smallest padded rect that contains the point.
  let best: HTMLElement | null = null;
  let bestArea = Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (
      pt.x >= r.left - padX &&
      pt.x <= r.right + padX &&
      pt.y >= r.top - padY &&
      pt.y <= r.bottom + padY
    ) {
      const area = r.width * r.height;
      if (area < bestArea) {
        bestArea = area;
        best = el;
      }
    }
  }
  if (best) return best;

  // 2) Fallback: nearest centre within a reasonable radius.
  const maxDist = Math.min(window.innerWidth, window.innerHeight) * 0.4;
  let near: HTMLElement | null = null;
  let nearDist = Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(pt.x - cx, pt.y - cy);
    if (d < nearDist) {
      nearDist = d;
      near = el;
    }
  }
  return nearDist <= maxDist ? near : null;
}
