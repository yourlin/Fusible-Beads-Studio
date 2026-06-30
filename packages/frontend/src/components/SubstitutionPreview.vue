<template>
  <v-dialog :model-value="modelValue" max-width="640" @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl" data-testid="substitution-preview">
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon color="warning" class="mr-2">mdi-swap-horizontal</v-icon>
        {{ t('invPanel.previewTitle') }}
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 mb-3">
          {{ t('invPanel.previewSummary', { colors: substitutions.length, cells: totalCells }) }}
        </p>

        <!-- 前后对比：桌面并排，窄屏堆叠（UX-DR7） -->
        <div class="compare">
          <figure class="compare__col">
            <figcaption class="text-caption text-medium-emphasis mb-1">{{ t('invPanel.before') }}</figcaption>
            <canvas ref="beforeCanvas" class="thumb" />
          </figure>
          <v-icon class="compare__arrow">mdi-arrow-right</v-icon>
          <figure class="compare__col">
            <figcaption class="text-caption text-medium-emphasis mb-1">{{ t('invPanel.after') }}</figcaption>
            <canvas ref="afterCanvas" class="thumb" />
          </figure>
        </div>

        <!-- 每个替代的视觉影响分级（UX-DR7 / UX-DR8，文字+图标不只靠颜色 NFR-4） -->
        <v-list density="compact" class="mt-2">
          <v-list-item v-for="s in rows" :key="s.fromIndex" class="px-0">
            <template #prepend>
              <span class="pd-bead sub-swatch" :style="{ backgroundColor: s.fromHex }" />
              <v-icon size="small" class="mx-1">mdi-arrow-right-thin</v-icon>
              <span class="pd-bead sub-swatch" :style="{ backgroundColor: s.toHex }" />
            </template>
            <v-list-item-title class="text-body-2">
              {{ s.fromName }} → {{ s.toName }}
            </v-list-item-title>
            <template #append>
              <v-chip size="x-small" :color="impactColor(s.impact)" variant="flat">
                <v-icon start size="x-small">{{ impactIcon(s.impact) }}</v-icon>
                {{ t('invPanel.impact') }}: {{ impactLabel(s.impact) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">{{ t('invPanel.discard') }}</v-btn>
        <v-btn color="primary" variant="flat" data-testid="apply-substitutions" @click="$emit('apply')">
          {{ t('invPanel.applyAll') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  applySubstitutions,
  classifyDeltaE,
  type BeadColor,
  type BeadGrid,
  type Substitution,
  type VisualImpact,
} from '@pindou/shared';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  grid: BeadGrid | null;
  colors: BeadColor[];
  substitutions: Substitution[];
}>();

defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'apply'): void }>();

const beforeCanvas = ref<HTMLCanvasElement | null>(null);
const afterCanvas = ref<HTMLCanvasElement | null>(null);

const totalCells = computed(() => props.substitutions.reduce((s, x) => s + x.affectedCells, 0));

const rows = computed(() =>
  props.substitutions.map((s) => ({
    fromIndex: s.fromIndex,
    fromHex: props.colors[s.fromIndex]?.hex ?? '#000',
    toHex: props.colors[s.toIndex]?.hex ?? '#000',
    fromName: props.colors[s.fromIndex]?.name ?? '',
    toName: props.colors[s.toIndex]?.name ?? '',
    impact: classifyDeltaE(s.deltaE),
  })),
);

function impactLabel(i: VisualImpact): string {
  return i === 'low' ? t('invPanel.impactLow') : i === 'mid' ? t('invPanel.impactMid') : t('invPanel.impactHigh');
}
function impactColor(i: VisualImpact): string {
  return i === 'low' ? 'success' : i === 'mid' ? 'warning' : 'error';
}
function impactIcon(i: VisualImpact): string {
  return i === 'low' ? 'mdi-circle-small' : i === 'mid' ? 'mdi-alert-outline' : 'mdi-alert';
}

/** 把网格渲染成小缩略图（无网格线，纯色块），用于前后对比。 */
function renderThumb(canvas: HTMLCanvasElement | null, grid: BeadGrid) {
  if (!canvas) return;
  const rowsN = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rowsN === 0 || cols === 0) return;
  const maxPx = 260;
  const cell = Math.max(1, Math.floor(maxPx / Math.max(cols, rowsN)));
  canvas.width = cols * cell;
  canvas.height = rowsN * cell;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rowsN; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = grid[r][c];
      if (idx < 0) continue;
      ctx.fillStyle = props.colors[idx]?.hex ?? '#000';
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

function draw() {
  if (!props.grid) return;
  renderThumb(beforeCanvas.value, props.grid);
  renderThumb(afterCanvas.value, applySubstitutions(props.grid, props.substitutions));
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick();
      draw();
    }
  },
);
</script>

<style scoped>
.compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.compare__col {
  margin: 0;
  text-align: center;
}
.compare__arrow {
  flex: 0 0 auto;
}
.thumb {
  display: block;
  max-width: 260px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  image-rendering: pixelated;
  background: repeating-conic-gradient(#f3f3f3 0% 25%, #fff 0% 50%) 50% / 16px 16px;
}
.sub-swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
@media (max-width: 600px) {
  .compare {
    flex-direction: column;
  }
  .compare__arrow {
    transform: rotate(90deg);
  }
}
</style>
