<template>
  <div>
    <div
      v-if="!previewUrl"
      class="dropzone"
      :class="{ 'dropzone--active': dragging }"
      role="button"
      tabindex="0"
      @click="openFileDialog"
      @keydown.enter.prevent="openFileDialog"
      @keydown.space.prevent="openFileDialog"
      @dragover.prevent="dragging = true"
      @dragenter.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <div class="dropzone__tile">
        <v-icon size="32" color="primary">mdi-cloud-upload-outline</v-icon>
      </div>
      <div class="text-body-1 font-weight-medium mt-3">{{ t('upload.dropHint') }}</div>
      <div class="text-caption text-medium-emphasis mt-1">
        {{ t('upload.formats') }}
      </div>
    </div>

    <div v-else class="preview-wrap">
      <img :src="previewUrl" alt="preview" class="preview" />
      <v-btn
        icon="mdi-close"
        size="x-small"
        color="error"
        variant="flat"
        class="preview-clear"
        :title="t('upload.cancel')"
        @click="$emit('clear')"
      />
      <div class="text-caption text-medium-emphasis mt-2 text-center text-truncate">{{ name }}</div>
      <v-btn variant="text" size="small" block class="mt-1" prepend-icon="mdi-image-sync-outline" @click="openFileDialog">
        {{ t('upload.reselect') }}
      </v-btn>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*,.svg"
      class="d-none"
      data-testid="upload-input"
      @change="onFileChange"
    />

    <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mt-3">
      {{ errorMsg }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { precompressImage } from '@/utils/imageCompress';

const { t } = useI18n();
const props = defineProps<{ source: Blob | null; name: string | null }>();
const emit = defineEmits<{
  (e: 'image', blob: Blob, name: string): void;
  (e: 'clear'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const errorMsg = ref<string | null>(null);
const previewUrl = ref<string | null>(null);

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
}

// 预览由 store 中的 source 驱动（单一数据源）
watch(
  () => props.source,
  (blob) => {
    revokePreview();
    if (blob) previewUrl.value = URL.createObjectURL(blob);
  },
  { immediate: true },
);

function openFileDialog() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void handleFile(file);
  input.value = '';
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) void handleFile(file);
}

async function handleFile(file: File) {
  errorMsg.value = null;
  const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
  if (!file.type.startsWith('image/') && !isSvg) {
    errorMsg.value = t('upload.notImage');
    return;
  }
  try {
    let blob: Blob;
    if (isSvg) {
      blob = await rasterizeSvg(file);
    } else {
      blob = await precompressImage(file);
    }
    emit('image', blob, file.name);
  } catch {
    errorMsg.value = t('upload.loadFailed');
  }
}

/** 将 SVG 文件通过 Image + Canvas 栅格化为 PNG Blob。 */
async function rasterizeSvg(file: Blob, maxEdge = 1024): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('SVG 加载失败'));
      i.src = url;
    });
    let w = img.naturalWidth || 512;
    let h = img.naturalHeight || 512;
    if (Math.max(w, h) > maxEdge) {
      const s = maxEdge / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ?? file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

onBeforeUnmount(revokePreview);
</script>

<style scoped>
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 18px;
  padding: 36px 16px;
  text-align: center;
  cursor: pointer;
  background: rgba(var(--v-theme-primary), 0.02);
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.dropzone:hover {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background-color: rgba(var(--v-theme-primary), 0.05);
}
.dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.09);
  transform: scale(1.01);
}
.dropzone__tile {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.12);
}
.preview-wrap {
  position: relative;
  text-align: center;
}
.preview {
  max-width: 100%;
  max-height: 240px;
  border-radius: 12px;
  image-rendering: pixelated;
}
.preview-clear {
  position: absolute;
  top: 6px;
  right: 6px;
}
.d-none {
  display: none;
}
</style>
