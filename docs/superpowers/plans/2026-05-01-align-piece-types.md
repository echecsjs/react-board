# Align Piece Types with @echecs/position — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace locally defined `Color`, `PieceType`, `Piece`, `File`, `Rank`,
`Square` types with imports from `@echecs/position` so consumers can pass
position data directly without conversion.

**Architecture:** Import domain types from `@echecs/position` (peer dep). Keep
`PieceKey`/`PieceSet` as-is for rendering. Add internal mapping from `Piece` →
`PieceKey`. Update FEN parser values, promotion dialog, and tests.

**Tech Stack:** TypeScript, React, vitest, @echecs/position@^3

---

### Task 1: Add `@echecs/position` as peer dependency

**Files:**

- Modify: `package.json:53-55`

- [ ] **Step 1: Add `@echecs/position` to peerDependencies**

In `package.json`, add `@echecs/position` to the existing `peerDependencies`:

```json
"peerDependencies": {
  "@echecs/position": ">=3",
  "react": ">=18"
}
```

- [ ] **Step 2: Verify install**

Run: `pnpm install` Expected: Clean install, no errors. `@echecs/position` is
already in devDependencies so it resolves.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat!: add @echecs/position as peer dependency"
```

---

### Task 2: Replace local type definitions with imports from `@echecs/position`

**Files:**

- Modify: `src/types.ts:1-23`

- [ ] **Step 1: Replace local type definitions**

Replace the first 23 lines of `src/types.ts` (everything before the
`Annotations` interface) with:

```typescript
import type {
  Color,
  File,
  Piece,
  PieceType,
  Rank,
  Square,
} from '@echecs/position';
import type React from 'react';

type ArrowKind = 'alternative' | 'capture' | 'danger' | 'move';
```

Remove the local definitions of `Color`, `File`, `PieceType`, `Rank`, `Square`,
and `Piece` — they are now imported from `@echecs/position`.

- [ ] **Step 2: Update `MoveEvent.promotion` type**

In `src/types.ts`, change the `MoveEvent` interface:

```typescript
interface MoveEvent {
  capture: boolean;
  from: Square;
  promotion?: PromotionPiece;
  to: Square;
}
```

This requires `PromotionPiece` to be available. Since it's defined in
`promotion-dialog.tsx`, we need to define it here instead (or inline the type).
Define it above `MoveEvent`:

```typescript
type PromotionPiece = Exclude<PieceType, 'king' | 'pawn'>;
```

- [ ] **Step 3: Add `Color`, `Piece`, `PieceType`, `Square` to exports**

In the export block at the bottom of `src/types.ts`, add re-exports. Also export
`PromotionPiece` from here:

```typescript
export type {
  Annotations,
  Arrow,
  ArrowKind,
  BoardProperties as BoardProps,
  Circle,
  Color,
  File,
  MoveEvent,
  Piece,
  PieceKey,
  PieceSet,
  PieceType,
  PromotionPiece,
  Rank,
  Square,
};
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm lint:types` Expected: Type errors in files that still use old
abbreviated values (`fen.ts`, `board.tsx`, `promotion-dialog.tsx`,
`use-drag.ts`). That's expected — we fix those in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts
git commit -m "feat!: import piece types from @echecs/position

BREAKING CHANGE: Color is now 'black' | 'white' (was 'b' | 'w').
PieceType is now 'bishop' | 'king' | ... (was 'b' | 'k' | ...).
MoveEvent.promotion is now PromotionPiece (was string)."
```

---

### Task 3: Update FEN parser

**Files:**

- Modify: `src/fen.ts:5-18`
- Modify: `src/__tests__/fen.spec.ts`

- [ ] **Step 1: Update test expectations**

In `src/__tests__/fen.spec.ts`, update all `Piece` literals from abbreviated to
full-word values:

