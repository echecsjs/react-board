import type { Piece, Square } from './types.js';

const FILE_CHARS = 'abcdefgh';

const PIECE_MAP: Record<string, Piece> = {
  B: { color: 'w', type: 'b' },
  K: { color: 'w', type: 'k' },
  N: { color: 'w', type: 'n' },
  P: { color: 'w', type: 'p' },
  Q: { color: 'w', type: 'q' },
  R: { color: 'w', type: 'r' },
  b: { color: 'b', type: 'b' },
  k: { color: 'b', type: 'k' },
  n: { color: 'b', type: 'n' },
  p: { color: 'b', type: 'p' },
  q: { color: 'b', type: 'q' },
  r: { color: 'b', type: 'r' },
};

/**
 * Parses the piece-placement field of a FEN string and returns a
 * Map<Square, Piece>. Ignores all other FEN fields (turn, castling, etc.).
 *
 * Returns an empty Map for an invalid or empty FEN.
 */
function parseFen(fen: string): Map<Square, Piece> {
  const result = new Map<Square, Piece>();
  const placement = fen.split(' ')[0];

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
      const skip = Number.parseInt(ch, 10);

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
