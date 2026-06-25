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

defineProps<{ tool: Tool; canUndo: boolean; canRedo: boolean }>();
defineEmits<{
  (e: 'update:tool', tool: Tool): void;
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
</style>
