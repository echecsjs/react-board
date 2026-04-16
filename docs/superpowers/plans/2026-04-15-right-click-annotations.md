# Right-Click Annotations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable user-drawn arrows and circle highlights via right-click
interactions, rename `interactive` to `movable`, and rename `ArrowOverlay` to
`AnnotationOverlay` with circle support.

**Architecture:** A new `useDrawing` hook handles right-click pointer events
(button === 2) to track drawing state and manage user-drawn annotations. The
existing `ArrowOverlay` is renamed to `AnnotationOverlay` and extended to render
circles. The Board component merges drawing handlers with drag handlers, and
resolves the `movable`/`interactive` prop precedence.

**Tech Stack:** React, SVG, TypeScript, Vitest, Storybook

---

## File Structure

| File                                                                                 | Action          | Responsibility                                                                                                                             |
| ------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types.ts`                                                                       | Modify          | Add `Circle`, `Annotations`, `ArrowKind` export. Add `movable`, `drawable`, `onAnnotationChange` to `BoardProps`. Deprecate `interactive`. |
| `src/arrow-overlay.tsx` → `src/annotation-overlay.tsx`                               | Rename + modify | Render both arrows and circles. Rename component + data attribute.                                                                         |
| `src/hooks/use-drawing.ts`                                                           | Create          | Right-click annotation hook — manages drawing state, produces annotations                                                                  |
| `src/hooks/use-drag.ts`                                                              | Modify          | Filter to left-click only (`button === 0`), accept `clearAnnotations` callback                                                             |
| `src/board.tsx`                                                                      | Modify          | Wire `useDrawing`, merge handlers, resolve `movable`/`interactive`                                                                         |
| `src/index.ts`                                                                       | Modify          | Export new types, update import path                                                                                                       |
| `src/__tests__/arrow-overlay.spec.tsx` → `src/__tests__/annotation-overlay.spec.tsx` | Rename + modify | Add circle rendering tests                                                                                                                 |
| `src/__tests__/use-drawing.spec.ts`                                                  | Create          | Tests for drawing hook                                                                                                                     |
| `src/__stories__/board.stories.tsx`                                                  | Modify          | Add drawable stories, update existing stories for `movable`                                                                                |

---

### Task 1: Update types

**Files:**

- Modify: `src/types.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add `Circle` and `Annotations` types to `src/types.ts`**

Add the following after the `Arrow` interface:

```ts
interface Annotations {
  arrows: Arrow[];
  circles: Circle[];
}

interface Circle {
  kind: ArrowKind;
  square: Square;
}
```

- [ ] **Step 2: Update `BoardProperties` in `src/types.ts`**

Replace the current `BoardProperties` interface with:

```ts
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
```

New props: `drawable`, `movable`, `onAnnotationChange`. `interactive` kept with
JSDoc deprecation tag.

- [ ] **Step 3: Export new types from `src/types.ts` and `src/index.ts`**

Update the export block in `src/types.ts`:

```ts
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
```

Update `src/index.ts`:

```ts
export type {
  Annotations,
  Arrow,
  ArrowKind,
  BoardProps,
  Circle,
  MoveEvent,
  PieceKey,
  PieceSet,
} from './types.js';
```

