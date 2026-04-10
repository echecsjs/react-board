# Background-Image Pieces

Replace React component-based piece rendering with CSS `background-image` divs.

## Problem

During drag and animation, pieces occasionally render behind adjacent squares
due to stacking context issues with inline SVG elements. chess.com avoids this
by painting pieces as div backgrounds -- fewer DOM nodes, simpler compositing.

## Design

### API changes

- **`PieceSet`** becomes `Record<PieceKey, string>` where each value is an image
  URL (data URI, blob URL, or HTTP URL).
- **`PieceComponent`** type is removed from the public API.
- **`DEFAULT_PIECES`** becomes a record of `data:image/svg+xml,...` URIs, one
  per piece key. The 12 individual TSX component files are deleted and replaced
  by a single module exporting the data URIs.
- **`BoardProps.pieces`** keeps the same name, type changes from component
  record to string record.
- **`PromotionDialogProps.pieces`** same change.

### Rendering

Each piece on the board is a single `div` with:

```css
background-image: url(...)
background-size: contain
background-repeat: no-repeat
background-position: center
```

No child DOM elements for pieces. The piece wrapper div carries the background
directly.

During drag, the ghost piece follows the same pattern -- a `div` with
`background-image` and `position: fixed`.

Animation (transform + transition on the piece div) works the same way, but with
no SVG child element inside.

The promotion dialog renders each option as a background-image div as well.

### Bundled piece set

The current cburnett SVGs (inline paths in each TSX component) are converted to
standalone SVG markup strings and encoded as `data:image/svg+xml,...` URIs. Each
piece's SVG content is extracted from its component, wrapped in an
`<svg xmlns="..." viewBox="0 0 300 300">` root, and URI-encoded.

### What this fixes

- Fewer DOM nodes per piece (no SVG tree, just a background-painted div)
- Background painting is composited as part of the element's layer -- no child
  stacking context issues
- Simpler ghost piece during drag

## File changes

| File                                              | Action  | Description                                                                                   |
| ------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `src/pieces/b-b.tsx` through `w-r.tsx` (12 files) | Delete  | Replaced by data URIs                                                                         |
| `src/pieces/index.ts`                             | Rewrite | Export `DEFAULT_PIECES` as `Record<PieceKey, string>` with data URIs                          |
| `src/types.ts`                                    | Update  | Remove `PieceComponent`, change `PieceSet` to `Record<PieceKey, string>`, update `BoardProps` |
| `src/board.tsx`                                   | Update  | Render pieces as background-image divs                                                        |
| `src/promotion-dialog.tsx`                        | Update  | Same background-image approach                                                                |
| `src/index.ts`                                    | Update  | Remove `PieceComponent` from exports                                                          |
| Tests                                             | Update  | Match new API                                                                                 |
| Stories                                           | Update  | Match new API                                                                                 |
| `README.md`                                       | Update  | Custom pieces section shows URL strings                                                       |

## Breaking changes

- `PieceComponent` type removed
- `PieceSet` changes from
  `Record<PieceKey, React.ComponentType<{ size: number }>>` to
  `Record<PieceKey, string>`
- Consumers using custom piece components must convert to image URLs
