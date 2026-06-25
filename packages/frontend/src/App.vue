<template>
  <v-app>
    <v-app-bar color="surface" density="comfortable" flat class="app-bar">
      <template #prepend>
        <router-link to="/" class="brand" :aria-label="t('brand')">
          <svg class="brand__logo" viewBox="0 0 36 36" aria-hidden="true">
            <g v-for="b in logoBeads" :key="b.cx + '-' + b.cy">
              <circle :cx="b.cx" :cy="b.cy" r="7.5" :fill="b.color" />
              <circle :cx="b.cx" :cy="b.cy" r="2.6" fill="#FFFFFF" fill-opacity="0.85" />
            </g>
          </svg>
          <span class="brand__name font-brand">{{ t('brand') }}</span>
        </router-link>
      </template>

      <template #append>
        <v-btn variant="text" to="/" exact prepend-icon="mdi-home-variant-outline">
          {{ t('nav.home') }}
        </v-btn>
        <v-btn variant="flat" color="primary" to="/studio" prepend-icon="mdi-palette" class="ml-1">
          {{ t('nav.studio') }}
        </v-btn>
        <v-btn-toggle
          :model-value="locale"
          mandatory
          density="compact"
          variant="outlined"
          divided
          class="ml-3 lang-toggle"
          @update:model-value="onLocale"
        >
          <v-btn value="en" size="small">EN</v-btn>
          <v-btn value="zh" size="small">中文</v-btn>
        </v-btn-toggle>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { setLocale } from '@/plugins/i18n';

const { t, locale } = useI18n();

function onLocale(value: unknown) {
  if (value === 'en' || value === 'zh') setLocale(value);
}

const logoBeads = [
  { cx: 11, cy: 11, color: '#C8456B' },
  { cx: 25, cy: 11, color: '#15A08C' },
  { cx: 11, cy: 25, color: '#F2A03D' },
  { cx: 25, cy: 25, color: '#3A86C8' },
];
</script>

<style scoped>
.app-bar {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: 8px;
  text-decoration: none;
  color: rgb(var(--v-theme-on-surface));
}
.brand__logo {
  width: 30px;
  height: 30px;
  filter: drop-shadow(0 1px 1px rgba(44, 42, 51, 0.18));
  flex: 0 0 auto;
}
.brand__name {
  font-size: 1.3rem;
  line-height: 1;
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 600px) {
  .brand__name {
    display: none;
  }
}
</style>
