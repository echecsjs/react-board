# Eliminate Duplicated Rendering Logic in Board Component

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove ~120 lines of duplicated square rendering in the Board
component and consolidate triplicated `FILES`/`RANKS` constants and duplicated
`getSquareFromPointer` into a single source of truth.

**Architecture:** Export `FILES`, `RANKS`, and `getSquareFromPointer` from
`src/utilities.ts`. Import them in the two hooks. Merge the two Board rendering
branches (movable vs non-movable) into a single `<div>` with
conditionally-merged event handlers.

**Tech Stack:** React, TypeScript, Vitest

**Closes:** #21

---

## File Map

- **Modify:** `src/utilities.ts` — export `FILES`, `RANKS`, add
  `getSquareFromPointer` and `coordsToSquare`
- **Modify:** `src/hooks/use-drag.ts` — remove local `FILES`, `RANKS`,
  `coordsToSquare`, `getSquareFromPointer`; import from utilities
- **Modify:** `src/hooks/use-drawing.ts` — remove local `FILES`, `RANKS`,
  `Square` type, `getSquareFromPointer`; import from utilities
- **Modify:** `src/board.tsx` — merge the two rendering branches into a single
  grid `<div>` with conditional handlers
- **Modify:** `src/__tests__/utilities.spec.ts` — add tests for
  `getSquareFromPointer`

---

### Task 1: Export `FILES` and `RANKS` from utilities

**Files:**

- Modify: `src/utilities.ts:3-4,130`

- [ ] **Step 1: Add `FILES` and `RANKS` to the export statement**

In `src/utilities.ts`, change the export at line 130 from:

```typescript
export { diffPositions, SQUARES, squareColor, squareCoords };
```

to:

```typescript
export { diffPositions, FILES, RANKS, SQUARES, squareColor, squareCoords };
```

- [ ] **Step 2: Run tests to verify nothing broke**

Run: `pnpm test` Expected: all 114 tests pass — this is a purely additive export
change.

- [ ] **Step 3: Commit**

```bash
git add src/utilities.ts
git commit -m "refactor: export FILES and RANKS from utilities"
```

---

### Task 2: Move `getSquareFromPointer` to utilities

**Files:**

- Modify: `src/utilities.ts:3-4,130`
- Modify: `src/__tests__/utilities.spec.ts`

- [ ] **Step 1: Write failing tests for `getSquareFromPointer`**

Add a new `describe` block at the end of `src/__tests__/utilities.spec.ts`:

```typescript
import {
  SQUARES,
  diffPositions,
  getSquareFromPointer,
  squareColor,
  squareCoords,
} from '../utilities.js';

// ... existing tests ...

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/utilities.spec.ts` Expected: FAIL —
`getSquareFromPointer` is not exported from `../utilities.js`.

- [ ] **Step 3: Add `coordsToSquare` and `getSquareFromPointer` to
      `src/utilities.ts`**

Add the two functions before the `export` statement (after the `diffPositions`
function, before line 130). Use the `Square` type from `@echecs/position` which
is already imported:

```typescript
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
```

Update the export statement:

```typescript
export {
  diffPositions,
  FILES,
  getSquareFromPointer,
  RANKS,
  SQUARES,
  squareColor,
  squareCoords,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/__tests__/utilities.spec.ts` Expected: all tests pass,
including the new `getSquareFromPointer` tests.

- [ ] **Step 5: Commit**

```bash
git add src/utilities.ts src/__tests__/utilities.spec.ts
git commit -m "refactor: move getSquareFromPointer to utilities"
```

---

### Task 3: Update `use-drag.ts` to import from utilities

**Files:**

- Modify: `src/hooks/use-drag.ts:1-97`

- [ ] **Step 1: Replace local constants and functions with imports**

In `src/hooks/use-drag.ts`, add the import:

```typescript
import { FILES, getSquareFromPointer, RANKS } from '../utilities.js';
```

Remove the following local definitions:

- Lines 7-8: `const FILES = ...` and `const RANKS = ...`
- Lines 54-82: the entire `coordsToSquare` function
- Lines 84-97: the entire `getSquareFromPointer` function

The `FILES` and `RANKS` constants are only used by `coordsToSquare` which is now
removed. They are still imported so the types resolve. Actually — check if
`FILES` and `RANKS` are used anywhere else in the file. They are not (only in
`coordsToSquare`). So import only `getSquareFromPointer`:

```typescript
import { getSquareFromPointer } from '../utilities.js';
```

Remove lines 7-8 (`FILES`, `RANKS`), lines 54-82 (`coordsToSquare`), and lines
84-97 (`getSquareFromPointer`).

- [ ] **Step 2: Run all tests**

