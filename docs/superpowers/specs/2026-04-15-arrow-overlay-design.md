# Arrow Overlay (SVG)

Render arrows on the board via an SVG overlay. Arrows point from the center of
one square to the center of another. Styling is controlled through CSS custom
properties and semantic arrow kinds.

Closes #1.

## Problem

There is no way to display arrows on the board -- needed for engine lines, study
annotations, and analysis visualization. The `arrows` prop and `Arrow` type
already exist in the codebase but have no rendering implementation.

## Design

### Arrow type

Replace the current `brush` field with `kind`, a semantic category that maps to
a CSS custom property for its color:

```ts
type ArrowKind = 'move' | 'capture' | 'danger' | 'alternative';

interface Arrow {
  from: Square;
  kind: ArrowKind;
  to: Square;
}
```

### CSS custom properties

Each kind has a default color. Opacity is shared across all arrows:

| Variable                    | Default            | Description      |
| --------------------------- | ------------------ | ---------------- |
| `--board-arrow-move`        | `#15781B` (green)  | Best / main move |
| `--board-arrow-capture`     | `#c33` (red)       | Attacking move   |
| `--board-arrow-danger`      | `#e89a00` (orange) | Threat           |
| `--board-arrow-alternative` | `#003fa4` (blue)   | Secondary line   |
| `--board-arrow-opacity`     | `0.8`              | Shared opacity   |

Consumers override colors and opacity via CSS, same pattern as
`--board-dark-square` and `--board-light-square`.

### SVG rendering

Each arrow is a single `<path>` element — a continuous filled shape with a
narrow shaft that widens into a triangular arrowhead. No `<line>` + `<marker>`
(avoids the visible seam at the junction). This matches the chess.com approach.

The arrow path is computed from seven points:

```
start-left ── shaft-left ── head-left
                                      ╲
                                        tip
                                      ╱
start-right ─ shaft-right ─ head-right
```

Given `from` and `to` square centers in SVG coordinates, a `shaftWidth` and
`headWidth`, and a `headLength`:

1. Compute the unit vector along the arrow direction and its perpendicular.
2. The shaft runs from `from` to `from + direction * (length - headLength)`.
3. The head base flares out to `headWidth` and the tip is at `to`.
4. Emit a `<path d="M... L... Z">` with `fill` set to the resolved CSS variable.

### Arrow dimensions

Expressed relative to the square size (so they scale with the board):

| Dimension   | Value               |
| ----------- | ------------------- |
| Shaft width | `0.2 * squareSize`  |
| Head width  | `0.55 * squareSize` |
| Head length | `0.35 * squareSize` |

These proportions produce a clean arrow similar to chess.com's. The destination
endpoint is pulled back by `headLength` so the arrowhead tip lands at the target
square center.

### Component structure

A new `ArrowOverlay` component renders the SVG. It receives `arrows`,
`squareSize`, and `orientation` as props. It is a pure rendering component with
no internal state.

```
ArrowOverlay({ arrows, squareSize, orientation })
  └─ <svg data-arrows viewBox="0 0 {boardSize} {boardSize}"
          style="position: absolute; inset: 0; pointer-events: none;">
       <path d="..." style="fill: var(--board-arrow-move, #15781B);
                            opacity: var(--board-arrow-opacity, 0.8);" />
       <path d="..." style="fill: var(--board-arrow-capture, #c33);
                            opacity: var(--board-arrow-opacity, 0.8);" />
     </svg>
```

CSS custom properties on SVG elements must be applied via the `style` attribute
(not via SVG presentation attributes like `fill="..."`) so that `var()` resolves
correctly. Each `<path>` includes the fallback default inline.

### Placement in the DOM

The SVG is absolutely positioned on the root container, between the grid and the
ghost piece in z-order:

```
<div ref={containerReference}>          <!-- root, position: relative -->
  <div style={gridStyle}>              <!-- 8×8 CSS grid -->
    <div data-square>...</div>          <!-- ×64 -->
    {children}                          <!-- PromotionDialog, etc. -->
  </div>
  <ArrowOverlay ... />                  <!-- NEW -->
  <div data-ghost />                    <!-- drag ghost, z-index: 9999 -->
</div>
```

### Coordinate mapping

Square centers are computed using the existing
`squareCoords(square, orientation)` utility, which returns 1-based grid
positions. In pixel space:

```
centerX = (col - 0.5) * squareSize
centerY = (row - 0.5) * squareSize
```

The SVG `viewBox` is `0 0 {8 * squareSize} {8 * squareSize}` so pixel
coordinates map 1:1.

### Deduplication

If the `arrows` array contains duplicate entries (same `from`, `to`, `kind`),
only the first occurrence is rendered.

## Scope

This issue covers **declarative rendering only**. The parent passes `arrows`,
the board renders them.

**Not in scope** (deferred to #3 — right-click annotations):

- User-drawn arrows via right-click drag
- `onDrawChange` callback
- Modifier key → kind mapping
- Circle annotations (right-click on same square)

## File changes

| File                                | Action | Description                                                          |
| ----------------------------------- | ------ | -------------------------------------------------------------------- |
| `src/types.ts`                      | Update | Replace `brush: string` with `kind: ArrowKind`, add `ArrowKind` type |
| `src/arrow-overlay.tsx`             | Create | New component: SVG arrow rendering                                   |
| `src/board.tsx`                     | Update | Render `<ArrowOverlay>` between grid and ghost                       |
| `src/index.ts`                      | Update | Export `ArrowKind` type                                              |
| `src/__tests__/arrows.test.tsx`     | Create | Tests for arrow rendering                                            |
| `src/__stories__/board.stories.tsx` | Update | Add arrow stories                                                    |

## Breaking changes

- `Arrow.brush` removed, replaced by `Arrow.kind: ArrowKind`.
- Consumers using the `Arrow` type must update from `{ brush, from, to }` to
  `{ kind, from, to }`.
