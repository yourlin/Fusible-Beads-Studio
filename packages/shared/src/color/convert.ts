import type { Lab, RGB } from '../types.js';

/** 将 "#RRGGBB" / "RRGGBB" / "#RGB" 解析为 RGB。 */
export function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** 将 RGB 转为 "#RRGGBB"（大写）。 */
export function rgbToHex({ r, g, b }: RGB): string {
  const to2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** sRGB 通道 (0-255) 线性化到 [0,1] 线性光。 */
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
}

// D65 参考白点
const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

/** RGB (sRGB, 0-255) → CIE XYZ (D65)。 */
export function rgbToXyz({ r, g, b }: RGB): { x: number; y: number; z: number } {
  const lr = srgbToLinear(r) * 100;
  const lg = srgbToLinear(g) * 100;
  const lb = srgbToLinear(b) * 100;
  return {
    x: lr * 0.4124 + lg * 0.3576 + lb * 0.1805,
    y: lr * 0.2126 + lg * 0.7152 + lb * 0.0722,
    z: lr * 0.0193 + lg * 0.1192 + lb * 0.9505,
  };
}

function pivotXyz(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

/** RGB (sRGB, 0-255) → CIE L*a*b* (D65)。 */
export function rgbToLab(rgb: RGB): Lab {
  const { x, y, z } = rgbToXyz(rgb);
  const fx = pivotXyz(x / REF_X);
  const fy = pivotXyz(y / REF_Y);
  const fz = pivotXyz(z / REF_Z);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}
