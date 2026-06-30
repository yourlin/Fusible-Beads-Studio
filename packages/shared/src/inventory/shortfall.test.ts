import { describe, it, expect } from 'vitest';
import { shortfallTone } from './shortfall.js';
import type { ShortfallItem } from '../types.js';

function item(p: Partial<ShortfallItem>): ShortfallItem {
  return { colorId: 'c', index: 0, kind: 'insufficient', deficit: 0, required: 100, owned: 100, ...p };
}

describe('shortfallTone', () => {
  it('missing kind → missing', () => {
    expect(shortfallTone(item({ kind: 'missing', deficit: 50, required: 50, owned: 0 }))).toBe('missing');
  });

  it('insufficient with positive deficit → short', () => {
    expect(shortfallTone(item({ deficit: 100, required: 2000, owned: 1900 }))).toBe('short');
  });

  it('owned barely covers required → tight', () => {
    // 需求 1000，拥有 1050，余量 50 ≤ 10%(100) → 紧张
    expect(shortfallTone(item({ deficit: 0, required: 1000, owned: 1050 }))).toBe('tight');
  });

  it('owned comfortably exceeds required → roomy', () => {
    // 需求 1000，拥有 2000，余量 1000 > 100 → 充足
    expect(shortfallTone(item({ deficit: 0, required: 1000, owned: 2000 }))).toBe('roomy');
  });

  it('tiny required uses floor band of 1', () => {
    // 需求 5，拥有 6，余量 1 ≤ max(1, round(0.5))=1 → 紧张
    expect(shortfallTone(item({ deficit: 0, required: 5, owned: 6 }))).toBe('tight');
  });
});