Run: `pnpm test` Expected: all 114+ tests pass. The `use-drag` tests should
still pass since the function signature is identical.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-drag.ts
git commit -m "refactor: use-drag imports getSquareFromPointer from utilities"
```

---

### Task 4: Update `use-drawing.ts` to import from utilities

**Files:**

- Modify: `src/hooks/use-drawing.ts:1-65`

- [ ] **Step 1: Replace local constants and functions with imports**

In `src/hooks/use-drawing.ts`, add the import:

```typescript
import { getSquareFromPointer } from '../utilities.js';
```

Remove the following local definitions:

- Lines 6-7: `const FILES = ...` and `const RANKS = ...`
- Line 9: `type Square = ...` — this local type derived from `FILES`/`RANKS` is
  no longer needed; import `Square` from `@echecs/position` instead
- Lines 32-65: the entire `getSquareFromPointer` function

Add the `Square` type import:

```typescript
import type { Square } from '@echecs/position';
```

Note: the `use-drawing.ts` function uses `Square` in `drawStartReference`
(line 87) and in `getSquareFromPointer` return types. The imported `Square` from
`@echecs/position` is the same branded type used everywhere else.

- [ ] **Step 2: Run all tests**

Run: `pnpm test` Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-drawing.ts
git commit -m "refactor: use-drawing imports getSquareFromPointer from utilities"
```

---

### Task 5: Merge the two Board rendering branches

**Files:**

- Modify: `src/board.tsx:193-488`

This is the core task. The two `<div>` branches (lines 195-351 for movable,
lines 352-487 for non-movable) differ in:

1. **Grid container attributes**: movable has `data-board-grid`, `onDragStart`,
   combined pointer handlers; non-movable conditionally applies draw handlers.
2. **Square rendering**: movable tracks `isSelected` and `hidePiece`;
   non-movable does not.
3. **Highlight JSX**: movable renders `data-highlight` AND `data-selected`;
   non-movable only renders `data-highlight`.

- [ ] **Step 1: Build the merged grid container handlers**

Replace the entire ternary (lines 195-488) with a single `<div>`:

```tsx
const gridHandlers: Record<
  string,
  React.EventHandler<React.SyntheticEvent> | undefined
> = {};

if (isMovable) {
  gridHandlers.onDragStart = (event: React.SyntheticEvent) =>
    event.preventDefault();
  gridHandlers.onPointerDown = (event: React.PointerEvent) => {
    handlers.onPointerDown(event);
    drawHandlers.onPointerDown(event);
  };
  gridHandlers.onPointerMove = (event: React.PointerEvent) => {
    handlers.onPointerMove(event);
    drawHandlers.onPointerMove(event);
  };
  gridHandlers.onPointerUp = (event: React.PointerEvent) => {
    handlers.onPointerUp(event);
    drawHandlers.onPointerUp(event);
  };
  gridHandlers.onContextMenu = drawHandlers.onContextMenu;
} else if (drawable) {
  gridHandlers.onContextMenu = drawHandlers.onContextMenu;
  gridHandlers.onPointerDown = drawHandlers.onPointerDown;
  gridHandlers.onPointerMove = drawHandlers.onPointerMove;
  gridHandlers.onPointerUp = drawHandlers.onPointerUp;
}
```

Place this before the `return` statement (before line 193).

- [ ] **Step 2: Replace the ternary with a single grid `<div>` and unified
      square rendering**

Replace lines 195-488 with:

