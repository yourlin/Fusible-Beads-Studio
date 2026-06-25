import {
  findClosestColor,
  paletteLabs,
  type BeadCount,
  type BeadGrid,
  type BoardSize,
  type ConvertOptions,
  type ConvertResult,
  type Palette,
  type RGB,
} from '@pindou/shared';

/** 与 DOM ImageData 兼容的最小结构，便于在无浏览器环境下做单元测试。 */
export interface ImageLike {
  data: Uint8ClampedArray | number[];
  width: number;
  height: number;
}

/** 透明像素判定阈值：alpha 低于此值视为背景（空珠）。 */
const ALPHA_CUTOFF = 128;

function clampByte(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

/**
 * 将已缩放到 cols×rows 的像素数据转换为拼豆网格与用量统计（纯函数）。
 *
 * 背景剔除规则：
 * - alpha < 128 的像素总是视为空珠 (-1)。
 * - 当 backgroundThreshold > 0 时，RGB 各通道都 ≥ (255 - threshold) 的近白像素也视为空珠。
 *
 * 当 dithering 为 true 时使用 Floyd–Steinberg 误差扩散。
 */
export function convertImageData(
  image: ImageLike,
  boardSize: BoardSize,
  palette: Palette,
  options: ConvertOptions = {},
): ConvertResult {
  const { cols, rows } = boardSize;
  if (image.width !== cols || image.height !== rows) {
    throw new Error(
      `Image size ${image.width}x${image.height} does not match board ${cols}x${rows}`,
    );
  }

  const dithering = options.dithering ?? false;
  const backgroundThreshold = options.backgroundThreshold ?? 0;
  const whiteCut = backgroundThreshold > 0 ? 255 - backgroundThreshold : -1;

  const labs = paletteLabs(palette);
  const src = image.data;

  // 工作缓冲（float，用于抖动误差累积）。
  const n = cols * rows;
  const rBuf = new Float32Array(n);
  const gBuf = new Float32Array(n);
  const bBuf = new Float32Array(n);
  const isBg = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const a = src[p + 3];
    const r = src[p];
    const g = src[p + 1];
    const b = src[p + 2];
    rBuf[i] = r;
    gBuf[i] = g;
    bBuf[i] = b;
    const transparent = a < ALPHA_CUTOFF;
    const nearWhite = whiteCut >= 0 && r >= whiteCut && g >= whiteCut && b >= whiteCut;
    isBg[i] = transparent || nearWhite ? 1 : 0;
  }

  const grid: BeadGrid = [];
  const counts = new Map<number, number>();

  for (let y = 0; y < rows; y++) {
    const rowArr: number[] = new Array(cols);
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (isBg[i]) {
        rowArr[x] = -1;
        continue;
      }
      const rgb: RGB = {
        r: clampByte(Math.round(rBuf[i])),
        g: clampByte(Math.round(gBuf[i])),
        b: clampByte(Math.round(bBuf[i])),
      };
      const match = findClosestColor(rgb, palette, labs);
      rowArr[x] = match.index;
      counts.set(match.index, (counts.get(match.index) ?? 0) + 1);

      if (dithering) {
        const matched = palette.colors[match.index].rgb;
        const errR = rgb.r - matched.r;
        const errG = rgb.g - matched.g;
        const errB = rgb.b - matched.b;
        diffuse(rBuf, gBuf, bBuf, isBg, x + 1, y, cols, rows, errR, errG, errB, 7 / 16);
        diffuse(rBuf, gBuf, bBuf, isBg, x - 1, y + 1, cols, rows, errR, errG, errB, 3 / 16);
        diffuse(rBuf, gBuf, bBuf, isBg, x, y + 1, cols, rows, errR, errG, errB, 5 / 16);
        diffuse(rBuf, gBuf, bBuf, isBg, x + 1, y + 1, cols, rows, errR, errG, errB, 1 / 16);
      }
    }
    grid.push(rowArr);
  }

  return { grid, counts: buildCounts(counts, palette) };
}

function diffuse(
  rBuf: Float32Array,
  gBuf: Float32Array,
  bBuf: Float32Array,
  isBg: Uint8Array,
  x: number,
  y: number,
  cols: number,
  rows: number,
  errR: number,
  errG: number,
  errB: number,
  factor: number,
): void {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return;
  const i = y * cols + x;
  if (isBg[i]) return;
  rBuf[i] += errR * factor;
  gBuf[i] += errG * factor;
  bBuf[i] += errB * factor;
}

/** 由颜色索引计数构建排序后的 BeadCount 列表（按用量降序）。 */
export function buildCounts(counts: Map<number, number>, palette: Palette): BeadCount[] {
  const result: BeadCount[] = [];
  for (const [index, count] of counts) {
    const color = palette.colors[index];
    result.push({ colorId: color.id, name: color.name, hex: color.hex, count });
  }
  result.sort((a, b) => b.count - a.count);
  return result;
}

/** 从 BeadGrid 重新统计各颜色用量（编辑后增量更新的兜底全量计算）。 */
export function countGrid(grid: BeadGrid, palette: Palette): BeadCount[] {
  const counts = new Map<number, number>();
  for (const row of grid) {
    for (const idx of row) {
      if (idx < 0) continue;
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
  }
  return buildCounts(counts, palette);
}
