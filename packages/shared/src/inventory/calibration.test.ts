/**
 * Story 4.5 验收：在定稿阈值下，SM-C1 反指标（高视觉影响替代占比）可被测量。
 * 这把「标定 done-ness」固化为可执行断言：分级 API 稳定、占比可算。
 */
import { describe, it, expect } from 'vitest';
import { classifyDeltaE } from './thresholds.js';
import type { Substitution } from '../types.js';

function highImpactRatio(subs: Substitution[]): number {
  if (subs.length === 0) return 0;
  const high = subs.filter((s) => classifyDeltaE(s.deltaE) === 'high').length;
  return high / subs.length;
}

describe('SM-C1 measurability under finalized thresholds', () => {
  it('computes high-visual-impact substitution ratio', () => {
    const subs: Substitution[] = [
      { fromIndex: 0, toIndex: 1, deltaE: 1.0, affectedCells: 10 }, // low
      { fromIndex: 2, toIndex: 3, deltaE: 3.0, affectedCells: 5 }, // mid
      { fromIndex: 4, toIndex: 5, deltaE: 8.0, affectedCells: 2 }, // high
      { fromIndex: 6, toIndex: 7, deltaE: 12.0, affectedCells: 1 }, // high
    ];
    expect(highImpactRatio(subs)).toBe(0.5);
  });

  it('empty substitutions → ratio 0 (no high impact)', () => {
    expect(highImpactRatio([])).toBe(0);
  });

  it('all-low substitutions → ratio 0', () => {
    const subs: Substitution[] = [
      { fromIndex: 0, toIndex: 1, deltaE: 0.5, affectedCells: 1 },
      { fromIndex: 2, toIndex: 3, deltaE: 1.5, affectedCells: 1 },
    ];
    expect(highImpactRatio(subs)).toBe(0);
  });
});
