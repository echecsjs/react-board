import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDrawing } from '../hooks/use-drawing.js';

function createBoardReference() {
  const div = document.createElement('div');
  Object.defineProperty(div, 'getBoundingClientRect', {
    value: () => ({
      bottom: 480,
      height: 480,
      left: 0,
      right: 480,
      top: 0,
      width: 480,
      x: 0,
      y: 0,
    }),
  });
  return { current: div };
}

function pointerEvent(
  overrides: Partial<PointerEvent> & { button: number },
): React.PointerEvent {
  return {
    button: overrides.button,
    clientX: overrides.clientX ?? 0,
    clientY: overrides.clientY ?? 0,
    ctrlKey: overrides.ctrlKey ?? false,
    altKey: overrides.altKey ?? false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.PointerEvent;
}

function mouseEvent(overrides: Partial<MouseEvent> = {}): React.MouseEvent {
  return {
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as React.MouseEvent;
}

describe('useDrawing', () => {
  const baseOptions = {
    boardRef: createBoardReference(),
    drawable: true,
    orientation: 'white' as const,
    squareSize: 60,
  };

  it('returns empty annotations initially', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    expect(result.current.annotations).toEqual({ arrows: [], circles: [] });
  });

  it('does nothing when drawable is false', () => {
    const { result } = renderHook(() =>
      useDrawing({ ...baseOptions, drawable: false }),
    );
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations).toEqual({ arrows: [], circles: [] });
  });

  it('ignores left-click events', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 0, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 0, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations).toEqual({ arrows: [], circles: [] });
  });

  it('adds a circle on right-click release on same square', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.circles).toEqual([
      { kind: 'move', square: 'e4' },
    ]);
  });

  it('toggles circle off when drawing same circle again', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.circles).toHaveLength(1);
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.circles).toHaveLength(0);
  });

  it('replaces circle kind when different modifier used on same square', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.circles[0]!.kind).toBe('move');
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270, ctrlKey: true }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270, ctrlKey: true }),
      );
    });
    expect(result.current.annotations.circles).toHaveLength(1);
    expect(result.current.annotations.circles[0]!.kind).toBe('capture');
  });

  it('adds an arrow on right-click drag to another square', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 390 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.arrows).toEqual([
      { from: 'e2', to: 'e4', kind: 'move' },
    ]);
  });

  it('toggles arrow off when drawing same arrow again', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 390 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.arrows).toHaveLength(1);
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 390 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.arrows).toHaveLength(0);
  });

  it('maps ctrl to capture kind', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270, ctrlKey: true }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270, ctrlKey: true }),
      );
    });
    expect(result.current.annotations.circles[0]!.kind).toBe('capture');
  });

  it('maps alt to danger kind', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270, altKey: true }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270, altKey: true }),
      );
    });
    expect(result.current.annotations.circles[0]!.kind).toBe('danger');
  });

  it('maps ctrl+alt to alternative kind', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({
          button: 2,
          clientX: 270,
          clientY: 270,
          ctrlKey: true,
          altKey: true,
        }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({
          button: 2,
          clientX: 270,
          clientY: 270,
          ctrlKey: true,
          altKey: true,
        }),
      );
    });
    expect(result.current.annotations.circles[0]!.kind).toBe('alternative');
  });

  it('calls onAnnotationChange when annotations change', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDrawing({ ...baseOptions, onAnnotationChange: onChange }),
    );
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(onChange).toHaveBeenCalledWith({
      arrows: [],
      circles: [{ kind: 'move', square: 'e4' }],
    });
  });

  it('clearAnnotations resets both arrows and circles', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    act(() => {
      result.current.handlers.onPointerDown(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
      result.current.handlers.onPointerUp(
        pointerEvent({ button: 2, clientX: 270, clientY: 270 }),
      );
    });
    expect(result.current.annotations.circles).toHaveLength(1);
    act(() => {
      result.current.clearAnnotations();
    });
    expect(result.current.annotations).toEqual({ arrows: [], circles: [] });
  });

  it('prevents context menu when drawable is true', () => {
    const { result } = renderHook(() => useDrawing(baseOptions));
    const event = mouseEvent();
    act(() => {
      result.current.handlers.onContextMenu(event);
    });
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('does not prevent context menu when drawable is false', () => {
    const { result } = renderHook(() =>
      useDrawing({ ...baseOptions, drawable: false }),
    );
    const event = mouseEvent();
    act(() => {
      result.current.handlers.onContextMenu(event);
    });
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
