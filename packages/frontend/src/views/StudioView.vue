<template>
  <div class="studio">
    <!-- 左侧工具栏 -->
    <ToolRail
      v-if="store.hasDesign"
      :tool="editor.tool.value"
      :brush-size="editor.brushSize.value"
      :can-undo="editor.canUndo.value"
      :can-redo="editor.canRedo.value"
      @update:tool="editor.setTool($event)"
      @update:brush-size="editor.setBrushSize($event)"
      @undo="editor.undo()"
      @redo="editor.redo()"
    />

    <!-- 中间画布舞台 -->
    <main class="stage">
      <div class="stage__bar">
        <v-btn
          color="primary"
          size="small"
          variant="flat"
          prepend-icon="mdi-image-plus"
          data-testid="import-btn"
          @click="openImport"
        >
          {{ store.hasDesign ? t('studio.reimport') : t('studio.import') }}
        </v-btn>
        <span v-if="store.hasDesign" class="text-caption text-medium-emphasis ml-3">
          {{ store.boardSize.cols }} × {{ store.boardSize.rows }} ·
          {{ totalBeads }} {{ t('studio.beads') }} · {{ store.counts.length }} {{ t('studio.colors') }}
        </span>
        <v-spacer />
        <v-btn
          v-if="store.hasDesign"
          size="small"
          variant="tonal"
          class="mr-2"
          :color="showNumbers ? 'primary' : undefined"
          prepend-icon="mdi-numeric"
          @click="showNumbers = !showNumbers"
        >
          {{ t('studio.showNumbers') }}
        </v-btn>
        <ExportControls v-if="store.hasDesign" />
      </div>

      <div class="stage__canvas pd-pegboard">
        <v-alert v-if="error" type="error" variant="tonal" class="ma-4">{{ error }}</v-alert>

        <div v-if="converting" class="placeholder">
          <v-progress-circular indeterminate color="primary" size="44" width="4" />
          <div class="text-body-2 mt-3 text-medium-emphasis">{{ t('studio.converting') }}</div>
        </div>

        <div v-else-if="!store.hasDesign" class="placeholder">
          <div class="placeholder__art">
            <v-icon size="40" color="primary">mdi-image-plus</v-icon>
          </div>
          <div class="text-body-2 text-medium-emphasis mt-4">{{ t('studio.emptyHint') }}</div>
          <v-btn
            color="primary"
            variant="flat"
            class="mt-5"
            prepend-icon="mdi-image-plus"
            @click="openImport"
          >
            {{ t('studio.import') }}
          </v-btn>
        </div>

        <BeadCanvas
          v-else
          :grid="store.grid"
          :colors="store.palette.colors"
          :board-cols="store.boardSize.boardCols"
          :board-rows="store.boardSize.boardRows"
          :show-grid="true"
          :show-numbers="showNumbers"
          :number-for="store.numberFor"
          :missing-indices="missingIndices"
          :hover-size="hoverSize"
          :pan-mode="editor.tool.value === 'pan'"
          class="viewer"
          @cell-pointerdown="editor.onCellDown($event)"
          @cell-pointerenter="editor.onCellDrag($event)"
          @stroke-end="editor.endStroke()"
        />
      </div>

      <!-- 底部材料清单条 -->
      <div v-if="store.hasDesign" class="stage__bom pd-scroll" data-testid="bom-list">
        <span class="text-caption font-weight-medium mr-2">{{ t('studio.materialList') }}</span>
        <v-chip
          v-for="c in store.numberedCounts.slice(0, 24)"
          :key="c.colorId"
          class="ma-1"
          size="small"
          label
          variant="tonal"
        >
          <span class="pd-bead dot" :style="{ backgroundColor: c.hex }" />
          <strong class="mr-1">#{{ c.number }}</strong>
          {{ c.name }} × {{ c.count }}
        </v-chip>
      </div>
    </main>

    <!-- 可拖拽分隔条 -->
    <div v-if="store.hasDesign" class="resizer" title="拖动调整宽度" @pointerdown="startResize" />

    <!-- 右侧调色板 -->
    <aside v-if="store.hasDesign" class="panels pd-scroll" :style="{ width: panelWidth + 'px', flexBasis: panelWidth + 'px' }">
      <InventoryPanel
        class="mb-3"
        :substitute-enabled="true"
        @rematch="onRematch"
        @substitute="openSubstitute"
      />
      <PalettePanel
        :colors="store.palette.colors"
        :model-value="editor.selectedIndex.value"
        :number-for="store.numberFor"
        @update:model-value="editor.selectColor($event)"
      />
    </aside>

    <!-- 导入对话框 -->
    <ImportDialog
      v-model="importOpen"
      :loading="converting"
      @image="onImage"
      @clear="onClear"
      @generate="onGenerate"
    />

    <!-- 感知替代预览（FR-9） -->
    <SubstitutionPreview
      v-model="substituteOpen"
      :grid="store.grid"
      :colors="store.palette.colors"
      :substitutions="substitutions"
      @apply="applySubstitutions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BeadCanvas from '@/components/BeadCanvas.vue';
