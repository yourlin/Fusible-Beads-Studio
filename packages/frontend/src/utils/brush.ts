/**
 * 圆形笔刷几何：给定直径（格数），返回相对中心格的偏移集合。
 *
 * 绘制（useEditor）与悬停预览（render）共用此函数，保证「看到的圆 = 画出的圆」。
 * 判据：格子中心到光标格中心的欧氏距离 ≤ 半径。
 * - size=1 → 仅中心格 [{0,0}]
 * - size=2 → 2×2 方块（半径 1，四格中心距均 ≤ 1）
 * - size≥3 → 近似圆形
 */
export interface BrushOffset {
  dr: number;
  dc: number;
}

export function brushOffsets(size: number): BrushOffset[] {
  const s = Math.max(1, Math.floor(size));
  if (s === 1) return [{ dr: 0, dc: 0 }];

  const half = Math.floor(s / 2);
  // 偶数直径：中心落在格交点，整体向左上偏移半格，使覆盖对称。
  const center = (s - 1) / 2;
  // 半径取直径的一半，略放宽以让边缘格纳入更自然。
  const radius = s / 2;
  const offsets: BrushOffset[] = [];
  for (let dr = -half; dr <= s - 1 - half; dr++) {
    for (let dc = -half; dc <= s - 1 - half; dc++) {
      // 以「中心」为基准的实际位置（偶数时中心在格交点）
      const y = dr + half - center;
      const x = dc + half - center;
      if (x * x + y * y <= radius * radius + 1e-6) offsets.push({ dr, dc });
    }
  }
  return offsets;
}
