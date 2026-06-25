<template>
  <v-dialog
    :model-value="modelValue"
    max-width="820"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-title class="dialog-title d-flex align-center">
        <span class="pd-bead title-bead" />
        <span class="font-brand text-h6">{{ t('dialog.title') }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-divider />

      <v-card-text class="dialog-body pd-scroll">
        <!-- 上传区（无图片时全宽居中） -->
        <div v-if="!store.hasSource" class="upload-area">
          <UploadPanel
            :source="store.sourceBlob"
            :name="store.sourceName"
            @image="onImage"
            @clear="onClear"
          />
        </div>

        <!-- 有图片后：参数 + 左右对比 -->
        <template v-else>
          <!-- 参数行 -->
          <div class="mb-5">
            <div class="section-eyebrow">
              <span class="pd-bead section-eyebrow__dot" />{{ t('dialog.params') }}
            </div>
            <ParameterPanel />
          </div>

          <!-- 原图 vs 预览 左右对比 -->
          <v-row dense>
            <v-col cols="6">
              <div class="section-eyebrow">
                <span class="pd-bead section-eyebrow__dot" />{{ t('dialog.original') }}
              </div>
              <div class="compare-pane pd-checker">
                <UploadPanel
                  :source="store.sourceBlob"
                  :name="store.sourceName"
                  @image="onImage"
                  @clear="onClear"
                />
              </div>
            </v-col>
            <v-col cols="6">
              <div class="section-eyebrow">
                <span class="pd-bead section-eyebrow__dot section-eyebrow__dot--alt" />{{ t('dialog.beadPreview') }}
              </div>
              <div class="compare-pane pd-checker">
                <BeadPreview />
              </div>
            </v-col>
          </v-row>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-4 py-3">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">{{ t('dialog.cancel') }}</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="pill"
          class="px-6"
          :disabled="!store.hasSource"
          :loading="loading"
          prepend-icon="mdi-auto-fix"
          data-testid="generate-btn"
          @click="$emit('generate')"
        >
          {{ store.hasDesign ? t('dialog.regenerate') : t('dialog.generate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import UploadPanel from '@/components/UploadPanel.vue';
import ParameterPanel from '@/components/ParameterPanel.vue';
import BeadPreview from '@/components/BeadPreview.vue';
import { useDesignStore } from '@/stores/design';

const { t } = useI18n();
defineProps<{ modelValue: boolean; loading?: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', open: boolean): void;
  (e: 'image', blob: Blob, name: string): void;
  (e: 'clear'): void;
  (e: 'generate'): void;
}>();

const store = useDesignStore();

function onImage(blob: Blob, name: string) {
  emit('image', blob, name);
}
function onClear() {
  emit('clear');
}
</script>

<style scoped>
.dialog-title {
  padding: 16px 16px 16px 20px;
}
.title-bead {
  width: 16px;
  height: 16px;
  background: rgb(var(--v-theme-primary));
  margin-right: 10px;
}
.dialog-body {
  max-height: 68vh;
}
.upload-area {
  max-width: 440px;
  margin: 0 auto;
}
.section-eyebrow {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 10px;
}
.section-eyebrow__dot {
  width: 11px;
  height: 11px;
  background: rgb(var(--v-theme-primary));
  margin-right: 7px;
}
.section-eyebrow__dot--alt {
  background: rgb(var(--v-theme-secondary));
}
.compare-pane {
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  padding: 10px;
  min-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
