import { describe, expect, it } from 'vitest';

import {
  SQUARES,
  diffPositions,
  getSquareFromPointer,
  squareColor,
  squareCoords,
} from '../utilities.js';

import type { Piece, Square } from '../types.js';

describe('SQUARES', () => {
  it('has 64 entries', () => {
    expect(SQUARES).toHaveLength(64);
  });

  it('starts with a8', () => {
    expect(SQUARES[0]).toBe('a8');
  });

  it('ends with h1', () => {
    expect(SQUARES[63]).toBe('h1');
  });

  it('second entry is b8', () => {
    expect(SQUARES[1]).toBe('b8');
  });

  it('ninth entry is a7', () => {
    expect(SQUARES[8]).toBe('a7');
  });
});

describe('squareCoords', () => {
  it('a8 white orientation → col 1, row 1', () => {
    expect(squareCoords('a8', 'white')).toEqual({ col: 1, row: 1 });
  });

  it('h1 white orientation → col 8, row 8', () => {
    expect(squareCoords('h1', 'white')).toEqual({ col: 8, row: 8 });
  });

  it('a1 white orientation → col 1, row 8', () => {
    expect(squareCoords('a1', 'white')).toEqual({ col: 1, row: 8 });
  });

  it('h8 white orientation → col 8, row 1', () => {
    expect(squareCoords('h8', 'white')).toEqual({ col: 8, row: 1 });
  });

  it('a8 black orientation → col 8, row 8', () => {
    expect(squareCoords('a8', 'black')).toEqual({ col: 8, row: 8 });
  });

  it('h1 black orientation → col 1, row 1', () => {
    expect(squareCoords('h1', 'black')).toEqual({ col: 1, row: 1 });
  });

  it('a1 black orientation → col 8, row 1', () => {
    expect(squareCoords('a1', 'black')).toEqual({ col: 8, row: 1 });
  });
});

describe('squareColor', () => {
  it('a1 is dark', () => {
    expect(squareColor('a1')).toBe('dark');
  });

  it('b1 is light', () => {
    expect(squareColor('b1')).toBe('light');
  });

  it('a2 is light', () => {
    expect(squareColor('a2')).toBe('light');
  });

  it('h8 is dark', () => {
    expect(squareColor('h8')).toBe('dark');
  });

  it('a8 is light', () => {
    expect(squareColor('a8')).toBe('light');
  });

  it('e4 is light', () => {
    expect(squareColor('e4')).toBe('light');
  });

  it('d4 is dark', () => {
    expect(squareColor('d4')).toBe('dark');
  });
});

describe('diffPositions', () => {
  const wP: Piece = { color: 'w', type: 'p' };
  const bP: Piece = { color: 'b', type: 'p' };
  const wK: Piece = { color: 'w', type: 'k' };

  it('returns empty array for identical positions', () => {
    const pos = new Map<Square, Piece>([['e2', wP]]);
    expect(diffPositions(pos, pos)).toEqual([]);
  });

  it('detects a pawn move e2→e4', () => {
    const old = new Map<Square, Piece>([['e2', wP]]);
    const next = new Map<Square, Piece>([['e4', wP]]);
    const deltas = diffPositions(old, next);
    expect(deltas).toHaveLength(1);
    expect(deltas[0]).toEqual({ from: 'e2', piece: wP, to: 'e4' });
  });

  it('detects two independent pawn moves', () => {
    const old = new Map<Square, Piece>([
      ['e2', wP],
      ['d7', bP],
    ]);
    const next = new Map<Square, Piece>([
      ['e4', wP],
      ['d5', bP],
    ]);
    const deltas = diffPositions(old, next);
    expect(deltas).toHaveLength(2);
  });

  it('returns empty when a piece disappears with no match', () => {
    const old = new Map<Square, Piece>([['e4', wP]]);
    const next = new Map<Square, Piece>();
    // Piece removed, nothing added → no delta
    expect(diffPositions(old, next)).toEqual([]);
  });

  it('does not include unchanged pieces', () => {
    const old = new Map<Square, Piece>([
      ['e1', wK],
      ['e2', wP],
    ]);
    const next = new Map<Square, Piece>([
      ['e1', wK],
      ['e4', wP],
    ]);
    const deltas = diffPositions(old, next);
    expect(deltas).toHaveLength(1);
    expect(deltas[0]?.from).toBe('e2');
    expect(deltas[0]?.to).toBe('e4');
  });
});

describe('getSquareFromPointer', () => {
  // 480px board → 60px per square
  const rect = new DOMRect(0, 0, 480, 480);
  const squareSize = 60;

  it('returns a8 for top-left click in white orientation', () => {
    expect(getSquareFromPointer(5, 5, rect, squareSize, 'white')).toBe('a8');
  });

  it('returns h1 for bottom-right click in white orientation', () => {
    expect(getSquareFromPointer(475, 475, rect, squareSize, 'white')).toBe(
      'h1',
    );
  });

  it('returns e2 for center of e2 square in white orientation', () => {
    // e2: col=4 (0-based), row=6 (0-based) → x=270, y=390
    expect(getSquareFromPointer(270, 390, rect, squareSize, 'white')).toBe(
      'e2',
    );
  });

  it('returns h8 for top-left click in black orientation', () => {
    expect(getSquareFromPointer(5, 5, rect, squareSize, 'black')).toBe('h1');
  });

  it('returns undefined for click outside the board', () => {
    expect(
      getSquareFromPointer(-5, 5, rect, squareSize, 'white'),
    ).toBeUndefined();
  });

  it('returns undefined for click below the board', () => {
    expect(
      getSquareFromPointer(5, 490, rect, squareSize, 'white'),
    ).toBeUndefined();
  });

  it('handles board offset correctly', () => {
    const offsetRect = new DOMRect(100, 50, 480, 480);
    // a8 top-left corner: clientX=100, clientY=50
    expect(getSquareFromPointer(105, 55, offsetRect, squareSize, 'white')).toBe(
      'a8',
    );
  });
});
