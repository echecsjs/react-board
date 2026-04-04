import { useEffect, useRef, useState } from 'react';

import { parseFen } from './fen.js';
import { useAnimation } from './hooks/use-animation.js';
import { useDrag } from './hooks/use-drag.js';
import { DEFAULT_PIECES } from './pieces/index.js';
import { SQUARES, squareColor, squareCoords } from './utilities.js';

import type {
  BoardProps as BoardProperties,
  PieceComponent as PieceComponentType,
  PieceKey,
} from './types.js';
import type React from 'react';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function Board({
  animate = true,
  coordinates = true,
  highlight: highlightSquares = [],
  interactive = true,
  legalMoves,
  onMove,
  orientation = 'white',
  pieces = DEFAULT_PIECES,
  position,
}: BoardProperties): React.JSX.Element {
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

  const animationOffsets = useAnimation(
    positionMap,
    squareSize,
    orientation,
    animate,
  );

  const { dragState, handlers, selectedSquare } = useDrag({
    boardRef: containerReference,
    interactive,
    legalMoves,
    onMove,
    orientation,
    pieces: positionMap,
    squareSize,
  });

  // Legal dots: when interactive and a square is selected, show only its legal targets.
  // When interactive=false, show all legalTargets from the prop directly.
  const legalTargets = new Set<string>();

  if (!interactive && legalMoves) {
    for (const targets of legalMoves.values()) {
      for (const sq of targets) {
        legalTargets.add(sq);
      }
    }
  } else if (interactive && selectedSquare && legalMoves) {
    const targets = legalMoves.get(selectedSquare);

    if (targets) {
      for (const sq of targets) {
        legalTargets.add(sq);
      }
    }
  } else if (interactive && dragState.from && legalMoves) {
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
    width: '100%',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gridTemplateRows: 'repeat(8, 1fr)',
    height: '100%',
    width: '100%',
  };

  // Floating ghost piece during drag
  let GhostPiece: PieceComponentType | undefined;

  if (dragState.isDragging && dragState.from) {
    const ghostPiece = positionMap.get(dragState.from);

    if (ghostPiece) {
      const ghostKey: PieceKey =
        `${ghostPiece.color}${ghostPiece.type.toUpperCase()}` as PieceKey;
      GhostPiece = pieces[ghostKey];
    }
  }

  const ghostStyle: React.CSSProperties | undefined =
    dragState.isDragging && dragState.floating
      ? {
          left: dragState.floating.x - squareSize / 2,
          pointerEvents: 'none',
          position: 'fixed',
          top: dragState.floating.y - squareSize / 2,
          zIndex: 9999,
        }
      : undefined;

  return (
    <div ref={containerReference} style={rootStyle}>
      {interactive ? (
        <div
          data-board-grid
          style={gridStyle}
          onPointerDown={handlers.onPointerDown}
          onPointerMove={handlers.onPointerMove}
          onPointerUp={handlers.onPointerUp}
        >
          {SQUARES.map((square) => {
            const color = squareColor(square);
            const coords = squareCoords(square, orientation);
            const piece = positionMap.get(square);
            const isHighlighted = highlightSet.has(square);
            const hasLegalDot = legalTargets.has(square);
            const isSelected = selectedSquare === square;
            // Hide piece on source square while dragging
            const hidePiece = dragState.isDragging && dragState.from === square;

            // Coordinate visibility: rank label on a-file, file label on rank 1
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
              overflow: 'hidden',
              position: 'relative',
            };

            const rankCoordStyle: React.CSSProperties = {
              color:
                color === 'light'
                  ? 'var(--board-coordinate-on-light, #779952)'
                  : 'var(--board-coordinate-on-dark, #edeed1)',
              fontSize: `${squareSize * 0.25}px`,
              fontWeight: 'bold',
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
              fontSize: `${squareSize * 0.25}px`,
              fontWeight: 'bold',
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

            let PieceComponent: PieceComponentType | undefined;

            if (piece && !hidePiece) {
              const key: PieceKey =
                `${piece.color}${piece.type.toUpperCase()}` as PieceKey;
              PieceComponent = pieces[key];
            }

            const animOffset = animationOffsets.get(square);
            const pieceStyle: React.CSSProperties | undefined =
              PieceComponent && animOffset
                ? {
                    transform: `translate(${animOffset.x}px, ${animOffset.y}px)`,
                    transition:
                      animOffset.x !== 0 || animOffset.y !== 0
                        ? 'none'
                        : 'transform 200ms ease',
                  }
                : undefined;

            return (
              <div data-square={square} key={square} style={squareStyle}>
                {PieceComponent && (
                  <div style={pieceStyle}>
                    <PieceComponent size={squareSize} />
                  </div>
                )}
                {(isHighlighted || isSelected) && (
                  <div
                    data-highlight={isHighlighted || undefined}
                    data-selected={isSelected || undefined}
                    style={highlightStyle}
                  />
                )}
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
        </div>
      ) : (
        <div style={gridStyle}>
          {SQUARES.map((square) => {
            const color = squareColor(square);
            const coords = squareCoords(square, orientation);
            const piece = positionMap.get(square);
            const isHighlighted = highlightSet.has(square);
            const hasLegalDot = legalTargets.has(square);

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
              overflow: 'hidden',
              position: 'relative',
            };

            const rankCoordStyle: React.CSSProperties = {
              color:
                color === 'light'
                  ? 'var(--board-coordinate-on-light, #779952)'
                  : 'var(--board-coordinate-on-dark, #edeed1)',
              fontSize: `${squareSize * 0.25}px`,
              fontWeight: 'bold',
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
              fontSize: `${squareSize * 0.25}px`,
              fontWeight: 'bold',
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

            let PieceComponent: PieceComponentType | undefined;

            if (piece) {
              const key: PieceKey =
                `${piece.color}${piece.type.toUpperCase()}` as PieceKey;
              PieceComponent = pieces[key];
            }

            const animOffset = animationOffsets.get(square);
            const pieceStyle: React.CSSProperties | undefined =
              PieceComponent && animOffset
                ? {
                    transform: `translate(${animOffset.x}px, ${animOffset.y}px)`,
                    transition:
                      animOffset.x !== 0 || animOffset.y !== 0
                        ? 'none'
                        : 'transform 200ms ease',
                  }
                : undefined;

            return (
              <div data-square={square} key={square} style={squareStyle}>
                {PieceComponent && (
                  <div style={pieceStyle}>
                    <PieceComponent size={squareSize} />
                  </div>
                )}
                {isHighlighted && <div data-highlight style={highlightStyle} />}
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
        </div>
      )}
      {GhostPiece && ghostStyle && (
        <div data-ghost style={ghostStyle}>
          <GhostPiece size={squareSize} />
        </div>
      )}
    </div>
  );
}

export default Board;