- [ ] **Step 4: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/index.ts
git commit -m "feat: add Circle, Annotations types and movable/drawable props"
```

---

### Task 2: Rename ArrowOverlay to AnnotationOverlay + add circle rendering

**Files:**

- Rename: `src/arrow-overlay.tsx` → `src/annotation-overlay.tsx`
- Rename: `src/__tests__/arrow-overlay.spec.tsx` →
  `src/__tests__/annotation-overlay.spec.tsx`

- [ ] **Step 1: Rename files**

```bash
git mv src/arrow-overlay.tsx src/annotation-overlay.tsx
git mv src/__tests__/arrow-overlay.spec.tsx src/__tests__/annotation-overlay.spec.tsx
```

- [ ] **Step 2: Update imports in the test file**

In `src/__tests__/annotation-overlay.spec.tsx`, update the import:

```ts
import AnnotationOverlay, { arrowPath } from '../annotation-overlay.js';
```

Replace all references to `ArrowOverlay` with `AnnotationOverlay` in the test
file (component name in `render()` calls).

- [ ] **Step 3: Update `src/board.tsx` import**

Change:

```ts
import ArrowOverlay from './arrow-overlay.js';
```

To:

```ts
import AnnotationOverlay from './annotation-overlay.js';
```

And update the JSX from `<ArrowOverlay` to `<AnnotationOverlay`.

- [ ] **Step 4: Update `data-arrows` to `data-annotations` in the component**

In `src/annotation-overlay.tsx`, change:

```tsx
data - arrows;
```

To:

```tsx
data - annotations;
```

- [ ] **Step 5: Update the test that checks for `data-arrows`**

In the test file, change:

```ts
const svg = container.querySelector('svg[data-arrows]');
```

To:

```ts
const svg = container.querySelector('svg[data-annotations]');
```

- [ ] **Step 6: Rename the component function**

In `src/annotation-overlay.tsx`, rename `ArrowOverlay` to `AnnotationOverlay`
and the interface from `ArrowOverlayProperties` to
`AnnotationOverlayProperties`.

- [ ] **Step 7: Add `circles` prop and circle rendering**

Update the interface in `src/annotation-overlay.tsx`:

```ts
import type { Arrow, ArrowKind, Circle } from './types.js';

interface AnnotationOverlayProperties {
  arrows: Arrow[];
  circles?: Circle[];
  orientation: 'black' | 'white';
  squareSize: number;
}
```

Add `circles = []` to the destructured props. Update the empty check:

```ts
if (arrows.length === 0 && circles.length === 0) return undefined;
```

Add circle rendering before the arrow paths in the SVG body:

```tsx
const circleElements: React.ReactElement[] = [];
const seenCircles = new Set<string>();
for (const circle of circles) {
  const key = `${circle.square}-${circle.kind}`;
  if (seenCircles.has(key)) continue;
  seenCircles.add(key);

  const { col, row } = squareCoords(circle.square, orientation);
  const cx = (col - 0.5) * squareSize;
  const cy = (row - 0.5) * squareSize;
  const r = squareSize * 0.4;
  const strokeWidth = squareSize * 0.05;

  circleElements.push(
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      style={{
        fill: 'none',
        opacity: 'var(--board-arrow-opacity, 0.8)' as unknown as number,
        stroke: CSS_VAR[circle.kind],
        strokeWidth,
      }}
    />,
  );
}
```

In the SVG return, render circles before arrows:

```tsx
<svg ...>
  {circleElements}
  {paths}
</svg>
```

- [ ] **Step 8: Add circle tests to the test file**

Append to `src/__tests__/annotation-overlay.spec.tsx`:

```tsx
import type { Circle } from '../types.js';

