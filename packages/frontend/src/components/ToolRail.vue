<template>
  <div class="tool-rail">
    <v-btn
      v-for="item in tools"
      :key="item.value"
      :icon="item.icon"
      :color="tool === item.value ? 'primary' : undefined"
      :variant="tool === item.value ? 'flat' : 'text'"
      size="small"
      class="my-1"
      :title="item.title"
      @click="$emit('update:tool', item.value)"
    />

    <!-- 画笔大小（仅画笔/橡皮可用） -->
    <template v-if="tool === 'brush' || tool === 'eraser'">
      <v-divider class="my-2 w-100" />
      <v-menu location="end" :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="text"
            size="small"
            class="my-1 size-btn"
            :title="t('tools.brushSize')"
          >
            <v-icon size="18">mdi-circle</v-icon>
            <span class="size-badge">{{ brushSize }}</span>
          </v-btn>
        </template>
        <div class="size-popover">
          <div class="text-caption font-weight-medium mb-1">
            {{ t('tools.brushSize') }}：{{ brushSize }} × {{ brushSize }}
          </div>
          <v-slider
            :model-value="brushSize"
            :min="1"
            :max="10"
            :step="1"
            show-ticks="always"
            tick-size="3"
            density="compact"
            hide-details
            color="primary"
            @update:model-value="$emit('update:brushSize', $event)"
          />
        </div>
      </v-menu>
    </template>

    <v-divider class="my-2 w-100" />

    <v-btn
      icon="mdi-undo"
      variant="text"
      size="small"
      class="my-1"
      :title="t('tools.undo')"
      :disabled="!canUndo"
      @click="$emit('undo')"
    />
    <v-btn
      icon="mdi-redo"
      variant="text"
      size="small"
      class="my-1"
      :title="t('tools.redo')"
      :disabled="!canRedo"
      @click="$emit('redo')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Tool } from '@/composables/useEditor';

defineProps<{ tool: Tool; canUndo: boolean; canRedo: boolean; brushSize: number }>();
defineEmits<{
  (e: 'update:tool', tool: Tool): void;
  (e: 'update:brushSize', size: number): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
}>();

const { t } = useI18n();

const tools = computed<{ value: Tool; icon: string; title: string }[]>(() => [
  { value: 'brush', icon: 'mdi-brush', title: t('tools.brush') },
  { value: 'eraser', icon: 'mdi-eraser', title: t('tools.eraser') },
  { value: 'bucket', icon: 'mdi-format-color-fill', title: t('tools.bucket') },
  { value: 'eyedropper', icon: 'mdi-eyedropper', title: t('tools.eyedropper') },
  { value: 'pan', icon: 'mdi-hand-back-right', title: t('tools.pan') },
]);
</script>

<style scoped>
.tool-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
  width: 60px;
  flex: 0 0 60px;
  background: rgb(var(--v-theme-surface));
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow-y: auto;
}
.w-100 {
  width: 100%;
}
.size-btn {
  position: relative;
}
.size-badge {
  position: absolute;
  right: 2px;
  bottom: 2px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-radius: 6px;
  padding: 1px 3px;
  font-variant-numeric: tabular-nums;
}
.size-popover {
  width: 200px;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
}
</style>
