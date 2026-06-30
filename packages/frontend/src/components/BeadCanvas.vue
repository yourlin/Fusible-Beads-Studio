<template>
  <div
    ref="container"
    class="bead-canvas"
    data-testid="bead-canvas"
    @wheel.prevent="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerLeave"
    @pointerleave="onPointerLeave"
  >
    <canvas
      ref="canvasEl"
      class="bead-canvas__el"
      :class="{ panning: panning, grab: panMode && !panning }"
    />

    <div
      v-if="tooltip"
      class="bead-tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <span class="bead-tooltip__swatch" :style="{ backgroundColor: tooltip.hex }" />
      <span>{{ tooltip.label }}</span>
    </div>

    <div class="bead-canvas__zoom" @pointerdown.stop @pointerup.stop @wheel.stop>
      <v-btn icon size="x-small" variant="tonal" :title="t('canvas.zoomOut')" @click="zoomBy(1 / 1.25)">
        <v-icon>mdi-minus</v-icon>
      </v-btn>
      <div class="zoom-stack">
        <button type="button" class="zoom-pct" :title="t('canvas.reset100')" @click="resetActualSize">
          {{ zoomPercent }}%
        </button>
        <v-slider
          :model-value="sliderValue"
          :min="-1"
          :max="1"
          :step="0.001"
          hide-details
          density="compact"
          class="zoom-slider"
          track-size="3"
          thumb-size="12"
          @update:model-value="onSlider"
        />
      </div>
      <v-btn icon size="x-small" variant="tonal" :title="t('canvas.zoomIn')" @click="zoomBy(1.25)">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn icon size="x-small" variant="tonal" :title="t('canvas.fit')" @click="resetView">
        <v-icon>mdi-fit-to-page-outline</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BeadColor, BeadGrid } from '@pindou/shared';
import { useViewport } from '@/composables/useViewport';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';
import { panBy, zoomAt, BASE_SCALE, MIN_SCALE, MAX_SCALE } from '@/utils/viewport';
import type { RenderOptions } from '@/utils/render';

const props = defineProps<{
  grid: BeadGrid | null;
  colors: BeadColor[];
  boardCols?: number;
  boardRows?: number;
  showGrid?: boolean;
  panMode?: boolean;
  showNumbers?: boolean;
  numberFor?: Record<number, number>;
  /** 库存模式：缺色品牌索引集合，画布叠加暖橙+斜纹标记（FR-6）。 */
  missingIndices?: Set<number> | null;
}>();

const emit = defineEmits<{
  (e: 'cell-pointerdown', payload: { col: number; row: number }): void;
  (e: 'cell-pointerenter', payload: { col: number; row: number }): void;
  (e: 'stroke-end'): void;
}>();

const container = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const { t } = useI18n();
const panning = ref(false);
const hover = ref<{ col: number; row: number } | null>(null);
const tooltip = ref<{ x: number; y: number; hex: string; label: string } | null>(null);

const viewport = useViewport();
const hexColors = computed(() => props.colors.map((c) => c.hex));

function getOptions(): RenderOptions | null {
  if (!props.grid) return null;
  return {
    grid: props.grid,
    colors: hexColors.value,
    viewport: viewport.rawState,
    viewW: 0, // 由 renderer 用实际 CSS 尺寸覆盖
    viewH: 0,
    boardCols: props.boardCols,
    boardRows: props.boardRows,
    showGrid: props.showGrid ?? true,
    hover: hover.value,
    showNumbers: props.showNumbers ?? false,
    numberFor: props.numberFor,
    missingIndices: props.missingIndices ?? null,
  };
}

const renderer = useCanvasRenderer(canvasEl, getOptions);

let lastDims = '';
function maybeFit() {
  const el = container.value;
  if (!el || !props.grid) return;
  const cols = props.grid[0]?.length ?? 0;
  const rows = props.grid.length;
  const dims = `${cols}x${rows}`;
  if (dims !== lastDims) {
    lastDims = dims;
    // 默认以 100%（BASE_SCALE）居中显示
    const w = el.clientWidth;
    const h = el.clientHeight;
    viewport.set({
      scale: BASE_SCALE,
      offsetX: (w - cols * BASE_SCALE) / 2,
      offsetY: (h - rows * BASE_SCALE) / 2,
    });
  }
}

function resetView() {
  const el = container.value;
  if (!el || !props.grid) return;
  const cols = props.grid[0]?.length ?? 0;
  const rows = props.grid.length;
  viewport.fitTo(cols, rows, el.clientWidth, el.clientHeight);
  renderer.requestRender();
}

