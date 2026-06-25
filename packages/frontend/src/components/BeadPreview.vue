<template>
  <div class="bead-preview">
    <div v-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate size="20" width="2" color="primary" />
      <div class="text-caption mt-1">{{ t('preview.generating') }}</div>
    </div>
    <canvas v-show="!loading && hasPreview" ref="canvasEl" class="bead-preview__canvas pd-checker" />
    <div v-if="!loading && !hasPreview" class="text-caption text-medium-emphasis text-center py-4">
      {{ t('preview.hint') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDesignStore } from '@/stores/design';
import { useImageConverter } from '@/composables/useImageConverter';

const { t } = useI18n();
const store = useDesignStore();
const { convert } = useImageConverter();

const canvasEl = ref<HTMLCanvasElement | null>(null);
const loading = ref(false);
const hasPreview = ref(false);

let debounce: ReturnType<typeof setTimeout> | null = null;

/** 用当前参数做一次快速转换并在 canvas 上绘制圆珠预览。 */
async function regeneratePreview() {
  if (!store.sourceBlob) {
    hasPreview.value = false;
    return;
  }
  loading.value = true;
  try {
    const result = await convert(store.sourceBlob, store.boardSize, store.palette, store.options);
    await nextTick();
    renderMini(result.grid);
    hasPreview.value = true;
  } catch {
    hasPreview.value = false;
  } finally {
    loading.value = false;
  }
}

function renderMini(grid: number[][]) {
  const canvas = canvasEl.value;
  if (!canvas) return;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const cell = Math.min(6, Math.floor(260 / Math.max(cols, 1)));
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const colors = store.palette.colors;
  const r = cell / 2 - 0.5;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = grid[y][x];
      if (idx < 0) continue;
      ctx.fillStyle = colors[idx]?.hex ?? '#000';
      ctx.beginPath();
      ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function schedulePreview() {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => void regeneratePreview(), 200);
}

// 当源图片或转换参数变化时重新生成预览
watch(
  () => [store.sourceBlob, store.boardSizeId, store.paletteId, store.options.dithering, store.options.backgroundThreshold],
  () => schedulePreview(),
  { immediate: true },
);
</script>

<style scoped>
.bead-preview {
  margin-top: 8px;
}
.bead-preview__canvas {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  image-rendering: pixelated;
  margin: 0 auto;
}
</style>
