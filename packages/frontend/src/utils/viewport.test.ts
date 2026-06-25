import { describe, it, expect } from 'vitest';
import {
  clampScale,
  screenToCell,
  cellToScreen,
  zoomAt,
  panBy,
  fit,
  visibleCellRange,
  MAX_SCALE,
  MIN_SCALE,
  type ViewportState,
} from './viewport';

const base: ViewportState = { scale: 10, offsetX: 100, offsetY: 50 };

describe('viewport math', () => {
  it('clamps scale to bounds', () => {
    expect(clampScale(0.1)).toBe(MIN_SCALE);
    expect(clampScale(9999)).toBe(MAX_SCALE);
    expect(clampScale(12)).toBe(12);
  });

  it('screenToCell and cellToScreen are inverse', () => {
    const cell = screenToCell(base, 250, 130);
    const screen = cellToScreen(base, cell.col, cell.row);
    expect(screen.x).toBeCloseTo(250, 6);
    expect(screen.y).toBeCloseTo(130, 6);
  });

  it('zoomAt keeps the anchor cell fixed under the cursor', () => {
    const anchorX = 230;
    const anchorY = 170;
    const before = screenToCell(base, anchorX, anchorY);
    const zoomed = zoomAt(base, anchorX, anchorY, 1.5);
    const after = screenToCell(zoomed, anchorX, anchorY);
    expect(zoomed.scale).toBeCloseTo(15, 6);
    expect(after.col).toBeCloseTo(before.col, 6);
    expect(after.row).toBeCloseTo(before.row, 6);
  });

  it('zoomAt respects scale clamping', () => {
    const zoomed = zoomAt({ scale: MAX_SCALE, offsetX: 0, offsetY: 0 }, 0, 0, 2);
    expect(zoomed.scale).toBe(MAX_SCALE);
  });

  it('panBy shifts offset only', () => {
    const p = panBy(base, 5, -7);
    expect(p).toEqual({ scale: 10, offsetX: 105, offsetY: 43 });
  });

  it('fit centers content within the viewport', () => {
    const v = fit(29, 29, 600, 400, 16);
    // scale limited by the smaller available dimension (height)
    expect(v.scale).toBeCloseTo((400 - 32) / 29, 6);
    const contentW = 29 * v.scale;
    expect(v.offsetX).toBeCloseTo((600 - contentW) / 2, 6);
  });

  it('visibleCellRange clips to grid bounds', () => {
    // tiny scale so whole 29x29 board is visible
    const v = fit(29, 29, 600, 400);
    const r = visibleCellRange(v, 600, 400, 29, 29);
    expect(r.minCol).toBe(0);
    expect(r.minRow).toBe(0);
    expect(r.maxCol).toBe(28);
    expect(r.maxRow).toBe(28);
  });

  it('visibleCellRange returns a sub-window when zoomed in', () => {
    const state: ViewportState = { scale: 40, offsetX: 0, offsetY: 0 };
    const r = visibleCellRange(state, 200, 200, 100, 100);
    // 200px / 40px-per-cell = 5 cells visible (+1 margin each side)
    expect(r.minCol).toBe(0);
    expect(r.maxCol).toBeLessThanOrEqual(6);
  });
});
