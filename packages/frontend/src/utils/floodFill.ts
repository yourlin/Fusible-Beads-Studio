import type { BeadGrid } from '@pindou/shared';

export interface CellRef {
  row: number;
  col: number;
}

/**
 * 迭代式（非递归）4-邻接洪水填充。
 * 从 (row,col) 出发，将所有与起点同色且连通的格替换为 newIndex，
 * 返回所有被改变的格坐标（不含与 newIndex 相同而无需改变的情况）。
 * 使用显式栈，避免大区域递归导致的栈溢出。
 */
export function floodFill(
  grid: BeadGrid,
  row: number,
  col: number,
  newIndex: number,
): CellRef[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (row < 0 || col < 0 || row >= rows || col >= cols) return [];

  const targetIndex = grid[row][col];
  if (targetIndex === newIndex) return [];

  const changed: CellRef[] = [];
  const visited = new Uint8Array(rows * cols);
  const stack: number[] = [row * cols + col];
  visited[row * cols + col] = 1;

  while (stack.length > 0) {
    const id = stack.pop()!;
    const r = Math.floor(id / cols);
    const c = id % cols;
    if (grid[r][c] !== targetIndex) continue;

    changed.push({ row: r, col: c });

    // 4 邻接
    pushNeighbor(stack, visited, r - 1, c, rows, cols);
    pushNeighbor(stack, visited, r + 1, c, rows, cols);
    pushNeighbor(stack, visited, r, c - 1, rows, cols);
    pushNeighbor(stack, visited, r, c + 1, rows, cols);
  }

  return changed;
}

function pushNeighbor(
  stack: number[],
  visited: Uint8Array,
  r: number,
  c: number,
  rows: number,
  cols: number,
): void {
  if (r < 0 || c < 0 || r >= rows || c >= cols) return;
  const id = r * cols + c;
  if (visited[id]) return;
  visited[id] = 1;
  stack.push(id);
}