describe('AnnotationOverlay circles', () => {
  it('renders nothing when both arrows and circles are empty', () => {
    const { container } = render(
      <AnnotationOverlay
        arrows={[]}
        circles={[]}
        orientation="white"
        squareSize={60}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders an svg when only circles are provided', () => {
    const circles: Circle[] = [{ square: 'e4', kind: 'move' }];
    const { container } = render(
      <AnnotationOverlay
        arrows={[]}
        circles={circles}
        orientation="white"
        squareSize={60}
      />,
    );
    expect(container.querySelector('svg[data-annotations]')).not.toBeNull();
  });

  it('renders one circle element per circle', () => {
    const circles: Circle[] = [
      { square: 'e4', kind: 'move' },
      { square: 'd5', kind: 'capture' },
    ];
    const { container } = render(
      <AnnotationOverlay
        arrows={[]}
        circles={circles}
        orientation="white"
        squareSize={60}
      />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('deduplicates identical circles', () => {
    const circles: Circle[] = [
      { square: 'e4', kind: 'move' },
      { square: 'e4', kind: 'move' },
    ];
    const { container } = render(
      <AnnotationOverlay
        arrows={[]}
        circles={circles}
        orientation="white"
        squareSize={60}
      />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });

  it('applies the correct CSS variable for circle kind', () => {
    const circles: Circle[] = [{ square: 'e4', kind: 'danger' }];
    const { container } = render(
      <AnnotationOverlay
        arrows={[]}
        circles={circles}
        orientation="white"
        squareSize={60}
      />,
    );
    const circle = container.querySelector('circle')!;
    expect(circle.getAttribute('style')).toContain('--board-arrow-danger');
  });

  it('renders circles before arrows in DOM order', () => {
    const arrows: Arrow[] = [{ from: 'e2', to: 'e4', kind: 'move' }];
    const circles: Circle[] = [{ square: 'd5', kind: 'capture' }];
    const { container } = render(
      <AnnotationOverlay
        arrows={arrows}
        circles={circles}
        orientation="white"
        squareSize={60}
      />,
    );
    const svg = container.querySelector('svg')!;
    const children = [...svg.children];
    const circleIndex = children.findIndex((el) => el.tagName === 'circle');
    const pathIndex = children.findIndex((el) => el.tagName === 'path');
    expect(circleIndex).toBeLessThan(pathIndex);
  });
});
```

- [ ] **Step 9: Run tests**

Run: `pnpm test` Expected: all tests pass.

- [ ] **Step 10: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: rename ArrowOverlay to AnnotationOverlay, add circle rendering"
```

---

### Task 3: Filter useDrag to left-click only + accept clearAnnotations

**Files:**

- Modify: `src/hooks/use-drag.ts`

- [ ] **Step 1: Add button check to `onPointerDown`**

In `src/hooks/use-drag.ts`, in the `onPointerDown` callback, add a check at the
very beginning (after the `!interactive` check):

```ts
const onPointerDown = useCallback(
  (event: React.PointerEvent) => {
    if (!interactive || !boardRef.current) {
      return;
    }

    // Only handle left-click for piece movement
    if (event.button !== 0) {
      return;
    }

    // ... rest unchanged
```

- [ ] **Step 2: Add `clearAnnotations` to the options and call it**

Add `clearAnnotations` to `UseDragOptions`:

```ts
interface UseDragOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
  clearAnnotations?: () => void;
  interactive: boolean;
  legalMoves?: Map<Square, Square[]>;
  onMove?: (move: MoveEvent) => boolean;
  orientation: 'black' | 'white';
  pieces: Map<Square, Piece>;
  squareSize: number;
  turn?: 'black' | 'white';
}
```

Destructure it in the hook:

```ts
function useDrag({
  boardRef,
  clearAnnotations,
  interactive,
  // ... rest
}: UseDragOptions): UseDragResult {
```

Call `clearAnnotations?.()` in the `onPointerDown` callback, right after the
button check:

```ts
if (event.button !== 0) {
  return;
}

// Clear any user-drawn annotations on left-click
clearAnnotations?.();

const rect = boardRef.current.getBoundingClientRect();
// ... rest unchanged
```

Add `clearAnnotations` to the `onPointerDown` dependency array.

- [ ] **Step 3: Run tests**

Run: `pnpm test` Expected: all tests pass (existing useDrag tests shouldn't
break since `clearAnnotations` is optional).

- [ ] **Step 4: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-drag.ts
git commit -m "feat: filter useDrag to left-click, add clearAnnotations callback"
```

---

### Task 4: useDrawing hook

**Files:**

- Create: `src/hooks/use-drawing.ts`
- Create: `src/__tests__/use-drawing.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/use-drawing.spec.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDrawing } from '../hooks/use-drawing.js';

import type { Annotations } from '../types.js';

function createBoardRef() {
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
    boardRef: createBoardRef(),
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
    // Simulate right-click on e4 center (col 5, row 5 for white: x=270, y=270)
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
    // e4 center for white orientation: col 5, row 5 → x = 4.5*60 = 270, y = 4.5*60 = 270
    // Wait — squareCoords('e4', 'white') = { col: 5, row: 5 }
    // pixel center = (5 - 0.5) * 60 = 270... but getSquareFromPointer uses floor(x/squareSize)
    // so clientX=270, col = floor(270/60) = 4, file index 4 = 'e', rank index 4 = '4' → e4
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
    // Now ctrl+right-click same square
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
    // e2 → e4: e2 center at x=270, y=390; e4 center at x=270, y=270
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
    // Add a circle
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test` Expected: FAIL — `useDrawing` not found.

- [ ] **Step 3: Implement `useDrawing` hook**

Create `src/hooks/use-drawing.ts`:

```ts
import { useCallback, useRef, useState } from 'react';

import type { Annotations, Arrow, ArrowKind, Circle } from '../types.js';
import type React from 'react';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

type Square = `${(typeof FILES)[number]}${(typeof RANKS)[number]}`;

interface UseDrawingOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
  drawable: boolean;
  onAnnotationChange?: (annotations: Annotations) => void;
  orientation: 'black' | 'white';
  squareSize: number;
}

interface UseDrawingResult {
  annotations: Annotations;
  clearAnnotations: () => void;
  handlers: {
    onContextMenu: (event: React.MouseEvent) => void;
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
  };
}

const EMPTY_ANNOTATIONS: Annotations = { arrows: [], circles: [] };

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

  if (!file || !rank) return undefined;

  return `${file}${rank}` as Square;
}

function getKindFromModifiers(event: {
  altKey: boolean;
  ctrlKey: boolean;
}): ArrowKind {
  if (event.ctrlKey && event.altKey) return 'alternative';
  if (event.ctrlKey) return 'capture';
  if (event.altKey) return 'danger';
  return 'move';
}

function useDrawing({
  boardRef,
  drawable,
  onAnnotationChange,
  orientation,
  squareSize,
}: UseDrawingOptions): UseDrawingResult {
  const [annotations, setAnnotations] =
    useState<Annotations>(EMPTY_ANNOTATIONS);
  const drawStartRef = useRef<{ square: Square; kind: ArrowKind } | undefined>(
    undefined,
  );

  const updateAnnotations = useCallback(
    (next: Annotations) => {
      setAnnotations(next);
      onAnnotationChange?.(next);
    },
    [onAnnotationChange],
  );

  const clearAnnotations = useCallback(() => {
    setAnnotations((previous) => {
      if (previous.arrows.length === 0 && previous.circles.length === 0) {
        return previous;
      }
      onAnnotationChange?.(EMPTY_ANNOTATIONS);
      return EMPTY_ANNOTATIONS;
    });
  }, [onAnnotationChange]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (drawable) {
        event.preventDefault();
      }
    },
    [drawable],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!drawable || event.button !== 2 || !boardRef.current) {
        return;
      }

      const rect = boardRef.current.getBoundingClientRect();
      const square = getSquareFromPointer(
        event.clientX,
        event.clientY,
        rect,
        squareSize,
        orientation,
      );

      if (!square) return;

      const kind = getKindFromModifiers(event);
      drawStartRef.current = { square, kind };
    },
    [boardRef, drawable, orientation, squareSize],
  );

  const onPointerMove = useCallback((_event: React.PointerEvent) => {
    // No visual feedback during drawing for now.
    // Future: could show a preview arrow.
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!drawable || event.button !== 2 || !boardRef.current) {
        return;
      }

      const start = drawStartRef.current;
      drawStartRef.current = undefined;

      if (!start) return;

      const rect = boardRef.current.getBoundingClientRect();
      const endSquare = getSquareFromPointer(
        event.clientX,
        event.clientY,
        rect,
        squareSize,
        orientation,
      );

      if (!endSquare) return;

      if (endSquare === start.square) {
        // Circle: toggle on same square
        setAnnotations((previous) => {
          const existing = previous.circles.find(
            (c) => c.square === start.square,
          );

          let nextCircles: Circle[];

          if (existing && existing.kind === start.kind) {
            // Same kind → remove
            nextCircles = previous.circles.filter(
              (c) => c.square !== start.square,
            );
          } else {
            // Different kind or new → replace/add
            nextCircles = [
              ...previous.circles.filter((c) => c.square !== start.square),
              { kind: start.kind, square: start.square },
            ];
          }

          const next = { arrows: previous.arrows, circles: nextCircles };
          onAnnotationChange?.(next);
          return next;
        });
      } else {
        // Arrow: toggle between squares
        setAnnotations((previous) => {
          const existing = previous.arrows.find(
            (a) => a.from === start.square && a.to === endSquare,
          );

          let nextArrows: Arrow[];

          if (existing && existing.kind === start.kind) {
            // Same kind → remove
            nextArrows = previous.arrows.filter(
              (a) => !(a.from === start.square && a.to === endSquare),
            );
          } else {
            // Different kind or new → replace/add
            nextArrows = [
              ...previous.arrows.filter(
                (a) => !(a.from === start.square && a.to === endSquare),
              ),
              { from: start.square, kind: start.kind, to: endSquare },
            ];
          }

          const next = { arrows: nextArrows, circles: previous.circles };
          onAnnotationChange?.(next);
          return next;
        });
      }
    },
    [boardRef, drawable, onAnnotationChange, orientation, squareSize],
  );

  return {
    annotations,
    clearAnnotations,
    handlers: { onContextMenu, onPointerDown, onPointerMove, onPointerUp },
  };
}

