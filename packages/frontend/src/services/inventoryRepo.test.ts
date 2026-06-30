import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadInventory,
  saveInventory,
  clearInventory,
  SCHEMA_VERSION,
} from './inventoryRepo';
import type { Inventory, Palette } from '@pindou/shared';

// jsdom 在本环境未提供完整 localStorage 实现，注入一个内存版用于测试。
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
}
globalThis.localStorage = new MemoryStorage() as unknown as Storage;

const palette: Palette = {
  id: 'test-pal',
  name: 'Test',
  brand: 'generic',
  colors: [
    { id: 'c1', name: 'C1', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
    { id: 'c2', name: 'C2', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
  ],
};

const other: Palette = { ...palette, id: 'other-pal' };

function key(id: string): string {
  return `pindou-inventory:${id}`;
}

describe('inventoryRepo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty inventory when nothing stored', () => {
    expect(loadInventory(palette)).toEqual({ paletteId: 'test-pal', entries: [] });
  });

  it('round-trips save then load', () => {
    const inv: Inventory = { paletteId: 'test-pal', entries: [{ colorId: 'c1', qty: 100 }] };
    saveInventory(inv);
    expect(loadInventory(palette)).toEqual(inv);
  });

  it('writes a versioned envelope with current schema_version', () => {
    saveInventory({ paletteId: 'test-pal', entries: [{ colorId: 'c1', qty: 5 }] });
    const raw = JSON.parse(localStorage.getItem(key('test-pal'))!);
    expect(raw.schema_version).toBe(SCHEMA_VERSION);
    expect(raw.paletteId).toBe('test-pal');
  });

  it('keys by Palette.id — different palettes do not overwrite', () => {
    saveInventory({ paletteId: 'test-pal', entries: [{ colorId: 'c1', qty: 1 }] });
    saveInventory({ paletteId: 'other-pal', entries: [{ colorId: 'c2', qty: 2 }] });
    expect(loadInventory(palette).entries).toEqual([{ colorId: 'c1', qty: 1 }]);
    expect(loadInventory(other).entries).toEqual([{ colorId: 'c2', qty: 2 }]);
  });

  it('drops entries whose colorId does not resolve in the palette (no -1 fallback)', () => {
    const envelope = {
      schema_version: SCHEMA_VERSION,
      paletteId: 'test-pal',
      entries: [
        { colorId: 'c1', qty: 10 },
        { colorId: 'ghost', qty: 99 },
      ],
    };
    localStorage.setItem(key('test-pal'), JSON.stringify(envelope));
    expect(loadInventory(palette).entries).toEqual([{ colorId: 'c1', qty: 10 }]);
  });

  it('drops entries with illegal qty (negative / non-integer)', () => {
    const envelope = {
      schema_version: SCHEMA_VERSION,
      paletteId: 'test-pal',
      entries: [
        { colorId: 'c1', qty: -5 },
        { colorId: 'c2', qty: 3.5 },
      ],
    };
    localStorage.setItem(key('test-pal'), JSON.stringify(envelope));
    expect(loadInventory(palette).entries).toEqual([]);
  });

  it('degrades safely on an unknown future schema_version (no throw, empty)', () => {
    const envelope = {
      schema_version: SCHEMA_VERSION + 99,
      paletteId: 'test-pal',
      entries: [{ colorId: 'c1', qty: 10 }],
    };
    localStorage.setItem(key('test-pal'), JSON.stringify(envelope));
    expect(() => loadInventory(palette)).not.toThrow();
    expect(loadInventory(palette).entries).toEqual([]);
  });

  it('degrades safely on malformed JSON / missing fields', () => {
    localStorage.setItem(key('test-pal'), 'not json');
    expect(loadInventory(palette).entries).toEqual([]);
    localStorage.setItem(key('test-pal'), JSON.stringify({ foo: 'bar' }));
    expect(loadInventory(palette).entries).toEqual([]);
  });

  it('clearInventory removes only its own palette key', () => {
    saveInventory({ paletteId: 'test-pal', entries: [{ colorId: 'c1', qty: 1 }] });
    saveInventory({ paletteId: 'other-pal', entries: [{ colorId: 'c2', qty: 2 }] });
    clearInventory('test-pal');
    expect(loadInventory(palette).entries).toEqual([]);
    expect(loadInventory(other).entries).toEqual([{ colorId: 'c2', qty: 2 }]);
  });
});