```typescript
import { describe, expect, it } from 'vitest';

import { parseFen } from '../fen.js';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const AFTER_E4_FEN =
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

describe('parseFen', () => {
  describe('starting position', () => {
    it('has 32 pieces', () => {
      const pos = parseFen(STARTING_FEN);
      expect(pos.size).toBe(32);
    });

    it('has white king on e1', () => {
      const pos = parseFen(STARTING_FEN);
      expect(pos.get('e1')).toEqual({ color: 'white', type: 'king' });
    });

    it('has black king on e8', () => {
      const pos = parseFen(STARTING_FEN);
      expect(pos.get('e8')).toEqual({ color: 'black', type: 'king' });
    });

    it('has white pawns on rank 2', () => {
      const pos = parseFen(STARTING_FEN);
      for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(pos.get(`${file}2` as Parameters<typeof pos.get>[0])).toEqual({
          color: 'white',
          type: 'pawn',
        });
      }
    });

    it('has black pawns on rank 7', () => {
      const pos = parseFen(STARTING_FEN);
      for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(pos.get(`${file}7` as Parameters<typeof pos.get>[0])).toEqual({
          color: 'black',
          type: 'pawn',
        });
      }
    });
  });

  describe('after 1.e4', () => {
    it('has pawn on e4', () => {
      const pos = parseFen(AFTER_E4_FEN);
      expect(pos.get('e4')).toEqual({ color: 'white', type: 'pawn' });
    });

    it('has empty e2', () => {
      const pos = parseFen(AFTER_E4_FEN);
      expect(pos.get('e2')).toBeUndefined();
    });
  });

  describe('empty board', () => {
    it('has 0 pieces', () => {
      const pos = parseFen('8/8/8/8/8/8/8/8 w - - 0 1');
      expect(pos.size).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/fen.spec.ts` Expected: FAIL — assertions expect
`'white'`/`'king'` but get `'w'`/`'k'`.

- [ ] **Step 3: Update `PIECE_MAP` in `fen.ts`**

Replace `PIECE_MAP` in `src/fen.ts` (lines 5-18):

```typescript
const PIECE_MAP: Record<string, Piece> = {
  B: { color: 'white', type: 'bishop' },
  K: { color: 'white', type: 'king' },
  N: { color: 'white', type: 'knight' },
  P: { color: 'white', type: 'pawn' },
  Q: { color: 'white', type: 'queen' },
  R: { color: 'white', type: 'rook' },
  b: { color: 'black', type: 'bishop' },
  k: { color: 'black', type: 'king' },
  n: { color: 'black', type: 'knight' },
  p: { color: 'black', type: 'pawn' },
  q: { color: 'black', type: 'queen' },
  r: { color: 'black', type: 'rook' },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/__tests__/fen.spec.ts` Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/fen.ts src/__tests__/fen.spec.ts
git commit -m "feat!: update FEN parser to use full-word piece types"
```

---

### Task 4: Add `pieceKey` helper and update board rendering

**Files:**

- Modify: `src/board.tsx:1-14,162-172,307-313`

- [ ] **Step 1: Add `pieceKey` helper at the top of `board.tsx`**

After the imports, add a mapping function. Add imports for `Color` and
`PieceType`:

```typescript
import type { Color, PieceType } from '@echecs/position';
```

Then after `STARTING_FEN`:

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

function pieceKey(color: Color, type: PieceType): PieceKey {
  return `${COLOR_PREFIX[color]}${TYPE_SUFFIX[type]}` as PieceKey;
}
```

- [ ] **Step 2: Update ghost piece key construction**

Replace lines 168-169 in `src/board.tsx`:

```typescript
// Before:
const ghostKey: PieceKey =
  `${ghostPiece.color}${ghostPiece.type.toUpperCase()}` as PieceKey;

// After:
const ghostKey = pieceKey(ghostPiece.color, ghostPiece.type);
```

- [ ] **Step 3: Update rendered piece key construction**

Replace lines 310-311 in `src/board.tsx`:

```typescript
// Before:
const key: PieceKey = `${piece.color}${piece.type.toUpperCase()}` as PieceKey;

// After:
const key = pieceKey(piece.color, piece.type);
```

- [ ] **Step 4: Run board tests**

Run: `pnpm test -- src/__tests__/board.spec.tsx` Expected: All tests PASS (board
tests use FEN strings, not `Map<Square, Piece>` literals).

- [ ] **Step 5: Commit**

```bash
git add src/board.tsx
git commit -m "refactor: use pieceKey helper for Piece to PieceKey mapping"
```

---

### Task 5: Update `use-drag.ts` — remove `turnColor` conversion

**Files:**

- Modify: `src/hooks/use-drag.ts:66,157,245,261,283`

- [ ] **Step 1: Remove `turnColor` derivation**

In `src/hooks/use-drag.ts`, remove line 66:

```typescript
// Remove this line:
const turnColor = turn === 'white' ? 'w' : turn === 'black' ? 'b' : undefined;
```

- [ ] **Step 2: Replace all `turnColor` references with `turn`**

Since `turn` is already `'black' | 'white' | undefined` and `piece.color` is now
`'black' | 'white'`, replace every `turnColor` with `turn`:

Line 157: `if (piece && (!turnColor || piece.color === turnColor))` →
`if (piece && (!turn || piece.color === turn))`

Line 245:
`if (reselectedPiece && (!turnColor || reselectedPiece.color === turnColor))` →
`if (reselectedPiece && (!turn || reselectedPiece.color === turn))`

