<template>
  <div class="inventory pd-scroll">
    <header class="inventory__head">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">
          <span class="pd-bead title-bead" />
          {{ t('inventory.title') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ t('inventory.subtitle') }}</p>
      </div>
      <v-btn variant="text" to="/studio" prepend-icon="mdi-arrow-left">
        {{ t('inventory.backToStudio') }}
      </v-btn>
    </header>

    <!-- 品牌色板切换 -->
    <v-card variant="flat" border rounded="xl" class="mb-4">
      <v-card-text class="d-flex flex-wrap align-center ga-4">
        <v-select
          :model-value="store.paletteId"
          :items="paletteItems"
          item-title="title"
          item-value="value"
          :label="t('inventory.paletteLabel')"
          density="comfortable"
          hide-details
          style="max-width: 260px"
          @update:model-value="onPalette"
        />
        <v-spacer />
        <span v-if="summaryColors > 0" class="text-body-2" data-testid="inv-summary">
          {{ t('inventory.summary', { colors: summaryColors, beads: summaryBeads }) }}
        </span>
        <span v-else class="text-body-2 text-medium-emphasis" data-testid="inv-summary-empty">
          {{ t('inventory.summaryEmpty') }}
        </span>
        <v-btn
          v-if="summaryColors > 0"
          color="error"
          variant="text"
          size="small"
          prepend-icon="mdi-delete-outline"
          @click="resetOpen = true"
        >
          {{ t('inventory.reset') }}
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- 批量操作条 -->
    <v-card variant="flat" border rounded="xl" class="mb-4">
      <v-card-text class="d-flex flex-wrap align-center ga-3">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-checkbox-multiple-marked-outline" @click="selectAll">
          {{ t('inventory.selectAll') }}
        </v-btn>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-checkbox-multiple-blank-outline" @click="selectNone">
          {{ t('inventory.selectNone') }}
        </v-btn>
        <v-divider vertical class="mx-1" />
        <v-text-field
          v-model="bulkQty"
          type="number"
          :label="t('inventory.bulkQtyLabel')"
          density="compact"
          hide-details
          min="0"
          style="max-width: 200px"
        />
        <v-btn size="small" color="primary" variant="flat" @click="applyBulk">
          {{ t('inventory.bulkApply') }}
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- 色号录入列表 -->
    <v-card variant="flat" border rounded="xl">
      <v-card-text>
        <div class="rows">
          <div
            v-for="c in colors"
            :key="c.id"
            class="row"
            :class="{ 'row--owned': isOwned(c.id) }"
            data-testid="inv-row"
          >
            <v-checkbox
              :model-value="isOwned(c.id)"
              hide-details
              density="compact"
              :aria-label="`${t('inventory.own')} ${c.name}`"
              @update:model-value="onToggle(c.id, $event)"
            />
            <span class="pd-bead row__swatch" :style="{ backgroundColor: c.hex }" />
            <span class="row__name">
              {{ c.name }}
              <span v-if="c.code" class="text-medium-emphasis">· {{ c.code }}</span>
            </span>
            <v-text-field
              :model-value="qtyOf(c.id)"
              type="number"
              :disabled="!isOwned(c.id)"
              :label="t('inventory.quantity')"
              :error-messages="errorFor(c.id)"
              density="compact"
              hide-details="auto"
              min="0"
              class="row__qty"
              @update:model-value="onQty(c.id, $event)"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 清空二次确认 -->
    <v-dialog v-model="resetOpen" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="text-h6">{{ t('inventory.resetConfirmTitle') }}</v-card-title>
        <v-card-text>{{ t('inventory.resetConfirmBody') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="resetOpen = false">{{ t('inventory.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" @click="confirmReset">
            {{ t('inventory.confirmReset') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDesignStore } from '@/stores/design';
import { useSeo } from '@/composables/useSeo';

const { t } = useI18n();
const store = useDesignStore();
useSeo();

// 进入页面即加载当前色板库存
store.ensureInventoryLoaded();

const colors = computed(() => store.palette.colors);
const paletteItems = computed(() =>
  store.availablePalettes.map((p) => ({ title: p.name, value: p.id })),
);

// 当前库存条目的 colorId → qty 映射，便于查询
const entryMap = computed(() => {
  const m: Record<string, number> = {};
  for (const e of store.currentInventory.entries) m[e.colorId] = e.qty;
  return m;
});

const summaryColors = computed(() => store.inventoryColorCount);
const summaryBeads = computed(() => store.inventoryTotalBeads);

function isOwned(colorId: string): boolean {
  return colorId in entryMap.value;
}
function qtyOf(colorId: string): number {
  return entryMap.value[colorId] ?? 0;
}

// 即时校验：记录每个色号输入框的错误（非整数 / 负数）
const errors = reactive<Record<string, boolean>>({});
function errorFor(colorId: string): string | undefined {
  return errors[colorId] ? t('inventory.qtyInvalid') : undefined;
}

function validQty(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

function onToggle(colorId: string, value: boolean | null) {
  if (value) {
    // 勾选「拥有」：默认给 1，用户可改
    if (!isOwned(colorId)) store.setInventoryEntry(colorId, 1);
  } else {
    store.removeInventoryEntry(colorId);
    delete errors[colorId];
  }
}

function onQty(colorId: string, raw: unknown) {
  const n = validQty(raw);
  if (n === null) {
    errors[colorId] = true;
    return;
  }
  errors[colorId] = false;
  if (n === 0) store.removeInventoryEntry(colorId);
  else store.setInventoryEntry(colorId, n);
}

// ---- 批量操作 ----
const bulkQty = ref<number | string>(1000);

function selectAll() {
  const n = validQty(bulkQty.value) ?? 1;
  store.setInventoryBulk(
    colors.value.map((c) => c.id),
    n > 0 ? n : 1,
  );
}
function selectNone() {
  store.setInventoryBulk(
    colors.value.map((c) => c.id),
    0,
  );
}
function applyBulk() {
  const n = validQty(bulkQty.value);
  if (n === null) return;
  const checked = colors.value.map((c) => c.id).filter((id) => isOwned(id));
  store.setInventoryBulk(checked, n);
}

// ---- 切换品牌色板（各自独立库存）----
function onPalette(id: unknown) {
  if (typeof id !== 'string') return;
  store.setPalette(id);
  store.ensureInventoryLoaded(id);
}

// 切换色板时清掉旧的校验错误
watch(
  () => store.paletteId,
  () => {
    for (const k of Object.keys(errors)) delete errors[k];
  },
);

// ---- 清空 ----
const resetOpen = ref(false);
function confirmReset() {
  store.clearInventoryFor();
  for (const k of Object.keys(errors)) delete errors[k];
  resetOpen.value = false;
}
</script>

<style scoped>
.inventory {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 18px 48px;
  height: calc(100vh - 56px);
  overflow-y: auto;
}
.inventory__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.title-bead {
  display: inline-block;
  width: 18px;
  height: 18px;
  background: rgb(var(--v-theme-primary));
  margin-right: 8px;
  vertical-align: middle;
}
.rows {
  display: flex;
  flex-direction: column;
}
.row {
  display: grid;
  grid-template-columns: 40px 24px 1fr 140px;
  align-items: center;
  gap: 12px;
  padding: 4px 2px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.row--owned {
  background: rgba(var(--v-theme-primary), 0.04);
}
.row__swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}
.row__name {
  font-size: 0.92rem;
}
.row__qty {
  max-width: 140px;
}
</style>
