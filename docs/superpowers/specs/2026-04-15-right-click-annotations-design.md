# Right-Click Annotations

User-drawn arrows and circle highlights via right-click interactions. Builds on
the arrow overlay from #1.

Closes #3.

## Problem

The board can render declarative arrows but has no way for users to draw their
own annotations. Chess UIs need right-click drag for arrows and right-click for
circle highlights — used in analysis, studies, and teaching.

## Design

### New types

```ts
interface Circle {
  kind: ArrowKind;
  square: Square;
}

interface Annotations {
  arrows: Arrow[];
  circles: Circle[];
}
```

`Circle` reuses the existing `ArrowKind` type for kind/color mapping — same CSS
variables, same modifier key mapping.

### Props changes

```ts
interface BoardProperties {
  // ... existing props ...

  // NEW
  drawable?: boolean; // enables right-click annotations (default: false)
  movable?: boolean; // controls piece drag/click-to-move (default: false)
  onAnnotationChange?: (annotations: Annotations) => void;

  // DEPRECATED
  interactive?: boolean; // deprecated, use movable instead
}
```

**Resolution logic for `movable` / `interactive`:**

1. If `movable` is passed → use it
2. Else if `interactive` is passed → use it (+ `console.warn` in dev mode)
3. Else → `false`

This is a breaking change: consumers relying on the implicit
`interactive={true}` default will get non-movable boards. They must add
`movable` or `interactive` explicitly.

### Interaction model

A new `useDrawing` hook handles right-click events on the board:

**Drawing arrows:**

- Right-click + drag to another square → add arrow
- If the same arrow (same `from`, `to`, `kind`) exists → remove it
- If the same endpoints exist with a different kind → replace the kind

**Drawing circles:**

- Right-click + release on the same square → add circle
- If the same circle (same `square`, `kind`) exists → remove it
- If the same square exists with a different kind → replace the kind

**Modifier keys → kind:**

| Modifier   | Kind          | Default color |
| ---------- | ------------- | ------------- |
| (none)     | `move`        | green         |
| ctrl       | `capture`     | red           |
| alt        | `danger`      | blue          |
| ctrl + alt | `alternative` | yellow        |

**Clearing:** Any left-click or piece move clears all user-drawn annotations.

**Context menu:** `contextmenu` event is `preventDefault()`-ed when `drawable`
is true.

### Hook interface

```ts
interface UseDrawingOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
  drawable: boolean;
  onAnnotationChange?: (annotations: Annotations) => void;
  orientation: 'black' | 'white';
  squareSize: number;
}

interface UseDrawingResult {
  annotations: Annotations; // user-drawn annotations (internal state)
  clearAnnotations: () => void; // called by Board on left-click / move
  handlers: {
    onContextMenu: (event: React.MouseEvent) => void;
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
  };
}
```

The hook returns pointer handlers that are merged with the existing `useDrag`
handlers on the board container. Right-click events (`event.button === 2`) go to
`useDrawing`, left-click events go to `useDrag`. The `onPointerDown` handler in
`useDrawing` only acts on `button === 2`.

`clearAnnotations` is called by Board when a piece move occurs or when a
left-click happens.

### Rendering

Rename `ArrowOverlay` to `AnnotationOverlay`. The component now renders both
arrows and circles:

```
AnnotationOverlay({ arrows, circles, orientation, squareSize })
  └─ <svg data-annotations ...>
       <circle ... />   <!-- circle annotations -->
       <path ... />     <!-- arrow annotations -->
     </svg>
```

**Circle rendering:** An SVG `<circle>` element centered on the square with:

- `cx`, `cy` at the square center (same coordinate mapping as arrows)
- `r` = `squareSize * 0.4` (slightly smaller than the square)
- `stroke` from CSS variable (`var(--board-arrow-{kind}, fallback)`)
- `stroke-width` = `squareSize * 0.05`
- `fill: none`
- `opacity` from `var(--board-arrow-opacity, 0.8)`

Circles render before arrows in the SVG so arrows appear on top.

**Merging declarative and user-drawn:** The `arrows` prop (from parent) and
user-drawn arrows are concatenated for rendering. Declarative arrows render
first (below), user-drawn on top. The `onAnnotationChange` callback only reports
user-drawn annotations.

A declarative `circles` prop is not part of this issue — circles are user-drawn
only for now. A future issue could add `circles?: Circle[]` to `BoardProps` if
needed.

### Data attribute rename

The SVG element's data attribute changes from `data-arrows` to
`data-annotations` to reflect the broader scope.

### useDrag changes

The `useDrag` hook needs two changes:

1. Filter `onPointerDown` to only act on `button === 0` (left click). Currently
   it doesn't check the button, so right-clicks trigger drag logic.
2. Accept a `clearAnnotations` callback to call when a move succeeds or a
   left-click happens.

## File changes

| File                                        | Action | Description                                                                                                                  |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/types.ts`                              | Update | Add `Circle`, `Annotations` types. Add `movable`, `drawable`, `onAnnotationChange` to `BoardProps`. Deprecate `interactive`. |
| `src/arrow-overlay.tsx`                     | Rename | → `src/annotation-overlay.tsx`. Add circle rendering.                                                                        |
| `src/hooks/use-drawing.ts`                  | Create | Right-click annotation hook                                                                                                  |
| `src/hooks/use-drag.ts`                     | Update | Filter to left-click only, accept `clearAnnotations` callback                                                                |
| `src/board.tsx`                             | Update | Wire `useDrawing`, merge handlers, resolve `movable`/`interactive`, pass `clearAnnotations`                                  |
| `src/index.ts`                              | Update | Export `Circle`, `Annotations` types. Update component import.                                                               |
| `src/__tests__/annotation-overlay.spec.tsx` | Rename | From `arrow-overlay.spec.tsx`. Add circle tests.                                                                             |
| `src/__tests__/use-drawing.spec.ts`         | Create | Tests for drawing hook                                                                                                       |
| `src/__stories__/board.stories.tsx`         | Update | Add drawable stories, update existing arrow stories                                                                          |

## Breaking changes

- `interactive` deprecated — still works but emits console warning. Use
  `movable`.
- Default behavior change: boards without `movable` or `interactive` are now
  non-movable (previously defaulted to `interactive={true}`).
- `ArrowOverlay` renamed to `AnnotationOverlay` (internal, not exported).
- `data-arrows` attribute renamed to `data-annotations` on the SVG element.
