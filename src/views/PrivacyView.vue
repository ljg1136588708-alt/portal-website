<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

function toggleLang() {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}
</script>

<template>
  <div class="privacy-wrapper">
    <div class="privacy-content">
      <div class="top-bar">
        <a href="/" class="back-link">← {{ locale === 'en' ? 'Home' : '首页' }}</a>
        <button class="lang-btn" @click="toggleLang">
          {{ locale === 'en' ? 'ZH' : 'EN' }}
        </button>
      </div>

      <h1>{{ t('privacy.title') }}</h1>
      <p class="updated">{{ t('privacy.updated') }}</p>

      <section v-for="key in ['overview','noCollection','localStorage','permissions','thirdParty','changes']" :key="key">
        <h2>{{ t(`privacy.sections.${key}.title`) }}</h2>
        <p>{{ t(`privacy.sections.${key}.content`) }}</p>
      </section>

      <section>
        <h2>{{ t('privacy.sections.contact.title') }}</h2>
        <p>
          {{ t('privacy.sections.contact.content') }}
          <a href="mailto:ljg1136588708@gmail.com">ljg1136588708@gmail.com</a>.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.privacy-wrapper {
  min-height: 100vh;
  background: #f9f9f9;
  padding: 60px 16px;
}
.privacy-content {
  max-width: 760px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 48px 56px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.back-link {
  font-size: 0.875rem;
  color: #1677ff;
  text-decoration: none;
}
.back-link:hover { text-decoration: underline; }
.lang-btn {
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  color: #555;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}
.lang-btn:hover { background: #e0e0e0; }
h1 { font-size: 2rem; font-weight: 700; color: #111; margin-bottom: 4px; }
.updated { color: #888; font-size: 0.875rem; margin-bottom: 36px; }
section { margin-bottom: 32px; }
h2 { font-size: 1.125rem; font-weight: 600; color: #222; margin-bottom: 10px; }
p { line-height: 1.75; color: #444; }
a { color: #1677ff; text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
