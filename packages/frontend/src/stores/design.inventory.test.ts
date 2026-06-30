import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDesignStore } from './design';
import { DEFAULT_PALETTE, PALETTES } from '@pindou/shared';

// 内存版 localStorage（jsdom 在本环境未提供完整实现）
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

const firstColor = DEFAULT_PALETTE.colors[0].id;
const secondColor = DEFAULT_PALETTE.colors[1].id;

describe('design store · inventory', () => {
  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage() as unknown as Storage;
    setActivePinia(createPinia());
  });

  it('starts with empty inventory for current palette', () => {
    const store = useDesignStore();
    expect(store.hasInventory).toBe(false);
    expect(store.inventoryColorCount).toBe(0);
  });

  it('sets an entry and reflects in summary getters', () => {
    const store = useDesignStore();
    store.setInventoryEntry(firstColor, 500);
    store.setInventoryEntry(secondColor, 300);
    expect(store.hasInventory).toBe(true);
    expect(store.inventoryColorCount).toBe(2);
    expect(store.inventoryTotalBeads).toBe(800);
  });

  it('removing an entry / setting qty 0 drops it', () => {
    const store = useDesignStore();
    store.setInventoryEntry(firstColor, 500);
    store.setInventoryEntry(firstColor, 0);
    expect(store.inventoryColorCount).toBe(0);
    store.setInventoryEntry(firstColor, 500);
    store.removeInventoryEntry(firstColor);
    expect(store.inventoryColorCount).toBe(0);
  });

  it('bulk sets quantities for given colors', () => {
    const store = useDesignStore();
    const ids = DEFAULT_PALETTE.colors.slice(0, 5).map((c) => c.id);
    store.setInventoryBulk(ids, 1000);
    expect(store.inventoryColorCount).toBe(5);
    expect(store.inventoryTotalBeads).toBe(5000);
    // bulk 0 清空
    store.setInventoryBulk(ids, 0);
    expect(store.inventoryColorCount).toBe(0);
  });

  it('keeps separate inventories per palette (no cross-overwrite)', () => {
    const store = useDesignStore();
    const other = PALETTES.find((p) => p.id !== DEFAULT_PALETTE.id)!;
    store.setInventoryEntry(firstColor, 100);
    store.setPalette(other.id);
    store.ensureInventoryLoaded();
    expect(store.inventoryColorCount).toBe(0); // 新色板独立、空
    const otherColor = other.colors[0].id;
    store.setInventoryEntry(otherColor, 200);
    expect(store.inventoryColorCount).toBe(1);
    // 切回原色板，数据仍在
    store.setPalette(DEFAULT_PALETTE.id);
    expect(store.inventoryColorCount).toBe(1);
    expect(store.inventoryTotalBeads).toBe(100);
  });

  it('persists across store instances (cross-session) via repo', () => {
    const store = useDesignStore();
    store.setInventoryEntry(firstColor, 777);
    // 模拟重开：新 pinia，但 localStorage 保留
    setActivePinia(createPinia());
    const store2 = useDesignStore();
    store2.ensureInventoryLoaded();
    expect(store2.inventoryColorCount).toBe(1);
    expect(store2.inventoryTotalBeads).toBe(777);
  });

  it('clearInventoryFor empties current palette', () => {
    const store = useDesignStore();
    store.setInventoryEntry(firstColor, 100);
    store.clearInventoryFor();
    expect(store.inventoryColorCount).toBe(0);
  });
});
