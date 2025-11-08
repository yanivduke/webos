<template>
  <div class="i18n-demo">
    <div class="demo-header">
      <h2>i18n System Demo</h2>
      <p class="subtitle">Current Language: {{ getLanguageFlag() }} {{ getLanguageName() }}</p>
    </div>

    <div class="demo-section">
      <h3>Common Translations</h3>
      <div class="demo-grid">
        <button class="amiga-button">{{ t('common.save') }}</button>
        <button class="amiga-button">{{ t('common.cancel') }}</button>
        <button class="amiga-button">{{ t('common.delete') }}</button>
        <button class="amiga-button">{{ t('common.open') }}</button>
      </div>
    </div>

    <div class="demo-section">
      <h3>Menu Translations</h3>
      <div class="demo-list">
        <div>{{ t('menu.workbench') }}</div>
        <div>{{ t('menu.window') }}</div>
        <div>{{ t('menu.icons') }}</div>
        <div>{{ t('menu.tools') }}</div>
      </div>
    </div>

    <div class="demo-section">
      <h3>App Names</h3>
      <div class="demo-list">
        <div>{{ t('apps.calculator') }}</div>
        <div>{{ t('apps.notepad') }}</div>
        <div>{{ t('apps.shell') }}</div>
        <div>{{ t('apps.preferences') }}</div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Parameter Interpolation</h3>
      <div class="demo-list">
        <div>{{ t('messages.fileDeleted', { name: 'readme.txt' }) }}</div>
        <div>{{ t('messages.fileCopied', { name: 'document.doc' }) }}</div>
        <div>{{ t('language.languageChanged', { language: getLanguageName() }) }}</div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Pluralization</h3>
      <div class="demo-list">
        <div>{{ plural('messages.itemsSelected', 1) }}</div>
        <div>{{ plural('messages.itemsSelected', 5) }}</div>
        <div>{{ plural('time.minutesAgo', 1) }}</div>
        <div>{{ plural('time.minutesAgo', 30) }}</div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Date & Number Formatting</h3>
      <div class="demo-list">
        <div>Date: {{ formatDate(new Date()) }}</div>
        <div>Time: {{ formatTime(new Date()) }}</div>
        <div>Number: {{ formatNumber(1234567.89) }}</div>
        <div>Currency: {{ formatCurrency(99.99, 'USD') }}</div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Language Quick Switch</h3>
      <div class="demo-grid">
        <button
          v-for="lang in availableLanguages"
          :key="lang"
          class="amiga-button"
          :class="{ active: lang === locale }"
          @click="setLanguage(lang)"
        >
          {{ getLanguageFlag(lang) }} {{ getLanguageName(lang) }}
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h3>Language Info</h3>
      <div class="demo-list">
        <div>Current Locale: {{ locale }}</div>
        <div>RTL Mode: {{ isRTL ? 'Yes' : 'No' }}</div>
        <div>Completion: {{ getCompletionPercentage() }}%</div>
        <div>Available Languages: {{ availableLanguages.length }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '../../composables/useI18n';

const {
  t,
  plural,
  locale,
  isRTL,
  availableLanguages,
  setLanguage,
  getLanguageName,
  getLanguageFlag,
  getCompletionPercentage,
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency
} = useI18n();
</script>

<style scoped>
.i18n-demo {
  padding: 16px;
  font-family: 'Press Start 2P', monospace;
  background: #a0a0a0;
  height: 100%;
  overflow-y: auto;
}

.demo-header {
  margin-bottom: 20px;
  text-align: center;
}

.demo-header h2 {
  font-size: 14px;
  color: #000;
  margin: 0 0 8px 0;
  text-shadow: 1px 1px 0 #fff;
}

.subtitle {
  font-size: 9px;
  color: #0055aa;
  margin: 0;
}

.demo-section {
  margin-bottom: 20px;
  padding: 12px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.demo-section h3 {
  font-size: 10px;
  color: #0055aa;
  margin: 0 0 12px 0;
  border-bottom: 2px solid #0055aa;
  padding-bottom: 4px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.demo-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 9px;
  color: #000;
}

.demo-list > div {
  padding: 4px 8px;
  background: #e0e0e0;
  border: 1px solid #808080;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000;
  transition: all 0.1s;
  text-align: center;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

/* Scrollbar */
.i18n-demo::-webkit-scrollbar {
  width: 16px;
}

.i18n-demo::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.i18n-demo::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}
</style>
