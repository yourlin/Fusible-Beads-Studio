import { describe, it, expect } from 'vitest';
import { BOARD_SIZES, getBoardSize, DEFAULT_BOARD_SIZE } from './boards.js';

describe('board sizes', () => {
  it('has three presets', () => {
    expect(BOARD_SIZES).toHaveLength(3);
  });

  it('quad board is 58x58 with 29 single board', () => {
    const quad = getBoardSize('quad-58');
    expect(quad).toBeDefined();
    expect(quad?.cols).toBe(58);
    expect(quad?.rows).toBe(58);
    expect(quad?.boardCols).toBe(29);
  });

  it('default board is single 29x29', () => {
    expect(DEFAULT_BOARD_SIZE.cols).toBe(29);
    expect(DEFAULT_BOARD_SIZE.rows).toBe(29);
  });

  it('returns undefined for unknown id', () => {
    expect(getBoardSize('nope')).toBeUndefined();
  });
});
