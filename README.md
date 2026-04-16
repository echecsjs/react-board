# @echecs/react-board

React chessboard component with drag & drop, animation, and theming. Bundled
cburnett piece set, zero external dependencies beyond React.

[Live demo](https://react-board.echecs.dev)

## Installation

```bash
npm install @echecs/react-board
# or
pnpm add @echecs/react-board
```

React ≥18 is a peer dependency.

## Quick start

### Minimal

```tsx
import { Board } from '@echecs/react-board';

export function App() {
  return <Board />;
}
```

### Full featured

```tsx
import { useState } from 'react';
import { Board } from '@echecs/react-board';
import type { MoveEvent } from '@echecs/react-board';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function ChessGame() {
  const [position, setPosition] = useState(STARTING_FEN);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  function handleMove(event: MoveEvent): boolean {
    // validate and apply move, then update position
    // return false to reject the move
    return true;
  }

  return (
    <div style={{ width: 480 }}>
      <Board
        animate
        coordinates
        orientation={orientation}
        position={position}
        onMove={handleMove}
      />
      <button
        onClick={() =>
          setOrientation((o) => (o === 'white' ? 'black' : 'white'))
        }
      >
        Flip board
      </button>
    </div>
  );
}
```

## Props

| Prop            | Type                           | Default           | Description                                            |
| --------------- | ------------------------------ | ----------------- | ------------------------------------------------------ |
| `animate`       | `boolean`                      | `true`            | Enable CSS transition animation on piece moves         |
| `arrows`        | `Arrow[]`                      | —                 | Arrows to render on the board                          |
| `children`      | `React.ReactNode`              | —                 | Content rendered inside the board grid                 |
| `coordinates`   | `boolean`                      | `true`            | Show rank/file coordinate labels                       |
| `highlight`     | `Square[]`                     | `[]`              | Squares to highlight with an overlay                   |
| `interactive`   | `boolean`                      | `true`            | Enable drag & drop and click-to-move                   |
| `legalMoves`    | `Map<Square, Square[]>`        | —                 | Legal move map — restricts user interaction            |
| `onMove`        | `(move: MoveEvent) => boolean` | —                 | Called on every attempted move; return false to reject |
| `onSquareClick` | `(square: Square) => void`     | —                 | Called when a square is clicked                        |
| `orientation`   | `'white' \| 'black'`           | `'white'`         | Which side is at the bottom                            |
| `pieces`        | `PieceSet`                     | `DEFAULT_PIECES`  | Custom piece component record                          |
| `position`      | `string \| Map<Square, Piece>` | starting position | FEN string or position map                             |
| `turn`          | `'white' \| 'black'`           | —                 | Restrict interaction to one colour's pieces            |

## Theming

All visual styling is controlled via CSS custom properties. Set them on a parent
element or directly on the board container to override defaults.

```css
.my-board {
  --board-dark-square: #b58863;
  --board-light-square: #f0d9b5;
  --board-highlight: rgba(20, 85, 30, 0.5);
  --board-legal-dot: rgba(0, 0, 0, 0.3);
}
```

| Variable                       | Default                                  | Description                      |
| ------------------------------ | ---------------------------------------- | -------------------------------- |
| `--board-dark-square`          | `#779952`                                | Dark square colour               |
| `--board-light-square`         | `#edeed1`                                | Light square colour              |
| `--board-highlight`            | `rgba(255, 255, 0, 0.4)`                 | Highlight overlay colour         |
| `--board-legal-dot`            | `rgba(0, 0, 0, 0.2)`                     | Legal move dot colour            |
| `--board-coordinate-on-light`  | `#779952`                                | Coordinate text on light squares |
| `--board-coordinate-on-dark`   | `#edeed1`                                | Coordinate text on dark squares  |
| `--board-coordinate-weight`    | `600`                                    | Coordinate font weight           |
| `--board-promotion-background` | `rgba(0, 0, 0, 0.6)`                     | Promotion dialog background      |
| `--board-drag-shadow`          | `drop-shadow(0 4px 8px rgba(0,0,0,0.4))` | Drag ghost filter                |
| `--board-piece-transition`     | `transform 200ms ease`                   | Piece move animation transition  |

## Custom pieces

Supply a `PieceSet` record mapping piece keys to image URLs (any format the
browser can render as a CSS `background-image` — data URIs, SVG files, PNGs):

```tsx
import { DEFAULT_PIECES } from '@echecs/react-board';
import type { PieceSet } from '@echecs/react-board';

const myPieces: PieceSet = {
  ...DEFAULT_PIECES,
  wP: '/assets/pieces/white-pawn.svg',
};

<Board pieces={myPieces} />;
```

Piece key format: `'b' | 'w'` + `'B' | 'K' | 'N' | 'P' | 'Q' | 'R'` (e.g. `'wK'`
= white king, `'bP'` = black pawn).

## Sound assets

Bundled move sounds (Lichess standard set, MIT licensed). Import via subpath:

```ts
import moveSound from '@echecs/react-board/sounds/move.mp3';
import captureSound from '@echecs/react-board/sounds/capture.mp3';
import castleSound from '@echecs/react-board/sounds/castle.mp3';
import checkSound from '@echecs/react-board/sounds/check.mp3';
import gameEndSound from '@echecs/react-board/sounds/game-end.mp3';
```

| Subpath export                            | Description         |
| ----------------------------------------- | ------------------- |
| `@echecs/react-board/sounds/move.mp3`     | Standard piece move |
| `@echecs/react-board/sounds/capture.mp3`  | Piece capture       |
| `@echecs/react-board/sounds/castle.mp3`   | Castling move       |
| `@echecs/react-board/sounds/check.mp3`    | Check               |
| `@echecs/react-board/sounds/game-end.mp3` | Game over           |

## Promotion dialog

`PromotionDialog` is exported separately for cases where you manage promotion
state yourself:

```tsx
import { PromotionDialog } from '@echecs/react-board';

<PromotionDialog
  color="white"
  squareSize={60}
  onSelect={(piece) => console.log(piece)} // 'q' | 'r' | 'b' | 'n'
  onCancel={() => console.log('cancelled')}
/>;
```

### `PromotionDialog` props

| Prop         | Type                              | Default          | Description                     |
| ------------ | --------------------------------- | ---------------- | ------------------------------- |
| `color`      | `'white' \| 'black'`              | —                | Which colour is promoting       |
| `onCancel`   | `() => void`                      | —                | Optional. Called when dismissed |
| `onSelect`   | `(piece: PromotionPiece) => void` | —                | Called when a piece is clicked  |
| `pieces`     | `PieceSet`                        | `DEFAULT_PIECES` | Piece component set             |
| `squareSize` | `number`                          | —                | Square size in pixels           |

## API reference

### `squareCoords(square, orientation)`

Returns `{ col, row }` — 1-based CSS grid coordinates for `square` given the
board `orientation`.

```ts
import { squareCoords } from '@echecs/react-board';

squareCoords('e4', 'white'); // { col: 5, row: 5 }
squareCoords('e4', 'black'); // { col: 4, row: 4 }
```

### Exported types

| Type                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `Annotations`          | `{ arrows: Arrow[]; circles: Circle[] }` — drawable annotation state   |
| `Arrow`                | `{ from: Square; to: Square; kind: ArrowKind }` — arrow descriptor     |
| `ArrowKind`            | `'alternative' \| 'capture' \| 'danger' \| 'move'` — annotation colour |
| `BoardProps`           | All props accepted by `<Board />`                                      |
| `Circle`               | `{ square: Square; kind: ArrowKind }` — circle annotation descriptor   |
| `MoveEvent`            | `{ from, to, capture, promotion? }` — passed to `onMove`               |
| `PieceKey`             | Union of all 12 piece keys (`'wK'`, `'bP'`, …)                         |
| `PieceSet`             | `Record<PieceKey, string>` — maps piece keys to image URLs             |
| `PromotionDialogProps` | All props accepted by `<PromotionDialog />`                            |
| `PromotionPiece`       | `'q' \| 'r' \| 'b' \| 'n'` — promotable piece                          |
| `SquareCoords`         | `{ col: number; row: number }` — return type of `squareCoords`         |

## License

MIT
