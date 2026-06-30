import { describe, it, expect } from 'vitest';
import { applySubstitutions } from './substitute.js';
import type { BeadGrid, Substitution } from '../types.js';

function sub(fromIndex: number, toIndex: number): Substitution {
  return { fromIndex, toIndex, deltaE: 1, affectedCells: 0 };
}

describe('applySubstitutions', () => {
  it('replaces all cells of each from-index with its to-index', () => {
    const grid: BeadGrid = [
      [0, 1, 2],
      [2, 0, 1],
    ];
    const out = applySubstitutions(grid, [sub(2, 0), sub(1, 0)]);
    expect(out).toEqual([
      [0, 0, 0],
      [0, 0, 0],
    ]);
  });

  it('keeps empty cells (-1) and non-substituted indices', () => {
    const grid: BeadGrid = [[-1, 0, 3]];
    const out = applySubstitutions(grid, [sub(0, 5)]);
    expect(out).toEqual([[-1, 5, 3]]);
  });

  it('no substitutions returns a copy unchanged', () => {
    const grid: BeadGrid = [[0, 1]];
    const out = applySubstitutions(grid, []);
    expect(out).toEqual(grid);
    expect(out).not.toBe(grid);
  });

  it('does not mutate input', () => {
    const grid: BeadGrid = [[2]];
    applySubstitutions(grid, [sub(2, 0)]);
    expect(grid[0][0]).toBe(2);
  });
});
