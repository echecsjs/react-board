import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PromotionDialog } from '../promotion-dialog.js';

describe('PromotionDialog', () => {
  it('renders four promotion piece options', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PromotionDialog color="white" onSelect={onSelect} squareSize={60} />,
    );
    const pieces = container.querySelectorAll<HTMLElement>("[data-promotion-piece]");
    expect(pieces).toHaveLength(4);
  });

  it('renders pieces in order: queen, rook, bishop, knight', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PromotionDialog color="white" onSelect={onSelect} squareSize={60} />,
    );
    const pieces = container.querySelectorAll<HTMLElement>("[data-promotion-piece]");
    expect(pieces[0]?.dataset.promotionPiece).toBe('q');
    expect(pieces[1]?.dataset.promotionPiece).toBe('r');
    expect(pieces[2]?.dataset.promotionPiece).toBe('b');
    expect(pieces[3]?.dataset.promotionPiece).toBe('n');
  });

  it('calls onSelect with the clicked piece', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PromotionDialog color="white" onSelect={onSelect} squareSize={60} />,
    );
    const rook = container.querySelector(
      '[data-promotion-piece="r"]',
    ) as HTMLElement;
    fireEvent.click(rook);
    expect(onSelect).toHaveBeenCalledWith('r');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
      <PromotionDialog
        color="white"
        onCancel={onCancel}
        onSelect={onSelect}
        squareSize={60}
      />,
    );
    const cancel = container.querySelector(
      '[data-promotion-cancel]',
    ) as HTMLElement;
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not render cancel button when onCancel is not provided', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PromotionDialog color="white" onSelect={onSelect} squareSize={60} />,
    );
    expect(container.querySelector('[data-promotion-cancel]')).toBeNull();
  });

  it('renders black pieces when color is black', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PromotionDialog color="black" onSelect={onSelect} squareSize={60} />,
    );
    const pieces = container.querySelectorAll<HTMLElement>("[data-promotion-piece]");
    expect(pieces).toHaveLength(4);
  });

  it('uses the promotion background CSS variable', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PromotionDialog color="white" onSelect={onSelect} squareSize={60} />,
    );
    const piece = container.querySelector(
      '[data-promotion-piece]',
    ) as HTMLElement;
    expect(piece.style.background).toBe(
      'var(--board-promotion-background, rgba(0, 0, 0, 0.6))',
    );
  });
});
