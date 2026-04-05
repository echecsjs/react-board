import { Board } from '../index.js';

import type { BoardProps } from '../types.js';
import type { Square } from '@echecs/position';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<BoardProps> = {
  argTypes: {
    animate: { control: 'boolean' },
    coordinates: { control: 'boolean' },
    interactive: { control: 'boolean' },
    orientation: { control: 'radio', options: ['white', 'black'] },
    position: { control: 'text' },
    turn: { control: 'radio', options: [undefined, 'white', 'black'] },
  },
  component: Board,
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
  title: 'Board',
};

export default meta;

type Story = StoryObj<BoardProps>;

// -- Default: starting position, all defaults ---

export const Default: Story = {};

// -- Empty board: no pieces ---

export const EmptyBoard: Story = {
  args: {
    position: '8/8/8/8/8/8/8/8 w - - 0 1',
  },
};

// -- Custom position: Sicilian Najdorf ---

export const CustomPosition: Story = {
  args: {
    position:
      'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
  },
};

// -- Black orientation ---

export const BlackOrientation: Story = {
  args: {
    orientation: 'black',
  },
};

// -- With highlights ---

export const WithHighlights: Story = {
  args: {
    highlight: ['e4', 'e5'] as Square[],
  },
};

// -- With legal moves ---

export const WithLegalMoves: Story = {
  args: {
    interactive: false,
    legalMoves: new Map([
      ['e2', ['e3', 'e4']],
      ['d2', ['d3', 'd4']],
      ['g1', ['f3', 'h3']],
      ['b1', ['a3', 'c3']],
    ]) as Map<Square, Square[]>,
  },
};

// -- No coordinates ---

export const NoCoordinates: Story = {
  args: {
    coordinates: false,
  },
};

// -- No animation ---

export const NoAnimation: Story = {
  args: {
    animate: false,
  },
};

// -- Turn restriction: only white can move ---

export const TurnRestriction: Story = {
  args: {
    turn: 'white',
  },
};

// -- Dark theme (chess.com brown/beige) via CSS variables ---

export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--board-coordinate-on-dark': '#f0d9b5',
            '--board-coordinate-on-light': '#b58863',
            '--board-dark-square': '#b58863',
            '--board-light-square': '#f0d9b5',
            'width': 400,
          } as React.CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};

// -- Interactive: all props exposed as controls ---

export const Interactive: Story = {
  args: {
    animate: true,
    coordinates: true,
    interactive: true,
    orientation: 'white',
    position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  },
};
