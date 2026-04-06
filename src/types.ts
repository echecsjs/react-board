import type { Piece, Square } from '@echecs/position';
import type React from 'react';

interface Arrow {
  brush: string;
  from: Square;
  to: Square;
}

interface BoardProperties {
  animate?: boolean;
  arrows?: Arrow[];
  children?: React.ReactNode;
  coordinates?: boolean;
  highlight?: Square[];
  interactive?: boolean;
  legalMoves?: Map<Square, Square[]>;
  onMove?: (move: MoveEvent) => boolean;
  onSquareClick?: (square: Square) => void;
  orientation?: 'black' | 'white';
  pieces?: PieceSet;
  position?: Map<Square, Piece> | string;
  turn?: 'black' | 'white';
}

interface MoveEvent {
  capture: boolean;
  from: Square;
  promotion?: string;
  to: Square;
}

type PieceComponent = React.ComponentType<{ size: number }>;

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

type PieceSet = Record<PieceKey, PieceComponent>;

export type {
  Arrow,
  BoardProperties as BoardProps,
  MoveEvent,
  PieceComponent,
  PieceKey,
  PieceSet,
};
