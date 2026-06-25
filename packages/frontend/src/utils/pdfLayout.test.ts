import { describe, it, expect } from 'vitest';
import { computeBoardSegments, buildBomRows, totalBeadCount } from './pdfLayout';
import { GENERIC_PALETTE, type BoardSize } from '@pindou/shared';

describe('computeBoardSegments', () => {
  it('returns a single segment for an undivided board', () => {
    const board: BoardSize = { id: 's', label: '', cols: 29, rows: 29 };
    const segs = computeBoardSegments(board);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ startCol: 0, startRow: 0, endCol: 29, endRow: 29 });
  });

  it('splits a 58x58 board into 4 segments of 29x29', () => {
    const board: BoardSize = {
      id: 'q',
      label: '',
      cols: 58,
      rows: 58,
      boardCols: 29,
      boardRows: 29,
    };
    const segs = computeBoardSegments(board);
    expect(segs).toHaveLength(4);
    expect(segs[3]).toMatchObject({ startCol: 29, startRow: 29, endCol: 58, endRow: 58 });
    expect(segs[0].label).toContain('Board 1');
  });

  it('splits a horizontal 87x29 board into 3 segments', () => {
    const board: BoardSize = {
      id: 't',
      label: '',
      cols: 87,
      rows: 29,
      boardCols: 29,
      boardRows: 29,
    };
    const segs = computeBoardSegments(board);
    expect(segs).toHaveLength(3);
    expect(segs.map((s) => s.startCol)).toEqual([0, 29, 58]);
    expect(segs.every((s) => s.endRow === 29)).toBe(true);
  });
});

describe('buildBomRows / totalBeadCount', () => {
  it('builds rows aligned with bead numbering and palette metadata', () => {
    const grid = [
      [0, 0, 0],
      [10, 10, -1],
    ];
    const rows = buildBomRows(grid, GENERIC_PALETTE);
    expect(rows[0]).toMatchObject({
      number: 1,
      name: GENERIC_PALETTE.colors[0].name,
      count: 3,
    });
    expect(rows[1].count).toBe(2);
    expect(totalBeadCount(rows)).toBe(5);
  });
});
