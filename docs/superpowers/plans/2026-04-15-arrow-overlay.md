# Arrow Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render SVG arrows on the board via a declarative `arrows` prop, with
semantic arrow kinds styled through CSS custom properties.

**Architecture:** A new `ArrowOverlay` component renders an
absolutely-positioned `<svg>` over the board grid. Each arrow is a single
`<path>` (shaft + arrowhead). Arrow colors are resolved from CSS variables based
on the arrow's `kind` field. The existing `squareCoords` utility maps square
names to pixel centers.

**Tech Stack:** React, SVG, TypeScript, Vitest, Storybook

---

## File Structure

| File                                   | Action | Responsibility                                                |
| -------------------------------------- | ------ | ------------------------------------------------------------- |
| `src/types.ts`                         | Modify | Add `ArrowKind` type, change `Arrow.brush` to `Arrow.kind`    |
| `src/arrow-overlay.tsx`                | Create | SVG arrow rendering component + `arrowPath` geometry function |
| `src/board.tsx`                        | Modify | Wire `ArrowOverlay` into the render tree                      |
| `src/index.ts`                         | Modify | Export `ArrowKind` type                                       |
| `src/__tests__/arrow-overlay.spec.tsx` | Create | Tests for arrow path geometry + component rendering           |
| `src/__stories__/board.stories.tsx`    | Modify | Add arrow demo stories                                        |

---

### Task 1: Update the Arrow type

**Files:**

- Modify: `src/types.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Update `src/types.ts`**

Replace the `Arrow` interface and add the `ArrowKind` type:

```ts
// In src/types.ts — replace the existing Arrow interface and add ArrowKind

type ArrowKind = 'alternative' | 'capture' | 'danger' | 'move';

interface Arrow {
  from: Square;
  kind: ArrowKind;
  to: Square;
}
```

The `brush: string` field is removed. `ArrowKind` is a union of four semantic
categories. Properties are alphabetically sorted to match existing code style.

- [ ] **Step 2: Export `ArrowKind` from `src/index.ts`**

Add `ArrowKind` to the type exports:

```ts
export type {
  Arrow,
  ArrowKind,
  BoardProps,
  MoveEvent,
  PieceKey,
  PieceSet,
} from './types.js';
```

- [ ] **Step 3: Run type check**

Run: `pnpm lint` Expected: passes with no errors (no code references
`Arrow.brush` yet since rendering was never implemented).

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/index.ts
git commit -m "feat: replace Arrow.brush with Arrow.kind semantic type"
```

---

### Task 2: Arrow path geometry function + tests

**Files:**

- Create: `src/arrow-overlay.tsx` (geometry function only, no component yet)
- Create: `src/__tests__/arrow-overlay.spec.tsx`

- [ ] **Step 1: Write failing tests for `arrowPath`**

Create `src/__tests__/arrow-overlay.spec.tsx`:

```tsx
import { describe, expect, it } from 'vitest';

import { arrowPath } from '../arrow-overlay.js';

describe('arrowPath', () => {
  const SHAFT_WIDTH = 12;
  const HEAD_WIDTH = 33;
  const HEAD_LENGTH = 21;

  it('returns a closed SVG path string', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    expect(d).toMatch(/^M[\d., -]+Z$/);
  });

  it('vertical arrow: tip is at the destination point', () => {
    // Arrow pointing up: from (50, 350) to (50, 50)
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    // The tip point (4th of 7 points) should be at (50, 50)
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    // 4th point (index 3) is the tip
    expect(points[3]![0]).toBeCloseTo(50, 1);
    expect(points[3]![1]).toBeCloseTo(50, 1);
  });

  it('vertical arrow: shaft width is correct', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    // Points 0 and 6 are the start-left and start-right
    const startLeft = points[0]!;
    const startRight = points[6]!;
    const width = Math.abs(startLeft[0]! - startRight[0]!);
    expect(width).toBeCloseTo(SHAFT_WIDTH, 1);
  });

  it('vertical arrow: head width is correct', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    // Points 2 and 4 are head-left and head-right
    const headLeft = points[2]!;
    const headRight = points[4]!;
    const width = Math.abs(headLeft[0]! - headRight[0]!);
    expect(width).toBeCloseTo(HEAD_WIDTH, 1);
  });

  it('horizontal arrow: tip is at the destination point', () => {
    // Arrow pointing right: from (50, 200) to (350, 200)
    const d = arrowPath(
      50,
      200,
      350,
      200,
      SHAFT_WIDTH,
      HEAD_WIDTH,
      HEAD_LENGTH,
    );
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    expect(points[3]![0]).toBeCloseTo(350, 1);
    expect(points[3]![1]).toBeCloseTo(200, 1);
  });

  it('diagonal arrow: tip is at the destination point', () => {
    // Arrow pointing diagonally: from (50, 350) to (350, 50)
    const d = arrowPath(50, 350, 350, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    expect(points[3]![0]).toBeCloseTo(350, 1);
    expect(points[3]![1]).toBeCloseTo(50, 1);
  });

  it('produces 7 points', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d.replace(/^M/, '').replace(/Z$/, '').split('L');
    expect(points).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test` Expected: FAIL — `arrowPath` is not exported from
