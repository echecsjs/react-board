import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Board from '../board.js';

import type { Square } from '@echecs/position';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('Board', () => {
  it('renders 64 squares', () => {
    const { container } = render(<Board />);
    const squareDivs = container.querySelectorAll('[data-square]');
    expect(squareDivs).toHaveLength(64);
  });

  it('renders pieces from FEN', () => {
    const { container } = render(
      <Board position="8/8/8/8/8/8/8/4K3 w - - 0 1" />,
    );
    const kingSquare = container.querySelector('[data-square="e1"]');
    expect(kingSquare?.querySelector('svg')).toBeTruthy();
  });

  it('renders default starting position when no position prop', () => {
    const { container } = render(<Board />);
    // Starting position has 32 pieces (16 per side)
    const svgs = container.querySelectorAll('[data-square] svg');
    expect(svgs).toHaveLength(32);
  });

  it('renders empty squares with no pieces', () => {
    const { container } = render(
      <Board position="8/8/8/8/8/8/8/8 w - - 0 1" />,
    );
    const svgs = container.querySelectorAll('[data-square] svg');
    expect(svgs).toHaveLength(0);
  });

  it('uses CSS custom properties for square colors', () => {
    const { container } = render(<Board />);
    const darkSquare = container.querySelector(
      '[data-square="a1"]',
    ) as HTMLElement;
    const lightSquare = container.querySelector(
      '[data-square="a2"]',
    ) as HTMLElement;
    expect(darkSquare.style.background).toBe(
      'var(--board-dark-square, #779952)',
    );
    expect(lightSquare.style.background).toBe(
      'var(--board-light-square, #edeed1)',
    );
  });

  it('flips board for black orientation', () => {
    const { container } = render(<Board orientation="black" />);
    // With black orientation, a8 should be at grid position col=8, row=8 (bottom-right)
    const a8 = container.querySelector('[data-square="a8"]') as HTMLElement;
    expect(a8.style.gridColumn).toBe('8');
    expect(a8.style.gridRow).toBe('8');
  });

  it('white orientation places a1 at bottom-left (col 1, row 8)', () => {
    const { container } = render(<Board orientation="white" />);
    const a1 = container.querySelector('[data-square="a1"]') as HTMLElement;
    expect(a1.style.gridColumn).toBe('1');
    expect(a1.style.gridRow).toBe('8');
  });

  it('shows coordinates by default', () => {
    const { container } = render(<Board />);
    // Should show rank labels (1-8) and file labels (a-h)
    const coords = container.querySelectorAll('[data-coordinate]');
    // 8 rank labels + 8 file labels = 16 total
    expect(coords.length).toBeGreaterThanOrEqual(16);
  });

  it('hides coordinates when coordinates={false}', () => {
    const { container } = render(<Board coordinates={false} />);
    const coords = container.querySelectorAll('[data-coordinate]');
    expect(coords).toHaveLength(0);
  });

  it('does not set theme CSS variables on root element', () => {
    const { container } = render(<Board />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--board-dark-square')).toBe('');
    expect(root.style.getPropertyValue('--board-light-square')).toBe('');
  });

  it('uses per-square coordinate color CSS variables', () => {
    const { container } = render(<Board />);
    // a1 is dark, rank coord "1" sits on a1
    const a1 = container.querySelector('[data-square="a1"]');
    const rankCoord = a1?.querySelector(
      '[data-coordinate="rank"]',
    ) as HTMLElement;
    // a1 is dark → uses --board-coordinate-on-dark
    expect(rankCoord?.style.color).toBe(
      'var(--board-coordinate-on-dark, #edeed1)',
    );

    // a2 is light, rank coord "2" sits on a2
    const a2 = container.querySelector('[data-square="a2"]');
    const rankCoord2 = a2?.querySelector(
      '[data-coordinate="rank"]',
    ) as HTMLElement;
    // a2 is light → uses --board-coordinate-on-light
    expect(rankCoord2?.style.color).toBe(
      'var(--board-coordinate-on-light, #779952)',
    );
  });

  it('uses CSS variable for coordinate font weight', () => {
    const { container } = render(<Board />);
    const a1 = container.querySelector('[data-square="a1"]');
    const rankCoord = a1?.querySelector(
      '[data-coordinate="rank"]',
    ) as HTMLElement;
    expect(rankCoord?.style.fontWeight).toBe(
      'var(--board-coordinate-weight, 600)',
    );
  });

  it('highlights specified squares', () => {
    const { container } = render(<Board highlight={['e4', 'e5']} />);
    const squareE4 = container.querySelector('[data-square="e4"]');
    const squareE5 = container.querySelector('[data-square="e5"]');
    expect(squareE4?.querySelector('[data-highlight]')).toBeTruthy();
    expect(squareE5?.querySelector('[data-highlight]')).toBeTruthy();
  });

  it('does not render highlight overlay on non-highlighted squares', () => {
    const { container } = render(<Board highlight={['e4']} />);
    const squareE5 = container.querySelector('[data-square="e5"]');
    expect(squareE5?.querySelector('[data-highlight]')).toBeFalsy();
  });

  it('renders legal move dots when legalMoves provided and interactive=false', () => {
    const legalMoves = new Map([['e2', ['e3', 'e4']]]) as Map<Square, Square[]>;
    const { container } = render(
      <Board interactive={false} legalMoves={legalMoves} />,
    );
    const squareE3 = container.querySelector('[data-square="e3"]');
    const squareE4 = container.querySelector('[data-square="e4"]');
    expect(squareE3?.querySelector('[data-legal-dot]')).toBeTruthy();
    expect(squareE4?.querySelector('[data-legal-dot]')).toBeTruthy();
  });

  it('uses custom piece set when pieces prop provided', () => {
    const { container } = render(
      <Board
        pieces={{
          bB: () => <div data-testid="custom-piece" />,
          bK: () => <div />,
          bN: () => <div />,
          bP: () => <div />,
          bQ: () => <div />,
          bR: () => <div />,
          wB: () => <div />,
          wK: () => <div data-testid="custom-wk" />,
          wN: () => <div />,
          wP: () => <div />,
          wQ: () => <div />,
          wR: () => <div />,
        }}
        position={STARTING_FEN}
      />,
    );
    // White king on e1
    const kingSquare = container.querySelector('[data-square="e1"]');
    expect(kingSquare?.querySelector('[data-testid="custom-wk"]')).toBeTruthy();
  });

  it('has aspect-ratio 1/1 on root', () => {
    const { container } = render(<Board />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.aspectRatio).toBe('1 / 1');
  });

  it('renders children inside the board grid', () => {
    const { container } = render(
      <Board>
        <div data-testid="custom-overlay" style={{ gridColumn: 5, gridRow: 1 }}>
          overlay
        </div>
      </Board>,
    );
    const grid = container.querySelector('[data-board-grid]');
    const overlay = grid?.querySelector('[data-testid="custom-overlay"]');
    expect(overlay).toBeTruthy();
    expect(overlay?.textContent).toBe('overlay');
  });
});

describe('interaction', () => {
  // Mock getBoundingClientRect so the board thinks it is 480x480 (squareSize=60)
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      bottom: 480,
      height: 480,
      left: 0,
      right: 480,
      top: 0,
      width: 480,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    }));
  });

  it('calls onMove when a piece is dragged to a new square', () => {
    const onMove = vi.fn(() => true);
    // Starting position: white pawn on e2 (col 5, row 7 in white orientation → 5*60-30=270, 7*60-30=390)
    const { container } = render(<Board onMove={onMove} />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // e2 center: col=5, row=7 → x=(4+0.5)*60=270, y=(6+0.5)*60=390
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    // Move a bit so it counts as a drag
    fireEvent.pointerMove(grid, { clientX: 271, clientY: 391, pointerId: 1 });
    // e4 center: col=5, row=5 → x=270, y=(4+0.5)*60=270
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 270, pointerId: 1 });

    expect(onMove).toHaveBeenCalledWith({
      capture: false,
      from: 'e2',
      to: 'e4',
    });
  });

  it('does not call onMove when interactive is false', () => {
    const onMove = vi.fn(() => true);
    const { container } = render(<Board interactive={false} onMove={onMove} />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    expect(grid).toBeNull();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('selects a piece on click', () => {
    const { container } = render(<Board />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Click e2 (pawn): pointerDown + pointerUp at same spot
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    // e2 should be highlighted as selected
    const squareE2 = container.querySelector('[data-square="e2"]');
    expect(squareE2?.querySelector('[data-selected]')).toBeTruthy();
  });

  it('moves on second click to legal square', () => {
    const onMove = vi.fn(() => true);
    const legalMoves = new Map([['e2', ['e3', 'e4']]]) as Map<Square, Square[]>;
    const { container } = render(
      <Board legalMoves={legalMoves} onMove={onMove} />,
    );
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // First click: select e2
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    // Second click: click e4 (legal)
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 270, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 270, pointerId: 1 });

    expect(onMove).toHaveBeenCalledWith({
      capture: false,
      from: 'e2',
      to: 'e4',
    });
  });

  it('deselects on clicking the same piece', () => {
    const { container } = render(<Board />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Select e2
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    // Click e2 again to deselect
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    const squareE2 = container.querySelector('[data-square="e2"]');
    expect(squareE2?.querySelector('[data-selected]')).toBeFalsy();
  });

  it('shows legal move dots during selection when legalMoves provided', () => {
    const legalMoves = new Map([['e2', ['e3', 'e4']]]) as Map<Square, Square[]>;
    const { container } = render(<Board legalMoves={legalMoves} />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Before selection: no dots
    expect(
      container.querySelector('[data-square="e3"] [data-legal-dot]'),
    ).toBeFalsy();

    // Select e2
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    // Now dots on e3 and e4
    expect(
      container.querySelector('[data-square="e3"] [data-legal-dot]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-square="e4"] [data-legal-dot]'),
    ).toBeTruthy();
  });

  it('prevents move on illegal square when legalMoves provided', () => {
    const onMove = vi.fn(() => true);
    const legalMoves = new Map([['e2', ['e3', 'e4']]]) as Map<Square, Square[]>;
    const { container } = render(
      <Board legalMoves={legalMoves} onMove={onMove} />,
    );
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Select e2
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    // Click on d4 — illegal target for e2
    // d4: col=4, row=5 → x=(3+0.5)*60=210, y=(4+0.5)*60=270
    fireEvent.pointerDown(grid, { clientX: 210, clientY: 270, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 210, clientY: 270, pointerId: 1 });

    expect(onMove).not.toHaveBeenCalled();
  });

  it('renders a floating piece while dragging', () => {
    const { container } = render(<Board />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerMove(grid, { clientX: 280, clientY: 380, pointerId: 1 });

    expect(container.querySelector('[data-ghost]')).toBeTruthy();
  });

  it('prevents selecting a piece of the wrong color when turn is set', () => {
    const { container } = render(<Board turn="white" />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Try to click-select a black pawn on e7
    // e7: col=5, row=2 → x=(4+0.5)*60=270, y=(1+0.5)*60=90
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 90, pointerId: 1 });

    const squareE7 = container.querySelector('[data-square="e7"]');
    expect(squareE7?.querySelector('[data-selected]')).toBeFalsy();
  });

  it('allows selecting a piece of the correct color when turn is set', () => {
    const { container } = render(<Board turn="white" />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Click-select a white pawn on e2
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    const squareE2 = container.querySelector('[data-square="e2"]');
    expect(squareE2?.querySelector('[data-selected]')).toBeTruthy();
  });

  it('prevents dragging a piece of the wrong color when turn is set', () => {
    const onMove = vi.fn(() => true);
    const { container } = render(<Board turn="white" onMove={onMove} />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Try to drag black pawn from e7 to e5
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 90, pointerId: 1 });
    fireEvent.pointerMove(grid, { clientX: 271, clientY: 91, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 210, pointerId: 1 });

    expect(onMove).not.toHaveBeenCalled();
  });

  it('allows any piece when turn is not set', () => {
    const { container } = render(<Board />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Select a black pawn on e7 — should work without turn restriction
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 90, pointerId: 1 });

    const squareE7 = container.querySelector('[data-square="e7"]');
    expect(squareE7?.querySelector('[data-selected]')).toBeTruthy();
  });

  it('does not re-select a wrong-color piece during click-to-move', () => {
    const { container } = render(<Board turn="white" />);
    const grid = container.querySelector('[data-board-grid]') as HTMLElement;

    // Select white pawn on e2
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 390, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 390, pointerId: 1 });

    // Click black pawn on e7 — should not re-select, should deselect
    fireEvent.pointerDown(grid, { clientX: 270, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 270, clientY: 90, pointerId: 1 });

    const squareE7 = container.querySelector('[data-square="e7"]');
    expect(squareE7?.querySelector('[data-selected]')).toBeFalsy();
    // Original selection should also be cleared
    const squareE2 = container.querySelector('[data-square="e2"]');
    expect(squareE2?.querySelector('[data-selected]')).toBeFalsy();
  });
});
