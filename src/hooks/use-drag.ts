import { useCallback, useRef, useState } from 'react';

import type { MoveEvent } from '../types.js';
import type { Piece, Square } from '@echecs/position';
import type React from 'react';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

interface DragState {
  floating: { x: number; y: number } | undefined;
  from: Square | undefined;
  isDragging: boolean;
}

interface UseDragOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
  clearAnnotations?: () => void;
  interactive: boolean;
  legalMoves?: Map<Square, Square[]>;
  onMove?: (move: MoveEvent) => boolean;
  orientation: 'black' | 'white';
  pieces: Map<Square, Piece>;
  squareSize: number;
  turn?: 'black' | 'white';
}

interface PointerHandlers {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
}

interface DropInfo {
  square: Square;
  x: number;
  y: number;
}

interface UseDragResult {
  dragState: DragState;
  dropRef: React.MutableRefObject<DropInfo | undefined>;
  handlers: PointerHandlers;
  selectedSquare: Square | undefined;
}

interface PointerDownInfo {
  pointerType: string;
  square: Square;
  x: number;
  y: number;
}

function coordsToSquare(
  col: number,
  row: number,
  orientation: 'black' | 'white',
): Square | undefined {
  let fileIndex: number;
  let rankIndex: number;

  if (orientation === 'white') {
    fileIndex = col;
    rankIndex = row;
  } else {
    fileIndex = 7 - col;
    rankIndex = 7 - row;
  }

  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    return undefined;
  }

  const file = FILES[fileIndex];
  const rank = RANKS[rankIndex];

  if (!file || !rank) {
    return undefined;
  }

  return `${file}${rank}` as Square;
}

function getSquareFromPointer(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  squareSize: number,
  orientation: 'black' | 'white',
): Square | undefined {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const col = Math.floor(x / squareSize);
  const row = Math.floor(y / squareSize);

  return coordsToSquare(col, row, orientation);
}

const DRAG_THRESHOLD_MOUSE = 4;
const DRAG_THRESHOLD_TOUCH = 10;

