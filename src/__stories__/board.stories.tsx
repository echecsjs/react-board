import { Game } from '@echecs/game';
import { useCallback, useEffect, useRef, useState } from 'react';

import captureSound from '../../sounds/capture.mp3';
import castleSound from '../../sounds/castle.mp3';
import checkSound from '../../sounds/check.mp3';
import gameEndSound from '../../sounds/game-end.mp3';
import moveSound from '../../sounds/move.mp3';
import { Board } from '../index.js';
import { PromotionDialog } from '../promotion-dialog.js';
import { squareCoords } from '../utilities.js';

import type {
  Arrow,
  BoardProps as BoardProperties,
  MoveEvent,
  Piece,
  PieceKey,
  PieceSet,
  Square,
} from '../types.js';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<BoardProperties> = {
  argTypes: {
    animate: { control: 'boolean' },
    coordinates: { control: 'boolean' },
    drawable: { control: 'boolean' },
    movable: { control: 'boolean' },
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
  tags: ['autodocs'],
  title: 'Board',
};

export default meta;

type Story = StoryObj<BoardProperties>;

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

// -- With arrows ---

export const WithArrows: Story = {
  args: {
    arrows: [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'f1', to: 'c4', kind: 'alternative' },
      { from: 'd7', to: 'd5', kind: 'danger' },
      { from: 'b8', to: 'c6', kind: 'capture' },
    ] as Arrow[],
  },
};

// -- Drawable: right-click to draw annotations ---

export const Drawable: Story = {
  args: {
    drawable: true,
    movable: true,
  },
};

// -- Drawable only: annotations without piece movement ---

export const DrawableOnly: Story = {
  args: {
    drawable: true,
  },
};

// -- With legal moves ---

export const WithLegalMoves: Story = {
  args: {
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
    movable: true,
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

// -- Custom pieces: use any piece set via the `pieces` prop ---

const PIECE_KEYS: PieceKey[] = [
  'bB',
  'bK',
  'bN',
  'bP',
  'bQ',
  'bR',
  'wB',
  'wK',
  'wN',
  'wP',
  'wQ',
  'wR',
];

const MERIDA_PIECES: PieceSet = Object.fromEntries(
  PIECE_KEYS.map((key) => [
    key,
    `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/merida/${key}.svg`,
  ]),
) as PieceSet;

export const CustomPieces: Story = {
  args: {
    pieces: MERIDA_PIECES,
  },
};

// -- Custom arrow colors via CSS variables ---

export const CustomArrowColors: Story = {
  args: {
    arrows: [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'f1', to: 'c4', kind: 'alternative' },
    ] as Arrow[],
  },
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--board-arrow-alternative': '#9b59b6',
            '--board-arrow-move': '#e67e22',
            '--board-arrow-opacity': '0.6',
            'width': 400,
          } as React.CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};

// -- Interactive: playable game with @echecs/game ---

const COLOR_MAP: Record<string, 'b' | 'w'> = { black: 'b', white: 'w' };
const PROMOTION_MAP: Record<string, string> = {
  b: 'bishop',
  n: 'knight',
  q: 'queen',
  r: 'rook',
};
const TYPE_MAP: Record<string, 'b' | 'k' | 'n' | 'p' | 'q' | 'r'> = {
  bishop: 'b',
  king: 'k',
  knight: 'n',
  pawn: 'p',
  queen: 'q',
  rook: 'r',
};

function toPosition(game: Game): Map<Square, Piece> {
  const result = new Map<Square, Piece>();
  for (const [square, piece] of game.position().pieces()) {
    result.set(
      square as Square,
      {
        color: COLOR_MAP[piece.color],
        type: TYPE_MAP[piece.type],
      } as Piece,
    );
  }
  return result;
}

function toLegalMoves(game: Game): Map<Square, Square[]> {
  const result = new Map<Square, Square[]>();
  for (const move of game.moves()) {
    const from = move.from as Square;
    const to = move.to as Square;
    const existing = result.get(from) ?? [];
    if (!existing.includes(to)) {
      existing.push(to);
    }
    result.set(from, existing);
  }
  return result;
}

interface PendingPromotion {
  capture: boolean;
  from: Square;
  to: Square;
}

