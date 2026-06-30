import { defineStore } from 'pinia';
import {
  BOARD_SIZES,
  DEFAULT_BOARD_SIZE,
  DEFAULT_PALETTE,
  PALETTES,
  getBoardSize,
  getPalette,
  type BeadCount,
  type BeadGrid,
  type BoardSize,
  type ConvertOptions,
  type ConvertResult,
  type Inventory,
  type InventoryEntry,
  type Palette,
} from '@pindou/shared';
import { loadInventory, saveInventory, clearInventory } from '@/services/inventoryRepo';

/** 一个格的目标颜色变更（index = -1 表示清空为空珠）。 */
export interface CellChange {
  row: number;
  col: number;
  index: number;
}

interface DesignState {
  boardSizeId: string;
  paletteId: string;
  options: Required<ConvertOptions>;
  /** 上传并预压缩后的图片源，用于参数变更时重新转换 */
  sourceBlob: Blob | null;
  sourceName: string | null;
  /** 当前（可被编辑修改的）网格 */
  grid: BeadGrid | null;
  /** 转换得到的原始网格快照，橡皮工具据此恢复 */
  originalGrid: BeadGrid | null;
  /** 颜色索引 → 用量，增量维护 */
  countMap: Record<number, number>;
  /**
   * 各品牌色板的库存，按 `Palette.id` 缓存于内存；落盘经 inventoryRepo。
   * 未加载过的 palette 不在此 map（懒加载）。
   */
  inventories: Record<string, Inventory>;
}

function cloneGrid(grid: BeadGrid): BeadGrid {
  return grid.map((row) => row.slice());
}

/** 全量统计网格中各颜色索引的用量。 */
function tally(grid: BeadGrid): Record<number, number> {
  const map: Record<number, number> = {};
  for (const row of grid) {
    for (const idx of row) {
      if (idx < 0) continue;
      map[idx] = (map[idx] ?? 0) + 1;
    }
  }
  return map;
}

export const useDesignStore = defineStore('design', {
  state: (): DesignState => ({
    boardSizeId: DEFAULT_BOARD_SIZE.id,
    paletteId: DEFAULT_PALETTE.id,
    options: { dithering: false, backgroundThreshold: 0 },
    sourceBlob: null,
    sourceName: null,
    grid: null,
    originalGrid: null,
    countMap: {},
    inventories: {},
  }),

  getters: {
    boardSize(state): BoardSize {
      return getBoardSize(state.boardSizeId) ?? DEFAULT_BOARD_SIZE;
    },
    palette(state): Palette {
      return getPalette(state.paletteId) ?? DEFAULT_PALETTE;
    },
    hasDesign(state): boolean {
      return state.grid !== null;
    },
    hasSource(state): boolean {
      return state.sourceBlob !== null;
    },
    availableBoardSizes(): BoardSize[] {
      return BOARD_SIZES;
    },
    availablePalettes(): Palette[] {
      return PALETTES;
    },
    /** 由 countMap 派生的、按用量降序排列的材料清单。 */
    counts(state): BeadCount[] {
      const palette = getPalette(state.paletteId) ?? DEFAULT_PALETTE;
      const list: BeadCount[] = [];
      for (const key of Object.keys(state.countMap)) {
        const index = Number(key);
        const count = state.countMap[index];
        const color = palette.colors[index];
        if (!color || count <= 0) continue;
        list.push({ colorId: color.id, name: color.name, hex: color.hex, count });
      }
      list.sort((a, b) => b.count - a.count);
      return list;
    },
    /**
     * 用到的颜色按用量降序（用量相同按索引升序）排序后的清单，并分配编号（从 1 开始）。
     * 编号与导出（PNG/PDF）保持一致。
     */
    numberedCounts(state): Array<BeadCount & { index: number; number: number }> {
      const palette = getPalette(state.paletteId) ?? DEFAULT_PALETTE;
      const order = Object.keys(state.countMap)
        .map(Number)
        .filter((i) => (state.countMap[i] ?? 0) > 0)
        .sort((a, b) => state.countMap[b] - state.countMap[a] || a - b);
      return order.map((index, i) => {
        const color = palette.colors[index];
        return {
          index,
          number: i + 1,
          colorId: color.id,
          name: color.name,
          hex: color.hex,
          count: state.countMap[index],
        };
      });
    },
    /** 颜色索引 → 图例编号映射，供画布/色板标注。 */
    numberFor(): Record<number, number> {
      const map: Record<number, number> = {};
      for (const e of this.numberedCounts) map[e.index] = e.number;
      return map;
    },
    /** 单格颜色索引（越界或空返回 -1） */
    cellAt(state) {
      return (row: number, col: number): number => {
        const r = state.grid?.[row];
        return r ? (r[col] ?? -1) : -1;
      };
    },
    /** 当前品牌色板的库存（未加载则返回空库存，不触发副作用）。 */
    currentInventory(state): Inventory {
      return state.inventories[state.paletteId] ?? { paletteId: state.paletteId, entries: [] };
    },
    /** 某品牌色板的库存条目数（qty > 0 视为有效拥有色）。 */
    inventoryColorCount(): number {
      return this.currentInventory.entries.filter((e) => e.qty > 0).length;
    },
    /** 当前库存的总珠数（仅 qty > 0 计入）。 */
    inventoryTotalBeads(): number {
      return this.currentInventory.entries.reduce((s, e) => s + (e.qty > 0 ? e.qty : 0), 0);
    },
    /** 当前品牌色板是否已有非空库存（至少一条 qty > 0）。 */
    hasInventory(): boolean {
      return this.inventoryColorCount > 0;
    },
  },

  actions: {
    setBoardSize(id: string) {
      this.boardSizeId = id;
    },
    setPalette(id: string) {
      this.paletteId = id;
    },
    setDithering(value: boolean) {
      this.options.dithering = value;
    },
    setBackgroundThreshold(value: number) {
      this.options.backgroundThreshold = value;
    },
    setSource(blob: Blob | null, name: string | null = null) {
      this.sourceBlob = blob;
      this.sourceName = name;
    },
    /** 取消已上传的图片（同时清空当前设计）。 */
    clearSource() {
      this.sourceBlob = null;
      this.sourceName = null;
      this.grid = null;
      this.originalGrid = null;
      this.countMap = {};
    },
    /** 提交一次转换结果，并据此重建原始网格快照与统计。 */
    commitConversion(result: ConvertResult) {
      this.grid = result.grid;
      this.originalGrid = cloneGrid(result.grid);
      this.countMap = tally(result.grid);
    },
    /**
     * 应用一批格变更并增量更新用量统计。
     * 返回应用前的反向变更（供撤销栈记录）。已无变化的格会被跳过。
     */
    applyCellChanges(changes: CellChange[]): CellChange[] {
      const grid = this.grid;
      if (!grid) return [];
      const inverse: CellChange[] = [];
      for (const { row, col, index } of changes) {
        const gridRow = grid[row];
        if (!gridRow) continue;
        const prev = gridRow[col];
        if (prev === undefined || prev === index) continue;
        inverse.push({ row, col, index: prev });
        gridRow[col] = index;
        if (prev >= 0) {
          const next = (this.countMap[prev] ?? 0) - 1;
          if (next <= 0) delete this.countMap[prev];
          else this.countMap[prev] = next;
        }
        if (index >= 0) {
          this.countMap[index] = (this.countMap[index] ?? 0) + 1;
        }
      }
      return inverse;
    },
    /**
     * 确保某品牌色板的库存已从仓储加载进内存（懒加载，幂等）。
     * 写回 grid / 直读 localStorage 一律不在此处——只经 inventoryRepo。
     */
    ensureInventoryLoaded(paletteId?: string) {
      const pid = paletteId ?? this.paletteId;
      if (this.inventories[pid]) return;
      const palette = getPalette(pid);
      if (!palette) return;
      this.inventories[pid] = loadInventory(palette);
    },
    /**
     * 设置某色号的拥有数量并落盘。
     * - qty <= 0 时移除该条目（取消勾选 / 清零均视为不拥有的登记，详见调用方）。
     * - 仅接受非负整数；非法值由调用方（UI）拦截，这里做兜底归一化。
     */
    setInventoryEntry(colorId: string, qty: number, paletteId?: string) {
      const pid = paletteId ?? this.paletteId;
      this.ensureInventoryLoaded(pid);
      const inv = this.inventories[pid] ?? { paletteId: pid, entries: [] };
      const normalized = Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0;
      const rest = inv.entries.filter((e) => e.colorId !== colorId);
      const next: InventoryEntry[] =
        normalized > 0 ? [...rest, { colorId, qty: normalized }] : rest;
      const updated: Inventory = { paletteId: pid, entries: next };
      this.inventories[pid] = updated;
      saveInventory(updated);
    },
    /** 移除某色号的库存条目（等价于取消勾选「拥有」）。 */
    removeInventoryEntry(colorId: string, paletteId?: string) {
      const pid = paletteId ?? this.paletteId;
      this.ensureInventoryLoaded(pid);
      const inv = this.inventories[pid];
      if (!inv) return;
      const updated: Inventory = {
        paletteId: pid,
        entries: inv.entries.filter((e) => e.colorId !== colorId),
      };
      this.inventories[pid] = updated;
      saveInventory(updated);
    },
    /**
     * 批量设置一组色号的拥有数量（用于「给已勾选项设统一默认数量」）。
     * qty <= 0 的色号会被移除。
     */
    setInventoryBulk(colorIds: string[], qty: number, paletteId?: string) {
      const pid = paletteId ?? this.paletteId;
      this.ensureInventoryLoaded(pid);
      const inv = this.inventories[pid] ?? { paletteId: pid, entries: [] };
      const normalized = Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0;
      const target = new Set(colorIds);
      const map = new Map(inv.entries.map((e) => [e.colorId, e.qty] as const));
      for (const id of target) {
        if (normalized > 0) map.set(id, normalized);
        else map.delete(id);
      }
      const updated: Inventory = {
        paletteId: pid,
        entries: Array.from(map, ([colorId, q]) => ({ colorId, qty: q })),
      };
      this.inventories[pid] = updated;
      saveInventory(updated);
    },
    /** 清空某品牌色板的全部库存（移除分键 + 内存）。 */
    clearInventoryFor(paletteId?: string) {
      const pid = paletteId ?? this.paletteId;
      clearInventory(pid);
      this.inventories[pid] = { paletteId: pid, entries: [] };
    },
    /** 清空当前设计（保留参数设置）。 */
    clearDesign() {
      this.grid = null;
      this.originalGrid = null;
      this.countMap = {};
    },
    reset() {
      this.$reset();
    },
  },
});
