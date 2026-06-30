/**
 * 以库存色板重新匹配图纸（FR-5）的纯逻辑（框架无关，复用 color 引擎）。
 *
 * 把每个非空格子的当前品牌色，用 CIEDE2000 重匹配到**库存色板掩码内**最近的颜色。
 * 写回的恒为品牌色板索引（AD-1）；空珠（-1）保持不变。
 * 不引入 Web Worker（作用于板尺寸级，NFR-2）。
 */
import type { BeadGrid, Inventory, Palette } from '../types.js';
import { paletteLabs } from '../color/match.js';
import { ciede2000 } from '../color/ciede2000.js';

/** 由库存推导库存色板掩码（品牌索引集合，仅 qty > 0）。 */
function maskOf(inventory: Inventory, palette: Palette): Set<number> {
  const idToIndex = new Map<string, number>();
  palette.colors.forEach((c, i) => idToIndex.set(c.id, i));
  const mask = new Set<number>();
  for (const e of inventory.entries) {
    if (e.qty <= 0) continue;
    const idx = idToIndex.get(e.colorId);
    if (idx !== undefined) mask.add(idx);
  }
  return mask;
}

/**
 * 计算重匹配后的新网格。掩码为空时原样返回（无可用色，调用方应先拦截）。
 * 为每个出现过的源索引缓存其重匹配目标，避免逐格重复计算。
 */
export function rematchToInventory(
  grid: BeadGrid,
  palette: Palette,
  inventory: Inventory,
): BeadGrid {
  const mask = maskOf(inventory, palette);
  if (mask.size === 0) return grid.map((row) => row.slice());

  const labs = paletteLabs(palette);
  const cache = new Map<number, number>();

  function nearest(srcIndex: number): number {
    const hit = cache.get(srcIndex);
    if (hit !== undefined) return hit;
    if (mask.has(srcIndex)) {
      cache.set(srcIndex, srcIndex);
      return srcIndex;
    }
    const target = labs[srcIndex];
    let best = -1;
    let bestDelta = Infinity;
    for (const idx of mask) {
      const de = ciede2000(target, labs[idx]);
      if (de < bestDelta) {
        bestDelta = de;
        best = idx;
        if (de === 0) break;
      }
    }
    cache.set(srcIndex, best);
    return best;
  }

  return grid.map((row) =>
    row.map((idx) => {
      if (idx < 0) return idx; // 空珠保持
      return nearest(idx);
    }),
  );
}
