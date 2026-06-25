<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <v-container class="hero__container">
        <v-row align="center">
          <v-col cols="12" md="6">
            <div class="hero__eyebrow">
              <span class="pd-bead hero__eyebrow-dot" />
              {{ t('home.eyebrow') }}
            </div>
            <h1 class="hero__title font-brand">
              {{ t('home.titleLine1') }}<br />{{ t('home.titleLine2') }}
            </h1>
            <p class="hero__lead">{{ t('home.lead') }}</p>
            <div class="hero__actions">
              <v-btn size="large" color="primary" to="/studio" prepend-icon="mdi-palette" rounded="pill">
                {{ t('home.start') }}
              </v-btn>
              <v-btn
                size="large"
                variant="text"
                color="secondary"
                href="#features"
                append-icon="mdi-arrow-down"
              >
                {{ t('home.learn') }}
              </v-btn>
              <v-btn
                size="large"
                variant="text"
                icon="mdi-github"
                color="secondary"
                href="https://github.com/yourlin/Fusible-Beads-Studio"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="t('home.github')"
                :title="t('home.github')"
              />
            </div>
          </v-col>

          <!-- 签名元素:一颗用珠子拼出的爱心,直接体现产品在做的事 -->
          <v-col cols="12" md="6" class="d-flex justify-center justify-md-start">
            <div class="bead-art" role="img" aria-label="用拼豆拼成的爱心示意">
              <div
                v-for="(cell, i) in heartCells"
                :key="i"
                class="bead-art__cell"
              >
                <span
                  v-if="cell"
                  class="pd-bead bead-art__bead"
                  :style="{ backgroundColor: cell }"
                />
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Features -->
    <section id="features" class="features">
      <v-container>
        <h2 class="section-title font-brand">{{ t('home.sectionTitle') }}</h2>
        <v-row class="mt-2">
          <v-col v-for="(f, i) in features" :key="f.title" cols="12" sm="4">
            <v-card class="feature-card pd-lift h-100" elevation="0" border>
              <v-card-item>
                <div class="feature-card__num font-brand">0{{ i + 1 }}</div>
                <div class="feature-card__icon" :style="{ backgroundColor: f.tint }">
                  <v-icon :icon="f.icon" :color="f.color" size="26" />
                </div>
                <v-card-title class="feature-card__title">{{ f.title }}</v-card-title>
                <v-card-text class="px-0 text-medium-emphasis">{{ f.desc }}</v-card-text>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const B = '#C8456B'; // 莓果
const H = '#E8829E'; // 高光浅莓
const heart = [
  [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
  [1, 2, 2, 1, 0, 0, 0, 1, 2, 2, 1],
  [1, 2, 1, 1, 1, 0, 1, 1, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
];
const heartCells = heart.flat().map((v) => (v === 0 ? null : v === 2 ? H : B));

const features = computed(() => [
  {
    icon: 'mdi-image-multiple-outline',
    title: t('home.f1Title'),
    desc: t('home.f1Desc'),
    color: '#C8456B',
    tint: 'rgba(200, 69, 107, 0.12)',
  },
  {
    icon: 'mdi-brush-variant',
    title: t('home.f2Title'),
    desc: t('home.f2Desc'),
    color: '#15A08C',
    tint: 'rgba(21, 160, 140, 0.12)',
  },
  {
    icon: 'mdi-file-export-outline',
    title: t('home.f3Title'),
    desc: t('home.f3Desc'),
    color: '#F2A03D',
    tint: 'rgba(242, 160, 61, 0.16)',
  },
]);
</script>

<style scoped>
.home {
  min-height: calc(100vh - 56px);
}

/* ── Hero ── */
.hero {
  padding: clamp(40px, 7vw, 96px) 0 clamp(32px, 5vw, 64px);
  background:
    radial-gradient(120% 80% at 85% 0%, rgba(200, 69, 107, 0.08), transparent 60%),
    radial-gradient(90% 70% at 0% 100%, rgba(21, 160, 140, 0.08), transparent 55%);
}
.hero__container {
  max-width: 1080px;
}
.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-secondary));
  background: rgba(21, 160, 140, 0.1);
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 22px;
}
.hero__eyebrow-dot {
  width: 12px;
  height: 12px;
  background: rgb(var(--v-theme-secondary));
}
.hero__title {
  font-size: clamp(2.4rem, 5.5vw, 3.8rem);
  line-height: 1.12;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 18px;
}
.hero__lead {
  font-size: 1.06rem;
  line-height: 1.75;
  color: rgba(var(--v-theme-on-surface), 0.7);
  max-width: 30rem;
  margin-bottom: 28px;
}
.hero__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── 爱心豆图签名 ── */
.bead-art {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: clamp(4px, 1vw, 8px);
  width: min(100%, 380px);
  padding: clamp(16px, 3vw, 28px);
  background: rgb(var(--v-theme-surface));
  border-radius: 28px;
  box-shadow: 0 24px 60px -28px rgba(44, 42, 51, 0.4);
  transform: rotate(-3deg);
}
.bead-art__cell {
  aspect-ratio: 1;
}
.bead-art__bead {
  display: block;
  width: 100%;
  height: 100%;
}

/* ── Features ── */
.features {
  padding: clamp(32px, 5vw, 72px) 0 clamp(48px, 7vw, 96px);
}
.section-title {
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
}
.feature-card {
  position: relative;
  padding: 8px;
  overflow: hidden;
}
.feature-card__num {
  position: absolute;
  top: 6px;
  right: 16px;
  font-size: 2.6rem;
  color: rgba(var(--v-theme-on-surface), 0.06);
}
.feature-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.feature-card__title {
  font-weight: 700;
  padding-left: 0;
}
</style>
