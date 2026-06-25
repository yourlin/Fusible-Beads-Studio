import { reactive, readonly } from 'vue';
import {
  fit,
  panBy,
  screenToCell,
  visibleCellRange,
  zoomAt,
  type ViewportState,
} from '@/utils/viewport';

export interface PanGesture {
  active: boolean;
  lastX: number;
  lastY: number;
}

/**
 * 视口交互 composable：滚轮锚点缩放 + 指针拖拽平移。
 * 事件处理基于屏幕坐标（相对 canvas 容器左上角）。
 */
export function useViewport() {
  const state = reactive<ViewportState>({ scale: 10, offsetX: 0, offsetY: 0 });
  const gesture: PanGesture = { active: false, lastX: 0, lastY: 0 };

  function apply(next: ViewportState) {
    state.scale = next.scale;
    state.offsetX = next.offsetX;
    state.offsetY = next.offsetY;
  }

  /** 直接设置视口状态（供多指手势计算后写回）。 */
  function set(next: ViewportState) {
    apply(next);
  }

  function fitTo(cols: number, rows: number, viewW: number, viewH: number, padding = 16) {
    apply(fit(cols, rows, viewW, viewH, padding));
  }

  /** 滚轮缩放：deltaY<0 放大。anchor 为相对容器的坐标。 */
  function onWheel(deltaY: number, anchorX: number, anchorY: number) {
    const factor = deltaY < 0 ? 1.1 : 1 / 1.1;
    apply(zoomAt({ ...state }, anchorX, anchorY, factor));
  }

  /** 按倍率缩放（锚点为给定屏幕坐标，通常为视口中心）。 */
  function zoom(factor: number, anchorX: number, anchorY: number) {
    apply(zoomAt({ ...state }, anchorX, anchorY, factor));
  }

  /** 设置到指定绝对缩放（每格像素数），锚点保持不变。 */
  function setScaleAt(scale: number, anchorX: number, anchorY: number) {
    const factor = scale / state.scale;
    apply(zoomAt({ ...state }, anchorX, anchorY, factor));
  }

  function startPan(x: number, y: number) {
    gesture.active = true;
    gesture.lastX = x;
    gesture.lastY = y;
  }

  function movePan(x: number, y: number): boolean {
    if (!gesture.active) return false;
    apply(panBy({ ...state }, x - gesture.lastX, y - gesture.lastY));
    gesture.lastX = x;
    gesture.lastY = y;
    return true;
  }

  function endPan() {
    gesture.active = false;
  }

  function toCell(x: number, y: number) {
    return screenToCell({ ...state }, x, y);
  }

  function visible(viewW: number, viewH: number, cols: number, rows: number) {
    return visibleCellRange({ ...state }, viewW, viewH, cols, rows);
  }

  return {
    state: readonly(state),
    rawState: state,
    isPanning: () => gesture.active,
    fitTo,
    onWheel,
    zoom,
    setScaleAt,
    startPan,
    movePan,
    endPan,
    toCell,
    visible,
    set,
  };
}
