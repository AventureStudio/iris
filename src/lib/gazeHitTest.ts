/**
 * Maps the normalized gaze vector to a viewport point and resolves which control
 * the user is looking at — by real bounding rects (works for grids and rows),
 * with a nearest-centre fallback so there is always a candidate to dwell on.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface MapOpts {
  sensitivity: number;
  calX: number;
  calY: number;
  invertX: boolean;
  invertY: boolean;
}

export function gazeToPoint(gx: number, gy: number, o: MapOpts): Pt {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const gainX = 0.18 * o.sensitivity;
  const gainY = 0.14 * o.sensitivity;
  const sx = o.invertX ? -1 : 1;
  const sy = o.invertY ? -1 : 1;
  return {
    x: W / 2 + sx * (gx - o.calX) * gainX * W,
    y: H / 2 - sy * (gy - o.calY) * gainY * H,
  };
}

/** All gaze-selectable controls currently on screen. */
export function dwellables(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      ".tile, .action:not([disabled]), .tone, .iconbtn:not([disabled]), .modal__close, .btn-secondary",
    ),
  );
}

const PAD = 16;

export function resolveTarget(pt: Pt, els: HTMLElement[]): HTMLElement | null {
  // 1) Smallest padded rect that contains the point.
  let best: HTMLElement | null = null;
  let bestArea = Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (
      pt.x >= r.left - PAD &&
      pt.x <= r.right + PAD &&
      pt.y >= r.top - PAD &&
      pt.y <= r.bottom + PAD
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
