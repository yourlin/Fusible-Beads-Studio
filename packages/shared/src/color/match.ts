import type { Lab, Palette, RGB } from '../types.js';
import { rgbToLab } from './convert.js';
import { ciede2000 } from './ciede2000.js';

/** 颜色匹配结果。 */
export interface ColorMatch {
  /** 命中颜色在 palette.colors 中的索引 */
  index: number;
  /** ΔE00 距离 */
  deltaE: number;
}

/** 预计算调色板中每个颜色的 Lab 值，供逐像素匹配复用以提速。 */
export function paletteLabs(palette: Palette): Lab[] {
  return palette.colors.map((c) => rgbToLab(c.rgb));
}

/**
 * 在调色板中找到与目标 RGB 颜色 ΔE00 最近的拼豆色。
 * @param rgb 目标颜色
 * @param palette 调色板
 * @param labs 可选的预计算 Lab 数组（见 paletteLabs），逐像素调用时强烈建议传入
 */
export function findClosestColor(rgb: RGB, palette: Palette, labs?: Lab[]): ColorMatch {
  const cache = labs ?? paletteLabs(palette);
  if (cache.length === 0) {
    throw new Error('Palette has no colors');
  }
  const target = rgbToLab(rgb);
  let bestIndex = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < cache.length; i++) {
    const de = ciede2000(target, cache[i]);
    if (de < bestDelta) {
      bestDelta = de;
      bestIndex = i;
      if (de === 0) break;
    }
  }
  return { index: bestIndex, deltaE: bestDelta };
}