```tsx
<div
  data-board-grid={isMovable || undefined}
  style={gridStyle}
  {...gridHandlers}
>
  {SQUARES.map((square) => {
    const color = squareColor(square);
    const coords = squareCoords(square, orientation);
    const piece = positionMap.get(square);
    const isHighlighted = highlightSet.has(square);
    const hasLegalDot = legalTargets.has(square);
    const isSelected = isMovable && selectedSquare === square;
    const hidePiece =
      isMovable && dragState.isDragging && dragState.from === square;

    const file = square[0];
    const rank = square[1];

    const showRankCoord =
      coordinates && (orientation === 'white' ? file === 'a' : file === 'h');
    const showFileCoord =
      coordinates && (orientation === 'white' ? rank === '1' : rank === '8');

    const squareStyle: React.CSSProperties = {
      background:
        color === 'dark'
          ? 'var(--board-dark-square, #779952)'
          : 'var(--board-light-square, #edeed1)',
      gridColumn: String(coords.col),
      gridRow: String(coords.row),
      position: 'relative',
    };

    const rankCoordStyle: React.CSSProperties = {
      color:
        color === 'light'
          ? 'var(--board-coordinate-on-light, #779952)'
          : 'var(--board-coordinate-on-dark, #edeed1)',
      fontSize: `${squareSize * 0.15}px`,
      fontWeight: 'var(--board-coordinate-weight, 600)',
      left: '2px',
      lineHeight: 1,
      pointerEvents: 'none',
      position: 'absolute',
      top: '2px',
      userSelect: 'none',
    };

    const fileCoordStyle: React.CSSProperties = {
      bottom: '2px',
      color:
        color === 'light'
          ? 'var(--board-coordinate-on-light, #779952)'
          : 'var(--board-coordinate-on-dark, #edeed1)',
      fontSize: `${squareSize * 0.15}px`,
      fontWeight: 'var(--board-coordinate-weight, 600)',
      lineHeight: 1,
      pointerEvents: 'none',
      position: 'absolute',
      right: '2px',
      userSelect: 'none',
    };

    const highlightStyle: React.CSSProperties = {
      background: 'var(--board-highlight, rgba(255, 255, 0, 0.4))',
      height: '100%',
      inset: 0,
      position: 'absolute',
      width: '100%',
    };

    const legalDotStyle: React.CSSProperties = {
      background: 'var(--board-legal-dot, rgba(0, 0, 0, 0.2))',
      borderRadius: '50%',
      height: '30%',
      left: '50%',
      position: 'absolute',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '30%',
    };

    let pieceImage: string | undefined;

    if (piece && !hidePiece) {
      const key: PieceKey =
        `${piece.color}${piece.type.toUpperCase()}` as PieceKey;
      pieceImage = pieces[key];
    }

    const animOffset = animationOffsets.get(square);
    const pieceStyle: React.CSSProperties | undefined = pieceImage
      ? {
          backgroundImage: `url("${pieceImage}")`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          height: '100%',
          position: 'relative',
          width: '100%',
          zIndex: 1,
          ...(animOffset
            ? {
                transform: `translate(${animOffset.x}px, ${animOffset.y}px)`,
                transition:
                  animOffset.x !== 0 || animOffset.y !== 0
                    ? 'none'
                    : 'var(--board-piece-transition, transform 200ms ease)',
              }
            : undefined),
        }
      : undefined;

    return (
      <div data-square={square} key={square} style={squareStyle}>
        {(isHighlighted || isSelected) && (
          <div
            data-highlight={isHighlighted || undefined}
            data-selected={isSelected || undefined}
            style={highlightStyle}
          />
        )}
        {pieceStyle && <div data-piece style={pieceStyle} />}
        {hasLegalDot && <div data-legal-dot style={legalDotStyle} />}
        {showRankCoord && (
          <span data-coordinate="rank" style={rankCoordStyle}>
            {rank}
          </span>
        )}
        {showFileCoord && (
          <span data-coordinate="file" style={fileCoordStyle}>
            {file}
          </span>
        )}
      </div>
    );
  })}
  {children}
</div>
```

Key changes from the original:

- `isSelected` is `false` when `!isMovable` (guard:
  `isMovable && selectedSquare === square`)
- `hidePiece` is `false` when `!isMovable` (guard:
  `isMovable && dragState.isDragging && dragState.from === square`)
- The highlight overlay renders `data-selected` when `isSelected` is truthy;
  when `!isMovable`, `isSelected` is always `false` so the attribute won't
  appear — matching old behavior
- The `if (piece && !hidePiece)` check works for both branches since `hidePiece`
  is `false` when non-movable — matching the old `if (piece)` check
- `data-board-grid` is only set when `isMovable` (via `isMovable || undefined`)

- [ ] **Step 3: Run all tests**

Run: `pnpm test` Expected: all tests pass. Critical tests to watch:

- `renders children inside the board grid` — checks for `[data-board-grid]`
  (only when `movable`)
- `does not call onMove when interactive is false` — checks that
  `[data-board-grid]` is null (this test expects `grid` to be `null` — but now
  it won't be `null` since we always render one `<div>`. We need to check this.)

**Important:** The test at line 249-252 (`board.spec.tsx`) does:

```typescript
const grid = container.querySelector('[data-board-grid]') as HTMLElement;
expect(grid).toBeNull();
```

With the merged code, `data-board-grid` is only set when `isMovable` is true
(via `isMovable || undefined`). When `interactive={false}`, `isMovable` resolves
to `false`, so `data-board-grid` won't be present. This test should still pass.

- [ ] **Step 4: Run lint**

Run: `pnpm lint` Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/board.tsx
git commit -m "refactor: merge duplicated rendering branches in Board"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test` Expected: all tests pass.

- [ ] **Step 2: Run lint and typecheck**

Run: `pnpm lint` Expected: zero errors, zero warnings.

- [ ] **Step 3: Run the build**

Run: `pnpm build` Expected: builds successfully.
