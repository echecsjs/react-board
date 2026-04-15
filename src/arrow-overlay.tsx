/**
 * Computes an SVG path `d` attribute for an arrow shape.
 *
 * The arrow is a single closed polygon: narrow shaft widening into a
 * triangular arrowhead. Seven points define the shape:
 *
 *   start-left ── shaft-left ── head-left
 *                                          ╲
 *                                            tip
 *                                          ╱
 *   start-right ─ shaft-right ─ head-right
 */
export function arrowPath(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  shaftWidth: number,
  headWidth: number,
  headLength: number,
): string {
  const dx = tx - fx;
  const dy = ty - fy;
  const length = Math.hypot(dx, dy);

  if (length === 0) return '';

  // Unit vector along arrow direction
  const ux = dx / length;
  const uy = dy / length;

  // Perpendicular vector
  const px = -uy;
  const py = ux;

  const shaftEnd = length - headLength;

  const points: [number, number][] = [
    [fx + (px * shaftWidth) / 2, fy + (py * shaftWidth) / 2], // start left
    [
      fx + ux * shaftEnd + (px * shaftWidth) / 2,
      fy + uy * shaftEnd + (py * shaftWidth) / 2,
    ], // shaft end left
    [
      fx + ux * shaftEnd + (px * headWidth) / 2,
      fy + uy * shaftEnd + (py * headWidth) / 2,
    ], // head base left
    [tx, ty], // tip
    [
      fx + ux * shaftEnd - (px * headWidth) / 2,
      fy + uy * shaftEnd - (py * headWidth) / 2,
    ], // head base right
    [
      fx + ux * shaftEnd - (px * shaftWidth) / 2,
      fy + uy * shaftEnd - (py * shaftWidth) / 2,
    ], // shaft end right
    [fx - (px * shaftWidth) / 2, fy - (py * shaftWidth) / 2], // start right
  ];

  return `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z`;
}
