# Move Sounds

## Summary

Enrich `MoveEvent` with a `capture` field so consumers can distinguish move
types. Ship bundled sound assets (move, capture) as package exports. The board
does not play sounds — consumers import the assets and play them in their
`onMove` handler.

## MoveEvent change

```typescript
interface MoveEvent {
  capture: boolean;
  from: Square;
  promotion?: string;
  to: Square;
}
```

The board sets `capture` in the drag hook by checking if the target square has a
piece before firing `onMove`. A square with any piece (regardless of color)
counts as a capture — the board doesn't validate whether it's an opponent piece,
since it doesn't enforce rules.

## Sound assets

Two mp3 files bundled in the package:

- `src/sounds/move.mp3`
- `src/sounds/capture.mp3`

Source: Lichess standard sound set (MIT licensed).

Exported from the barrel as URL strings:

```typescript
export { default as captureSound } from './sounds/capture.mp3';
export { default as moveSound } from './sounds/move.mp3';
```

Consumers import them and use `Audio` or any audio library they prefer.

## Consumer usage

```typescript
import { captureSound, moveSound } from '@echecs/react-board';

<Board onMove={(move) => {
  new Audio(move.capture ? captureSound : moveSound).play();
  return game.move(move);
}} />
```

## Build config

The bundler (tsdown/rolldown) needs to handle `.mp3` imports. Add an asset
configuration so mp3 files are copied to `dist/` and the import resolves to the
file path/URL.

## Files affected

- `src/types.ts` — add `capture: boolean` to `MoveEvent`
- `src/hooks/use-drag.ts` — pass `capture` when calling `onMove`
- `src/sounds/move.mp3` — new asset
- `src/sounds/capture.mp3` — new asset
- `src/index.ts` — export sound assets
- `src/__tests__/board.spec.tsx` — update tests that check `onMove` calls
- `AGENTS.md` — update `MoveEvent` docs
- `BACKLOG.md` — mark item complete