`../arrow-overlay.js`.

- [ ] **Step 3: Implement `arrowPath`**

Create `src/arrow-overlay.tsx`:

```tsx
/**
 * Computes an SVG path `d` attribute for an arrow shape.
 *
 * The arrow is a single closed polygon: narrow shaft widening into a
 * triangular arrowhead. Seven points define the shape:
 *
 *   start-left ── shaft-left ── head-left
 *                                          ╲
 *                                            tip
 *                                          ╱
 *   start-right ─ shaft-right ─ head-right
 */
export function arrowPath(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  shaftWidth: number,
  headWidth: number,
  headLength: number,
): string {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return '';

  // Unit vector along arrow direction
  const ux = dx / len;
  const uy = dy / len;

  // Perpendicular vector
  const px = -uy;
  const py = ux;

  const shaftEnd = len - headLength;

  const points: [number, number][] = [
    [fx + (px * shaftWidth) / 2, fy + (py * shaftWidth) / 2], // start left
    [
      fx + ux * shaftEnd + (px * shaftWidth) / 2,
      fy + uy * shaftEnd + (py * shaftWidth) / 2,
    ], // shaft end left
    [
      fx + ux * shaftEnd + (px * headWidth) / 2,
      fy + uy * shaftEnd + (py * headWidth) / 2,
    ], // head base left
    [tx, ty], // tip
    [
      fx + ux * shaftEnd - (px * headWidth) / 2,
      fy + uy * shaftEnd - (py * headWidth) / 2,
    ], // head base right
    [
      fx + ux * shaftEnd - (px * shaftWidth) / 2,
      fy + uy * shaftEnd - (py * shaftWidth) / 2,
    ], // shaft end right
    [fx - (px * shaftWidth) / 2, fy - (py * shaftWidth) / 2], // start right
  ];

  return `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test` Expected: all `arrowPath` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/arrow-overlay.tsx src/__tests__/arrow-overlay.spec.tsx
git commit -m "feat: arrowPath geometry function with tests"
```

---

### Task 3: ArrowOverlay component + tests

**Files:**

- Modify: `src/arrow-overlay.tsx`
- Modify: `src/__tests__/arrow-overlay.spec.tsx`

- [ ] **Step 1: Write failing tests for the ArrowOverlay component**

Append to `src/__tests__/arrow-overlay.spec.tsx`:

```tsx
import { render } from '@testing-library/react';

import ArrowOverlay from '../arrow-overlay.js';

import type { Arrow } from '../types.js';

// ... existing arrowPath tests above ...

describe('ArrowOverlay', () => {
  it('renders nothing when arrows is empty', () => {
    const { container } = render(
      <ArrowOverlay arrows={[]} orientation="white" squareSize={60} />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders an svg with data-arrows attribute', () => {
    const arrows: Arrow[] = [{ from: 'e2', to: 'e4', kind: 'move' }];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const svg = container.querySelector('svg[data-arrows]');
    expect(svg).not.toBeNull();
  });

  it('renders one path per arrow', () => {
    const arrows: Arrow[] = [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'f1', to: 'c4', kind: 'alternative' },
    ];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
  });

  it('deduplicates identical arrows', () => {
    const arrows: Arrow[] = [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'e2', to: 'e4', kind: 'move' },
    ];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(1);
  });

  it('applies the correct CSS variable for each kind', () => {
    const arrows: Arrow[] = [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'd2', to: 'd4', kind: 'capture' },
      { from: 'f1', to: 'c4', kind: 'danger' },
      { from: 'g1', to: 'f3', kind: 'alternative' },
    ];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths[0]!.style.fill).toContain('--board-arrow-move');
    expect(paths[1]!.style.fill).toContain('--board-arrow-capture');
    expect(paths[2]!.style.fill).toContain('--board-arrow-danger');
    expect(paths[3]!.style.fill).toContain('--board-arrow-alternative');
  });

  it('sets pointer-events to none on the svg', () => {
    const arrows: Arrow[] = [{ from: 'e2', to: 'e4', kind: 'move' }];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.style.pointerEvents).toBe('none');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test` Expected: FAIL — `ArrowOverlay` is not exported as default from
`../arrow-overlay.js`.

- [ ] **Step 3: Implement the ArrowOverlay component**

Add the following to `src/arrow-overlay.tsx` after the `arrowPath` function:

