# AGENTS.md — @echecs/react-board

Coding-agent reference for the `react-board` package.

## Overview

`@echecs/react-board` is a React chessboard component with drag & drop, piece
animation, and theming support. It ships a bundled cburnett SVG piece set with
zero runtime dependencies beyond React.

**Architecture:**

- **CSS Grid** — the board is an 8×8 CSS grid; squares are positioned via
  `gridColumn` / `gridRow` based on orientation.
- **Pointer events** — drag & drop and click-to-move use the unified Pointer
  Events API for mouse and touch support.
- **CSS transitions** — piece animation works by injecting a pixel offset
  transform on the new square, then clearing it on the next animation frame so
  the CSS `transition` property animates the movement.
- **Peer dependency** — React ≥18 is a peer dependency, not bundled.

## Package structure

```
src/
  board.tsx              # Board component
  fen.ts                 # FEN string parser
  index.ts               # Barrel exports
  types.ts               # All public types
  utilities.ts           # squareCoords, squareColor, diffPositions, SQUARES
  hooks/
    use-animation.ts     # Piece animation hook
    use-drag.ts          # Pointer-events drag & drop hook
  pieces/
    b-b.tsx … w-r.tsx    # Bundled cburnett SVG pieces (one file per piece)
    index.ts             # DEFAULT_PIECES record
  __stories__/
    board.stories.tsx   # Storybook stories
  __tests__/
    board.spec.tsx
    fen.spec.ts
    use-animation.spec.ts
    utilities.spec.ts
.storybook/
  main.ts                # Storybook config
  preview.ts             # Storybook preview config
```

## Commands

```bash
pnpm build              # bundle TypeScript → dist/ via tsdown
pnpm test               # run all tests once (vitest run)
pnpm test:watch         # watch mode
pnpm test:coverage      # v8 coverage report
pnpm lint               # ESLint --fix + tsc --noEmit
pnpm lint:ci            # strict — zero warnings, no auto-fix
pnpm format             # Prettier --write
pnpm format:ci          # Prettier check
pnpm storybook          # start Storybook dev server on port 6006
pnpm storybook:build    # build static Storybook site
```

## Component API

### `<Board />`

| Prop          | Type                           | Default           | Description                                            |
| ------------- | ------------------------------ | ----------------- | ------------------------------------------------------ |
| `animate`     | `boolean`                      | `true`            | Enable CSS transition animation on moves               |
| `children`    | `React.ReactNode`              | —                 | Content rendered inside the board grid                 |
| `coordinates` | `boolean`                      | `true`            | Show rank/file labels                                  |
| `highlight`   | `Square[]`                     | `[]`              | Squares to highlight with a yellow overlay             |
| `interactive` | `boolean`                      | `true`            | Enable drag & drop and click-to-move                   |
| `legalMoves`  | `Map<Square, Square[]>`        | —                 | Legal moves map; restricts interaction                 |
| `onMove`      | `(move: MoveEvent) => boolean` | —                 | Called on every attempted move; return false to reject |
| `orientation` | `'white' \| 'black'`           | `'white'`         | Board orientation                                      |
| `pieces`      | `PieceSet`                     | `DEFAULT_PIECES`  | Custom piece component set                             |
| `position`    | `string \| Map<Square, Piece>` | starting position | FEN string or position map                             |
| `turn`        | `'white' \| 'black'`           | —                 | Restrict interaction to one colour                     |

### CSS Variables

All visual styling is controlled via CSS custom properties. Set them on a parent
element to override defaults.

| Variable                       | Default               | Description                      |
| ------------------------------ | --------------------- | -------------------------------- |
| `--board-dark-square`          | `#779952`             | Dark square colour               |
| `--board-light-square`         | `#edeed1`             | Light square colour              |
| `--board-highlight`            | `rgba(255,255,0,0.4)` | Highlight overlay                |
| `--board-legal-dot`            | `rgba(0,0,0,0.2)`     | Legal move dot colour            |
| `--board-coordinate-on-light`  | `#779952`             | Coordinate text on light squares |
| `--board-coordinate-on-dark`   | `#edeed1`             | Coordinate text on dark squares  |
| `--board-coordinate-weight`    | `600`                 | Coordinate font weight           |
| `--board-promotion-background` | `rgba(0,0,0,0.6)`     | Promotion dialog background      |

### `<PromotionDialog />`

| Prop         | Type                                        | Default          | Description                         |
| ------------ | ------------------------------------------- | ---------------- | ----------------------------------- |
| `color`      | `'white' \| 'black'`                        | —                | Which colour is promoting           |
| `onCancel`   | `() => void`                                | —                | Called when dialog is dismissed     |
| `onSelect`   | `(piece: 'q' \| 'r' \| 'b' \| 'n') => void` | —                | Called when a piece is clicked      |
| `pieces`     | `PieceSet`                                  | `DEFAULT_PIECES` | Piece component set (same as board) |
| `squareSize` | `number`                                    | —                | Square size in pixels               |

### `MoveEvent`

```typescript
interface MoveEvent {
  from: Square;
  promotion?: string;
  to: Square;
}
```

## Conventions

See the monorepo root `AGENTS.md` for TypeScript, ESLint, formatting, and
testing conventions that apply here.

### Piece file naming

Piece files follow `<colour>-<type>.tsx` (e.g. `b-b.tsx` = black bishop,
`w-k.tsx` = white king). The piece key in `PieceSet` / `DEFAULT_PIECES` uses
chess notation (`bB`, `wK`, etc.) as those are the public API identifiers.
