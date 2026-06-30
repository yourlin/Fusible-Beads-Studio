/**
 * Story 2.5 — 库存模式关闭·基线零回归测试套件（AD-7 / NFR-1 / SM-C2）。
 *
 * 钉死：库存模式默认关闭，关闭时库存派生完全不参与，转珠 / countMap / 撤销路径
 * 与引入库存功能前完全一致。任何改动 store / 匹配路径的后续工作都须保持本套件通过。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDesignStore } from './design';
import { DEFAULT_PALETTE } from '@pindou/shared';
import type { ConvertResult } from '@pindou/shared';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

function sampleResult(): ConvertResult {
  // 3×3 网格，含空珠
  return {
    grid: [
      [0, 1, -1],
      [1, 0, 2],
      [-1, 2, 0],
    ],
    counts: [],
  };
}

describe('design store · 库存模式关闭零回归', () => {
  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage() as unknown as Storage;
    setActivePinia(createPinia());
  });

  it('inventoryMode defaults to false', () => {
    const store = useDesignStore();
    expect(store.inventoryMode).toBe(false);
  });

  it('inventoryAnalysis is null while mode is off (zero participation)', () => {
    const store = useDesignStore();
    store.commitConversion(sampleResult());
    // 即便录了库存，关模式下分析也不参与
    store.setInventoryEntry(DEFAULT_PALETTE.colors[0].id, 100);
    expect(store.inventoryMode).toBe(false);
    expect(store.inventoryAnalysis).toBeNull();
  });

  it('cannot enable inventory mode with empty inventory (guarded)', () => {
    const store = useDesignStore();
    store.commitConversion(sampleResult());
    store.setInventoryMode(true);
    expect(store.inventoryMode).toBe(false); // 空库存被拒
  });

  it('commitConversion + countMap behave identically regardless of inventory', () => {
    const store = useDesignStore();
    store.commitConversion(sampleResult());
    // index 0 出现 3 次, 1 出现 2 次, 2 出现 2 次
    expect(store.countMap[0]).toBe(3);
    expect(store.countMap[1]).toBe(2);
    expect(store.countMap[2]).toBe(2);
    expect(store.counts.length).toBe(3);
  });

  it('applyCellChanges keeps three invariants with mode off', () => {
    const store = useDesignStore();
    store.commitConversion(sampleResult());
    const inverse = store.applyCellChanges([{ row: 0, col: 0, index: 2 }]);
    expect(store.grid![0][0]).toBe(2);
    expect(store.countMap[0]).toBe(2); // 3 → 2
    expect(store.countMap[2]).toBe(3); // 2 → 3
    // 反向变更可整体回退
    store.applyCellChanges(inverse);
    expect(store.grid![0][0]).toBe(0);
    expect(store.countMap[0]).toBe(3);
  });

  it('turning mode off after using it returns analysis to null', () => {
    const store = useDesignStore();
    store.commitConversion(sampleResult());
    store.setInventoryEntry(DEFAULT_PALETTE.colors[0].id, 100);
    store.setInventoryMode(true);
    expect(store.inventoryAnalysis).not.toBeNull();
    store.setInventoryMode(false);
    expect(store.inventoryAnalysis).toBeNull();
  });
});
