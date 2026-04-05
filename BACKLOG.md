# Backlog

Last updated: 2026-04-04

## High

- [x] ~~Highlight squares persist~~ — decided to keep `highlight` generic;
      consumers manage clearing. No `lastMove` prop needed.
- [x] ~~CSS-variable-based theming~~ — removed `theme` prop and `BoardTheme`
      type. All styling via `--board-*` CSS variables with `var()` fallbacks.
- [x] ~~Coordinate labels too large~~ — font size 15% (was 25%), weight 600 via
      `--board-coordinate-weight`, two color variables done in theming.
- [x] ~~No turn restriction~~ — added `turn` prop (`'white' | 'black'`) that
      restricts drag and click-select to the matching color.

## Medium

- [x] ~~Storybook~~ — replaced `playground/` with Storybook 10. 11 stories
      covering all props, themes, and controls.
- [x] ~~Promotion UI~~ — added `<PromotionDialog />` component and `children`
      prop on Board. Consumer positions dialog in the board grid.
- [ ] Move sound effects — play sounds on move, capture, check. Optional,
      disabled by default.
- [x] ~~Piece shadow during drag~~ — `drop-shadow` filter on ghost piece via
      `--board-drag-shadow` CSS variable.

## Future (v2)

- [ ] Arrow drawing (SVG overlay)
- [ ] Premove support
- [ ] Right-click annotations
- [ ] Touch gesture improvements
- [ ] Additional bundled piece sets
