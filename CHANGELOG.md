# Changelog

## [2.1.1] - 2026-04-16

### Fixed

- animation offset stuck when parent re-renders during RAF window — removed
  `cancelAnimationFrame` cleanup from `useAnimation` effect since the
  offset-clearing callback is idempotent (#14)
- added `docs` script for CI storybook deployment (#13)
- added missing `Annotations`, `ArrowKind`, `Circle` types to README (#16)

## [2.1.0] - 2026-04-16

### Added

- right-click drawable annotations — `drawable` prop, circle and arrow drawing
  via `useDrawing` hook and `AnnotationOverlay` component
- SVG arrow overlay — `arrows` prop with semantic `kind` types (`move`,
  `alternative`, `danger`, `capture`)
- touch-aware drag threshold (10px for touch, 4px for mouse)
- `movable` prop to control piece interaction independently from `drawable`

### Fixed

- drag restricted to left-click only (right-click no longer initiates drag)

## [2.0.0] - 2026-04-11

### Added

- `--board-piece-transition` CSS variable to customise piece move animation
  (default: `transform 200ms ease`)
- gh-pages deployment workflow for storybook documentation
- promotion support in the interactive storybook demo

### Changed

- **BREAKING:** `PieceSet` type changed from
  `Record<PieceKey, React.ComponentType<{ size: number }>>` to
  `Record<PieceKey, string>` — pieces are now image URLs (data URIs, SVG files,
  PNGs) rendered as CSS `background-image` instead of React components
- **BREAKING:** `PieceComponent` type removed from public exports
- bundled cburnett piece set converted from inline SVG components to
  `data:image/svg+xml` URIs
- drag-drop animation now starts from the drop point instead of the origin
  square

### Fixed

- pieces appearing behind adjacent squares during drag (removed
  `overflow: hidden` from squares)

### Removed

- 12 individual piece TSX component files (`src/pieces/*.tsx`) — replaced by
  data URIs in `src/pieces/index.ts`

## [1.0.2] - 2026-04-09

### Added

- added keywords for npm discoverability

## [1.0.1] - 2026-04-09

### Fixed

- removed non-existent `theme` prop and `BoardTheme` type from docs
- documented `turn`, `children`, `arrows`, `onSquareClick` props
- documented `squareCoords` function export
- documented all exported types (`Arrow`, `BoardProps`, `PieceKey`,
  `PromotionDialogProps`, `PromotionPiece`, `SquareCoords`)
- fixed `PromotionDialog.onCancel` as optional
- documented all sound assets (`castle.mp3`, `check.mp3`, `game-end.mp3`)

## [1.0.0] - 2026-04-09

### Added

- CSS variable theming (`--board-*`) for all visual properties
- `turn` prop to restrict interaction by piece colour
- `<PromotionDialog />` component for promotion piece selection
- `children` prop on `<Board />` for rendering overlays inside the grid
- `squareCoords` utility export for computing grid placement
- `capture` field on `MoveEvent`
- Bundled sound assets: move, capture, check, castle, game-end (subpath exports)
- `--board-drag-shadow` CSS variable for dragged piece shadow
- `--board-coordinate-on-light`, `--board-coordinate-on-dark`,
  `--board-coordinate-weight` CSS variables
- `--board-promotion-background` CSS variable
- Storybook with interactive stories including playable game demo with sounds
- Dependabot configuration

### Changed

- Default piece set replaced with chess.com Neo (vector-traced via vtracer)
- Coordinate labels scaled to 15% of square size (was 25%), semi-bold weight
- `MoveEvent` now includes `capture: boolean`
- Highlight renders behind pieces instead of on top

### Fixed

- Native browser drag interfering with fast piece moves
- Highlight overlay tinting pieces

### Removed

- `theme` prop and `BoardTheme` type (replaced by CSS variables)
- `playground/` dev environment (replaced by Storybook)

## [0.1.0] - 2026-04-04

- Initial release