const zoomPercent = computed(() => Math.round((viewport.state.scale / BASE_SCALE) * 100));

/**
 * 缩放滑块映射（对数）：滑块值 [-1,1]，中点 0 = 100%(BASE_SCALE)。
 * 左半段 [-1,0] 映射到 [MIN_SCALE, BASE_SCALE]，右半段 [0,1] 映射到 [BASE_SCALE, MAX_SCALE]。
 */
function scaleFromSlider(s: number): number {
  if (s <= 0) return MIN_SCALE * Math.pow(BASE_SCALE / MIN_SCALE, s + 1);
  return BASE_SCALE * Math.pow(MAX_SCALE / BASE_SCALE, s);
}

function sliderFromScale(scale: number): number {
  let s: number;
  if (scale <= BASE_SCALE) {
    s = Math.log(scale / MIN_SCALE) / Math.log(BASE_SCALE / MIN_SCALE) - 1;
  } else {
    s = Math.log(scale / BASE_SCALE) / Math.log(MAX_SCALE / BASE_SCALE);
  }
  return Math.min(1, Math.max(-1, s));
}

const sliderValue = computed(() => sliderFromScale(viewport.state.scale));

function onSlider(v: number) {
  const c = viewCenter();
  viewport.setScaleAt(scaleFromSlider(v), c.x, c.y);
  renderer.requestRender();
}

function viewCenter(): { x: number; y: number } {
  const el = container.value;
  return { x: (el?.clientWidth ?? 0) / 2, y: (el?.clientHeight ?? 0) / 2 };
}

/** 以画布中心为锚点按倍率缩放；经过 100% 时先停在 100%。 */
function zoomBy(factor: number) {
  const c = viewCenter();
  const current = viewport.state.scale;
  const target = current * factor;
  const eps = 1e-3;
  const crossesUp = current < BASE_SCALE - eps && target > BASE_SCALE + eps;
  const crossesDown = current > BASE_SCALE + eps && target < BASE_SCALE - eps;
  if (crossesUp || crossesDown) {
    // 缩放穿过 100% 时，先停留在 100%
    viewport.setScaleAt(BASE_SCALE, c.x, c.y);
  } else {
    viewport.zoom(factor, c.x, c.y);
  }
  renderer.requestRender();
}

/** 还原为 100%（每格 BASE_SCALE 像素），以画布中心为锚点。 */
function resetActualSize() {
  const c = viewCenter();
  viewport.setScaleAt(BASE_SCALE, c.x, c.y);
  renderer.requestRender();
}

function localPoint(e: PointerEvent | WheelEvent): { x: number; y: number } {
  const rect = container.value!.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// ---- 多指触摸手势（双指缩放 + 平移）----
const activePointers = new Map<number, { x: number; y: number }>();
let gesturing = false;
let lastPinchDist = 0;
let lastPinchMid = { x: 0, y: 0 };

function pinchMetrics(): { dist: number; mid: { x: number; y: number } } {
  const pts = [...activePointers.values()];
  const dx = pts[0].x - pts[1].x;
  const dy = pts[0].y - pts[1].y;
  return {
    dist: Math.hypot(dx, dy) || 1,
    mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
  };
}

function onWheel(e: WheelEvent) {
  const { x, y } = localPoint(e);
  viewport.onWheel(e.deltaY, x, y);
  renderer.requestRender();
  updateHover(x, y);
}

function onPointerDown(e: PointerEvent) {
  const { x, y } = localPoint(e);
  activePointers.set(e.pointerId, { x, y });
  container.value?.setPointerCapture?.(e.pointerId);

  if (activePointers.size >= 2) {
    // 进入双指手势：结束任何进行中的笔画与平移
    if (!gesturing) emit('stroke-end');
    gesturing = true;
    panning.value = false;
    viewport.endPan();
    const m = pinchMetrics();
    lastPinchDist = m.dist;
    lastPinchMid = m.mid;
    hover.value = null;
    tooltip.value = null;
    return;
  }

  if (e.button === 1 || e.button === 2 || e.shiftKey || (props.panMode && e.button === 0)) {
    // 中键/右键/Shift+左键/抓手工具 → 平移
    panning.value = true;
    viewport.startPan(x, y);
    return;
  }
  const cell = cellAt(x, y);
  if (cell) emit('cell-pointerdown', cell);
}

function onPointerMove(e: PointerEvent) {
  const { x, y } = localPoint(e);
  if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x, y });

  if (gesturing && activePointers.size >= 2) {
    const { dist, mid } = pinchMetrics();
    const factor = dist / lastPinchDist;
    let next = zoomAt({ ...viewport.rawState }, mid.x, mid.y, factor);
    next = panBy(next, mid.x - lastPinchMid.x, mid.y - lastPinchMid.y);
    viewport.set(next);
    lastPinchDist = dist;
    lastPinchMid = mid;
    renderer.requestRender();
    return;
  }

  if (viewport.movePan(x, y)) {
    renderer.requestRender();
    return;
  }
  updateHover(x, y);
  const cell = hover.value;
  if (cell && (e.buttons & 1) === 1) emit('cell-pointerenter', cell);
}

