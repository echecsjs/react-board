import { describe, expect, it } from 'vitest';

import { arrowPath } from '../arrow-overlay.js';

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