function useDrag({
  boardRef,
  clearAnnotations,
  interactive,
  legalMoves,
  onMove,
  orientation,
  pieces,
  squareSize,
  turn,
}: UseDragOptions): UseDragResult {
  const turnColor = turn === 'white' ? 'w' : turn === 'black' ? 'b' : undefined;

  const [dragState, setDragState] = useState<DragState>({
    floating: undefined,
    from: undefined,
    isDragging: false,
  });
  const [selectedSquare, setSelectedSquare] = useState<Square | undefined>();

  // Track pointer-down info to distinguish click vs drag.
  // Using undefined instead of null per project conventions.
  const pointerDownReference = useRef<PointerDownInfo | undefined>(undefined);

  // Exposes drop info so the animation system can animate from the drop
  // point instead of from the origin square.
  const dropReference = useRef<DropInfo | undefined>(undefined);

  const isLegalTarget = useCallback(
    (from: Square, to: Square): boolean => {
      if (!legalMoves) {
        return true;
      }

      const targets = legalMoves.get(from);

      return targets !== undefined && targets.includes(to);
    },
    [legalMoves],
  );

  const attemptMove = useCallback(
    (from: Square, to: Square): boolean => {
      if (from === to) {
        return false;
      }

      if (!isLegalTarget(from, to)) {
        return false;
      }

      if (onMove) {
        const capture = pieces.has(to);

        return onMove({ capture, from, to });
      }

      return true;
    },
    [isLegalTarget, onMove, pieces],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!interactive || !boardRef.current) {
        return;
      }

      // Only handle left-click for piece movement
      if (event.button !== 0) {
        return;
      }

      // Clear any user-drawn annotations on left-click
      clearAnnotations?.();

      const rect = boardRef.current.getBoundingClientRect();
      const square = getSquareFromPointer(
        event.clientX,
        event.clientY,
        rect,
        squareSize,
        orientation,
      );

      if (!square) {
        return;
      }

      const piece = pieces.get(square);

      // Always track the pointer-down square so onPointerUp can handle
      // click-to-move targets (even on empty squares).
      pointerDownReference.current = {
        pointerType: event.pointerType,
        square,
        x: event.clientX,
        y: event.clientY,
      };

      // Only start a drag if there's a piece on the source square
      // and it matches the turn color (when turn is set)
      if (piece && (!turnColor || piece.color === turnColor)) {
        setDragState({ floating: undefined, from: square, isDragging: false });
      }
    },
    [
      boardRef,
      clearAnnotations,
      interactive,
      orientation,
      pieces,
      squareSize,
      turnColor,
    ],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!interactive || !pointerDownReference.current) {
        return;
      }

      const { pointerType, x, y } = pointerDownReference.current;
      const dx = event.clientX - x;
      const dy = event.clientY - y;
      const distance = Math.hypot(dx, dy);
      const threshold =
        pointerType === 'touch' ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;

      if (distance >= threshold) {
        setDragState((previous) => ({
          ...previous,
          floating: { x: event.clientX, y: event.clientY },
          isDragging: true,
        }));
      }
    },
    [interactive],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!interactive || !pointerDownReference.current) {
        return;
      }

      const {
        pointerType,
        square: downSquare,
        x: downX,
        y: downY,
      } = pointerDownReference.current;
      pointerDownReference.current = undefined;

      const dx = event.clientX - downX;
      const dy = event.clientY - downY;
      const distance = Math.hypot(dx, dy);
      const threshold =
        pointerType === 'touch' ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;
      const isClick = distance < threshold;

      // Clear drag state
      setDragState({ floating: undefined, from: undefined, isDragging: false });
      dropReference.current = undefined;

      if (isClick) {
        // Click flow
        if (selectedSquare) {
          // Already have a selection
          if (selectedSquare === downSquare) {
            // Click same piece → deselect
            setSelectedSquare(undefined);

            return;
          }

          // Try to move to clicked square if legal
          if (isLegalTarget(selectedSquare, downSquare)) {
            attemptMove(selectedSquare, downSquare);
            setSelectedSquare(undefined);

            return;
          }

          // Clicked another piece → re-select (if correct turn)
          const reselectedPiece = pieces.get(downSquare);

          if (
            reselectedPiece &&
            (!turnColor || reselectedPiece.color === turnColor)
          ) {
            setSelectedSquare(downSquare);

            return;
          }

          // Clicked empty non-legal square → deselect
          setSelectedSquare(undefined);
        } else {
          // No selection yet: select if there's a piece here (and correct turn)
          const clickedPiece = pieces.get(downSquare);

          if (
            clickedPiece &&
            (!turnColor || clickedPiece.color === turnColor)
          ) {
            setSelectedSquare(downSquare);
          }
        }
      } else {
        // Drag flow: determine target square from drop position
        const board = boardRef.current;
        const rect = board ? board.getBoundingClientRect() : new DOMRect();
        const toSquare = getSquareFromPointer(
          event.clientX,
          event.clientY,
          rect,
          squareSize,
          orientation,
        );

        const draggedPiece = pieces.get(downSquare);

        if (
          toSquare &&
          toSquare !== downSquare &&
          draggedPiece &&
          (!turnColor || draggedPiece.color === turnColor) &&
          isLegalTarget(downSquare, toSquare)
        ) {
          dropReference.current = {
            square: toSquare,
            x: event.clientX,
            y: event.clientY,
          };
          attemptMove(downSquare, toSquare);
        }

        setSelectedSquare(undefined);
      }
    },
    [
      attemptMove,
      boardRef,
      interactive,
      isLegalTarget,
      orientation,
      pieces,
      selectedSquare,
      squareSize,
      turnColor,
    ],
  );

  return {
    dragState,
    dropRef: dropReference,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    selectedSquare,
  };
}

export { useDrag };
export type { DragState };
