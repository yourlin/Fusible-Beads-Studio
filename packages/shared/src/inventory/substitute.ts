/**
 * 应用感知替代到图纸（FR-8）的纯逻辑（框架无关）。
 *
 * 整色替换：把每个 `Substitution.fromIndex` 的全部格子换成 `toIndex`（品牌索引，AD-1）。
 * 空珠（-1）不受影响。返回新网格，不修改输入。
 */
import type { BeadGrid, Substitution } from '../types.js';

/**
 * @param grid 当前图纸
 * @param substitutions 要应用的替代（通常来自 analyzeInventory.substitutions）
 */
export function applySubstitutions(grid: BeadGrid, substitutions: Substitution[]): BeadGrid {
  if (substitutions.length === 0) return grid.map((row) => row.slice());
  const remap = new Map<number, number>();
  for (const s of substitutions) remap.set(s.fromIndex, s.toIndex);
  return grid.map((row) =>
    row.map((idx) => {
      if (idx < 0) return idx;
      return remap.get(idx) ?? idx;
    }),
  );
}
