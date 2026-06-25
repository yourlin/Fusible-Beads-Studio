import { describe, it, expect } from 'vitest';
import { DEFAULT_PALETTE, hexToRgb, type BoardSize } from '@pindou/shared';
import { convertImageData, countGrid, type ImageLike } from './imageConvert';

/** 构建一个 w×h 的像素缓冲，pixel(x,y) 返回 [r,g,b,a]。 */
function makeImage(
  w: number,
  h: number,
  pixel: (x: number, y: number) => [number, number, number, number],
): ImageLike {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const [r, g, b, a] = pixel(x, y);
      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = b;
      data[p + 3] = a;
    }
  }
  return { data, width: w, height: h };
}

const board4: BoardSize = { id: 't4', label: '4x4', cols: 4, rows: 4 };
const redRgb = hexToRgb('#E22B27'); // generic g11 "Red", index 10
const redIndex = DEFAULT_PALETTE.colors.findIndex((c) => c.name === 'Red');

describe('convertImageData', () => {
  it('maps a solid exact-palette color to that color everywhere', () => {
    const img = makeImage(4, 4, () => [redRgb.r, redRgb.g, redRgb.b, 255]);
    const { grid, counts } = convertImageData(img, board4, DEFAULT_PALETTE);
    expect(grid).toHaveLength(4);
    expect(grid.every((row) => row.every((idx) => idx === redIndex))).toBe(true);
    expect(counts).toHaveLength(1);
    expect(counts[0].name).toBe('Red');
    expect(counts[0].count).toBe(16);
  });

  it('treats transparent pixels as empty (-1)', () => {
    const img = makeImage(4, 4, (x) => (x === 0 ? [0, 0, 0, 0] : [redRgb.r, redRgb.g, redRgb.b, 255]));
    const { grid, counts } = convertImageData(img, board4, DEFAULT_PALETTE);
    expect(grid.every((row) => row[0] === -1)).toBe(true);
    expect(counts[0].count).toBe(12); // 3 columns * 4 rows
  });

  it('removes near-white pixels when backgroundThreshold > 0', () => {
    const img = makeImage(4, 4, (x) =>
      x === 0 ? [250, 250, 250, 255] : [redRgb.r, redRgb.g, redRgb.b, 255],
    );
    const { grid } = convertImageData(img, board4, DEFAULT_PALETTE, { backgroundThreshold: 10 });
    expect(grid.every((row) => row[0] === -1)).toBe(true);
  });

  it('keeps near-white pixels when threshold is 0 (default)', () => {
    const img = makeImage(4, 4, () => [250, 250, 250, 255]);
    const { grid } = convertImageData(img, board4, DEFAULT_PALETTE);
    expect(grid.every((row) => row.every((idx) => idx !== -1))).toBe(true);
  });

  it('throws when image size does not match the board', () => {
    const img = makeImage(3, 4, () => [0, 0, 0, 255]);
    expect(() => convertImageData(img, board4, DEFAULT_PALETTE)).toThrow();
  });

  it('produces a valid grid and consistent counts with dithering enabled', () => {
    const img = makeImage(4, 4, (x, y) => {
      const v = ((x + y) % 2) * 90 + 60; // alternating mid-grays
      return [v, v, v, 255];
    });
    const { grid, counts } = convertImageData(img, board4, DEFAULT_PALETTE, { dithering: true });
    const colorCount = DEFAULT_PALETTE.colors.length;
    for (const row of grid) {
      for (const idx of row) {
        expect(idx).toBeGreaterThanOrEqual(-1);
        expect(idx).toBeLessThan(colorCount);
      }
    }
    const total = counts.reduce((s, c) => s + c.count, 0);
    expect(total).toBe(16);
  });

  it('counts are sorted by usage descending', () => {
    const img = makeImage(4, 4, (x) =>
      x < 3 ? [redRgb.r, redRgb.g, redRgb.b, 255] : [0, 0, 0, 255],
    );
    const { counts } = convertImageData(img, board4, DEFAULT_PALETTE);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i - 1].count).toBeGreaterThanOrEqual(counts[i].count);
    }
    expect(counts[0].name).toBe('Red');
  });
});

describe('countGrid', () => {
  it('recounts a grid ignoring -1 cells', () => {
    const grid = [
      [redIndex, redIndex, -1],
      [-1, redIndex, -1],
    ];
    const counts = countGrid(grid, DEFAULT_PALETTE);
    expect(counts).toHaveLength(1);
    expect(counts[0].count).toBe(3);
    expect(counts[0].name).toBe('Red');
  });
});