import PalettePanel from '@/components/PalettePanel.vue';
import InventoryPanel from '@/components/InventoryPanel.vue';
import SubstitutionPreview from '@/components/SubstitutionPreview.vue';
import ToolRail from '@/components/ToolRail.vue';
import ExportControls from '@/components/ExportControls.vue';
import ImportDialog from '@/components/ImportDialog.vue';
import { useDesignStore } from '@/stores/design';
import { useImageConverter } from '@/composables/useImageConverter';
import { useEditor } from '@/composables/useEditor';
import { rematchToInventory, applySubstitutions as applySubs, type Substitution } from '@pindou/shared';

const { t } = useI18n();
const store = useDesignStore();
const { converting, error, convert } = useImageConverter();
const editor = useEditor();

const importOpen = ref(false);
const showNumbers = ref(true);
const totalBeads = computed(() => store.counts.reduce((s, c) => s + c.count, 0));

/** 悬停预览框大小：仅画笔/橡皮按笔刷大小显示，其余工具为单格。 */
const hoverSize = computed(() =>
  editor.tool.value === 'brush' || editor.tool.value === 'eraser' ? editor.brushSize.value : 1,
);

/** 库存模式下的缺色品牌索引集合，供画布叠加标记（FR-6）。 */
const missingIndices = computed<Set<number> | null>(() => {
  const analysis = store.inventoryAnalysis;
  if (!analysis) return null;
  const s = new Set<number>();
  for (const [k, v] of Object.entries(analysis.perColorStatus)) {
    if (v === 'missing') s.add(Number(k));
  }
  return s;
});

/** 以库存色板重匹配当前图纸（FR-5），记为单条历史（AD-9）。 */
function onRematch() {
  if (!store.grid) return;
  const next = rematchToInventory(store.grid, store.palette, store.currentInventory);
  editor.applyFullGrid(next);
}

// ---- 感知替代（FR-7/8/9）----
const substituteOpen = ref(false);
const substitutions = computed<Substitution[]>(() => store.inventoryAnalysis?.substitutions ?? []);

function openSubstitute() {
  if (substitutions.value.length === 0) return;
  substituteOpen.value = true;
}

/** 应用感知替代：整色替换写回，记为单条历史（AD-9），随后即时刷新判定。 */
function applySubstitutions() {
  if (!store.grid || substitutions.value.length === 0) return;
  const next = applySubs(store.grid, substitutions.value);
  editor.applyFullGrid(next);
  substituteOpen.value = false;
}

function openImport() {
  importOpen.value = true;
}

// ---- 右侧面板宽度（可拖拽调整）----
const PANEL_MIN = 220;
const PANEL_MAX = 560;
const panelWidth = ref(300);
let resizing = false;
let startX = 0;
let startWidth = 0;

function startResize(e: PointerEvent) {
  resizing = true;
  startX = e.clientX;
  startWidth = panelWidth.value;
  window.addEventListener('pointermove', onResize);
  window.addEventListener('pointerup', endResize);
  e.preventDefault();
}

function onResize(e: PointerEvent) {
  if (!resizing) return;
  const next = startWidth + (startX - e.clientX);
  panelWidth.value = Math.min(PANEL_MAX, Math.max(PANEL_MIN, next));
}

function endResize() {
  resizing = false;
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
}

function onImage(blob: Blob, name: string) {
  store.setSource(blob, name);
}

function onClear() {
  store.clearSource();
}

async function onGenerate() {
  if (!store.sourceBlob) return;
  try {
    const result = await convert(store.sourceBlob, store.boardSize, store.palette, store.options);
    store.commitConversion(result);
    editor.clearHistory();
    importOpen.value = false;
  } catch {
    // error 已由 composable 设置
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!store.hasDesign) return;
  const meta = e.ctrlKey || e.metaKey;
  if (!meta) return;
  if (e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) editor.redo();
    else editor.undo();
  } else if (e.key.toLowerCase() === 'y') {
    e.preventDefault();
    editor.redo();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  endResize();
});
</script>

<style scoped>
.studio {
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
}

/* 中间舞台 */
.stage {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: rgb(var(--v-theme-background));
}
.stage__bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.stage__canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px;
}
.viewer {
  width: 100%;
  height: 100%;
}
.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.placeholder__art {
  width: 88px;
  height: 88px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface));
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  box-shadow: 0 12px 30px -18px rgba(44, 42, 51, 0.45);
}
.stage__bom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  max-height: 88px;
  overflow-y: auto;
  padding: 8px 14px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* 拖拽分隔条 */
.resizer {
  flex: 0 0 6px;
  cursor: col-resize;
  background: rgba(var(--v-theme-on-surface), 0.06);
  transition: background-color 0.15s ease;
}
.resizer:hover {
  background: rgb(var(--v-theme-primary));
}

/* 右侧面板列 */
.panels {
  padding: 14px;
  overflow-y: auto;
  background: rgb(var(--v-theme-surface));
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
}

@media (max-width: 960px) {
  .studio {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }
  .resizer {
    display: none;
  }
  .panels {
    width: 100% !important;
    flex-basis: auto !important;
    border-left: none;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
  .stage__canvas {
    height: 60vh;
  }
}
</style>
