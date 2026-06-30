/**
 * 库存分析单一派生源（架构 AD-5）。
 *
 * 一个纯函数一次算出库存模式所需的全部派生结论：掩码、逐色状态、三态判定、
 * 缺口清单、感知替代建议。框架无关、零 Vue 依赖、可单测，复用既有 color 引擎。
 *
 * 关键不变量：
 * - 所有索引均为**品牌色板索引**，与 grid 同空间（AD-1）。
 * - 「拥有数量 > 0」谓词与「BeadColor.id → 品牌索引」的连接只在此处计算一次。
 * - 空态（库存/掩码为空）返回确定值、不抛错（空态契约）。
 */
import type {
  BeadGrid,
  Inventory,
  InventoryAnalysis,
  Lab,
  Palette,
  PerColorStatus,
  ShortfallItem,
  Substitution,
} from '../types.js';
import { paletteLabs } from '../color/match.js';
import { ciede2000 } from '../color/ciede2000.js';

/** 统计网格中各品牌索引的用量（忽略空珠 -1）。 */
function tallyGrid(grid: BeadGrid): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of grid) {
    for (const idx of row) {
      if (idx < 0) continue;
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * 由库存推导库存色板掩码：colorId → 品牌索引，仅保留 qty > 0 的。
 * 解析不到的 colorId 直接忽略（不污染掩码）。
 */
function buildMask(inventory: Inventory, palette: Palette): { mask: Set<number>; owned: Map<number, number> } {
  const idToIndex = new Map<string, number>();
  palette.colors.forEach((c, i) => idToIndex.set(c.id, i));
  const mask = new Set<number>();
  const owned = new Map<number, number>();
  for (const entry of inventory.entries) {
    if (entry.qty <= 0) continue;
    const index = idToIndex.get(entry.colorId);
    if (index === undefined) continue;
    mask.add(index);
    owned.set(index, entry.qty);
  }
  return { mask, owned };
}

/**
 * 在库存色板掩码内，为某缺色找 ΔE 最小的替代色（CIEDE2000）。
 * @returns 替代目标的品牌索引与 ΔE；掩码为空时返回 null。
 */
function nearestInMask(
  fromIndex: number,
  mask: Set<number>,
  labs: Lab[],
): { toIndex: number; deltaE: number } | null {
  const target = labs[fromIndex];
  let bestIndex = -1;
  let bestDelta = Infinity;
  for (const idx of mask) {
    const de = ciede2000(target, labs[idx]);
    if (de < bestDelta) {
      bestDelta = de;
      bestIndex = idx;
      if (de === 0) break;
    }
  }
  return bestIndex < 0 ? null : { toIndex: bestIndex, deltaE: bestDelta };
}

/**
 * 库存分析单一派生源。
 *
 * @param grid 当前图纸（品牌索引空间）
 * @param brandPalette 当前品牌色板
 * @param inventory 当前库存（须与 brandPalette 同 paletteId，调用方保证）
 */
export function analyzeInventory(
  grid: BeadGrid,
  brandPalette: Palette,
  inventory: Inventory,
): InventoryAnalysis {
  const { mask, owned } = buildMask(inventory, brandPalette);
  const used = tallyGrid(grid);

  // 空态契约：掩码为空 → 不可用，引导录入，不产出替代。
  if (mask.size === 0) {
    const perColorStatus: Record<number, PerColorStatus> = {};
    for (const index of used.keys()) perColorStatus[index] = 'missing';
    return {
      mask,
      perColorStatus,
      verdict: 'unavailable',
      shortfall: [],
      substitutions: [],
    };
  }

  const labs = paletteLabs(brandPalette);
  const perColorStatus: Record<number, PerColorStatus> = {};
  const shortfall: ShortfallItem[] = [];
  const substitutions: Substitution[] = [];

  let hasMissing = false;
  let hasInsufficient = false;

  for (const [index, required] of used) {
    const colorId = brandPalette.colors[index]?.id ?? '';
    if (!mask.has(index)) {
      // 缺色：图纸用到但库存色板里没有
      hasMissing = true;
      perColorStatus[index] = 'missing';
      shortfall.push({ colorId, index, kind: 'missing', deficit: required, required, owned: 0 });
      const sub = nearestInMask(index, mask, labs);
      if (sub) {
        substitutions.push({
          fromIndex: index,
          toIndex: sub.toIndex,
          deltaE: sub.deltaE,
          affectedCells: required,
        });
      }
    } else {
      const have = owned.get(index) ?? 0;
      if (have < required) {
        // 数量不足：在库存色板里，但需求 > 拥有
        hasInsufficient = true;
        perColorStatus[index] = 'insufficient';
        shortfall.push({
          colorId,
          index,
          kind: 'insufficient',
          deficit: required - have,
          required,
          owned: have,
        });
      } else {
        perColorStatus[index] = 'ok';
      }
    }
  }

  // 三态判据（不做替代色库存级联校验）：
  // 有缺色 → 黄（替代后无缺色）；无缺色但有不足 → 红；都没有 → 绿。
  let verdict: InventoryAnalysis['verdict'];
  if (hasMissing) verdict = 'substitutable';
  else if (hasInsufficient) verdict = 'insufficient';
  else verdict = 'buildable';

  return { mask, perColorStatus, verdict, shortfall, substitutions };
}
