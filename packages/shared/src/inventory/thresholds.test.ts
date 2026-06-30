import { describe, it, expect } from 'vitest';
import { classifyDeltaE, DELTA_E_THRESHOLDS } from './thresholds.js';

describe('classifyDeltaE', () => {
  it('classifies low (< low threshold)', () => {
    expect(classifyDeltaE(0)).toBe('low');
    expect(classifyDeltaE(1.9)).toBe('low');
  });

  it('classifies mid (low ≤ dE ≤ high)', () => {
    expect(classifyDeltaE(2)).toBe('mid');
    expect(classifyDeltaE(3.5)).toBe('mid');
    expect(classifyDeltaE(5)).toBe('mid');
  });

  it('classifies high (> high threshold)', () => {
    expect(classifyDeltaE(5.01)).toBe('high');
    expect(classifyDeltaE(20)).toBe('high');
  });

  it('uses the single-source threshold constants', () => {
    expect(DELTA_E_THRESHOLDS.low).toBe(2);
    expect(DELTA_E_THRESHOLDS.high).toBe(5);
  });
});
