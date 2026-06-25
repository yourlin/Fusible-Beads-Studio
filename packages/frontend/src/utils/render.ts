import type { BeadGrid } from '@pindou/shared';
import { visibleCellRange, type ViewportState } from './viewport';
import { contrastColor } from './exportRender';

export interface RenderOptions {
  grid: BeadGrid;
  /** 调色板各索引对应的 hex 颜色 */
  colors: string[];
  viewport: ViewportState;
  /** CSS 像素视口尺寸 */
  viewW: number;
  viewH: number;
  /** 单块拼板尺寸，用于绘制多板分割线 */
  boardCols?: number;
  boardRows?: number;
  /** 是否绘制单格网格线（缩放足够大时） */
  showGrid?: boolean;
  /** 悬停高亮格 */
  hover?: { col: number; row: number } | null;
  /** 是否在珠子上绘制颜色编号 */
  showNumbers?: boolean;
  /** 颜色索引 → 编号 */
  numberFor?: Record<number, number>;
}

const GRID_LINE = 'rgba(0,0,0,0.08)';
const BOARD_LINE = 'rgba(0,0,0,0.45)';
const HOVER_LINE = 'rgba(25,118,210,0.95)';

/**
 * 在 2D 上下文上渲染拼豆网格：圆形珠子 + 网格线 + 多板分割线 + 悬停高亮。
 * 仅绘制视口内可见的格（视口裁剪）。
 * 调用前上下文应已按 devicePixelRatio 缩放，传入的尺寸为 CSS 像素。
 */
export function renderBeadGrid(ctx: CanvasRenderingContext2D, opts: RenderOptions): void {
  const { grid, colors, viewport, viewW, viewH, showGrid = true } = opts;
  const { scale, offsetX, offsetY } = viewport;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  ctx.clearRect(0, 0, viewW, viewH);
  if (rows === 0 || cols === 0) return;

  const range = visibleCellRange(viewport, viewW, viewH, cols, rows);
  const radius = (scale / 2) * 0.92;

  // 珠子
  for (let row = range.minRow; row <= range.maxRow; row++) {
    const gridRow = grid[row];
    for (let col = range.minCol; col <= range.maxCol; col++) {
      const idx = gridRow[col];
      if (idx < 0) continue;
      const cx = (col + 0.5) * scale + offsetX;
      const cy = (row + 0.5) * scale + offsetY;
      ctx.fillStyle = colors[idx] ?? '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 单格网格线（缩放足够大才画，避免密集时糊成一片）
  if (showGrid && scale >= 6) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID_LINE;
    ctx.beginPath();
    for (let col = range.minCol; col <= range.maxCol + 1; col++) {
      const x = Math.round(col * scale + offsetX) + 0.5;
      ctx.moveTo(x, range.minRow * scale + offsetY);
      ctx.lineTo(x, (range.maxRow + 1) * scale + offsetY);
    }
    for (let row = range.minRow; row <= range.maxRow + 1; row++) {
      const y = Math.round(row * scale + offsetY) + 0.5;
      ctx.moveTo(range.minCol * scale + offsetX, y);
      ctx.lineTo((range.maxCol + 1) * scale + offsetX, y);
    }
    ctx.stroke();
  }

  // 多板分割线
  drawBoardDividers(ctx, opts, range);

  // 颜色编号（缩放足够大时）
  if (opts.showNumbers && opts.numberFor && scale >= 12) {
    const fontSize = Math.max(7, Math.floor(scale * 0.5));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let row = range.minRow; row <= range.maxRow; row++) {
      const gridRow = grid[row];
      for (let col = range.minCol; col <= range.maxCol; col++) {
        const idx = gridRow[col];
        if (idx < 0) continue;
        const num = opts.numberFor[idx];
        if (num == null) continue;
        const cx = (col + 0.5) * scale + offsetX;
        const cy = (row + 0.5) * scale + offsetY;
        ctx.fillStyle = contrastColor(colors[idx] ?? '#000');
        ctx.fillText(String(num), cx, cy);
      }
    }
  }

  // 悬停高亮
  if (opts.hover) {
    const { col, row } = opts.hover;
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = HOVER_LINE;
      ctx.strokeRect(col * scale + offsetX, row * scale + offsetY, scale, scale);
    }
  }
}

function drawBoardDividers(
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions,
  range: { minCol: number; maxCol: number; minRow: number; maxRow: number },
): void {
  const { boardCols, boardRows, viewport, grid } = opts;
  const { scale, offsetX, offsetY } = viewport;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  ctx.lineWidth = 2;
  ctx.strokeStyle = BOARD_LINE;
  ctx.beginPath();

  if (boardCols && boardCols > 0 && boardCols < cols) {
    for (let col = 0; col <= cols; col += boardCols) {
      const x = Math.round(col * scale + offsetX) + 0.5;
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, rows * scale + offsetY);
    }
  }
  if (boardRows && boardRows > 0 && boardRows < rows) {
    for (let row = 0; row <= rows; row += boardRows) {
      const y = Math.round(row * scale + offsetY) + 0.5;
      ctx.moveTo(offsetX, y);
      ctx.lineTo(cols * scale + offsetX, y);
    }
  }
  // 外边框
  ctx.rect(offsetX, offsetY, cols * scale, rows * scale);
  ctx.stroke();
  void range;
}
