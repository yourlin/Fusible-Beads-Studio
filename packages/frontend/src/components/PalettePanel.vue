<template>
  <v-card variant="flat" border rounded="xl">
    <v-card-title class="text-subtitle-1 d-flex align-center font-weight-bold">
      <v-icon size="20" color="primary" class="mr-2">mdi-palette-outline</v-icon>
      {{ t('palettePanel.title') }}
      <v-spacer />
      <span class="text-caption text-medium-emphasis">{{ selected?.name }}</span>
    </v-card-title>
    <v-card-text>
      <div class="swatches">
        <button
          v-for="(c, i) in colors"
          :key="c.id"
          type="button"
          class="swatch pd-bead"
          :class="{ 'swatch--active': i === modelValue }"
          :style="{ backgroundColor: c.hex }"
          :title="c.code ? `${c.name} · ${c.code}` : c.name"
          @click="$emit('update:modelValue', i)"
        >
          <span
            v-if="numberFor && numberFor[i]"
            class="swatch__num"
            :style="{ color: textColor(c.hex) }"
          >
            {{ numberFor[i] }}
          </span>
        </button>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { hexToRgb, type BeadColor } from '@pindou/shared';

const { t } = useI18n();
const props = defineProps<{
  colors: BeadColor[];
  modelValue: number;
  numberFor?: Record<number, number>;
}>();
defineEmits<{ (e: 'update:modelValue', index: number): void }>();

const selected = computed(() => props.colors[props.modelValue]);

/** 依据底色亮度返回黑/白，保证编号可读。 */
function textColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#FFFFFF';
}
</script>

<style scoped>
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
  gap: 9px;
  padding: 3px;
}
.swatch {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  padding: 0;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.swatch__num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}
.swatch:hover {
  transform: scale(1.12);
  z-index: 1;
}
.swatch--active {
  z-index: 2;
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.45),
    0 0 0 2px rgb(var(--v-theme-surface)),
    0 0 0 3.5px rgb(var(--v-theme-primary));
}
</style>