Line 261:
`if (clickedPiece && (!turnColor || clickedPiece.color === turnColor))` →
`if (clickedPiece && (!turn || clickedPiece.color === turn))`

Line 283: `(!turnColor || draggedPiece.color === turnColor)` →
`(!turn || draggedPiece.color === turn)`

- [ ] **Step 3: Remove `turnColor` from the `useCallback` dependencies**

The dependency arrays that reference `turnColor` should now reference `turn`
instead. Check each `useCallback`:

- `onPointerDown` deps (line 162): replace `turnColor` with `turn`
- `onPointerUp` deps (line 306): replace `turnColor` with `turn` (it may already
  have `turn` from before — just ensure `turnColor` is fully removed)

Actually, looking at the current code, the dependency arrays already don't list
`turnColor` explicitly — they close over it. Since `turnColor` was a local const
derived from `turn`, the hooks already list `turn` in outer scope deps. Just
remove the `turnColor` line and replace all usages with `turn`.

Wait — checking again. The `onPointerDown` callback at line 161-170 has deps:
`[boardRef, clearAnnotations, interactive, orientation, pieces, squareSize, turnColor]`.
So `turnColor` IS in the deps. Replace it with `turn`.

Similarly `onPointerUp` callback at line 297-307 has deps:
`[attemptMove, boardRef, interactive, isLegalTarget, orientation, pieces, selectedSquare, squareSize, turnColor]`.
Replace `turnColor` with `turn`.

- [ ] **Step 4: Run all tests**

Run: `pnpm test` Expected: All tests PASS. The board tests with `turn="white"`
still work because `turn` and `piece.color` are now both `'white'`/`'black'`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-drag.ts
git commit -m "refactor: compare turn directly against piece.color

No longer need turnColor conversion since Color is now
'black' | 'white', matching the turn prop."
```

---

### Task 6: Update promotion dialog

**Files:**

- Modify: `src/promotion-dialog.tsx:3,6,16,25,46-48,53`
- Modify: `src/__tests__/promotion-dialog.spec.tsx`

- [ ] **Step 1: Update test expectations**

In `src/__tests__/promotion-dialog.spec.tsx`, update the expected
`data-promotion-piece` values and `onSelect` arguments:

Line 26: `expect(pieces[0]?.dataset.promotionPiece).toBe('q');` →
`expect(pieces[0]?.dataset.promotionPiece).toBe('queen');` Line 27:
`expect(pieces[1]?.dataset.promotionPiece).toBe('r');` →
`expect(pieces[1]?.dataset.promotionPiece).toBe('rook');` Line 28:
`expect(pieces[2]?.dataset.promotionPiece).toBe('b');` →
`expect(pieces[2]?.dataset.promotionPiece).toBe('bishop');` Line 29:
`expect(pieces[3]?.dataset.promotionPiece).toBe('n');` →
`expect(pieces[3]?.dataset.promotionPiece).toBe('knight');`

Line 38: `'[data-promotion-piece="r"]'` → `'[data-promotion-piece="rook"]'` Line
41: `expect(onSelect).toHaveBeenCalledWith('r');` →
`expect(onSelect).toHaveBeenCalledWith('rook');`

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/promotion-dialog.spec.tsx` Expected: FAIL —
pieces still have abbreviated values.

- [ ] **Step 3: Update `promotion-dialog.tsx`**

Import `PromotionPiece` from types instead of defining locally. Import `Color`
and `PieceType` for the mapping:

```typescript
import { DEFAULT_PIECES } from './pieces/index.js';

import type { PieceKey, PieceSet, PromotionPiece } from './types.js';
import type { Color } from '@echecs/position';
import type React from 'react';
```

Remove the local `type PromotionPiece = 'b' | 'n' | 'q' | 'r';` definition.

Update `PROMOTION_PIECES`:

```typescript
const PROMOTION_PIECES: PromotionPiece[] = [
  'queen',
  'rook',
  'bishop',
  'knight',
];
```

Update `colorPrefix` mapping (line 25):

```typescript
const COLOR_PREFIX: Record<Color, 'b' | 'w'> = { black: 'b', white: 'w' };
```

Replace the inline `colorPrefix` derivation with:

```typescript
const colorPrefix = COLOR_PREFIX[color];
```

Update the `PieceKey` construction inside the map (line 47-48). The piece is now
`'queen'`, `'rook'`, etc. We need to map to the uppercase single char:

```typescript
const TYPE_KEY: Record<PromotionPiece, string> = {
  bishop: 'B',
  knight: 'N',
  queen: 'Q',
  rook: 'R',
};
```

