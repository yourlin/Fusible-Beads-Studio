/**
 * ΔE 视觉影响分级阈值——**单一常量来源**（架构 AD-8）。
 *
 * 分级语义（CIEDE2000 经验区间）：
 * - low  ΔE < 2  ：肉眼几乎无差
 * - mid  2 ≤ ΔE ≤ 5：仔细看可辨
 * - high ΔE > 5  ：明显不同色
 *
 * 标定状态（Story 4.5）：v1 保留 CIEDE2000 公认经验区间（low<2 / 2–5 / >5）作为
 * 定稿值。这些区间是色差领域的标准阈值（ΔE<1 肉眼难辨、1–2 极接近、2–10 可察觉），
 * 用作拼豆替代的视觉影响判据稳健。**仍建议在真实拼豆图纸上人工复核**（见
 * calibration-record.md）；若复核需调整，只改本文件的常量字面量，**不改**
 * classifyDeltaE 的函数签名——FR-7/8/9 全程基于稳定 API 开发。
 * SM-C1 反指标（高视觉影响占比）的判据来源于此。
 */
export const DELTA_E_THRESHOLDS = {
  /** ΔE 低于此值视为「低」视觉影响。 */
  low: 2,
  /** ΔE 高于此值视为「高」视觉影响。 */
  high: 5,
} as const;

export type VisualImpact = 'low' | 'mid' | 'high';

/**
 * 把 CIEDE2000 色差映射为视觉影响分级。
 * 边界归属：dE < low → low；low ≤ dE ≤ high → mid；dE > high → high。
 */
export function classifyDeltaE(deltaE: number): VisualImpact {
  if (deltaE < DELTA_E_THRESHOLDS.low) return 'low';
  if (deltaE > DELTA_E_THRESHOLDS.high) return 'high';
  return 'mid';
}
