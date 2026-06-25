import { describe, it, expect } from 'vitest';
import { assignBeadNumbers } from './beadNumbering';
import type { BeadGrid } from '@pindou/shared';

describe('assignBeadNumbers', () => {
  it('numbers colors by usage descending', () => {
    const grid: BeadGrid = [
      [2, 2, 2],
      [5, 5, -1],
    ];
    const { entries, numberFor } = assignBeadNumbers(grid);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ index: 2, number: 1, count: 3 });
    expect(entries[1]).toMatchObject({ index: 5, number: 2, count: 2 });
    expect(numberFor[2]).toBe(1);
    expect(numberFor[5]).toBe(2);
  });

  it('breaks ties by index ascending', () => {
    const grid: BeadGrid = [[7, 3]];
    const { numberFor } = assignBeadNumbers(grid);
    expect(numberFor[3]).toBe(1);
    expect(numberFor[7]).toBe(2);
  });

  it('ignores empty cells', () => {
    const grid: BeadGrid = [
      [-1, -1],
      [-1, -1],
    ];
    const { entries } = assignBeadNumbers(grid);
    expect(entries).toEqual([]);
  });
});
