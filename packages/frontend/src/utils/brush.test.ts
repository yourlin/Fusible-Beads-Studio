import { describe, it, expect } from 'vitest';
import { brushOffsets } from './brush';

function has(offs: { dr: number; dc: number }[], dr: number, dc: number): boolean {
  return offs.some((o) => o.dr === dr && o.dc === dc);
}

describe('brushOffsets (circular brush)', () => {
  it('size 1 → single center cell', () => {
    expect(brushOffsets(1)).toEqual([{ dr: 0, dc: 0 }]);
  });

  it('size 3 covers the full 3×3 (corners within radius)', () => {
    const offs = brushOffsets(3);
    expect(offs.length).toBe(9);
    expect(has(offs, -1, -1)).toBe(true);
    expect(has(offs, 1, 1)).toBe(true);
  });

  it('size 5 rounds the corners off (not a full 5×5 square)', () => {
    const offs = brushOffsets(5);
    expect(offs.length).toBeLessThan(25);
    // 远角 (±2,±2) 距离 √8≈2.83 > 半径 2.5 → 不纳入
    expect(has(offs, -2, -2)).toBe(false);
    expect(has(offs, 2, 2)).toBe(false);
    // 正上下左右极点纳入
    expect(has(offs, -2, 0)).toBe(true);
    expect(has(offs, 0, 2)).toBe(true);
  });

  it('is symmetric about both axes', () => {
    const offs = brushOffsets(7);
    for (const { dr, dc } of offs) {
      expect(has(offs, -dr, dc)).toBe(true);
      expect(has(offs, dr, -dc)).toBe(true);
    }
  });

  it('clamps non-positive sizes to a single cell', () => {
    expect(brushOffsets(0)).toEqual([{ dr: 0, dc: 0 }]);
  });
});
