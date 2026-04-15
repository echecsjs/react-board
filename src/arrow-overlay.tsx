import { squareCoords } from './utilities.js';

import type { Arrow, ArrowKind } from './types.js';
import type React from 'react';

const CSS_VAR: Record<ArrowKind, string> = {
  alternative: 'var(--board-arrow-alternative, #003fa4)',
  capture: 'var(--board-arrow-capture, #c33)',
  danger: 'var(--board-arrow-danger, #e89a00)',
  move: 'var(--board-arrow-move, #15781B)',
};

interface ArrowOverlayProperties {
  arrows: Arrow[];
  orientation: 'black' | 'white';
  squareSize: number;
}

function ArrowOverlay({
  arrows,
  orientation,
  squareSize,
}: ArrowOverlayProperties): React.ReactElement | undefined {
  if (arrows.length === 0) return undefined;

  const boardSize = squareSize * 8;
  const shaftWidth = squareSize * 0.2;
  const headWidth = squareSize * 0.55;
  const headLength = squareSize * 0.35;

  // Deduplicate by from-to-kind, first wins
  const seen = new Set<string>();
  const unique: Arrow[] = [];
  for (const arrow of arrows) {
    const key = `${arrow.from}-${arrow.to}-${arrow.kind}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(arrow);
    }
  }

  const paths: React.ReactElement[] = [];
  for (const arrow of unique) {
    const { col: fromCol, row: fromRow } = squareCoords(
      arrow.from,
      orientation,
    );
    const { col: toCol, row: toRow } = squareCoords(arrow.to, orientation);

    const fx = (fromCol - 0.5) * squareSize;
    const fy = (fromRow - 0.5) * squareSize;
    const tx = (toCol - 0.5) * squareSize;
    const ty = (toRow - 0.5) * squareSize;

    const d = arrowPath(fx, fy, tx, ty, shaftWidth, headWidth, headLength);
    if (!d) continue;

    paths.push(
      <path
        key={`${arrow.from}-${arrow.to}-${arrow.kind}`}
        d={d}
        style={{
          fill: CSS_VAR[arrow.kind],
          opacity: 'var(--board-arrow-opacity, 0.8)' as unknown as number,
        }}
      />,
    );
  }

  return (
    <svg
      data-arrows
      viewBox={`0 0 ${boardSize} ${boardSize}`}
      style={{
        height: '100%',
        inset: 0,
        pointerEvents: 'none',
        position: 'absolute',
        width: '100%',
      }}
    >
      {paths}
    </svg>
  );
}

export default ArrowOverlay;

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
