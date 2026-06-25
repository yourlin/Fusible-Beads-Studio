import type { BeadGrid } from '@pindou/shared';

export interface BeadNumberEntry {
  /** 调色板颜色索引 */
  index: number;
  /** 图例编号（从 1 开始） */
  number: number;
  /** 用量 */
  count: number;
}

/**
 * 为网格中实际用到的颜色分配图例编号（按用量降序，用量相同按索引升序）。
 * 返回有序条目数组与 index→number 的映射，供导出时在珠子上标注。
 */
export function assignBeadNumbers(grid: BeadGrid): {
  entries: BeadNumberEntry[];
  numberFor: Record<number, number>;
} {
  const counts = new Map<number, number>();
  for (const row of grid) {
    for (const idx of row) {
      if (idx < 0) continue;
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] - b[0];
  });

  const entries: BeadNumberEntry[] = [];
  const numberFor: Record<number, number> = {};
  sorted.forEach(([index, count], i) => {
    const number = i + 1;
    entries.push({ index, number, count });
    numberFor[index] = number;
  });

  return { entries, numberFor };
}
