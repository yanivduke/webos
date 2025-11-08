<template>
  <div class="language-selector">
    <div class="selector-header">
      <h2>{{ t('language.selectLanguage') }}</h2>
      <div class="current-language">
        <span class="label">{{ t('language.currentLanguage') }}:</span>
        <span class="value">{{ getLanguageFlag() }} {{ getLanguageName() }}</span>
      </div>
    </div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('language.searchLanguages')"
        class="amiga-input"
      />
    </div>

    <div class="languages-list">
      <div
        v-for="lang in filteredLanguages"
        :key="lang"
        class="language-item"
        :class="{ active: lang === locale }"
        @click="changeLanguage(lang)"
      >
        <div class="language-info">
          <span class="flag">{{ getLanguageFlag(lang) }}</span>
          <span class="name">{{ getLanguageName(lang) }}</span>
        </div>
        <div class="language-meta">
          <div class="completion-bar">
            <div
              class="completion-fill"
              :style="{ width: getCompletionPercentage(lang) + '%' }"
            ></div>
          </div>
          <span class="completion-text">{{ getCompletionPercentage(lang) }}%</span>
        </div>
        <div v-if="lang === locale" class="active-indicator">✓</div>
      </div>
    </div>

    <div class="preview-section">
      <h3>{{ t('language.sampleText') }}</h3>
      <div class="preview-text">
        <p><strong>{{ t('menu.workbench') }}</strong></p>
        <p>{{ t('messages.itemsSelected', { count: 3 }) }}</p>
        <p>{{ t('common.save') }} | {{ t('common.cancel') }} | {{ t('common.delete') }}</p>
      </div>
    </div>

    <div class="selector-footer">
      <button class="amiga-button" @click="downloadMore" disabled>
        {{ t('language.downloadMore') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useI18n } from '../../composables/useI18n';

const {
  t,
  locale,
  availableLanguages,
  setLanguage,
  getLanguageName,
  getLanguageFlag,
  getCompletionPercentage
} = useI18n();

const searchQuery = ref('');

const filteredLanguages = computed(() => {
  if (!searchQuery.value) {
    return availableLanguages.value;
  }

  const query = searchQuery.value.toLowerCase();
  return availableLanguages.value.filter(lang => {
    const name = getLanguageName(lang).toLowerCase();
    return name.includes(query) || lang.includes(query);
  });
});

const changeLanguage = async (lang: string) => {
  const success = await setLanguage(lang);
  if (success) {
    console.log(`Language changed to ${lang}`);
  }
};

const downloadMore = () => {
  // Future feature: Download additional language packs
  alert(t('language.downloadMore') + ' - Coming Soon!');
};
</script>

<style scoped>
.language-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.selector-header {
  margin-bottom: 16px;
}

.selector-header h2 {
  font-size: 14px;
  color: #000;
  margin: 0 0 12px 0;
  text-shadow: 1px 1px 0 #fff;
}

.current-language {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 10px;
}

.current-language .label {
  color: #0055aa;
  font-weight: bold;
}

.current-language .value {
  color: #000;
}

.search-box {
  margin-bottom: 12px;
}

.amiga-input {
  width: 100%;
  padding: 6px 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #000;
}

.amiga-input:focus {
  outline: none;
  background: #ffffcc;
}

.languages-list {
  flex: 1;
  overflow-y: auto;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
  padding: 4px;
  margin-bottom: 12px;
}

.language-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 4px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: all 0.1s;
  position: relative;
}

.language-item:hover {
  background: #b0b0b0;
  transform: translateY(-1px);
}

.language-item.active {
  background: #0055aa;
  border-color: #000000 #ffffff #ffffff #000000;
}

.language-item.active .language-info {
  color: #ffffff;
}

.language-item.active .completion-text {
  color: #ffffff;
}

.language-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9px;
  color: #000;
  flex: 1;
}

.flag {
  font-size: 16px;
}

.name {
  font-weight: bold;
}

.language-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.completion-bar {
  width: 50px;
  height: 8px;
  background: #666;
  border: 1px solid #000;
  position: relative;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: #00ff00;
  transition: width 0.3s;
}

.language-item.active .completion-fill {
  background: #ffaa00;
}

.completion-text {
  font-size: 8px;
  color: #000;
  font-weight: bold;
  min-width: 30px;
}

.active-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #00ff00;
  font-weight: bold;
}

.preview-section {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  margin-bottom: 12px;
}

.preview-section h3 {
  font-size: 10px;
  color: #0055aa;
  margin: 0 0 8px 0;
}

.preview-text {
  font-size: 8px;
  color: #000;
  line-height: 1.6;
}

.preview-text p {
  margin: 4px 0;
}

.preview-text strong {
  color: #0055aa;
}

.selector-footer {
  display: flex;
  justify-content: center;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000;
  transition: all 0.1s;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Scrollbar styling */
.languages-list::-webkit-scrollbar {
  width: 16px;
}

.languages-list::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.languages-list::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.languages-list::-webkit-scrollbar-thumb:hover {
  background: #0066cc;
}
</style>
