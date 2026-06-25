<template>
  <div class="d-flex align-center ga-2">
    <v-menu :close-on-content-click="false" location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn
          icon="mdi-cog"
          size="small"
          variant="text"
          :title="t('exportCtl.settings')"
          v-bind="menuProps"
        />
      </template>
      <v-card min-width="240" class="pa-3">
        <div class="text-caption text-medium-emphasis mb-1">{{ t('exportCtl.cellSize') }}: {{ cellSize }}px</div>
        <v-slider v-model="cellSize" :min="8" :max="40" :step="1" density="compact" hide-details />
        <v-switch v-model="showGrid" :label="t('exportCtl.gridLines')" color="primary" density="compact" hide-details />
        <v-switch
          v-model="showNumbers"
          :label="t('exportCtl.beadNumbers')"
          color="primary"
          density="compact"
          hide-details
        />
      </v-card>
    </v-menu>

    <v-btn
      color="primary"
      size="small"
      variant="flat"
      :loading="exporting"
      prepend-icon="mdi-file-image"
      data-testid="export-png-btn"
      @click="onExportPng"
    >
      PNG
    </v-btn>
    <v-btn
      color="primary"
      size="small"
      variant="tonal"
      :loading="exportingPdf"
      prepend-icon="mdi-file-pdf-box"
      data-testid="export-pdf-btn"
      @click="onExportPdf"
    >
      PDF
    </v-btn>

    <v-snackbar :model-value="!!error" color="warning" timeout="4000" @update:model-value="error = null">
      {{ error }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useExport } from '@/composables/useExport';

const { t } = useI18n();
const cellSize = ref(20);
const showGrid = ref(true);
const showNumbers = ref(true);

const { exporting, exportingPdf, error, exportPng, exportPdf } = useExport();

function onExportPng() {
  void exportPng({
    cellSize: cellSize.value,
    showGrid: showGrid.value,
    showNumbers: showNumbers.value,
  });
}

function onExportPdf() {
  void exportPdf({
    cellSizeMm: 5,
    showGrid: showGrid.value,
    showNumbers: showNumbers.value,
  });
}
</script>
