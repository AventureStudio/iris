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
 * Affine map gaze(-1..1) → screen(0..1), fitted from multi-point calibration:
 *   sx = ax*gx + bx*gy + cx ,  sy = ay*gx + by*gy + cy
 * It absorbs scale, offset, axis cross-coupling and inversion, so once calibrated
 * the manual sensitivity/invert knobs are not needed.
 */
export interface GazeCalibration {
  ax: number; bx: number; cx: number;
  ay: number; by: number; cy: number;
}

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
  if (o.calibration) {
    const c = o.calibration;
    return {
      x: clamp01(c.ax * gx + c.bx * gy + c.cx) * W,
      y: clamp01(c.ay * gx + c.by * gy + c.cy) * H,
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

/** Solve a 3x3 linear system by Cramer's rule; null if (near-)singular. */
function solve3(m: number[][], v: number[]): [number, number, number] | null {
  const det = (a: number[][]) =>
    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
    a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
    a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const d = det(m);
  if (Math.abs(d) < 1e-9) return null;
  const withCol = (i: number) => {
    const mm = m.map((row) => row.slice());
    for (let r = 0; r < 3; r++) mm[r][i] = v[r];
    return mm;
  };
  return [det(withCol(0)) / d, det(withCol(1)) / d, det(withCol(2)) / d];
}

export interface CalSample {
  gx: number;
  gy: number;
  tx: number; // target screen x, 0..1
  ty: number; // target screen y, 0..1
}

/** Least-squares affine fit from calibration samples (gaze → normalized screen). */
export function fitAffine(samples: CalSample[]): GazeCalibration | null {
  if (samples.length < 3) return null;
  let Sxx = 0, Sxy = 0, Syy = 0, Sx = 0, Sy = 0, n = 0;
  let Sxtx = 0, Sytx = 0, Stx = 0;
  let Sxty = 0, Syty = 0, Sty = 0;
  for (const s of samples) {
    Sxx += s.gx * s.gx; Sxy += s.gx * s.gy; Syy += s.gy * s.gy;
    Sx += s.gx; Sy += s.gy; n += 1;
    Sxtx += s.gx * s.tx; Sytx += s.gy * s.tx; Stx += s.tx;
    Sxty += s.gx * s.ty; Syty += s.gy * s.ty; Sty += s.ty;
  }
  const M = [
    [Sxx, Sxy, Sx],
    [Sxy, Syy, Sy],
    [Sx, Sy, n],
  ];
  const X = solve3(M, [Sxtx, Sytx, Stx]);
  const Y = solve3(M, [Sxty, Syty, Sty]);
  if (!X || !Y) return null;
  return { ax: X[0], bx: X[1], cx: X[2], ay: Y[0], by: Y[1], cy: Y[2] };
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
