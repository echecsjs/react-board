# CSS Variable Theming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `theme` prop with pure CSS custom property theming — all
board visuals driven by `--board-*` variables with sensible defaults at the
point of consumption.

**Architecture:** Remove `BoardTheme` type, `theme` prop, and `DEFAULT_THEME`
constant. Every inline style that references a color uses
`var(--board-*, <default>)` fallbacks. Coordinate color splits from one variable
into two (`--board-coordinate-on-light`, `--board-coordinate-on-dark`). No
variables are set on the root element — consumers define them on a parent.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react

---

### Task 1: Remove `BoardTheme` from types and exports

**Files:**

- Modify: `src/types.ts:22` (remove `theme` from `BoardProperties`),
  `src/types.ts:25-32` (remove `BoardTheme` interface), `src/types.ts:61`
  (remove `BoardTheme` from exports)
- Modify: `src/index.ts:7` (remove `BoardTheme` from re-exports)

- [ ] **Step 1: Remove `BoardTheme` interface and `theme` prop from
      `src/types.ts`**

Remove the `BoardTheme` interface (lines 25-32), remove `theme?: BoardTheme`
from `BoardProperties` (line 22), and remove `BoardTheme` from the export block
(line 61).

The file should look like:

```typescript
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
  coordinates?: boolean;
  highlight?: Square[];
  interactive?: boolean;
  legalMoves?: Map<Square, Square[]>;
  onMove?: (move: MoveEvent) => boolean;
  onSquareClick?: (square: Square) => void;
  orientation?: 'black' | 'white';
  pieces?: PieceSet;
  position?: Map<Square, Piece> | string;
}

interface MoveEvent {
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
```

- [ ] **Step 2: Remove `BoardTheme` from barrel exports in `src/index.ts`**

```typescript
export { default as Board } from './board.js';
export { DEFAULT_PIECES } from './pieces/index.js';

export type {
  Arrow,
  BoardProps,
  MoveEvent,
  PieceComponent,
  PieceKey,
  PieceSet,
} from './types.js';
```

- [ ] **Step 3: Verify TypeScript compiles (expect errors in board.tsx — that's
      next)**

Run: `pnpm tsc --noEmit 2>&1 | head -20`

Expected: errors in `src/board.tsx` referencing `BoardTheme` and `theme` — this
is correct, we fix those in Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/index.ts
git commit -m "remove BoardTheme type and theme prop from public API"
```

---

### Task 2: Refactor board.tsx to use CSS variable fallbacks

**Files:**

- Modify: `src/board.tsx`

This is the main task. Remove `DEFAULT_THEME`, the theme merge, and the
`BoardTheme` import. Replace inline style references to use
`var(--board-*, <default>)` directly. Split coordinate color into two variables.
Remove the root-level CSS variable assignments.

- [ ] **Step 1: Remove theme-related imports, constants, and props from
      `src/board.tsx`**

Remove the `BoardTheme` import (line 11), `DEFAULT_THEME` constant (lines
17-24), `theme` from the destructured props (line 38), and the theme merge line
(line 82). Remove `resolvedTheme` usage.

The import block becomes:

```typescript
import { useEffect, useRef, useState } from 'react';

import { parseFen } from './fen.js';
import { useAnimation } from './hooks/use-animation.js';
import { useDrag } from './hooks/use-drag.js';
import { DEFAULT_PIECES } from './pieces/index.js';
import { SQUARES, squareColor, squareCoords } from './utilities.js';