function InteractiveGame(): React.JSX.Element {
  const gameReference = useRef(new Game());
  const [position, setPosition] = useState(() =>
    toPosition(gameReference.current),
  );
  const [legalMoves, setLegalMoves] = useState(() =>
    toLegalMoves(gameReference.current),
  );
  const [turn, setTurn] = useState<'white' | 'black'>('white');
  const [pendingPromotion, setPendingPromotion] = useState<
    PendingPromotion | undefined
  >();

  const syncState = useCallback(() => {
    setPosition(toPosition(gameReference.current));
    setLegalMoves(toLegalMoves(gameReference.current));
    setTurn(gameReference.current.turn() as 'white' | 'black');
  }, []);

  const playSound = useCallback(
    (move: { capture: boolean }, isCastle: boolean) => {
      const sound = gameReference.current.isGameOver()
        ? gameEndSound
        : gameReference.current.isCheck()
          ? checkSound
          : isCastle
            ? castleSound
            : move.capture
              ? captureSound
              : moveSound;
      new Audio(sound).play();
    },
    [],
  );

  const handleMove = useCallback(
    (move: MoveEvent): boolean => {
      try {
        const piece = gameReference.current.get(move.from as never);
        const toRank = move.to[1];
        const isPromotion =
          piece?.type === 'pawn' && (toRank === '8' || toRank === '1');

        if (isPromotion) {
          setPendingPromotion({
            capture: move.capture,
            from: move.from,
            to: move.to,
          });
          return true;
        }

        const fromFile = move.from.codePointAt(0) ?? 0;
        const toFile = move.to.codePointAt(0) ?? 0;
        const isCastle =
          piece?.type === 'king' && Math.abs(fromFile - toFile) === 2;
        gameReference.current.move({ from: move.from, to: move.to });
        playSound(move, isCastle);
        syncState();
        return true;
      } catch {
        return false;
      }
    },
    [playSound, syncState],
  );

  const handlePromotion = useCallback(
    (piece: string) => {
      if (!pendingPromotion) return;
      try {
        const promotionType = PROMOTION_MAP[piece] ?? 'queen';
        gameReference.current.move({
          from: pendingPromotion.from,
          promotion: promotionType as never,
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

  const promotionColor = turn;
  const promotionCoords = pendingPromotion
    ? squareCoords(pendingPromotion.to, 'white')
    : undefined;

  return (
    <Board
      legalMoves={legalMoves}
      movable
      onMove={handleMove}
      position={position}
      turn={turn}
    >
      {pendingPromotion && promotionCoords && (
        <div
          style={{
            gridColumn: promotionCoords.col,
            gridRow: `${promotionCoords.row} / span 4`,
            zIndex: 10,
          }}
        >
          <PromotionDialog
            color={promotionColor}
            onCancel={() => setPendingPromotion(undefined)}
            onSelect={handlePromotion}
            squareSize={50}
          />
        </div>
      )}
    </Board>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveGame />,
};

// -- Premove: queue a move during opponent's turn ---

function PremoveDemo(): React.JSX.Element {
  const gameReference = useRef(new Game());
  const [position, setPosition] = useState(() =>
    toPosition(gameReference.current),
  );
  const [turn, setTurn] = useState<'black' | 'white'>('white');
  const [premove, setPremove] = useState<
    { from: Square; to: Square } | undefined
  >();

  const syncState = useCallback(() => {
    setPosition(toPosition(gameReference.current));
    setTurn(gameReference.current.turn() as 'black' | 'white');
  }, []);

  const handleMove = useCallback(
    (move: MoveEvent): boolean => {
      if (gameReference.current.turn() === 'white') {
        // White's turn: apply immediately
        try {
          gameReference.current.move({ from: move.from, to: move.to });
          syncState();
          return true;
        } catch {
          return false;
        }
      }

      // Black's turn: queue as premove (highlight only, don't apply)
      setPremove({ from: move.from, to: move.to });
      return false;
    },
    [syncState],
  );

  // Execute premove after black plays
  const applyPremove = useCallback(() => {
    if (!premove) return;
    try {
      gameReference.current.move({ from: premove.from, to: premove.to });
    } catch {
      // premove no longer legal
    }
    setPremove(undefined);
    syncState();
  }, [premove, syncState]);

  // When it becomes white's turn and there's a pending premove, apply it
  useEffect(() => {
    if (turn === 'white' && premove) {
      applyPremove();
    }
  }, [applyPremove, premove, turn]);

  const highlight = premove ? [premove.from, premove.to] : [];

  return (
    <div
      style={
        {
          '--board-highlight': 'rgba(0, 100, 255, 0.4)',
        } as React.CSSProperties
      }
    >
      <Board
        highlight={highlight as Square[]}
        movable
        onMove={handleMove}
        position={position}
      />
    </div>
  );
}

export const Premove: Story = {
  render: () => <PremoveDemo />,
};

// -- Promotion dialog: interactive demo ---

function PromotionDemo(): React.JSX.Element {
  const [showPromotion, setShowPromotion] = useState(true);
  const promotionSquare = 'e8' as Square;
  const coords = squareCoords(promotionSquare, 'white');

  return (
    <Board position="rnbqkbnr/ppppPppp/8/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1">
      {showPromotion && (
        <div
          style={{
            gridColumn: coords.col,
            gridRow: `${coords.row} / span 4`,
            zIndex: 10,
          }}
        >
          <PromotionDialog
            color="white"
            onCancel={() => setShowPromotion(false)}
            onSelect={() => {
              setShowPromotion(false);
            }}
            squareSize={50}
          />
        </div>
      )}
    </Board>
  );
}

export const Promotion: Story = {
  render: () => <PromotionDemo />,
};
