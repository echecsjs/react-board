import type { Piece, Square } from './types.js';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

/** All 64 squares in render order: a8, b8, …, h8, a7, …, h1 */
const SQUARES: Square[] = RANKS.flatMap((rank) =>
  FILES.map((file) => `${file}${rank}` as Square),
);

interface SquareCoords {
  col: number;
  row: number;
}

interface PieceDelta {
  from: Square;
  piece: Piece;
  to: Square;
}

/**
 * Returns 1-based `{ col, row }` for CSS grid placement of a square,
 * taking orientation into account.
 */
function squareCoords(
  square: Square,
  orientation: 'black' | 'white',
): SquareCoords {
  const file = square[0] as (typeof FILES)[number];
  const rank = square[1] as (typeof RANKS)[number];

  const fileIndex = FILES.indexOf(file);
  const rankIndex = RANKS.indexOf(rank);

  if (orientation === 'white') {
    return { col: fileIndex + 1, row: rankIndex + 1 };
  }

  // Black orientation: flip both axes
  return { col: 8 - fileIndex, row: 8 - rankIndex };
}

/**
 * Returns `'dark'` or `'light'` for the given square.
 * a1 is dark (odd sum of file+rank indices).
 */
function squareColor(square: Square): 'dark' | 'light' {
  const file = square[0] as (typeof FILES)[number];
  const rank = square[1] as (typeof RANKS)[number];

  const fileIndex = FILES.indexOf(file);
  // rank '1' → rankNumber 1, '8' → 8
  const rankNumber = Number.parseInt(rank, 10);

  return (fileIndex + rankNumber) % 2 === 1 ? 'dark' : 'light';
}

/**
 * Returns an array of `{ from, to, piece }` for each piece that moved
 * between `oldPos` and `newPos`. A piece that disappeared is not included
 * unless it reappears on another square.
 *
 * Uses a greedy match: for each piece type present in both positions,
 * pairs up squares that changed.
 */
function diffPositions(
  oldPos: Map<Square, Piece>,
  newPos: Map<Square, Piece>,
): PieceDelta[] {
  const deltas: PieceDelta[] = [];

  // Find squares that no longer have the same piece
  const removedEntries: [Square, Piece][] = [];
  const addedEntries: [Square, Piece][] = [];

  for (const [square, piece] of oldPos) {
    const newPiece = newPos.get(square);

    if (
      !newPiece ||
      newPiece.color !== piece.color ||
      newPiece.type !== piece.type
    ) {
      removedEntries.push([square, piece]);
    }
  }

  for (const [square, piece] of newPos) {
    const oldPiece = oldPos.get(square);

    if (
      !oldPiece ||
      oldPiece.color !== piece.color ||
      oldPiece.type !== piece.type
    ) {
      addedEntries.push([square, piece]);
    }
  }

  // Match removed → added by piece identity (color + type)
  const usedAdded = new Set<number>();

  for (const [fromSquare, fromPiece] of removedEntries) {
    for (const [index, entry] of addedEntries.entries()) {
      if (usedAdded.has(index)) {
        continue;
      }

      if (!entry) {
        continue;
      }

      const [toSquare, toPiece] = entry;

      if (
        toPiece.color === fromPiece.color &&
        toPiece.type === fromPiece.type
      ) {
        deltas.push({ from: fromSquare, piece: fromPiece, to: toSquare });
        usedAdded.add(index);
        break;
      }
    }
  }

  return deltas;
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

export {
  diffPositions,
  FILES,
  getSquareFromPointer,
  RANKS,
  SQUARES,
  squareColor,
  squareCoords,
};
export type { PieceDelta, SquareCoords };
