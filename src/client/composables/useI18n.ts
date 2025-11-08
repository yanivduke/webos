/**
 * useI18n - Vue Composable for Internationalization
 *
 * Usage in components:
 *
 * <script setup>
 * import { useI18n } from '@/composables/useI18n';
 * const { t, locale, setLanguage, formatDate, formatNumber } = useI18n();
 * </script>
 *
 * <template>
 *   <button>{{ t('common.save') }}</button>
 *   <p>{{ t('messages.fileDeleted', { name: 'test.txt' }) }}</p>
 * </template>
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import i18nManager from '../utils/i18n-manager';

export function useI18n() {
  // Reactive locale ref
  const locale = ref(i18nManager.getLanguage());

  // Subscribe to language changes
  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    unsubscribe = i18nManager.subscribe((newLocale) => {
      locale.value = newLocale;
    });
  });

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  /**
   * Translate function (reactive)
   */
  const t = (key: string, params?: Record<string, any>) => {
    // Force reactivity by accessing locale.value
    locale.value;
    return i18nManager.t(key, params);
  };

  /**
   * Plural translation
   */
  const plural = (key: string, count: number, params?: Record<string, any>) => {
    locale.value;
    return i18nManager.plural(key, count, params);
  };

  /**
   * Set language
   */
  const setLanguage = async (newLocale: string): Promise<boolean> => {
    const success = await i18nManager.setLanguage(newLocale);
    if (success) {
      locale.value = i18nManager.getLanguage();
    }
    return success;
  };

  /**
   * Get available languages
   */
  const availableLanguages = computed(() => {
    return i18nManager.getSupportedLanguages();
  });

  /**
   * Get language name
   */
  const getLanguageName = (languageCode?: string) => {
    return i18nManager.getLanguageName(languageCode);
  };

  /**
   * Get language flag
   */
  const getLanguageFlag = (languageCode?: string) => {
    return i18nManager.getLanguageFlag(languageCode);
  };

  /**
   * Check if current language is RTL
   */
  const isRTL = computed(() => {
    locale.value;
    return i18nManager.isRTL();
  });

  /**
   * Format date according to current locale
   */
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    locale.value;
    return i18nManager.formatDate(date, options);
  };

  /**
   * Format time according to current locale
   */
  const formatTime = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    locale.value;
    return i18nManager.formatTime(date, options);
  };

  /**
   * Format number according to current locale
   */
  const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    locale.value;
    return i18nManager.formatNumber(num, options);
  };

  /**
   * Format currency according to current locale
   */
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    locale.value;
    return i18nManager.formatCurrency(amount, currency);
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (date: Date) => {
    locale.value;
    return i18nManager.formatRelativeTime(date);
  };

  /**
   * Get translation completion percentage
   */
  const getCompletionPercentage = (languageCode?: string) => {
    return i18nManager.getCompletionPercentage(languageCode);
  };

  return {
    // Reactive values
    locale,
    isRTL,
    availableLanguages,

    // Translation functions
    t,
    plural,

    // Language management
    setLanguage,
    getLanguageName,
    getLanguageFlag,
    getCompletionPercentage,

    // Formatting functions
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime
  };
}