import type {
  BoardProps as BoardProperties,
  PieceComponent as PieceComponentType,
  PieceKey,
} from './types.js';
import type React from 'react';
```

The props destructuring becomes (no `theme`):

```typescript
function Board({
  animate = true,
  coordinates = true,
  highlight: highlightSquares = [],
  interactive = true,
  legalMoves,
  onMove,
  orientation = 'white',
  pieces = DEFAULT_PIECES,
  position,
}: BoardProperties): React.JSX.Element {
```

Remove the theme merge line:

```typescript
// DELETE: const resolvedTheme: Required<BoardTheme> = { ...DEFAULT_THEME, ...theme };
```

- [ ] **Step 2: Update `rootStyle` — remove CSS variable assignments**

The root element no longer sets any `--board-*` variables. It only keeps layout
properties:

```typescript
const rootStyle: React.CSSProperties = {
  aspectRatio: '1 / 1',
  position: 'relative',
  width: '100%',
};
```

- [ ] **Step 3: Update square background styles to use `var()` with fallbacks**

In both the interactive and non-interactive square rendering, update
`squareStyle`:

```typescript
const squareStyle: React.CSSProperties = {
  background:
    color === 'dark'
      ? 'var(--board-dark-square, #779952)'
      : 'var(--board-light-square, #edeed1)',
  gridColumn: String(coords.col),
  gridRow: String(coords.row),
  overflow: 'hidden',
  position: 'relative',
};
```

This appears twice in the file — once in the interactive block and once in the
non-interactive block. Update both.

- [ ] **Step 4: Update coordinate styles to use two variables with fallbacks**

Replace the single `var(--board-coordinate)` with per-square-color variables.
The coordinate color depends on which square the label sits on — use the
opposite square color as default.

In both interactive and non-interactive blocks, update `rankCoordStyle`:

```typescript
const rankCoordStyle: React.CSSProperties = {
  color:
    color === 'light'
      ? 'var(--board-coordinate-on-light, #779952)'
      : 'var(--board-coordinate-on-dark, #edeed1)',
  fontSize: `${squareSize * 0.25}px`,
  fontWeight: 'bold',
  left: '2px',
  lineHeight: 1,
  pointerEvents: 'none',
  position: 'absolute',
  top: '2px',
  userSelect: 'none',
};
```

And `fileCoordStyle`:

```typescript
const fileCoordStyle: React.CSSProperties = {
  bottom: '2px',
  color:
    color === 'light'
      ? 'var(--board-coordinate-on-light, #779952)'
      : 'var(--board-coordinate-on-dark, #edeed1)',
  fontSize: `${squareSize * 0.25}px`,
  fontWeight: 'bold',
  lineHeight: 1,
  pointerEvents: 'none',
  position: 'absolute',
  right: '2px',
  userSelect: 'none',
};
```

Update all four occurrences (rank + file in both interactive and non-interactive
blocks).

- [ ] **Step 5: Update highlight style to use `var()` with fallback**

In both interactive and non-interactive blocks:

```typescript
const highlightStyle: React.CSSProperties = {
  background: 'var(--board-highlight, rgba(255, 255, 0, 0.4))',
  height: '100%',
  inset: 0,
  position: 'absolute',
  width: '100%',
};
```

- [ ] **Step 6: Update legal dot style to use `var()` with fallback**

In both interactive and non-interactive blocks:

```typescript
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
```

- [ ] **Step 7: Verify TypeScript compiles cleanly**

Run: `pnpm tsc --noEmit`

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/board.tsx
git commit -m "refactor board to use CSS variable fallbacks instead of theme prop"
```

---

### Task 3: Update tests

**Files:**

- Modify: `src/__tests__/board.spec.tsx`

Two existing tests reference the `theme` prop and check CSS variable values on
the root element. These need to be rewritten for the new approach (no `theme`
prop, no variables on root, fallbacks at point of consumption).

- [ ] **Step 1: Rewrite the custom theme test**

Replace the test "applies custom theme colors as CSS custom properties" (lines
83-90). The new test verifies that a consumer can set CSS variables on a parent
and they take effect. Since jsdom doesn't resolve `var()` in computed styles, we
instead verify the inline style uses the correct `var()` expression:

```typescript
it('uses CSS custom properties for square colors', () => {
  const { container } = render(<Board />);
  const darkSquare = container.querySelector('[data-square="a1"]') as HTMLElement;
  const lightSquare = container.querySelector('[data-square="a2"]') as HTMLElement;
  expect(darkSquare.style.background).toBe('var(--board-dark-square, #779952)');
  expect(lightSquare.style.background).toBe('var(--board-light-square, #edeed1)');
});
```

- [ ] **Step 2: Rewrite the default theme test**

Replace the test "applies default theme when no theme prop" (lines 92-97).
Verify that the root element no longer sets `--board-*` variables:

```typescript
it('does not set theme CSS variables on root element', () => {
  const { container } = render(<Board />);
  const root = container.firstElementChild as HTMLElement;
  expect(root.style.getPropertyValue('--board-dark-square')).toBe('');
  expect(root.style.getPropertyValue('--board-light-square')).toBe('');
});
```

- [ ] **Step 3: Add test for coordinate color variables**

Add a new test that verifies coordinate labels use the per-square-color
variables:

```typescript
it('uses per-square coordinate color CSS variables', () => {
  const { container } = render(<Board />);
  // a1 is dark, rank coord "1" sits on a1
  const a1 = container.querySelector('[data-square="a1"]');
  const rankCoord = a1?.querySelector('[data-coordinate="rank"]') as HTMLElement;
  // a1 is dark → uses --board-coordinate-on-dark
  expect(rankCoord?.style.color).toBe('var(--board-coordinate-on-dark, #edeed1)');

  // a2 is light, rank coord "2" sits on a2
  const a2 = container.querySelector('[data-square="a2"]');
  const rankCoord2 = a2?.querySelector('[data-coordinate="rank"]') as HTMLElement;
  // a2 is light → uses --board-coordinate-on-light
  expect(rankCoord2?.style.color).toBe('var(--board-coordinate-on-light, #779952)');
});
```

- [ ] **Step 4: Run all tests**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/board.spec.tsx
git commit -m "update tests for CSS variable theming"
```

---

### Task 4: Update AGENTS.md documentation

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1: Remove `theme` from the props table and `BoardTheme` section**

Replace the `<Board />` props table — remove the `theme` row:

```markdown
### `<Board />`

| Prop          | Type                           | Default           | Description                                            |
| ------------- | ------------------------------ | ----------------- | ------------------------------------------------------ |
| `animate`     | `boolean`                      | `true`            | Enable CSS transition animation on moves               |
| `coordinates` | `boolean`                      | `true`            | Show rank/file labels                                  |
| `highlight`   | `Square[]`                     | `[]`              | Squares to highlight with a yellow overlay             |
| `interactive` | `boolean`                      | `true`            | Enable drag & drop and click-to-move                   |
| `legalMoves`  | `Map<Square, Square[]>`        | —                 | Legal moves map; restricts interaction                 |
| `onMove`      | `(move: MoveEvent) => boolean` | —                 | Called on every attempted move; return false to reject |
| `orientation` | `'white' \| 'black'`           | `'white'`         | Board orientation                                      |
| `pieces`      | `PieceSet`                     | `DEFAULT_PIECES`  | Custom piece component set                             |
| `position`    | `string \| Map<Square, Piece>` | starting position | FEN string or position map                             |
```

Replace the `BoardTheme` section with a CSS variables section:

```markdown
### CSS Variables

All visual styling is controlled via CSS custom properties. Set them on a parent
element to override defaults.

| Variable                      | Default               | Description                      |
| ----------------------------- | --------------------- | -------------------------------- |
| `--board-border`              | `transparent`         | Board border colour              |
| `--board-dark-square`         | `#779952`             | Dark square colour               |
| `--board-light-square`        | `#edeed1`             | Light square colour              |
| `--board-highlight`           | `rgba(255,255,0,0.4)` | Highlight overlay                |
| `--board-legal-dot`           | `rgba(0,0,0,0.2)`     | Legal move dot colour            |
| `--board-coordinate-on-light` | `#779952`             | Coordinate text on light squares |
| `--board-coordinate-on-dark`  | `#edeed1`             | Coordinate text on dark squares  |
```

- [ ] **Step 2: Run lint to ensure markdown is clean**

Run: `pnpm lint`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "update docs for CSS variable theming"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 2: Run lint and type check**

Run: `pnpm lint:ci`

Expected: no errors.

- [ ] **Step 3: Run build**

Run: `pnpm build`

Expected: clean build, no errors.
