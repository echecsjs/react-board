import { DEFAULT_PIECES } from './pieces/index.js';

import type { PieceKey, PieceSet } from './types.js';
import type React from 'react';

type PromotionPiece = 'b' | 'n' | 'q' | 'r';

interface PromotionDialogProperties {
  color: 'black' | 'white';
  onCancel?: () => void;
  onSelect: (piece: PromotionPiece) => void;
  pieces?: PieceSet;
  squareSize: number;
}

const PROMOTION_PIECES: PromotionPiece[] = ['q', 'r', 'b', 'n'];

function PromotionDialog({
  color,
  onCancel,
  onSelect,
  pieces = DEFAULT_PIECES,
  squareSize,
}: PromotionDialogProperties): React.JSX.Element {
  const colorPrefix = color === 'white' ? 'w' : 'b';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 100,
  };

  const itemStyle: React.CSSProperties = {
    alignItems: 'center',
    background: 'var(--board-promotion-background, rgba(0, 0, 0, 0.6))',
    cursor: 'pointer',
    display: 'flex',
    height: squareSize,
    justifyContent: 'center',
    width: squareSize,
  };

  return (
    <div data-promotion-dialog style={containerStyle}>
      {PROMOTION_PIECES.map((piece) => {
        const key: PieceKey =
          `${colorPrefix}${piece.toUpperCase()}` as PieceKey;
        const PieceComponent = pieces[key];

        return (
          <div
            data-promotion-piece={piece}
            key={piece}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(piece);
            }}
            style={itemStyle}
          >
            <PieceComponent size={squareSize * 0.85} />
          </div>
        );
      })}
      {onCancel && (
        <div
          data-promotion-cancel
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          style={{
            ...itemStyle,
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: squareSize * 0.3,
          }}
        >
          {'\u00D7'}
        </div>
      )}
    </div>
  );
}

export { PromotionDialog };
export type {
  PromotionDialogProperties as PromotionDialogProps,
  PromotionPiece,
};
