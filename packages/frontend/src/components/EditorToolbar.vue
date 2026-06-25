<template>
  <v-card variant="outlined">
    <v-card-text class="py-2">
      <div class="d-flex align-center flex-wrap ga-1">
        <v-btn-toggle
          :model-value="tool"
          mandatory
          density="comfortable"
          color="primary"
          variant="outlined"
          divided
          @update:model-value="$emit('update:tool', $event)"
        >
          <v-btn value="brush" title="画笔"><v-icon>mdi-brush</v-icon></v-btn>
          <v-btn value="eraser" title="橡皮（恢复原色）"><v-icon>mdi-eraser</v-icon></v-btn>
          <v-btn value="bucket" title="油漆桶"><v-icon>mdi-format-color-fill</v-icon></v-btn>
          <v-btn value="eyedropper" title="取色器"><v-icon>mdi-eyedropper</v-icon></v-btn>
        </v-btn-toggle>

        <v-divider vertical class="mx-2" />

        <v-btn
          icon
          variant="text"
          size="small"
          title="撤销 (Ctrl+Z)"
          :disabled="!canUndo"
          @click="$emit('undo')"
        >
          <v-icon>mdi-undo</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="small"
          title="重做 (Ctrl+Shift+Z)"
          :disabled="!canRedo"
          @click="$emit('redo')"
        >
          <v-icon>mdi-redo</v-icon>
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Tool } from '@/composables/useEditor';

defineProps<{ tool: Tool; canUndo: boolean; canRedo: boolean }>();
defineEmits<{
  (e: 'update:tool', tool: Tool): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
}>();
</script>
