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
      <template v-if="store.inventoryMode && store.hasInventory">
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
import { useI18n } from 'vue-i18n';
import { useDesignStore } from '@/stores/design';

const { t } = useI18n();
const store = useDesignStore();

defineEmits<{ (e: 'rematch'): void }>();

function onToggle(value: boolean | null) {
  store.setInventoryMode(!!value);
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
</style>