function releasePointer(e: PointerEvent) {
  activePointers.delete(e.pointerId);
  container.value?.releasePointerCapture?.(e.pointerId);
  if (activePointers.size < 2) {
    gesturing = false;
    lastPinchDist = 0;
  }
}

function onPointerUp(e: PointerEvent) {
  const wasGesturing = gesturing;
  const wasPanning = panning.value;
  releasePointer(e);
  panning.value = false;
  viewport.endPan();
  if (!wasPanning && !wasGesturing) emit('stroke-end');
}

function onPointerLeave(e: PointerEvent) {
  const wasGesturing = gesturing;
  const wasPanning = panning.value;
  releasePointer(e);
  panning.value = false;
  viewport.endPan();
  hover.value = null;
  tooltip.value = null;
  if (!wasPanning && !wasGesturing) emit('stroke-end');
  renderer.requestRender();
}

function cellAt(x: number, y: number): { col: number; row: number } | null {
  if (!props.grid) return null;
  const { col, row } = viewport.toCell(x, y);
  const c = Math.floor(col);
  const r = Math.floor(row);
  const cols = props.grid[0]?.length ?? 0;
  const rows = props.grid.length;
  if (c < 0 || r < 0 || c >= cols || r >= rows) return null;
  return { col: c, row: r };
}

function updateHover(x: number, y: number) {
  const cell = cellAt(x, y);
  hover.value = cell;
  if (!cell || !props.grid) {
    tooltip.value = null;
    renderer.requestRender();
    return;
  }
  const idx = props.grid[cell.row][cell.col];
  if (idx < 0) {
    tooltip.value = null;
  } else {
    const color = props.colors[idx];
    const label = color.code ? `${color.name} · ${color.code}` : color.name;
    tooltip.value = { x: x + 12, y: y + 12, hex: color.hex, label };
  }
  renderer.requestRender();
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const el = container.value;
  if (!el) return;
  resizeObserver = new ResizeObserver(() => {
    renderer.resize(el.clientWidth, el.clientHeight);
    maybeFit();
    renderer.requestRender();
  });
  resizeObserver.observe(el);
  renderer.resize(el.clientWidth, el.clientHeight);
  maybeFit();
  renderer.requestRender();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

watch(
  () => props.grid,
  () => {
    maybeFit();
    renderer.requestRender();
  },
);
watch(
  [
    () => props.colors,
    () => props.showGrid,
    () => props.showNumbers,
    () => props.numberFor,
    () => props.missingIndices,
  ],
  () => renderer.requestRender(),
);
</script>

<style scoped>
.bead-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  overflow: hidden;
  border-radius: 6px;
  background: repeating-conic-gradient(#f3f3f3 0% 25%, #fff 0% 50%) 50% / 20px 20px;
  touch-action: none;
}
.bead-canvas__el {
  display: block;
  cursor: crosshair;
}
.bead-canvas__el.grab {
  cursor: grab;
}
.bead-canvas__el.panning {
  cursor: grabbing;
}
.bead-tooltip {
  position: absolute;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(33, 33, 33, 0.92);
  color: #fff;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 5;
}
.bead-tooltip__swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.bead-canvas__zoom {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(3px);
}
.bead-canvas__zoom .zoom-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
}
.bead-canvas__zoom .zoom-pct {
  font-size: 11px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 0 6px;
  margin-bottom: -2px;
  cursor: pointer;
}
.bead-canvas__zoom .zoom-pct:hover {
  color: rgb(var(--v-theme-primary));
}
.bead-canvas__zoom .zoom-slider {
  width: 120px;
  flex: 0 0 auto;
}
</style>
