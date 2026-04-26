import { useCallback, useRef, useState } from 'react';

import { getSquareFromPointer } from '../utilities.js';

import type {
  Annotations,
  Arrow,
  ArrowKind,
  Circle,
  Square,
} from '../types.js';
import type React from 'react';

interface UseDrawingOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
  drawable: boolean;
  onAnnotationChange?: (annotations: Annotations) => void;
  orientation: 'black' | 'white';
  squareSize: number;
}

interface UseDrawingResult {
  annotations: Annotations;
  clearAnnotations: () => void;
  handlers: {
    onContextMenu: (event: React.MouseEvent) => void;
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
  };
}

const EMPTY_ANNOTATIONS: Annotations = { arrows: [], circles: [] };

function getKindFromModifiers(event: {
  altKey: boolean;
  ctrlKey: boolean;
}): ArrowKind {
  if (event.ctrlKey && event.altKey) return 'alternative';
  if (event.ctrlKey) return 'capture';
  if (event.altKey) return 'danger';
  return 'move';
}

function useDrawing({
  boardRef,
  drawable,
  onAnnotationChange,
  orientation,
  squareSize,
}: UseDrawingOptions): UseDrawingResult {
  const [annotations, setAnnotations] =
    useState<Annotations>(EMPTY_ANNOTATIONS);
  const drawStartReference = useRef<
    { kind: ArrowKind; square: Square } | undefined
  >(undefined);

  const clearAnnotations = useCallback(() => {
    setAnnotations((previous) => {
      if (previous.arrows.length === 0 && previous.circles.length === 0) {
        return previous;
      }
      onAnnotationChange?.(EMPTY_ANNOTATIONS);
      return EMPTY_ANNOTATIONS;
    });
  }, [onAnnotationChange]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (drawable) {
        event.preventDefault();
      }
    },
    [drawable],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!drawable || event.button !== 2 || !boardRef.current) {
        return;
      }

      const rect = boardRef.current.getBoundingClientRect();
      const square = getSquareFromPointer(
        event.clientX,
        event.clientY,
        rect,
        squareSize,
        orientation,
      );

      if (!square) return;

      const kind = getKindFromModifiers(event);
      drawStartReference.current = { kind, square };
    },
    [boardRef, drawable, orientation, squareSize],
  );

  const onPointerMove = useCallback(() => {
    // No visual feedback during draw for now
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!drawable || event.button !== 2 || !boardRef.current) {
        return;
      }

      const start = drawStartReference.current;
      drawStartReference.current = undefined;

      if (!start) return;

      const rect = boardRef.current.getBoundingClientRect();
      const endSquare = getSquareFromPointer(
        event.clientX,
        event.clientY,
        rect,
        squareSize,
        orientation,
      );

      if (!endSquare) return;

      if (endSquare === start.square) {
        // Circle toggle
        setAnnotations((previous) => {
          const existing = previous.circles.find(
            (c) => c.square === start.square,
          );

          const nextCircles: Circle[] =
            existing && existing.kind === start.kind
              ? previous.circles.filter((c) => c.square !== start.square)
              : [
                  ...previous.circles.filter((c) => c.square !== start.square),
                  { kind: start.kind, square: start.square },
                ];

          const next = { arrows: previous.arrows, circles: nextCircles };
          onAnnotationChange?.(next);
          return next;
        });
      } else {
        // Arrow toggle
        setAnnotations((previous) => {
          const existing = previous.arrows.find(
            (a) => a.from === start.square && a.to === endSquare,
          );

          const nextArrows: Arrow[] =
            existing && existing.kind === start.kind
              ? previous.arrows.filter(
                  (a) => !(a.from === start.square && a.to === endSquare),
                )
              : [
                  ...previous.arrows.filter(
                    (a) => !(a.from === start.square && a.to === endSquare),
                  ),
                  { from: start.square, kind: start.kind, to: endSquare },
                ];

          const next = { arrows: nextArrows, circles: previous.circles };
          onAnnotationChange?.(next);
          return next;
        });
      }
    },
    [boardRef, drawable, onAnnotationChange, orientation, squareSize],
  );

  return {
    annotations,
    clearAnnotations,
    handlers: { onContextMenu, onPointerDown, onPointerMove, onPointerUp },
  };
}

export { useDrawing };