export { useDrawing };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test` Expected: all tests pass.

- [ ] **Step 5: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-drawing.ts src/__tests__/use-drawing.spec.ts
git commit -m "feat: useDrawing hook for right-click annotations"
```

---

### Task 5: Wire everything into Board

**Files:**

- Modify: `src/board.tsx`

- [ ] **Step 1: Import `useDrawing`**

Add to imports in `src/board.tsx`:

```ts
import { useDrawing } from './hooks/use-drawing.js';
```

- [ ] **Step 2: Resolve `movable`/`interactive` and add new props**

Update the Board function signature to include the new props and implement the
resolution logic:

```ts
function Board({
  animate = true,
  arrows = [],
  children,
  coordinates = true,
  drawable = false,
  highlight: highlightSquares = [],
  interactive,
  legalMoves,
  movable,
  onAnnotationChange,
  onMove,
  orientation = 'white',
  pieces = DEFAULT_PIECES,
  position,
  turn,
}: BoardProperties): React.JSX.Element {
  // Resolve movable/interactive precedence
  let isMovable: boolean;
  if (movable !== undefined) {
    isMovable = movable;
  } else if (interactive !== undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[@echecs/react-board] `interactive` is deprecated. Use `movable` instead.',
      );
    }
    isMovable = interactive;
  } else {
    isMovable = false;
  }
```

