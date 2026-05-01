import { useEffect, useRef, useState } from 'react';

import AnnotationOverlay from './annotation-overlay.js';
import { parseFen } from './fen.js';
import { useAnimation } from './hooks/use-animation.js';
import { useDrag } from './hooks/use-drag.js';
import { useDrawing } from './hooks/use-drawing.js';
import { DEFAULT_PIECES } from './pieces/index.js';
import { SQUARES, squareColor, squareCoords } from './utilities.js';

import type { BoardProps as BoardProperties, PieceKey } from './types.js';
import type { Color, PieceType } from '@echecs/position';
import type React from 'react';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

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

function Board({
  animate = true,
  arrows = [],
  children,
  coordinates = true,
  drawable = false,
  highlight: highlightSquares = [],
  interactive,
  legalMoves,
  movable,
  onAnnotationChange,
  onMove,
  orientation = 'white',
  pieces = DEFAULT_PIECES,
  position,
  turn,
}: BoardProperties): React.JSX.Element {
  // Resolve movable/interactive precedence
  let isMovable: boolean;
  if (movable !== undefined) {
    isMovable = movable;
  } else if (interactive === undefined) {
    isMovable = false;
  } else {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[@echecs/react-board] `interactive` is deprecated. Use `movable` instead.',
      );
    }
    isMovable = interactive;
  }
  const containerReference = useRef<HTMLDivElement>(null);
  const [squareSize, setSquareSize] = useState(60);

  useEffect(() => {
    const element = containerReference.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setSquareSize(entry.contentRect.width / 8);
      }
    });

    observer.observe(element);
    setSquareSize(element.getBoundingClientRect().width / 8);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Resolve position to Map<Square, Piece>
  const positionMap =
    position === undefined
      ? parseFen(STARTING_FEN)
      : typeof position === 'string'
        ? parseFen(position)
        : position;

  const {
    annotations: userAnnotations,
    clearAnnotations,
    handlers: drawHandlers,
  } = useDrawing({
    boardRef: containerReference,
    drawable,
    onAnnotationChange,
    orientation,
    squareSize,
  });

  const { dragState, dropRef, handlers, selectedSquare } = useDrag({
    boardRef: containerReference,
    clearAnnotations,
    interactive: isMovable,
    legalMoves,
    onMove,
    orientation,
    pieces: positionMap,
    squareSize,
    turn,
  });

  const animationOffsets = useAnimation(
    positionMap,
    squareSize,
    orientation,
    animate,
    containerReference,
    dropRef,
  );

  // Legal dots: when isMovable and a square is selected, show only its legal targets.
  // When isMovable=false, show all legalTargets from the prop directly.
  const legalTargets = new Set<string>();

  if (!isMovable && legalMoves) {
    for (const targets of legalMoves.values()) {
      for (const sq of targets) {
        legalTargets.add(sq);
      }
    }
  } else if (isMovable && selectedSquare && legalMoves) {
    const targets = legalMoves.get(selectedSquare);

    if (targets) {
      for (const sq of targets) {
        legalTargets.add(sq);
      }
    }
  } else if (isMovable && dragState.from && legalMoves) {
    const targets = legalMoves.get(dragState.from);

    if (targets) {
      for (const sq of targets) {
        legalTargets.add(sq);
      }
    }
  }

  const highlightSet = new Set(highlightSquares);

  const rootStyle: React.CSSProperties = {
    aspectRatio: '1 / 1',
    position: 'relative',
  };

  const gridStyle: React.CSSProperties = {
    WebkitUserDrag: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gridTemplateRows: 'repeat(8, 1fr)',
    height: '100%',
    touchAction: 'none',
    userSelect: 'none',
    width: '100%',
  } as React.CSSProperties;

  // Floating ghost piece during drag
  let ghostImage: string | undefined;

  if (dragState.isDragging && dragState.from) {
    const ghostPiece = positionMap.get(dragState.from);

    if (ghostPiece) {
      const ghostKey = pieceKey(ghostPiece.color, ghostPiece.type);
      ghostImage = pieces[ghostKey];
    }
  }

  const ghostStyle: React.CSSProperties | undefined =
    dragState.isDragging && dragState.floating && ghostImage
      ? {
          backgroundImage: `url("${ghostImage}")`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          filter:
            'var(--board-drag-shadow, drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)))',
          height: squareSize,
          left: dragState.floating.x - squareSize / 2,
          pointerEvents: 'none',
          position: 'fixed',
          top: dragState.floating.y - squareSize / 2,
          width: squareSize,
          zIndex: 9999,
        }
      : undefined;

  const gridHandlers: Record<
    string,
    React.EventHandler<React.SyntheticEvent> | undefined
  > = {};

  if (isMovable) {
    gridHandlers.onDragStart = (event: React.SyntheticEvent) =>
      event.preventDefault();
    gridHandlers.onPointerDown = (event: React.PointerEvent) => {
      handlers.onPointerDown(event);
      drawHandlers.onPointerDown(event);
    };
    gridHandlers.onPointerMove = (event: React.PointerEvent) => {
      handlers.onPointerMove(event);
      drawHandlers.onPointerMove(event);
    };
    gridHandlers.onPointerUp = (event: React.PointerEvent) => {
      handlers.onPointerUp(event);
      drawHandlers.onPointerUp(event);
    };
    gridHandlers.onContextMenu = drawHandlers.onContextMenu;
  } else if (drawable) {
    gridHandlers.onContextMenu = drawHandlers.onContextMenu;
    gridHandlers.onPointerDown = drawHandlers.onPointerDown;
    gridHandlers.onPointerMove = drawHandlers.onPointerMove;
    gridHandlers.onPointerUp = drawHandlers.onPointerUp;
  }

  return (
    <div ref={containerReference} style={rootStyle}>
      <div
        data-board-grid={isMovable || undefined}
        style={gridStyle}
        {...gridHandlers}
      >
        {SQUARES.map((square) => {
          const color = squareColor(square);
          const coords = squareCoords(square, orientation);
          const piece = positionMap.get(square);
          const isHighlighted = highlightSet.has(square);
          const hasLegalDot = legalTargets.has(square);
          const isSelected = isMovable && selectedSquare === square;
          const hidePiece =
            isMovable && dragState.isDragging && dragState.from === square;

          const file = square[0];
          const rank = square[1];

          const showRankCoord =
            coordinates &&
            (orientation === 'white' ? file === 'a' : file === 'h');
          const showFileCoord =
            coordinates &&
            (orientation === 'white' ? rank === '1' : rank === '8');

          const squareStyle: React.CSSProperties = {
            background:
              color === 'dark'
                ? 'var(--board-dark-square, #779952)'
                : 'var(--board-light-square, #edeed1)',
            gridColumn: String(coords.col),
            gridRow: String(coords.row),
            position: 'relative',
          };

          const rankCoordStyle: React.CSSProperties = {
            color:
              color === 'light'
                ? 'var(--board-coordinate-on-light, #779952)'
                : 'var(--board-coordinate-on-dark, #edeed1)',
            fontSize: `${squareSize * 0.15}px`,
            fontWeight: 'var(--board-coordinate-weight, 600)',
            left: '2px',
            lineHeight: 1,
            pointerEvents: 'none',
            position: 'absolute',
            top: '2px',
            userSelect: 'none',
          };

          const fileCoordStyle: React.CSSProperties = {
            bottom: '2px',
            color:
              color === 'light'
                ? 'var(--board-coordinate-on-light, #779952)'
                : 'var(--board-coordinate-on-dark, #edeed1)',
            fontSize: `${squareSize * 0.15}px`,
            fontWeight: 'var(--board-coordinate-weight, 600)',
            lineHeight: 1,
            pointerEvents: 'none',
            position: 'absolute',
            right: '2px',
            userSelect: 'none',
          };

          const highlightStyle: React.CSSProperties = {
            background: 'var(--board-highlight, rgba(255, 255, 0, 0.4))',
            height: '100%',
            inset: 0,
            position: 'absolute',
            width: '100%',
          };

          const legalDotStyle: React.CSSProperties = {
            background: 'var(--board-legal-dot, rgba(0, 0, 0, 0.2))',
            borderRadius: '50%',
            height: '30%',
            left: '50%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30%',
          };

          let pieceImage: string | undefined;

          if (piece && !hidePiece) {
            const key = pieceKey(piece.color, piece.type);
            pieceImage = pieces[key];
          }

          const animOffset = animationOffsets.get(square);
          const pieceStyle: React.CSSProperties | undefined = pieceImage
            ? {
                backgroundImage: `url("${pieceImage}")`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                height: '100%',
                position: 'relative',
                width: '100%',
                zIndex: 1,
                ...(animOffset
                  ? {
                      transform: `translate(${animOffset.x}px, ${animOffset.y}px)`,
                      transition:
                        animOffset.x !== 0 || animOffset.y !== 0
                          ? 'none'
                          : 'var(--board-piece-transition, transform 200ms ease)',
                    }
                  : undefined),
              }
            : undefined;

          return (
            <div data-square={square} key={square} style={squareStyle}>
              {(isHighlighted || isSelected) && (
                <div
                  data-highlight={isHighlighted || undefined}
                  data-selected={isSelected || undefined}
                  style={highlightStyle}
                />
              )}
              {pieceStyle && <div data-piece style={pieceStyle} />}
              {hasLegalDot && <div data-legal-dot style={legalDotStyle} />}
              {showRankCoord && (
                <span data-coordinate="rank" style={rankCoordStyle}>
                  {rank}
                </span>
              )}
              {showFileCoord && (
                <span data-coordinate="file" style={fileCoordStyle}>
                  {file}
                </span>
              )}
            </div>
          );
        })}
        {children}
      </div>
      <AnnotationOverlay
        arrows={[...arrows, ...userAnnotations.arrows]}
        circles={userAnnotations.circles}
        orientation={orientation}
        squareSize={squareSize}
      />
      {ghostStyle && <div data-ghost style={ghostStyle} />}
    </div>
  );
}

export default Board;