Then in the map callback:

```typescript
const key: PieceKey = `${colorPrefix}${TYPE_KEY[piece]}` as PieceKey;
```

- [ ] **Step 4: Update exports**

Remove the `PromotionPiece` export from `promotion-dialog.tsx` since it's now
exported from `types.ts`:

```typescript
export { PromotionDialog };
export type { PromotionDialogProperties as PromotionDialogProps };
```

- [ ] **Step 5: Update `src/index.ts`**

Move `PromotionPiece` export from the promotion-dialog re-export to the types
re-export:

```typescript
export type {
  Annotations,
  Arrow,
  ArrowKind,
  BoardProps,
  Circle,
  Color,
  File,
  MoveEvent,
  Piece,
  PieceKey,
  PieceSet,
  PieceType,
  PromotionPiece,
  Rank,
  Square,
} from './types.js';

export type { PromotionDialogProps } from './promotion-dialog.js';
export type { SquareCoords } from './utilities.js';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test -- src/__tests__/promotion-dialog.spec.tsx` Expected: All tests
PASS.

- [ ] **Step 7: Commit**

```bash
git add src/promotion-dialog.tsx src/types.ts src/index.ts src/__tests__/promotion-dialog.spec.tsx
git commit -m "feat!: update PromotionPiece to use full-word values

BREAKING CHANGE: PromotionPiece is now 'bishop' | 'knight' | 'queen' | 'rook'
(was 'b' | 'n' | 'q' | 'r')."
```

---

### Task 7: Update stories — remove conversion helpers

**Files:**

- Modify: `src/__stories__/board.stories.tsx:236-264,353-361`

- [ ] **Step 1: Remove `COLOR_MAP`, `TYPE_MAP`, `PROMOTION_MAP` and simplify
      `toPosition`**

Remove lines 236-250 (`COLOR_MAP`, `PROMOTION_MAP`, `TYPE_MAP`).

Replace `toPosition` (lines 252-264) with:

```typescript
function toPosition(game: Game): Map<Square, Piece> {
  return game.position().pieces() as Map<Square, Piece>;
}
```

Since `game.position().pieces()` returns `Map<Square, Piece>` from
`@echecs/position` and react-board's `Piece` is now the same type, the cast is
just to satisfy the import path difference (both are structurally identical).

- [ ] **Step 2: Update `handlePromotion` callback**

The `handlePromotion` callback (around line 353) currently receives a `string`
and maps through `PROMOTION_MAP`. Since `PromotionPiece` is now
`'bishop' | 'knight' | 'queen' | 'rook'` — which is exactly what `@echecs/game`
expects — simplify:

```typescript
const handlePromotion = useCallback(
  (piece: string) => {
    if (!pendingPromotion) return;
    try {
      gameReference.current.move({
        from: pendingPromotion.from,
        promotion: piece as never,
        to: pendingPromotion.to,
      });
      playSound(pendingPromotion, false);
      syncState();
    } catch {
      // invalid promotion
    }
    setPendingPromotion(undefined);
  },
  [pendingPromotion, playSound, syncState],
);
```

(Removed the `PROMOTION_MAP` lookup — `piece` is already the right value.)

- [ ] **Step 3: Remove unused imports**

Check that `Piece` is still needed in the imports (yes — used in `toPosition`
return type). Remove `PieceKey` from imports if it's no longer used directly in
stories. Looking at line 179, `PIECE_KEYS` uses `PieceKey[]` — keep it.

- [ ] **Step 4: Verify storybook builds**

Run: `pnpm storybook:build` Expected: Build succeeds without errors.

- [ ] **Step 5: Commit**

```bash
git add src/__stories__/board.stories.tsx
git commit -m "refactor: remove type conversion helpers from stories

Types now align directly between @echecs/game and react-board."
```

---

### Task 8: Full verification

- [ ] **Step 1: Run all tests**

Run: `pnpm test` Expected: All tests PASS.

- [ ] **Step 2: Run linter**

Run: `pnpm lint` Expected: No errors.

- [ ] **Step 3: Run build**

Run: `pnpm build` Expected: Build succeeds. Verify `dist/index.d.ts` re-exports
the new types.

- [ ] **Step 4: Verify exported types in dist**

Run: `grep -E 'Color|PieceType|PromotionPiece' dist/index.d.ts` Expected:
`Color`, `PieceType`, `Piece`, `Square`, `PromotionPiece` are present in the
type exports.

- [ ] **Step 5: Commit any remaining changes (if any)**

If lint auto-fixed anything:

```bash
git add -A
git commit -m "chore: lint fixes"
```
