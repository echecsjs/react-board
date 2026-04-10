# AGENTS.md — @echecs/react-board

Coding-agent reference for the `react-board` package.

**Backlog:** tracked in
[GitHub Issues](https://github.com/mormubis/react-board/issues).

## Project Overview

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
