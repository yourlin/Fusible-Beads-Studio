import type { BeadGrid, BoardSize, Palette } from '@pindou/shared';
import { assignBeadNumbers } from './beadNumbering';

/** 一块拼板在整图中的区域。 */
export interface BoardSegment {
  /** 顺序索引（从 0 开始） */
  index: number;
  /** 板行/列（从 0 开始） */
  boardRow: number;
  boardCol: number;
  /** 覆盖的格范围 [startCol,endCol) × [startRow,endRow) */
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
  /** ASCII 标签（避免 PDF 中文字体嵌入） */
  label: string;
}

/**
 * 按单板尺寸把整图切分为多块拼板区域。
 * 无细分（boardCols/boardRows 缺省或等于整图）时返回单块覆盖全图。
 */
export function computeBoardSegments(board: BoardSize): BoardSegment[] {
  const { cols, rows } = board;
  const bCols = board.boardCols && board.boardCols > 0 ? board.boardCols : cols;
  const bRows = board.boardRows && board.boardRows > 0 ? board.boardRows : rows;

  const nCols = Math.ceil(cols / bCols);
  const nRows = Math.ceil(rows / bRows);

  const segments: BoardSegment[] = [];
  let index = 0;
  for (let br = 0; br < nRows; br++) {
    for (let bc = 0; bc < nCols; bc++) {
      const startCol = bc * bCols;
      const startRow = br * bRows;
      const endCol = Math.min(startCol + bCols, cols);
      const endRow = Math.min(startRow + bRows, rows);
      segments.push({
        index,
        boardRow: br,
        boardCol: bc,
        startCol,
        startRow,
        endCol,
        endRow,
        label:
          nCols * nRows > 1
            ? `Board ${index + 1} (row ${br + 1}, col ${bc + 1})`
            : 'Full board',
      });
      index++;
    }
  }
  return segments;
}

export interface BomRow {
  number: number;
  name: string;
  code: string;
  hex: string;
  count: number;
}

/** 由网格与调色板构建材料清单（BOM）行，编号与导出标注一致。 */
export function buildBomRows(grid: BeadGrid, palette: Palette): BomRow[] {
  const { entries } = assignBeadNumbers(grid);
  return entries.map((e) => {
    const color = palette.colors[e.index];
    return {
      number: e.number,
      name: color?.name ?? `#${e.index}`,
      code: color?.code ?? '',
      hex: color?.hex ?? '#000000',
      count: e.count,
    };
  });
}

/** 总珠子数（不含空珠）。 */
export function totalBeadCount(rows: BomRow[]): number {
  return rows.reduce((s, r) => s + r.count, 0);
}
