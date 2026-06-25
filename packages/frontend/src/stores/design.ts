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
  type Palette,
} from '@pindou/shared';

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
