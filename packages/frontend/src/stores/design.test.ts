import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { DEFAULT_BOARD_SIZE, DEFAULT_PALETTE, PALETTES, type ConvertResult } from '@pindou/shared';
import { useDesignStore } from './design';

describe('design store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('has sensible defaults', () => {
    const s = useDesignStore();
    expect(s.boardSizeId).toBe(DEFAULT_BOARD_SIZE.id);
    expect(s.paletteId).toBe(DEFAULT_PALETTE.id);
    expect(s.hasDesign).toBe(false);
    expect(s.hasSource).toBe(false);
    expect(s.options).toEqual({ dithering: false, backgroundThreshold: 0 });
  });

  it('resolves board size and palette getters', () => {
    const s = useDesignStore();
    const other = PALETTES.find((p) => p.id !== DEFAULT_PALETTE.id)!;
    s.setPalette(other.id);
    s.setBoardSize('quad-58');
    expect(s.palette.id).toBe(other.id);
    expect(s.boardSize.cols).toBe(58);
  });

  it('falls back to defaults for unknown ids', () => {
    const s = useDesignStore();
    s.setBoardSize('nope');
    s.setPalette('nope');
    expect(s.boardSize.id).toBe(DEFAULT_BOARD_SIZE.id);
    expect(s.palette.id).toBe(DEFAULT_PALETTE.id);
  });

  it('commits conversion and snapshots an independent originalGrid', () => {
    const s = useDesignStore();
    const result: ConvertResult = {
      grid: [
        [0, 1],
        [-1, 2],
      ],
      counts: [{ colorId: 'g01', name: 'White', hex: '#FFFFFF', count: 3 }],
    };
    s.commitConversion(result);
    expect(s.hasDesign).toBe(true);
    expect(s.cellAt(0, 1)).toBe(1);
    expect(s.cellAt(1, 0)).toBe(-1);

    // mutate current grid; original snapshot must stay intact
    s.grid![0][0] = 9;
    expect(s.originalGrid![0][0]).toBe(0);
  });

  it('clears design but keeps params', () => {
    const s = useDesignStore();
    s.setBoardSize('quad-58');
    s.commitConversion({ grid: [[0]], counts: [] });
    s.clearDesign();
    expect(s.hasDesign).toBe(false);
    expect(s.counts).toEqual([]);
    expect(s.boardSizeId).toBe('quad-58');
  });

  it('updates options', () => {
    const s = useDesignStore();
    s.setDithering(true);
    s.setBackgroundThreshold(20);
    expect(s.options.dithering).toBe(true);
    expect(s.options.backgroundThreshold).toBe(20);
  });

  it('derives counts from the grid, sorted by usage desc', () => {
    const s = useDesignStore();
    s.commitConversion({
      grid: [
        [0, 0, 0],
        [1, 1, -1],
      ],
      counts: [],
    });
    expect(s.counts.map((c) => c.count)).toEqual([3, 2]);
    expect(s.counts[0].name).toBe(s.palette.colors[0].name);
  });

  it('applyCellChanges updates grid + counts and returns inverse', () => {
    const s = useDesignStore();
    s.commitConversion({
      grid: [
        [0, 0],
        [1, 1],
      ],
      counts: [],
    });
    const inverse = s.applyCellChanges([
      { row: 0, col: 0, index: 1 },
      { row: 0, col: 1, index: 1 },
    ]);
    expect(s.cellAt(0, 0)).toBe(1);
    // index1 now used 4 times, index0 gone
    const c = s.counts.find((x) => x.name === s.palette.colors[1].name);
    expect(c?.count).toBe(4);
    expect(s.counts.find((x) => x.name === s.palette.colors[0].name)).toBeUndefined();
    // inverse restores
    s.applyCellChanges(inverse);
    expect(s.cellAt(0, 0)).toBe(0);
    expect(s.counts.find((x) => x.name === s.palette.colors[0].name)?.count).toBe(2);
  });

  it('applyCellChanges skips no-op and out-of-range cells', () => {
    const s = useDesignStore();
    s.commitConversion({ grid: [[0, 1]], counts: [] });
    const inv = s.applyCellChanges([
      { row: 0, col: 0, index: 0 }, // no-op
      { row: 9, col: 9, index: 2 }, // out of range
    ]);
    expect(inv).toEqual([]);
  });

  it('can erase to empty (-1)', () => {
    const s = useDesignStore();
    s.commitConversion({ grid: [[0, 0]], counts: [] });
    s.applyCellChanges([{ row: 0, col: 0, index: -1 }]);
    expect(s.cellAt(0, 0)).toBe(-1);
    expect(s.counts[0].count).toBe(1);
  });
});
