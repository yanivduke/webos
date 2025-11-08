<template>
  <div class="language-indicator" @click="toggleDropdown" ref="indicatorRef">
    <span class="flag">{{ getLanguageFlag() }}</span>
    <span class="code">{{ locale.toUpperCase() }}</span>

    <div v-if="showDropdown" class="language-dropdown" @click.stop>
      <div
        v-for="lang in availableLanguages"
        :key="lang"
        class="dropdown-item"
        :class="{ active: lang === locale }"
        @click="changeLang(lang)"
      >
        <span class="flag">{{ getLanguageFlag(lang) }}</span>
        <span class="name">{{ getLanguageName(lang) }}</span>
        <span v-if="lang === locale" class="check">✓</span>
      </div>
      <div class="dropdown-separator"></div>
      <div class="dropdown-item" @click="openLanguageSelector">
        <span>⚙️</span>
        <span class="name">{{ t('language.selectLanguage') }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../composables/useI18n';

const emit = defineEmits(['openLanguageSelector']);

const {
  t,
  locale,
  availableLanguages,
  setLanguage,
  getLanguageName,
  getLanguageFlag
} = useI18n();

const showDropdown = ref(false);
const indicatorRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const changeLang = async (lang: string) => {
  await setLanguage(lang);
  showDropdown.value = false;
};

const openLanguageSelector = () => {
  showDropdown.value = false;
  emit('openLanguageSelector');
};

const handleClickOutside = (event: MouseEvent) => {
  if (indicatorRef.value && !indicatorRef.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.language-indicator {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  cursor: pointer;
  user-select: none;
  background: rgba(0, 85, 170, 0.1);
  border: 1px solid #0055aa;
  transition: all 0.1s;
}

.language-indicator:hover {
  background: rgba(0, 85, 170, 0.2);
}

.flag {
  font-size: 12px;
}

.code {
  font-size: 9px;
  font-weight: bold;
  color: #0055aa;
}

.language-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 180px;
  font-size: 9px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  color: #000;
  background: #a0a0a0;
  border-bottom: 1px solid #808080;
  transition: all 0.1s;
  white-space: nowrap;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.dropdown-item.active {
  background: #b0b0b0;
  font-weight: bold;
}

.dropdown-item .name {
  flex: 1;
}

.dropdown-item .check {
  color: #00ff00;
  font-weight: bold;
}

.dropdown-separator {
  height: 2px;
  background: #000000;
  margin: 2px 0;
}
</style>
