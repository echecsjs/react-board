import { DEFAULT_PIECES } from './pieces/index.js';

import type { PieceKey, PieceSet, PromotionPiece } from './types.js';
import type { Color } from '@echecs/position';
import type React from 'react';

interface PromotionDialogProperties {
  color: 'black' | 'white';
  onCancel?: () => void;
  onSelect: (piece: PromotionPiece) => void;
  pieces?: PieceSet;
  squareSize: number;
}

const PROMOTION_PIECES: PromotionPiece[] = [
  'queen',
  'rook',
  'bishop',
  'knight',
];

const COLOR_PREFIX: Record<Color, 'b' | 'w'> = { black: 'b', white: 'w' };
const TYPE_KEY: Record<PromotionPiece, string> = {
  bishop: 'B',
  knight: 'N',
  queen: 'Q',
  rook: 'R',
};

function PromotionDialog({
  color,
  onCancel,
  onSelect,
  pieces = DEFAULT_PIECES,
  squareSize,
}: PromotionDialogProperties): React.JSX.Element {
  const colorPrefix = COLOR_PREFIX[color];

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
        const key: PieceKey = `${colorPrefix}${TYPE_KEY[piece]}` as PieceKey;
        const pieceImage = pieces[key];

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
            <div
              style={{
                backgroundImage: `url("${pieceImage}")`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                height: squareSize * 0.85,
                width: squareSize * 0.85,
              }}
            />
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
export type { PromotionDialogProperties as PromotionDialogProps };
