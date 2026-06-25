/**
 * 视口数学（纯函数）。
 * 内容坐标以「格」为单位；scale = 每格的像素数；offset 为屏幕像素平移量。
 * 屏幕坐标 = 格坐标 * scale + offset。
 */
export interface ViewportState {
  /** 每格像素数 */
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const MIN_SCALE = 1;
export const MAX_SCALE = 80;
/** 100% 缩放对应的每格像素数（缩放百分比的基准）。 */
export const BASE_SCALE = 20;

export function clampScale(scale: number, min = MIN_SCALE, max = MAX_SCALE): number {
  return Math.min(max, Math.max(min, scale));
}

/** 屏幕坐标 → 格坐标（浮点）。 */
export function screenToCell(
  state: ViewportState,
  screenX: number,
  screenY: number,
): { col: number; row: number } {
  return {
    col: (screenX - state.offsetX) / state.scale,
    row: (screenY - state.offsetY) / state.scale,
  };
}

/** 格坐标 → 屏幕坐标。 */
export function cellToScreen(
  state: ViewportState,
  col: number,
  row: number,
): { x: number; y: number } {
  return {
    x: col * state.scale + state.offsetX,
    y: row * state.scale + state.offsetY,
  };
}

/**
 * 以 (anchorX, anchorY) 屏幕点为锚点缩放：缩放后锚点下的格坐标保持不变。
 */
export function zoomAt(
  state: ViewportState,
  anchorX: number,
  anchorY: number,
  factor: number,
  min = MIN_SCALE,
  max = MAX_SCALE,
): ViewportState {
  const newScale = clampScale(state.scale * factor, min, max);
  // 锚点下的格坐标在缩放前后必须一致
  const cell = screenToCell(state, anchorX, anchorY);
  return {
    scale: newScale,
    offsetX: anchorX - cell.col * newScale,
    offsetY: anchorY - cell.row * newScale,
  };
}

/** 平移视口。 */
export function panBy(state: ViewportState, dx: number, dy: number): ViewportState {
  return { scale: state.scale, offsetX: state.offsetX + dx, offsetY: state.offsetY + dy };
}

/**
 * 计算让 cols×rows 内容在 viewW×viewH 视口中居中铺满（含 padding）的视口状态。
 */
export function fit(
  cols: number,
  rows: number,
  viewW: number,
  viewH: number,
  padding = 16,
): ViewportState {
  const availW = Math.max(1, viewW - padding * 2);
  const availH = Math.max(1, viewH - padding * 2);
  const scale = clampScale(Math.min(availW / cols, availH / rows));
  const contentW = cols * scale;
  const contentH = rows * scale;
  return {
    scale,
    offsetX: (viewW - contentW) / 2,
    offsetY: (viewH - contentH) / 2,
  };
}

/**
 * 计算当前视口中可见的格范围（用于裁剪渲染），含 1 格余量。
 */
export function visibleCellRange(
  state: ViewportState,
  viewW: number,
  viewH: number,
  cols: number,
  rows: number,
): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
  const topLeft = screenToCell(state, 0, 0);
  const bottomRight = screenToCell(state, viewW, viewH);
  return {
    minCol: Math.max(0, Math.floor(topLeft.col) - 1),
    maxCol: Math.min(cols - 1, Math.ceil(bottomRight.col) + 1),
    minRow: Math.max(0, Math.floor(topLeft.row) - 1),
    maxRow: Math.min(rows - 1, Math.ceil(bottomRight.row) + 1),
  };
}