- [ ] **Step 3: Replace all `interactive` references with `isMovable`**

In the Board function body, replace every occurrence of the `interactive`
variable with `isMovable`:

- `useDrag({ ... interactive, ... })` →
  `useDrag({ ... interactive: isMovable, ... })`
- `if (!interactive && legalMoves)` → `if (!isMovable && legalMoves)`
- `else if (interactive && selectedSquare ...` →
  `else if (isMovable && selectedSquare ...`
- `else if (interactive && dragState.from ...` →
  `else if (isMovable && dragState.from ...`
- `{interactive ? (` → `{isMovable ? (`

- [ ] **Step 4: Wire `useDrawing` hook**

Add the `useDrawing` call after the `useDrag` call:

```ts
const {
  annotations: userAnnotations,
  clearAnnotations,
  handlers: drawHandlers,
} = useDrawing({
  boardRef: containerReference,
  drawable,
  onAnnotationChange,
  orientation,
  squareSize,
});
```

Pass `clearAnnotations` to `useDrag`:

```ts
const { dragState, dropRef, handlers, selectedSquare } = useDrag({
  boardRef: containerReference,
  clearAnnotations,
  interactive: isMovable,
  legalMoves,
  onMove,
  orientation,
  pieces: positionMap,
  squareSize,
  turn,
});
```

