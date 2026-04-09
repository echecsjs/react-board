# Changelog

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
