import { describe, it, expect } from 'vitest';
import { analyzeInventory } from './analyze.js';
import type { BeadGrid, Inventory, Palette } from '../types.js';

// 构造一个小色板：索引 0=红 1=近红 2=蓝 3=绿
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

describe('analyzeInventory', () => {
  it('empty-state contract: empty inventory → unavailable, no throw, no substitutions', () => {
    const grid: BeadGrid = [
      [0, 2],
      [0, 3],
    ];
    const a = analyzeInventory(grid, palette, inv([]));
    expect(a.verdict).toBe('unavailable');
    expect(a.substitutions).toEqual([]);
    expect(a.mask.size).toBe(0);
    // 图纸用到的索引都标 missing
    expect(a.perColorStatus[0]).toBe('missing');
    expect(a.perColorStatus[2]).toBe('missing');
  });

  it('buildable (green): all colors in mask with enough qty', () => {
    const grid: BeadGrid = [
      [0, 0],
      [2, -1],
    ]; // 红×2, 蓝×1
    const a = analyzeInventory(grid, palette, inv([['red', 10], ['blue', 10]]));
    expect(a.verdict).toBe('buildable');
    expect(a.shortfall).toEqual([]);
    expect(a.perColorStatus[0]).toBe('ok');
    expect(a.perColorStatus[2]).toBe('ok');
  });

  it('substitutable (yellow): missing color finds nearest in mask', () => {
    const grid: BeadGrid = [
      [2, 2],
      [2, -1],
    ]; // 蓝×3，但库存只有红/绿 → 蓝缺色
    const a = analyzeInventory(grid, palette, inv([['red', 100], ['green', 100]]));
    expect(a.verdict).toBe('substitutable');
    expect(a.perColorStatus[2]).toBe('missing');
    const sub = a.substitutions.find((s) => s.fromIndex === 2);
    expect(sub).toBeTruthy();
    expect(sub!.affectedCells).toBe(3);
    // 替代目标必须在掩码内
    expect(a.mask.has(sub!.toIndex)).toBe(true);
  });

  it('insufficient (red): color in mask but required > owned, no missing', () => {
    const grid: BeadGrid = [
      [0, 0],
      [0, 0],
    ]; // 红×4
    const a = analyzeInventory(grid, palette, inv([['red', 2]]));
    expect(a.verdict).toBe('insufficient');
    const item = a.shortfall.find((s) => s.index === 0);
    expect(item).toMatchObject({ kind: 'insufficient', deficit: 2, required: 4, owned: 2 });
  });

  it('missing dominates insufficient in verdict (substitutable wins)', () => {
    const grid: BeadGrid = [
      [0, 0, 0], // 红×3
      [2, -1, -1], // 蓝×1（缺色）
    ];
    // 红拥有 1（不足），蓝缺色 → 同时有 missing 与 insufficient
    const a = analyzeInventory(grid, palette, inv([['red', 1]]));
    expect(a.verdict).toBe('substitutable');
    expect(a.shortfall.some((s) => s.kind === 'missing')).toBe(true);
    expect(a.shortfall.some((s) => s.kind === 'insufficient')).toBe(true);
  });

  it('picks the perceptually closest substitute (red2 over green for red-ish)', () => {
    // 图纸用「红」，库存有 red2(近red) 与 green → 应替代为 red2
    const grid: BeadGrid = [[0]];
    const a = analyzeInventory(grid, palette, inv([['red2', 50], ['green', 50]]));
    const sub = a.substitutions.find((s) => s.fromIndex === 0);
    expect(sub!.toIndex).toBe(1); // red2
    expect(sub!.deltaE).toBeLessThan(2);
  });

  it('all indices in perColorStatus are brand-palette indices (same space as grid)', () => {
    const grid: BeadGrid = [[3]];
    const a = analyzeInventory(grid, palette, inv([['green', 5]]));
    expect(a.perColorStatus[3]).toBe('ok');
    expect(Object.keys(a.perColorStatus)).toEqual(['3']);
  });
});
