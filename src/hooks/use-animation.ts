import { useEffect, useRef, useState } from 'react';

import { diffPositions, squareCoords } from '../utilities.js';

import type { Piece, Square } from '../types.js';
import type React from 'react';

interface AnimationOffset {
  x: number;
  y: number;
}

interface DropInfo {
  square: Square;
  x: number;
  y: number;
}

function useAnimation(
  position: Map<Square, Piece>,
  squareSize: number,
  orientation: 'black' | 'white',
  animate: boolean,
  boardReference: React.RefObject<HTMLDivElement | null>,
  dropReference: React.MutableRefObject<DropInfo | undefined>,
): Map<Square, AnimationOffset> {
  const previousPositionReference = useRef<Map<Square, Piece>>(position);
  const [offsets, setOffsets] = useState<Map<Square, AnimationOffset>>(
    new Map(),
  );

  useEffect(() => {
    if (!animate) {
      previousPositionReference.current = position;
      return;
    }

    const previousPosition = previousPositionReference.current;
    previousPositionReference.current = position;

    const deltas = diffPositions(previousPosition, position);

    if (deltas.length === 0) {
      return;
    }

    const drop = dropReference.current;
    dropReference.current = undefined;
    const rect = boardReference.current?.getBoundingClientRect();

    const newOffsets = new Map<Square, AnimationOffset>();

    for (const { from, to } of deltas) {
      if (drop && rect && drop.square === to) {
        // Drag-drop: animate from the drop point to the square center
        const toCoords = squareCoords(to, orientation);
        const squareCenterX = rect.left + (toCoords.col - 0.5) * squareSize;
        const squareCenterY = rect.top + (toCoords.row - 0.5) * squareSize;

        newOffsets.set(to, {
          x: drop.x - squareCenterX,
          y: drop.y - squareCenterY,
        });
      } else {
        // Click-to-move or programmatic: animate from origin square
        const oldCoords = squareCoords(from, orientation);
        const newCoords = squareCoords(to, orientation);

        newOffsets.set(to, {
          x: (oldCoords.col - newCoords.col) * squareSize,
          y: (oldCoords.row - newCoords.row) * squareSize,
        });
      }
    }

    setOffsets(newOffsets);

    requestAnimationFrame(() => {
      setOffsets((previous) => {
        const cleared = new Map<Square, AnimationOffset>();

        for (const [square] of previous) {
          cleared.set(square, { x: 0, y: 0 });
        }

        return cleared;
      });
    });
  }, [animate, orientation, position, squareSize]);

  if (!animate) {
    return new Map();
  }

  return offsets;
}

export { useAnimation };
export type { AnimationOffset };
