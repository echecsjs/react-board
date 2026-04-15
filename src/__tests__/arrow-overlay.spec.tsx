import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ArrowOverlay, { arrowPath } from '../arrow-overlay.js';

import type { Arrow } from '../types.js';

describe('arrowPath', () => {
  const SHAFT_WIDTH = 12;
  const HEAD_WIDTH = 33;
  const HEAD_LENGTH = 21;

  it('returns a closed SVG path string', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    expect(d).toMatch(/^M[\d.L, -]+Z$/);
  });

  it('vertical arrow: tip is at the destination point', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    expect(points[3]![0]).toBeCloseTo(50, 1);
    expect(points[3]![1]).toBeCloseTo(50, 1);
  });

  it('vertical arrow: shaft width is correct', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    const startLeft = points[0]!;
    const startRight = points[6]!;
    const width = Math.abs(startLeft[0]! - startRight[0]!);
    expect(width).toBeCloseTo(SHAFT_WIDTH, 1);
  });

  it('vertical arrow: head width is correct', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    const headLeft = points[2]!;
    const headRight = points[4]!;
    const width = Math.abs(headLeft[0]! - headRight[0]!);
    expect(width).toBeCloseTo(HEAD_WIDTH, 1);
  });

  it('horizontal arrow: tip is at the destination point', () => {
    const d = arrowPath(
      50,
      200,
      350,
      200,
      SHAFT_WIDTH,
      HEAD_WIDTH,
      HEAD_LENGTH,
    );
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    expect(points[3]![0]).toBeCloseTo(350, 1);
    expect(points[3]![1]).toBeCloseTo(200, 1);
  });

  it('diagonal arrow: tip is at the destination point', () => {
    const d = arrowPath(50, 350, 350, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d
      .replace(/^M/, '')
      .replace(/Z$/, '')
      .split('L')
      .map((p) => p.split(',').map(Number));
    expect(points[3]![0]).toBeCloseTo(350, 1);
    expect(points[3]![1]).toBeCloseTo(50, 1);
  });

  it('produces 7 points', () => {
    const d = arrowPath(50, 350, 50, 50, SHAFT_WIDTH, HEAD_WIDTH, HEAD_LENGTH);
    const points = d.replace(/^M/, '').replace(/Z$/, '').split('L');
    expect(points).toHaveLength(7);
  });
});

describe('ArrowOverlay', () => {
  it('renders nothing when arrows is empty', () => {
    const { container } = render(
      <ArrowOverlay arrows={[]} orientation="white" squareSize={60} />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders an svg with data-arrows attribute', () => {
    const arrows: Arrow[] = [{ from: 'e2', to: 'e4', kind: 'move' }];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const svg = container.querySelector('svg[data-arrows]');
    expect(svg).not.toBeNull();
  });

  it('renders one path per arrow', () => {
    const arrows: Arrow[] = [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'f1', to: 'c4', kind: 'alternative' },
    ];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
  });

  it('deduplicates identical arrows', () => {
    const arrows: Arrow[] = [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'e2', to: 'e4', kind: 'move' },
    ];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(1);
  });

  it('applies the correct CSS variable for each kind', () => {
    const arrows: Arrow[] = [
      { from: 'e2', to: 'e4', kind: 'move' },
      { from: 'd2', to: 'd4', kind: 'capture' },
      { from: 'f1', to: 'c4', kind: 'danger' },
      { from: 'g1', to: 'f3', kind: 'alternative' },
    ];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths[0]!.getAttribute('style')).toContain('--board-arrow-move');
    expect(paths[1]!.getAttribute('style')).toContain('--board-arrow-capture');
    expect(paths[2]!.getAttribute('style')).toContain('--board-arrow-danger');
    expect(paths[3]!.getAttribute('style')).toContain(
      '--board-arrow-alternative',
    );
  });

  it('sets pointer-events to none on the svg', () => {
    const arrows: Arrow[] = [{ from: 'e2', to: 'e4', kind: 'move' }];
    const { container } = render(
      <ArrowOverlay arrows={arrows} orientation="white" squareSize={60} />,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.style.pointerEvents).toBe('none');
  });
});
