import type { Piece, Square } from './types.js';

const FILE_CHARS = 'abcdefgh';

const PIECE_MAP: Record<string, Piece> = {
  B: { color: 'white', type: 'bishop' },
  K: { color: 'white', type: 'king' },
  N: { color: 'white', type: 'knight' },
  P: { color: 'white', type: 'pawn' },
  Q: { color: 'white', type: 'queen' },
  R: { color: 'white', type: 'rook' },
  b: { color: 'black', type: 'bishop' },
  k: { color: 'black', type: 'king' },
  n: { color: 'black', type: 'knight' },
  p: { color: 'black', type: 'pawn' },
  q: { color: 'black', type: 'queen' },
  r: { color: 'black', type: 'rook' },
};

/**
 * Parses the piece-placement field of a FEN string and returns a
 * Map<Square, Piece>. Ignores all other FEN fields (turn, castling, etc.).
 *
 * Returns an empty Map for an invalid or empty FEN.
 */
function parseFen(fen: string): Map<Square, Piece> {
  const result = new Map<Square, Piece>();
  const placement = fen.split(' ', 1)[0];

  if (!placement) {
    return result;
  }

  const ranks = placement.split('/');

  if (ranks.length !== 8) {
    return result;
  }

  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const rankChar = String(8 - rankIndex);
    const rankFen = ranks[rankIndex];

    if (!rankFen) {
      continue;
    }

    let fileIndex = 0;

    for (const ch of rankFen) {
      const skip = Number(ch);

      if (Number.isNaN(skip)) {
        const piece = PIECE_MAP[ch];

        if (piece && fileIndex < 8) {
          const fileChar = FILE_CHARS[fileIndex];

          if (fileChar) {
            const square = `${fileChar}${rankChar}` as Square;
            result.set(square, piece);
          }
        }

        fileIndex++;
      } else {
        fileIndex += skip;
      }
    }
  }

  return result;
}

export { parseFen };
