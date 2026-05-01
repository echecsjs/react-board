import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnimation } from '../hooks/use-animation.js';

import type { Piece, Square } from '../types.js';

function makePosition(entries: [Square, Piece][]): Map<Square, Piece> {
  return new Map(entries);
}

const whitePawn: Piece = { color: 'white', type: 'pawn' };
const whiteKing: Piece = { color: 'white', type: 'king' };

// Stub refs for tests — no board element, no drop info
const boardReference =
  createRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement | null>;
const dropReference: React.MutableRefObject<undefined> = { current: undefined };

describe('useAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns an empty map when animate is false', () => {
    const position = makePosition([['e2', whitePawn]]);
    const { result } = renderHook(() =>
      useAnimation(position, 60, 'white', false, boardReference, dropReference),
    );

    expect(result.current.size).toBe(0);
  });

  it('returns an empty map on initial render with animate=true', () => {
    const position = makePosition([['e2', whitePawn]]);
    const { result } = renderHook(() =>
      useAnimation(position, 60, 'white', true, boardReference, dropReference),
    );

    expect(result.current.size).toBe(0);
  });

  it('computes offset when position changes', () => {
    const position1 = makePosition([['e2', whitePawn]]);
    const position2 = makePosition([['e4', whitePawn]]);

    let currentPosition = position1;

    const { result, rerender } = renderHook(() =>
      useAnimation(
        currentPosition,
        60,
        'white',
        true,
        boardReference,
        dropReference,
      ),
    );

    // initial — no offsets
    expect(result.current.size).toBe(0);

    // update position
    currentPosition = position2;
    act(() => {
      rerender();
    });

    // e2 → e4: same col (5), row goes from 7 to 5, offset y = (7-5)*60 = 120
    const offset = result.current.get('e4');
    expect(offset).toBeDefined();
    expect(offset?.x).toBe(0);
    expect(offset?.y).toBe(120);
  });

  it('clears offsets to zero after an animation frame', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
    let rafCallback: FrameRequestCallback | undefined;
    rafSpy.mockImplementation((callback) => {
      rafCallback = callback;
      return 1;
    });

    const position1 = makePosition([['e2', whitePawn]]);
    const position2 = makePosition([['e4', whitePawn]]);

    let currentPosition = position1;

    const { result, rerender } = renderHook(() =>
      useAnimation(
        currentPosition,
        60,
        'white',
        true,
        boardReference,
        dropReference,
      ),
    );

    currentPosition = position2;
    act(() => {
      rerender();
    });

    // offsets should be non-zero immediately
    expect(result.current.get('e4')?.y).toBe(120);

    // simulate animation frame
    act(() => {
      rafCallback?.(0);
    });

    // offsets cleared to zero
    const cleared = result.current.get('e4');
    expect(cleared?.x).toBe(0);
    expect(cleared?.y).toBe(0);

    rafSpy.mockRestore();
  });

  it('ignores position changes when animate switches to false', () => {
    const position1 = makePosition([['e2', whitePawn]]);
    const position2 = makePosition([['e4', whitePawn]]);

    let currentPosition = position1;
    let currentAnimate = false;

    const { result, rerender } = renderHook(() =>
      useAnimation(
        currentPosition,
        60,
        'white',
        currentAnimate,
        boardReference,
        dropReference,
      ),
    );

    currentPosition = position2;
    currentAnimate = false;
    act(() => {
      rerender();
    });

    expect(result.current.size).toBe(0);
  });

  it('clears offsets even when parent re-renders before RAF fires', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
    const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    const pendingCallbacks = new Map<number, FrameRequestCallback>();
    let nextId = 1;

    rafSpy.mockImplementation((callback) => {
      const id = nextId++;
      pendingCallbacks.set(id, callback);
      return id;
    });

    cafSpy.mockImplementation((id: number) => {
      pendingCallbacks.delete(id);
    });

    const position1 = makePosition([['e2', whitePawn]]);
    const position2 = makePosition([['e4', whitePawn]]);

    let currentPosition = position1;

    const { result, rerender } = renderHook(() =>
      useAnimation(
        currentPosition,
        60,
        'white',
        true,
        boardReference,
        dropReference,
      ),
    );

    // move the piece — sets non-zero offsets and schedules RAF
    currentPosition = position2;
    act(() => {
      rerender();
    });

    expect(result.current.get('e4')?.y).toBe(120);

    // parent re-renders with a new position reference (same content)
    // this triggers effect cleanup which cancels the pending RAF
    currentPosition = makePosition([['e4', whitePawn]]);
    act(() => {
      rerender();
    });

    // fire all surviving RAF callbacks (cancelled ones were removed)
    act(() => {
      for (const [, callback] of pendingCallbacks) callback(0);
    });

    // offsets must be cleared to zero — the animation should complete
    const cleared = result.current.get('e4');
    expect(cleared).toBeDefined();
    expect(cleared?.x).toBe(0);
    expect(cleared?.y).toBe(0);

    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('handles multiple pieces moving simultaneously', () => {
    const position1 = makePosition([
      ['e2', whitePawn],
      ['e1', whiteKing],
    ]);
    const position2 = makePosition([
      ['e4', whitePawn],
      ['e2', whiteKing],
    ]);

    let currentPosition = position1;

    const { result, rerender } = renderHook(() =>
      useAnimation(
        currentPosition,
        60,
        'white',
        true,
        boardReference,
        dropReference,
      ),
    );

    currentPosition = position2;
    act(() => {
      rerender();
    });

    // Both pieces should have offsets
    expect(result.current.size).toBe(2);
  });
});
