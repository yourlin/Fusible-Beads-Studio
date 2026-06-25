import type { BeadColor, BeadGrid } from '@pindou/shared';

export interface LegendEntry {
  number: number;
  hex: string;
  name: string;
  count: number;
}

export interface ExportRenderOptions {
  grid: BeadGrid;
  colors: BeadColor[];
  /** 每格像素尺寸 */
  cellSize: number;
  showGrid: boolean;
  showNumbers: boolean;
  boardCols?: number;
  boardRows?: number;
  /** 颜色索引 → 图例编号 */
  numberFor?: Record<number, number>;
  /** 背景色（默认白色） */
  background?: string;
  /** 材料清单（提供则在图稿下方绘制图例） */
  legend?: LegendEntry[];
  /** 材料清单标题 */
  legendTitle?: string;
}

/** 单边最大像素限制（超过则视为过大分辨率）。 */
export const MAX_EXPORT_PX = 8000;

export function exportDimensions(
  grid: BeadGrid,
  cellSize: number,
): { width: number; height: number } {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return { width: cols * cellSize, height: rows * cellSize };
}

export function exceedsMaxSize(grid: BeadGrid, cellSize: number): boolean {
  const { width, height } = exportDimensions(grid, cellSize);
  return width > MAX_EXPORT_PX || height > MAX_EXPORT_PX;
}

const LEGEND_PAD = 20;
const LEGEND_TITLE_H = 34;
const LEGEND_ROW_H = 26;
const LEGEND_ITEM_W = 200;

function legendLayout(width: number, count: number): {
  columns: number;
  rowsPerCol: number;
  height: number;
} {
  if (count === 0) return { columns: 0, rowsPerCol: 0, height: 0 };
  const usableW = Math.max(LEGEND_ITEM_W, width - LEGEND_PAD * 2);
  const columns = Math.max(1, Math.floor(usableW / LEGEND_ITEM_W));
  const rowsPerCol = Math.ceil(count / columns);
  const height = LEGEND_PAD + LEGEND_TITLE_H + rowsPerCol * LEGEND_ROW_H + LEGEND_PAD;
  return { columns, rowsPerCol, height };
}

/**
 * 在给定 canvas 上全量渲染拼豆图稿（高清、不做视口裁剪）。
 * 圆形珠子 + 可选网格线 + 多板分割线 + 可选编号 + 可选材料清单图例。
 */
export function renderBeadExport(canvas: HTMLCanvasElement, opts: ExportRenderOptions): void {
  const { grid, colors, cellSize, showGrid, showNumbers, numberFor } = opts;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const width = cols * cellSize;
  const height = rows * cellSize;

  const legend = opts.legend ?? [];
  const legendW = Math.max(width, legend.length ? LEGEND_ITEM_W + LEGEND_PAD * 2 : 0);
  const { rowsPerCol, height: legendH } = legendLayout(legendW, legend.length);
  const totalW = Math.max(width, legendW);
  const totalH = height + legendH;

  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取导出用 2D 上下文');

  // 背景
  ctx.fillStyle = opts.background ?? '#FFFFFF';
  ctx.fillRect(0, 0, totalW, totalH);

  const radius = (cellSize / 2) * 0.92;

  // 珠子
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = grid[row][col];
      if (idx < 0) continue;
      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;
      ctx.fillStyle = colors[idx]?.hex ?? '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 网格线
  if (showGrid) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      const x = Math.round(c * cellSize) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let r = 0; r <= rows; r++) {
      const y = Math.round(r * cellSize) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  // 多板分割线
  drawDividers(ctx, opts, width, height, cols, rows);

  // 编号
  if (showNumbers && numberFor) {
    const fontSize = Math.max(6, Math.floor(cellSize * 0.42));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = grid[row][col];
        if (idx < 0) continue;
        const num = numberFor[idx];
        if (num == null) continue;
        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;
        ctx.fillStyle = contrastColor(colors[idx]?.hex ?? '#000');
        ctx.fillText(String(num), cx, cy);
      }
    }
  }

  // 材料清单图例
  if (legend.length) {
    drawLegend(ctx, legend, opts.legendTitle ?? '', height, rowsPerCol);
  }
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  legend: LegendEntry[],
  title: string,
  top: number,
  rowsPerCol: number,
): void {
  // 分隔线
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(ctx.canvas.width, top + 0.5);
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title, LEGEND_PAD, top + LEGEND_PAD + 12);

  const bodyTop = top + LEGEND_PAD + LEGEND_TITLE_H;
  ctx.font = '15px sans-serif';
  legend.forEach((e, i) => {
    const col = Math.floor(i / rowsPerCol);
    const rowInCol = i % rowsPerCol;
    const x = LEGEND_PAD + col * LEGEND_ITEM_W;
    const y = bodyTop + rowInCol * LEGEND_ROW_H + LEGEND_ROW_H / 2;

    // 色块
    ctx.fillStyle = e.hex;
    ctx.beginPath();
    ctx.arc(x + 8, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 编号
    ctx.fillStyle = contrastColor(e.hex);
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(e.number), x + 8, y + 0.5);
    // 文本
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    const label = `#${e.number} ${e.name} × ${e.count}`;
    ctx.fillText(label, x + 22, y);
  });
}

function drawDividers(
  ctx: CanvasRenderingContext2D,
  opts: ExportRenderOptions,
  width: number,
  height: number,
  cols: number,
  rows: number,
): void {
  const { boardCols, boardRows, cellSize } = opts;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  if (boardCols && boardCols > 0 && boardCols < cols) {
    for (let c = boardCols; c < cols; c += boardCols) {
      const x = Math.round(c * cellSize) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
  }
  if (boardRows && boardRows > 0 && boardRows < rows) {
    for (let r = boardRows; r < rows; r += boardRows) {
      const y = Math.round(r * cellSize) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
  }
  ctx.rect(0.5, 0.5, width - 1, height - 1);
  ctx.stroke();
}

/** 依据背景亮度返回黑或白，保证编号文字可读。 */
export function contrastColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  // 感知亮度
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#FFFFFF';
}
