import { describe, it, expect } from 'vitest';
import { rematchToInventory } from './rematch.js';
import type { BeadGrid, Inventory, Palette } from '../types.js';

const palette: Palette = {
  id: 'p',
  name: 'P',
  brand: 'generic',
  colors: [
    { id: 'red', name: 'Red', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 } },
    { id: 'red2', name: 'Red2', hex: '#FE0000', rgb: { r: 254, g: 0, b: 0 } },
    { id: 'blue', name: 'Blue', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 } },
  ],
};

function inv(entries: Array<[string, number]>): Inventory {
  return { paletteId: 'p', entries: entries.map(([colorId, qty]) => ({ colorId, qty })) };
}

describe('rematchToInventory', () => {
  it('remaps out-of-stock indices to nearest in mask, keeps in-stock unchanged', () => {
    const grid: BeadGrid = [
      [0, 2], // red, blue
      [2, 0],
    ];
    // 库存只有 red2 与 blue → red(0) 应映射到 red2(1)，blue(2) 保持
    const out = rematchToInventory(grid, palette, inv([['red2', 10], ['blue', 10]]));
    expect(out).toEqual([
      [1, 2],
      [2, 1],
    ]);
  });

  it('keeps empty cells (-1) untouched', () => {
    const grid: BeadGrid = [[-1, 0, -1]];
    const out = rematchToInventory(grid, palette, inv([['red2', 10]]));
    expect(out[0][0]).toBe(-1);
    expect(out[0][2]).toBe(-1);
    expect(out[0][1]).toBe(1); // red → red2
  });

  it('returns a copy unchanged when mask is empty', () => {
    const grid: BeadGrid = [[0, 2]];
    const out = rematchToInventory(grid, palette, inv([]));
    expect(out).toEqual(grid);
    expect(out).not.toBe(grid); // 是副本
  });

  it('does not mutate the input grid', () => {
    const grid: BeadGrid = [[0]];
    rematchToInventory(grid, palette, inv([['red2', 10]]));
    expect(grid[0][0]).toBe(0);
  });
});
