import { ref } from 'vue';
import { hexToRgb } from '@pindou/shared';
import { useDesignStore } from '@/stores/design';
import { assignBeadNumbers } from '@/utils/beadNumbering';
import {
  exceedsMaxSize,
  exportDimensions,
  renderBeadExport,
  MAX_EXPORT_PX,
  contrastColor,
} from '@/utils/exportRender';
import { buildBomRows, totalBeadCount, type BomRow } from '@/utils/pdfLayout';
import { downloadBlob, timestampedName } from '@/utils/download';
import { t } from '@/plugins/i18n';

export interface PngExportOptions {
  cellSize?: number;
  showGrid?: boolean;
  showNumbers?: boolean;
}

export interface PdfExportOptions {
  cellSizeMm?: number;
  showGrid?: boolean;
  showNumbers?: boolean;
}

/** 导出相关 composable（PNG；PDF 在 Task 8 接入）。 */
export function useExport() {
  const store = useDesignStore();
  const exporting = ref(false);
  const exportingPdf = ref(false);
  const error = ref<string | null>(null);

  async function exportPng(options: PngExportOptions = {}): Promise<boolean> {
    error.value = null;
    const grid = store.grid;
    if (!grid) {
      error.value = t('exportCtl.noDesign');
      return false;
    }
    const cellSize = options.cellSize ?? 20;

    if (exceedsMaxSize(grid, cellSize)) {
      const { width, height } = exportDimensions(grid, cellSize);
      error.value = t('exportCtl.tooLarge', { w: width, h: height, max: MAX_EXPORT_PX });
      return false;
    }

    exporting.value = true;
    try {
      const { numberFor } = assignBeadNumbers(grid);
      const canvas = document.createElement('canvas');
      const legend = store.numberedCounts.map((c) => ({
        number: c.number,
        hex: c.hex,
        name: c.name,
        count: c.count,
      }));
      renderBeadExport(canvas, {
        grid,
        colors: store.palette.colors,
        cellSize,
        showGrid: options.showGrid ?? true,
        showNumbers: options.showNumbers ?? false,
        boardCols: store.boardSize.boardCols,
        boardRows: store.boardSize.boardRows,
        numberFor,
        legend,
        legendTitle: t('studio.materialList'),
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) {
        error.value = t('exportCtl.pngFailed');
        return false;
      }
      downloadBlob(blob, timestampedName('pindou', 'png'));
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      return false;
    } finally {
      exporting.value = false;
    }
  }

  async function exportPdf(options: PdfExportOptions = {}): Promise<boolean> {
    error.value = null;
    const grid = store.grid;
    if (!grid) {
      error.value = t('exportCtl.noDesign');
      return false;
    }
    exportingPdf.value = true;
    try {
      const { jsPDF } = await import('jspdf');
      const cellMm = options.cellSizeMm ?? 5;
      const showGrid = options.showGrid ?? true;
      const showNumbers = options.showNumbers ?? true;
      const { numberFor } = assignBeadNumbers(grid);
      const colors = store.palette.colors;
      const rows = buildBomRows(grid, store.palette);

      const cols = grid[0]?.length ?? 0;
      const gridRows = grid.length;
      const gridW = cols * cellMm;
      const gridH = gridRows * cellMm;

      // 材料清单按列排布（不分页）
      const itemW = 58;
      const itemH = 6.5;
      const listCols = Math.max(1, Math.floor(gridW / itemW));
      const listRows = Math.ceil(rows.length / listCols);
      const listH = rows.length ? LIST_HEADER_H + listRows * itemH : 0;

      // 单页尺寸自适应（mm）
      const contentW = Math.max(gridW, listCols * itemW, 120);
      const pageW = MARGIN * 2 + contentW;
      const pageH = MARGIN * 2 + TITLE_H + gridH + (listH ? GAP + listH : 0);
      const orientation = pageW >= pageH ? 'landscape' : 'portrait';

      const doc = new jsPDF({ orientation, unit: 'mm', format: [pageW, pageH] });

      drawWholeGrid(doc, grid, colors, cellMm, showGrid, showNumbers, numberFor, {
        boardCols: store.boardSize.boardCols,
        boardRows: store.boardSize.boardRows,
        originX: MARGIN,
        originY: MARGIN + TITLE_H,
      });

      // 标题（用 canvas 图像渲染，支持中文）
      const titleText = `${cols} × ${gridRows}  ·  ${totalBeadCount(rows)} ${t('studio.beads')}  ·  ${rows.length} ${t('studio.colors')}`;
      addLabel(doc, titleText, MARGIN, MARGIN, 18, '#141414');

      // 材料清单
      if (rows.length) {
        drawBomColumns(doc, rows, t('studio.materialList'), {
          originX: MARGIN,
          originY: MARGIN + TITLE_H + gridH + GAP,
          itemW,
          itemH,
          listCols,
        });
      }

      doc.save(timestampedName('pindou', 'pdf'));
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      return false;
    } finally {
      exportingPdf.value = false;
    }
  }

  return { exporting, exportingPdf, error, exportPng, exportPdf };
}

const MARGIN = 12;
const TITLE_H = 10;
const GAP = 8;
const LIST_HEADER_H = 8;
const PX_TO_MM = 25.4 / 96;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Pdf = any;

/**
 * 把一段文字渲染成 canvas 图像并放入 PDF（mm 坐标，top 对齐）。
 * 用于本地化标签，绕过 jsPDF 内置字体不支持中文（CJK）的限制。
 */
function addLabel(doc: Pdf, text: string, xMm: number, yMm: number, fontPx: number, color: string): void {
  if (!text) return;
  const ss = 3; // 超采样，保证清晰
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return;
  measure.font = `${fontPx * ss}px sans-serif`;
  const textW = Math.max(1, Math.ceil(measure.measureText(text).width));
  const textH = Math.ceil(fontPx * ss * 1.35);

  const canvas = document.createElement('canvas');
  canvas.width = textW;
  canvas.height = textH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.font = `${fontPx * ss}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.fillText(text, 0, 0);

  const wMm = (textW / ss) * PX_TO_MM;
  const hMm = (textH / ss) * PX_TO_MM;
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', xMm, yMm, wMm, hMm);
}

interface GridDrawOpts {
  boardCols?: number;
  boardRows?: number;
  originX: number;
  originY: number;
}

/** 在单页上绘制整张网格：圆点 + 网格线 + 多板分割线 + 可选编号。 */
function drawWholeGrid(
  doc: Pdf,
  grid: number[][],
  colors: { hex: string }[],
  cell: number,
  showGrid: boolean,
  showNumbers: boolean,
  numberFor: Record<number, number>,
  opts: GridDrawOpts,
): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const { originX, originY } = opts;
  const gridW = cols * cell;
  const gridH = rows * cell;

  // 细网格线
  if (showGrid) {
    doc.setDrawColor(210);
    doc.setLineWidth(0.1);
    for (let c = 0; c <= cols; c++) {
      const x = originX + c * cell;
      doc.line(x, originY, x, originY + gridH);
    }
    for (let r = 0; r <= rows; r++) {
      const y = originY + r * cell;
      doc.line(originX, y, originX + gridW, y);
    }
  }

  // 珠子圆点 + 编号
  const radius = cell * 0.45;
  const fontPt = Math.max(4, cell * 1.7);
  doc.setFontSize(fontPt);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = grid[r][c];
      if (idx < 0) continue;
      const hex = colors[idx]?.hex ?? '#000000';
      const { r: rr, g: gg, b: bb } = hexToRgb(hex);
      const cx = originX + c * cell + cell / 2;
      const cy = originY + r * cell + cell / 2;
      doc.setFillColor(rr, gg, bb);
      doc.circle(cx, cy, radius, 'F');
      if (showNumbers && cell >= 3) {
        const num = numberFor[idx];
        if (num != null) {
          const tc = contrastColor(hex);
          doc.setTextColor(tc === '#000000' ? 0 : 255);
          doc.text(String(num), cx, cy, { align: 'center', baseline: 'middle' });
        }
      }
    }
  }

  // 多板分割线（粗线）
  doc.setDrawColor(90);
  doc.setLineWidth(0.5);
  const { boardCols, boardRows } = opts;
  if (boardCols && boardCols > 0 && boardCols < cols) {
    for (let c = boardCols; c < cols; c += boardCols) {
      const x = originX + c * cell;
      doc.line(x, originY, x, originY + gridH);
    }
  }
  if (boardRows && boardRows > 0 && boardRows < rows) {
    for (let r = boardRows; r < rows; r += boardRows) {
      const y = originY + r * cell;
      doc.line(originX, y, originX + gridW, y);
    }
  }

  // 外框
  doc.setLineWidth(0.5);
  doc.rect(originX, originY, gridW, gridH);
}

interface BomDrawOpts {
  originX: number;
  originY: number;
  itemW: number;
  itemH: number;
  listCols: number;
}

/** 在单页底部按多列绘制材料清单（不分页）。 */
function drawBomColumns(doc: Pdf, rows: BomRow[], title: string, opts: BomDrawOpts): void {
  const { originX, originY, itemW, itemH, listCols } = opts;

  addLabel(doc, title, originX, originY - 4, 15, '#141414');

  const bodyY = originY + LIST_HEADER_H;
  const perCol = Math.ceil(rows.length / listCols);

  rows.forEach((row, i) => {
    const col = Math.floor(i / perCol);
    const rowInCol = i % perCol;
    const x = originX + col * itemW;
    const y = bodyY + rowInCol * itemH;

    const { r, g, b } = hexToRgb(row.hex);
    doc.setFillColor(r, g, b);
    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.circle(x + 2.5, y - 1.2, 2.4, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(20);
    const label = `#${row.number} ${row.name}${row.code ? ` (${row.code})` : ''}`;
    doc.text(label, x + 7, y, { maxWidth: itemW - 18 });
    doc.text(`x${row.count}`, x + itemW - 4, y, { align: 'right' });
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */