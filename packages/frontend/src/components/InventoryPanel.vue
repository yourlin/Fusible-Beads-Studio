<template>
  <v-card variant="flat" border rounded="xl" data-testid="inventory-panel">
    <v-card-title class="text-subtitle-1 d-flex align-center font-weight-bold">
      <span class="pd-bead title-bead" />
      {{ t('invPanel.title') }}
    </v-card-title>
    <v-card-text>
      <!-- 库存模式开关（FR-4 / UX-DR5） -->
      <v-switch
        :model-value="store.inventoryMode"
        :disabled="!store.hasInventory"
        color="primary"
        density="compact"
        hide-details
        :label="t('invPanel.toggle')"
        @update:model-value="onToggle"
      />

      <!-- 库存为空：禁用并引导（UX-DR5 / UX-DR9） -->
      <div v-if="!store.hasInventory" class="text-body-2 text-medium-emphasis mt-1">
        {{ t('invPanel.emptyHint') }}
        <v-btn
          variant="text"
          size="small"
          color="primary"
          to="/inventory"
          prepend-icon="mdi-basket-outline"
          class="mt-1"
        >
          {{ t('invPanel.goManage') }}
        </v-btn>
      </div>

      <!-- 库存模式开启后的内容 -->
      <template v-if="store.inventoryMode && store.hasInventory && analysis">
        <!-- 三态灯（FR-10 / UX-DR1）：常驻状态 + 一句人话，点击展开缺口清单 -->
        <v-chip
          :color="lightColor"
          variant="flat"
          class="mt-3 light-chip"
          :prepend-icon="lightIcon"
          data-testid="verdict-light"
          @click="expanded = !expanded"
        >
          {{ lightText }}
          <v-icon v-if="hasShortfall" size="small" class="ml-1">
            {{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </v-chip>

        <!-- 缺口清单（FR-11 / UX-DR6）：点击三态灯展开 -->
        <v-expand-transition>
          <div v-if="expanded && hasShortfall" class="mt-3" data-testid="shortfall-list">
            <div class="d-flex align-center mb-1">
              <span class="text-caption font-weight-medium">{{ t('invPanel.shortfallTitle') }}</span>
              <v-spacer />
              <v-btn
                size="x-small"
                variant="text"
                :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
                @click="copyShortfall"
              >
                {{ copied ? t('invPanel.copied') : t('invPanel.copyText') }}
              </v-btn>
            </div>
            <div v-for="item in analysis.shortfall" :key="item.colorId" class="short-row">
              <span class="pd-bead short-swatch" :style="{ backgroundColor: hexOf(item.index) }" />
              <div class="short-main">
                <div class="short-name">
                  {{ nameOf(item.index) }}
                  <v-chip
                    size="x-small"
                    :color="item.kind === 'missing' ? 'accent' : 'error'"
                    variant="flat"
                    class="ml-1"
                  >
                    <v-icon start size="x-small">
                      {{ item.kind === 'missing' ? 'mdi-help-circle-outline' : 'mdi-alert' }}
                    </v-icon>
                    {{ item.kind === 'missing' ? t('invPanel.missing') : t('invPanel.short') }}
                  </v-chip>
                </div>
                <div class="short-note text-caption text-medium-emphasis">{{ noteFor(item) }}</div>
              </div>
              <!-- 缺色行的「用库存替代」入口（UX-DR11 / 占位决议）。
                   Epic 4 解禁前为可见但禁用的占位。 -->
              <v-btn
                v-if="item.kind === 'missing'"
                size="x-small"
                variant="tonal"
                color="primary"
                :disabled="!substituteEnabled"
                :title="substituteEnabled ? t('invPanel.substitute') : t('invPanel.substituteSoon')"
                @click="$emit('substitute')"
              >
                {{ t('invPanel.substitute') }}
              </v-btn>
            </div>
          </div>
        </v-expand-transition>

        <v-btn
          block
          variant="tonal"
          color="secondary"
          prepend-icon="mdi-refresh"
          class="mt-3"
          @click="$emit('rematch')"
        >
          {{ t('invPanel.rematch') }}
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { shortfallTone, type ShortfallItem } from '@pindou/shared';
import { useDesignStore } from '@/stores/design';

const { t } = useI18n();
const store = useDesignStore();

const props = defineProps<{
  /** 感知替代是否已可用（Epic 4 解禁；默认 false → 缺色行替代按钮为占位）。 */
  substituteEnabled?: boolean;
}>();

defineEmits<{ (e: 'rematch'): void; (e: 'substitute'): void }>();

const expanded = ref(false);
const copied = ref(false);

const analysis = computed(() => store.inventoryAnalysis);
const substituteEnabled = computed(() => props.substituteEnabled ?? false);
const hasShortfall = computed(() => (analysis.value?.shortfall.length ?? 0) > 0);

function onToggle(value: boolean | null) {
  store.setInventoryMode(!!value);
}

// ---- 三态灯（颜色 + 图标 + 一句人话，UX-DR1 / UX-DR8）----
const lightColor = computed(() => {
  switch (analysis.value?.verdict) {
    case 'buildable':
      return 'success';
    case 'substitutable':
      return 'warning';
    case 'insufficient':
      return 'error';
    default:
      return 'surface-variant';
  }
});
const lightIcon = computed(() => {
  switch (analysis.value?.verdict) {
    case 'buildable':
      return 'mdi-check-circle';
    case 'substitutable':
      return 'mdi-swap-horizontal';
    case 'insufficient':
      return 'mdi-alert-circle';
    default:
      return 'mdi-information-outline';
  }
});
const lightText = computed(() => {
  const a = analysis.value;
  if (!a) return '';
  switch (a.verdict) {
    case 'buildable':
      return t('invPanel.buildable');
    case 'substitutable':
      return t('invPanel.substitutable', { n: countMissing(a.shortfall) });
    case 'insufficient':
      return t('invPanel.insufficient', { n: countInsufficient(a.shortfall) });
    default:
      return t('invPanel.unavailable');
  }
});

function countMissing(list: ShortfallItem[]): number {
  return list.filter((s) => s.kind === 'missing').length;
}
function countInsufficient(list: ShortfallItem[]): number {
  return list.filter((s) => s.kind === 'insufficient').length;
}

// ---- 缺口清单行的色块 / 名称 / 人话解读 ----
function hexOf(index: number): string {
  return store.palette.colors[index]?.hex ?? '#000';
}
function nameOf(index: number): string {
  const c = store.palette.colors[index];
  if (!c) return '';
  return c.code ? `${c.name} · ${c.code}` : c.name;
}

/**
 * 缺口每行的人话解读（FR-11 party-mode 决议：引擎算得出的事别让用户肉眼算）。
 * - 缺色：需约 N 颗（一颗没有）。
 * - 数量不足：还差约 N 颗；若仅是余量紧张（拥有 ≥ 需求但接近）给「够铺，余量紧张」。
 */
function noteFor(item: ShortfallItem): string {
  switch (shortfallTone(item)) {
    case 'missing':
      return t('invPanel.needMissing', { n: item.required });
    case 'short':
      return t('invPanel.needMore', { n: item.deficit });
    case 'tight':
      return t('invPanel.needTight');
    default:
      return t('invPanel.needRoomy');
  }
}

// ---- 复制为纯文本（FR-11 / UX-DR6，不进 PDF、不含采购链接）----
async function copyShortfall() {
  const a = analysis.value;
  if (!a) return;
  const lines = a.shortfall.map((item) => {
    const tag = item.kind === 'missing' ? t('invPanel.missing') : t('invPanel.short');
    return `${nameOf(item.index)} [${tag}] — ${noteFor(item)}`;
  });
  const text = lines.join('\n');
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // 剪贴板不可用时静默（如无 https），不阻断
  }
}
</script>

<style scoped>
.title-bead {
  display: inline-block;
  width: 16px;
  height: 16px;
  background: rgb(var(--v-theme-secondary));
  margin-right: 8px;
}
.light-chip {
  cursor: pointer;
  height: auto;
  min-height: 32px;
  white-space: normal;
  padding-top: 6px;
  padding-bottom: 6px;
}
.short-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 2px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.short-swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex: 0 0 auto;
  margin-top: 2px;
}
.short-main {
  flex: 1 1 auto;
  min-width: 0;
}
.short-name {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.short-note {
  margin-top: 2px;
}
</style>