- [ ] **Step 5: Merge handlers on the grid**

Update the interactive grid's event handlers to call both drag and drawing
handlers:

```tsx
{isMovable ? (
  <div
    data-board-grid
    onContextMenu={drawHandlers.onContextMenu}
    onDragStart={(event) => event.preventDefault()}
    onPointerDown={(event) => {
      handlers.onPointerDown(event);
      drawHandlers.onPointerDown(event);
    }}
    onPointerMove={(event) => {
      handlers.onPointerMove(event);
      drawHandlers.onPointerMove(event);
    }}
    onPointerUp={(event) => {
      handlers.onPointerUp(event);
      drawHandlers.onPointerUp(event);
    }}
    style={gridStyle}
  >
```

For the non-movable branch, also add drawing handlers if drawable:

```tsx
) : (
  <div
    onContextMenu={drawable ? drawHandlers.onContextMenu : undefined}
    onPointerDown={drawable ? drawHandlers.onPointerDown : undefined}
    onPointerMove={drawable ? drawHandlers.onPointerMove : undefined}
    onPointerUp={drawable ? drawHandlers.onPointerUp : undefined}
    style={gridStyle}
  >
```

- [ ] **Step 6: Merge arrows for rendering**

Update the `AnnotationOverlay` to receive merged arrows and user-drawn circles:

```tsx
<AnnotationOverlay
  arrows={[...arrows, ...userAnnotations.arrows]}
  circles={userAnnotations.circles}
  orientation={orientation}
  squareSize={squareSize}
/>
```

- [ ] **Step 7: Run tests**

Run: `pnpm test` Expected: all tests pass.

- [ ] **Step 8: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 9: Commit**

```bash
git add src/board.tsx
git commit -m "feat: wire useDrawing into Board, resolve movable/interactive"
```

---

### Task 6: Update stories

**Files:**

- Modify: `src/__stories__/board.stories.tsx`

- [ ] **Step 1: Update existing interactive story to use `movable`**

In `src/__stories__/board.stories.tsx`, find the `InteractiveGame` component's
`<Board>` usage and add `movable`:

```tsx
<Board
  legalMoves={legalMoves}
  movable
  onMove={handleMove}
  position={position}
  turn={turn}
>
```

Also update any stories that use `interactive` to use `movable` instead.

- [ ] **Step 2: Add a drawable story**

Add after the existing `WithArrows` story:

```tsx
// -- Drawable: right-click to draw annotations ---

export const Drawable: Story = {
  args: {
    drawable: true,
    movable: true,
  },
};
```

- [ ] **Step 3: Add a drawable-only story (non-movable)**

```tsx
// -- Drawable only: annotations without piece movement ---

export const DrawableOnly: Story = {
  args: {
    drawable: true,
  },
};
```

- [ ] **Step 4: Verify Storybook builds**

Run: `pnpm storybook:build` Expected: builds without errors.

- [ ] **Step 5: Commit**

```bash
git add src/__stories__/board.stories.tsx
git commit -m "feat: add drawable stories, migrate to movable prop"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test` Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 3: Run build**

Run: `pnpm build` Expected: succeeds. `Annotations`, `Circle`, and updated
`BoardProps` in output.

- [ ] **Step 4: Run format**

Run: `pnpm format` Expected: all files formatted.
