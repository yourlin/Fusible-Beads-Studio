/**
 * Story 4.4 验收：预览声称的「受影响格数」必须与应用实际改变的格数一致
 * （预览是对应用的承诺，须可被验证）。
 */
import { describe, it, expect } from 'vitest';
import { analyzeInventory } from './analyze.js';
import { applySubstitutions } from './substitute.js';
import type { BeadGrid, Inventory, Palette } from '../types.js';

const palette: Palette = {
  id: 'p',
  name: 'P',
  brand: 'generic',
  colors: [
    { id: 'red', name: 'Red', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 } },
    { id: 'red2', name: 'Red2', hex: '#FE0000', rgb: { r: 254, g: 0, b: 0 } },
    { id: 'blue', name: 'Blue', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 } },
    { id: 'green', name: 'Green', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 } },
  ],
};

function inv(entries: Array<[string, number]>): Inventory {
  return { paletteId: 'p', entries: entries.map(([colorId, qty]) => ({ colorId, qty })) };
}

function countChanged(a: BeadGrid, b: BeadGrid): number {
  let n = 0;
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) n++;
    }
  }
  return n;
}

describe('substitution preview ↔ apply consistency', () => {
  it('sum of affectedCells equals cells actually changed by apply', () => {
    const grid: BeadGrid = [
      [2, 2, 3], // blue, blue, green（蓝/绿都缺色）
      [3, -1, 2],
    ];
    // 库存只有 red/red2 → blue 与 green 都缺色，会被替代
    const analysis = analyzeInventory(grid, palette, inv([['red', 50], ['red2', 50]]));
    const promised = analysis.substitutions.reduce((s, x) => s + x.affectedCells, 0);
    const after = applySubstitutions(grid, analysis.substitutions);
    expect(countChanged(grid, after)).toBe(promised);
  });

  it('after applying, re-analysis has no missing colors (verdict not substitutable)', () => {
    const grid: BeadGrid = [[2, 2, 3]];
    const a1 = analyzeInventory(grid, palette, inv([['red', 50], ['red2', 50]]));
    expect(a1.verdict).toBe('substitutable');
    const after = applySubstitutions(grid, a1.substitutions);
    const a2 = analyzeInventory(after, palette, inv([['red', 50], ['red2', 50]]));
    // 缺色应消失 → 不再是 substitutable（绿或红，取决于数量）
    expect(a2.verdict).not.toBe('substitutable');
    expect(a2.shortfall.every((s) => s.kind !== 'missing')).toBe(true);
  });
});
