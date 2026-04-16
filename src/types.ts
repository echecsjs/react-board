import type { Piece, Square } from '@echecs/position';
import type React from 'react';

type ArrowKind = 'alternative' | 'capture' | 'danger' | 'move';

interface Annotations {
  arrows: Arrow[];
  circles: Circle[];
}

interface Arrow {
  from: Square;
  kind: ArrowKind;
  to: Square;
}

interface BoardProperties {
  animate?: boolean;
  arrows?: Arrow[];
  children?: React.ReactNode;
  coordinates?: boolean;
  drawable?: boolean;
  highlight?: Square[];
  /** @deprecated Use `movable` instead. */
  interactive?: boolean;
  legalMoves?: Map<Square, Square[]>;
  movable?: boolean;
  onAnnotationChange?: (annotations: Annotations) => void;
  onMove?: (move: MoveEvent) => boolean;
  onSquareClick?: (square: Square) => void;
  orientation?: 'black' | 'white';
  pieces?: PieceSet;
  position?: Map<Square, Piece> | string;
  turn?: 'black' | 'white';
}

interface Circle {
  kind: ArrowKind;
  square: Square;
}

interface MoveEvent {
  capture: boolean;
  from: Square;
  promotion?: string;
  to: Square;
}

type PieceKey =
  | 'bB'
  | 'bK'
  | 'bN'
  | 'bP'
  | 'bQ'
  | 'bR'
  | 'wB'
  | 'wK'
  | 'wN'
  | 'wP'
  | 'wQ'
  | 'wR';

type PieceSet = Record<PieceKey, string>;

export type {
  Annotations,
  Arrow,
  ArrowKind,
  BoardProperties as BoardProps,
  Circle,
  MoveEvent,
  PieceKey,
  PieceSet,
};
