import { describe, it, expect } from 'vitest';
import { floodFill } from './floodFill';
import type { BeadGrid } from '@pindou/shared';

describe('floodFill', () => {
  it('fills a connected region of the same color', () => {
    const grid: BeadGrid = [
      [0, 0, 1],
      [0, 1, 1],
      [2, 2, 1],
    ];
    const changed = floodFill(grid, 0, 0, 5);
    // the connected 0-region is (0,0),(0,1),(1,0) = 3 cells
    expect(changed).toHaveLength(3);
    const keys = changed.map((c) => `${c.row},${c.col}`).sort();
    expect(keys).toEqual(['0,0', '0,1', '1,0']);
  });

  it('does nothing when new color equals target', () => {
    const grid: BeadGrid = [
      [3, 3],
      [3, 3],
    ];
    expect(floodFill(grid, 0, 0, 3)).toEqual([]);
  });

  it('fills the whole grid when uniform', () => {
    const grid: BeadGrid = [
      [1, 1, 1],
      [1, 1, 1],
    ];
    expect(floodFill(grid, 1, 1, 9)).toHaveLength(6);
  });

  it('respects diagonal disconnection (4-neighbour only)', () => {
    const grid: BeadGrid = [
      [1, 0],
      [0, 1],
    ];
    // top-left 1 is not connected to bottom-right 1 diagonally
    expect(floodFill(grid, 0, 0, 7)).toHaveLength(1);
  });

  it('can fill empty (-1) regions', () => {
    const grid: BeadGrid = [
      [-1, -1, 2],
      [-1, 2, 2],
    ];
    const changed = floodFill(grid, 0, 0, 4);
    expect(changed).toHaveLength(3);
  });

  it('handles out-of-bounds start gracefully', () => {
    const grid: BeadGrid = [[0]];
    expect(floodFill(grid, 5, 5, 1)).toEqual([]);
  });

  it('does not overflow on a large uniform grid', () => {
    const n = 100;
    const grid: BeadGrid = Array.from({ length: n }, () => new Array(n).fill(0));
    expect(floodFill(grid, 0, 0, 1)).toHaveLength(n * n);
  });
});