```tsx
import type React from 'react';

import { squareCoords } from './utilities.js';

import type { Arrow, ArrowKind } from './types.js';

const CSS_VAR: Record<ArrowKind, string> = {
  alternative: 'var(--board-arrow-alternative, #003fa4)',
  capture: 'var(--board-arrow-capture, #c33)',
  danger: 'var(--board-arrow-danger, #e89a00)',
  move: 'var(--board-arrow-move, #15781B)',
};

interface ArrowOverlayProps {
  arrows: Arrow[];
  orientation: 'black' | 'white';
  squareSize: number;
}

function ArrowOverlay({
  arrows,
  orientation,
  squareSize,
}: ArrowOverlayProps): React.JSX.Element | null {
  if (arrows.length === 0) return null;

  const boardSize = squareSize * 8;
  const shaftWidth = squareSize * 0.2;
  const headWidth = squareSize * 0.55;
  const headLength = squareSize * 0.35;

  // Deduplicate: first occurrence wins
  const seen = new Set<string>();
  const unique: Arrow[] = [];

  for (const arrow of arrows) {
    const key = `${arrow.from}-${arrow.to}-${arrow.kind}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(arrow);
    }
  }

  return (
    <svg
      data-arrows
      style={{
        height: '100%',
        inset: 0,
        pointerEvents: 'none',
        position: 'absolute',
        width: '100%',
      }}
      viewBox={`0 0 ${boardSize} ${boardSize}`}
    >
      {unique.map((arrow) => {
        const from = squareCoords(arrow.from, orientation);
        const to = squareCoords(arrow.to, orientation);
        const fx = (from.col - 0.5) * squareSize;
        const fy = (from.row - 0.5) * squareSize;
        const tx = (to.col - 0.5) * squareSize;
        const ty = (to.row - 0.5) * squareSize;
        const d = arrowPath(fx, fy, tx, ty, shaftWidth, headWidth, headLength);

        if (!d) return null;

        return (
          <path
            d={d}
            key={`${arrow.from}-${arrow.to}-${arrow.kind}`}
            style={{
              fill: CSS_VAR[arrow.kind],
              opacity: 'var(--board-arrow-opacity, 0.8)' as unknown as number,
            }}
          />
        );
      })}
    </svg>
  );
}

export default ArrowOverlay;
```

The full file will have the imports at the top, then `arrowPath` (exported for
testing), then `CSS_VAR`, then the component as the default export.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test` Expected: all arrow-overlay tests PASS.

- [ ] **Step 5: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add src/arrow-overlay.tsx src/__tests__/arrow-overlay.spec.tsx
git commit -m "feat: ArrowOverlay component with tests"
```

---

### Task 4: Wire ArrowOverlay into Board

**Files:**

- Modify: `src/board.tsx`

- [ ] **Step 1: Import ArrowOverlay in `src/board.tsx`**

Add the import at the top of `src/board.tsx`:

```ts
import ArrowOverlay from './arrow-overlay.js';
```

- [ ] **Step 2: Destructure `arrows` from props**

In the Board function signature, add `arrows` to the destructured props. It
already exists in `BoardProps` from step 1. Add a default of `[]`:

```ts
function Board({
  animate = true,
  arrows = [],
  children,
  // ... rest unchanged
}: BoardProperties): React.JSX.Element {
```

- [ ] **Step 3: Render ArrowOverlay between the grid and ghost**

In the JSX return, insert `<ArrowOverlay>` after the closing `</div>` of the
grid (both the interactive and non-interactive branches) and before the ghost
piece div:

```tsx
      {/* ... grid closing </div> ... */}
      <ArrowOverlay
        arrows={arrows}
        orientation={orientation}
        squareSize={squareSize}
      />
      {ghostStyle && <div data-ghost style={ghostStyle} />}
    </div>
```

- [ ] **Step 4: Run all tests**

Run: `pnpm test` Expected: all tests PASS (existing + new).

- [ ] **Step 5: Run lint**

Run: `pnpm lint` Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add src/board.tsx
git commit -m "feat: wire ArrowOverlay into Board component"
```

---

### Task 5: Storybook stories

**Files:**

- Modify: `src/__stories__/board.stories.tsx`

- [ ] **Step 1: Add an Arrows story**

Add the following stories after the existing `WithHighlights` story in
`src/__stories__/board.stories.tsx`:

```tsx
import type { Arrow } from '../types.js';

// -- With arrows ---

export const WithArrows: Story = {
  args: {
    arrows: [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'f1', to: 'c4', kind: 'alternative' },
      { from: 'd7', to: 'd5', kind: 'danger' },
      { from: 'b8', to: 'c6', kind: 'capture' },
    ] as Arrow[],
  },
};
```

- [ ] **Step 2: Add a themed arrows story**

Add a story that shows arrows with custom CSS variable overrides, after the
`DarkTheme` story:

```tsx
// -- Custom arrow colors via CSS variables ---

export const CustomArrowColors: Story = {
  args: {
    arrows: [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'f1', to: 'c4', kind: 'alternative' },
    ] as Arrow[],
  },
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--board-arrow-alternative': '#9b59b6',
            '--board-arrow-move': '#e67e22',
            '--board-arrow-opacity': '0.6',
            'width': 400,
          } as React.CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};
```

- [ ] **Step 3: Verify Storybook builds**

Run: `pnpm storybook:build` Expected: builds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/__stories__/board.stories.tsx
git commit -m "feat: add arrow storybook stories"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test` Expected: all tests PASS.

- [ ] **Step 2: Run lint**

Run: `pnpm lint` Expected: passes with no errors or warnings.

- [ ] **Step 3: Run build**

Run: `pnpm build` Expected: builds successfully. `ArrowOverlay`, `ArrowKind`,
and updated `Arrow` type are included in the output.

- [ ] **Step 4: Run format**

Run: `pnpm format` Expected: all files formatted.
