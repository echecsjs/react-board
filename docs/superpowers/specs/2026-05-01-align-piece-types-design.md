# align piece types with @echecs/position

**issue:** [#57](https://github.com/echecsjs/react-board/issues/57)
**breaking:** yes — major version bump required

## background

react-board used to import `Piece` and `Square` from `@echecs/position@^1.0.0`,
which had abbreviated types (`'b'|'w'`, `'b'|'k'|'n'|...`). PR #39 inlined those
types locally and dropped the dependency entirely.

`@echecs/position` has since moved to v3 with full-word types
(`'black'|'white'`, `'bishop'|'king'|'knight'|...`). this means consumers using
both packages must manually convert between the two type systems — the stories
already have `COLOR_MAP` / `TYPE_MAP` helpers doing exactly this.

## changes

### types — import from `@echecs/position`

replace locally defined types with imports from `@echecs/position`:

| type        | current (local)                          | new (from position)                                             |
| ----------- | ---------------------------------------- | --------------------------------------------------------------- |
| `Color`     | `'b' \| 'w'`                             | `'black' \| 'white'`                                            |
| `PieceType` | `'b' \| 'k' \| 'n' \| 'p' \| 'q' \| 'r'` | `'bishop' \| 'king' \| 'knight' \| 'pawn' \| 'queen' \| 'rook'` |
| `Piece`     | `{ color: Color; type: PieceType }`      | same shape, different literal values                            |
| `File`      | `'a' \| 'b' \| ... \| 'h'`               | identical — import for consistency                              |
| `Rank`      | `'1' \| '2' \| ... \| '8'`               | identical — import for consistency                              |
| `Square`    | `` `${File}${Rank}` ``                   | identical — import for consistency                              |

re-export `Color`, `File`, `PieceType`, `Piece`, `Rank`, `Square` from the
package entry point so consumers don't need to install `@echecs/position` just
to type a `Piece`.

### `PromotionPiece` — align with `PieceType`

current: `'b' | 'n' | 'q' | 'r'` new: `'bishop' | 'knight' | 'queen' | 'rook'`

this is an exported type used in the `PromotionDialog` `onSelect` callback.

### `MoveEvent.promotion` — type narrowly

current: `promotion?: string` new: `promotion?: PromotionPiece`

since `PromotionPiece` now uses full-word values, the promotion field becomes
properly typed instead of an opaque string.

### `PieceKey` and `PieceSet` — unchanged

`PieceKey` stays as `'bB' | 'wK' | ...` — this is a rendering/theming concern
(sprite-sheet lookup), not a domain concern. decoupling it from the domain types
keeps the breaking surface smaller and the keys compact.

internal code that converts `Piece` → `PieceKey` needs a small mapping:

```typescript
const COLOR_PREFIX: Record<Color, 'b' | 'w'> = { black: 'b', white: 'w' };
const TYPE_SUFFIX: Record<PieceType, string> = {
  bishop: 'B',
  king: 'K',
  knight: 'N',
  pawn: 'P',
  queen: 'Q',
  rook: 'R',
};

function pieceKey(piece: Piece): PieceKey {
  return `${COLOR_PREFIX[piece.color]}${TYPE_SUFFIX[piece.type]}` as PieceKey;
}
```

### FEN parsing — update `PIECE_MAP` values

`fen.ts` maps FEN characters to `Piece` objects. the values change:

```typescript
const PIECE_MAP: Record<string, Piece> = {
  B: { color: 'white', type: 'bishop' },
  K: { color: 'white', type: 'king' },
  // ... etc
  b: { color: 'black', type: 'bishop' },
  k: { color: 'black', type: 'king' },
  // ... etc
};
```

### dependency — add `@echecs/position` as peer dep

```json
{
  "peerDependencies": {
    "@echecs/position": ">=3",
    "react": ">=18"
  }
}
```

type-only usage — no runtime import. consumers using only FEN strings don't
interact with position's types at runtime, but typescript needs the package
installed to resolve the type imports.

keep `@echecs/position` in `devDependencies` as well for local development.

### stories cleanup

remove `COLOR_MAP`, `TYPE_MAP`, and `PROMOTION_MAP` from `board.stories.tsx`.
the `toPosition()` helper becomes a direct passthrough since
`game.position().pieces()` already returns `Map<Square, Piece>` with the right
types. `PROMOTION_MAP` goes away because `PromotionPiece` values now match what
`@echecs/game` expects.

### `orientation` and `turn` props

already use `'black' | 'white'` — no change needed.

## files affected

| file                                      | change                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `src/types.ts`                            | import types from position, update `PromotionPiece`, type `MoveEvent.promotion` |
| `src/index.ts`                            | re-export `Color`, `File`, `Piece`, `PieceType`, `Rank`, `Square`               |
| `src/fen.ts`                              | update `PIECE_MAP` values                                                       |
| `src/board.tsx`                           | add `Piece` → `PieceKey` mapping                                                |
| `src/promotion-dialog.tsx`                | update `PromotionPiece` values, `colorPrefix` mapping                           |
| `src/utilities.ts`                        | no change (uses `Piece`/`Square` by shape)                                      |
| `src/hooks/use-drag.ts`                   | no change (uses types by shape)                                                 |
| `src/hooks/use-animation.ts`              | no change (uses types by shape)                                                 |
| `src/__stories__/board.stories.tsx`       | remove conversion helpers                                                       |
| `src/__tests__/fen.spec.ts`               | update expected `Piece` values in assertions                                    |
| `src/__tests__/board.spec.tsx`            | update any `Piece` literals in test data                                        |
| `src/__tests__/promotion-dialog.spec.tsx` | update expected `PromotionPiece` values                                         |
| `package.json`                            | add `@echecs/position` to peerDependencies                                      |

## what does NOT change

- `PieceKey` type (`'bB' | 'wK' | ...`)
- `PieceSet` type (`Record<PieceKey, string>`)
- `DEFAULT_PIECES` constant
- CSS variable names
- SVG piece assets
- board rendering logic (grid, coordinates, drag & drop)
- animation system
- annotation overlay

## breaking change surface

consumers must update if they:

1. pass `Map<Square, Piece>` to the `position` prop — piece values change
2. handle `PromotionPiece` from `PromotionDialog.onSelect` — values change
3. read `MoveEvent.promotion` — now typed as `PromotionPiece` instead of
   `string`

consumers are unaffected if they:

- use FEN strings for position
- pass custom `PieceSet` (keys unchanged)
- only use `onMove`, `onSquareClick` callbacks with `Square` values
