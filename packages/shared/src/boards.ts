import type { BoardSize } from './types.js';

/**
 * 拼豆板尺寸预设。
 * - 单板 29x29
 * - 4 板拼接 58x58（单板 29）
 * - 横向 3 板 87x29（单板 29）
 */
export const BOARD_SIZES: BoardSize[] = [
  {
    id: 'single-29',
    label: '单板 29 × 29',
    cols: 29,
    rows: 29,
    boardCols: 29,
    boardRows: 29,
  },
  {
    id: 'quad-58',
    label: '4 板拼接 58 × 58',
    cols: 58,
    rows: 58,
    boardCols: 29,
    boardRows: 29,
  },
  {
    id: 'tri-87x29',
    label: '横向 3 板 87 × 29',
    cols: 87,
    rows: 29,
    boardCols: 29,
    boardRows: 29,
  },
];

export const DEFAULT_BOARD_SIZE = BOARD_SIZES[0];

export function getBoardSize(id: string): BoardSize | undefined {
  return BOARD_SIZES.find((b) => b.id === id);
}
