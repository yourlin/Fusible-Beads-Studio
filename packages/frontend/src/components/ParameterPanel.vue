<template>
  <div class="param-group">
    <div class="param-row">
      <v-select
        :model-value="store.boardSizeId"
        :items="boardItems"
        item-title="label"
        item-value="id"
        :label="t('params.boardSize')"
        density="compact"
        variant="outlined"
        hide-details
        class="param-select"
        @update:model-value="store.setBoardSize($event)"
      />

      <v-select
        :model-value="store.paletteId"
        :items="paletteItems"
        item-title="title"
        item-value="id"
        :label="t('params.palette')"
        density="compact"
        variant="outlined"
        hide-details
        class="param-select"
        @update:model-value="store.setPalette($event)"
      />

      <div class="d-flex align-center">
        <v-switch
          :model-value="store.options.dithering"
          :label="t('params.dither')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="store.setDithering(!!$event)"
        />
        <v-tooltip location="top" max-width="280">
          <template #activator="{ props: tip }">
            <v-icon v-bind="tip" size="small" class="ml-1 text-medium-emphasis" style="cursor: help">
              mdi-help-circle-outline
            </v-icon>
          </template>
          <span>{{ t('params.ditherHelp') }}</span>
        </v-tooltip>
      </div>

      <div class="d-flex align-center bg-slider">
        <span class="text-caption text-medium-emphasis text-no-wrap mr-1">
          {{ t('params.bgRemoval') }}
        </span>
        <v-tooltip location="top" max-width="280">
          <template #activator="{ props: tip }">
            <v-icon v-bind="tip" size="small" class="mr-1 text-medium-emphasis" style="cursor: help">
              mdi-help-circle-outline
            </v-icon>
          </template>
          <span>{{ t('params.bgRemovalHelp') }}</span>
        </v-tooltip>
        <v-slider
          :model-value="store.options.backgroundThreshold"
          :min="0"
          :max="60"
          :step="1"
          thumb-label
          density="compact"
          hide-details
          class="flex-grow-1"
          @update:model-value="store.setBackgroundThreshold(Math.round($event))"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDesignStore } from '@/stores/design';

const { t } = useI18n();
const store = useDesignStore();

const boardItems = computed(() =>
  store.availableBoardSizes.map((b) => ({
    id: b.id,
    label: `${t('boards.' + b.id)} ${b.cols}×${b.rows}`,
  })),
);

const paletteItems = computed(() =>
  store.availablePalettes.map((p) => ({
    id: p.id,
    title: `${t('palettes.' + p.id)} · ${p.colors.length} ${t('params.colorsWord')}`,
  })),
);
</script>

<style scoped>
.param-group {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  padding: 14px 16px;
}
.param-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.param-select {
  flex: 0 0 180px;
  max-width: 200px;
}
.bg-slider {
  flex: 1 1 160px;
  min-width: 140px;
}
</style>
