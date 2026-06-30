/**
 * 缺口项的人话解读「语气」分类（FR-11 party-mode 决议）。
 * 把「引擎算得出的事」收敛为一个语气枚举，UI 据此选文案（说人话、不甩账本）。
 * 纯逻辑，可单测，零 Vue 依赖。
 */
import type { ShortfallItem } from '../types.js';

export type ShortfallTone =
  | 'missing' // 缺色：一颗没有
  | 'short' // 数量不足：还差 N 颗
  | 'tight' // 够铺，但余量紧张
  | 'roomy'; // 够铺，余量充足

/** 余量「紧张」判据：剩余 ≤ max(1, 需求的 10%)。 */
export function shortfallTone(item: ShortfallItem): ShortfallTone {
  if (item.kind === 'missing') return 'missing';
  if (item.deficit > 0) return 'short';
  const margin = item.owned - item.required;
  const tightBand = Math.max(1, Math.round(item.required * 0.1));
  return margin <= tightBand ? 'tight' : 'roomy';
}
