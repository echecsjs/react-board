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
  /** Enable CSS transition animations for piece movement. Defaults to `true`. */
  animate?: boolean;
  /** Arrows to render on the board (e.g. for analysis or engine lines). */
  arrows?: Arrow[];
  /** Overlay elements rendered on top of the board (e.g. promotion dialogs). */
  children?: React.ReactNode;
  /** Show rank and file coordinates around the board. Defaults to `true`. */
  coordinates?: boolean;
  /** Allow right-click drawing of arrows and circles. */
  drawable?: boolean;
  /** Squares to highlight (e.g. last move origin and destination). */
  highlight?: Square[];
  /** @deprecated Use `movable` instead. */
  interactive?: boolean;
  /** Map of legal moves per square, used to show move hints on selection. */
  legalMoves?: Map<Square, Square[]>;
  /** Allow pieces to be moved via drag or click. */
  movable?: boolean;
  /** Called when user-drawn annotations change. */
  onAnnotationChange?: (annotations: Annotations) => void;
  /** Called when a piece is moved. Return `true` to accept the move. */
  onMove?: (move: MoveEvent) => boolean;
  /** Called when a square is clicked. */
  onSquareClick?: (square: Square) => void;
  /** Board orientation. `'white'` shows rank 1 at the bottom. */
  orientation?: 'black' | 'white';
  /** Custom SVG piece set, keyed by piece code (e.g. `wK`, `bQ`). */
  pieces?: PieceSet;
  /** Board position as a FEN string or a `Map<Square, Piece>`. */
  position?: Map<Square, Piece> | string;
  /** Restrict which side can move. `undefined` allows both. */
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
