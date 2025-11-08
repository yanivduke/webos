/**
 * i18n Manager - Internationalization System for WebOS
 *
 * Features:
 * - Dynamic language loading
 * - Browser language detection
 * - localStorage persistence
 * - Fallback to English
 * - Hot-reload without page refresh
 * - Pluralization support
 * - Date/time/number formatting
 * - Parameter interpolation
 */

interface TranslationData {
  [key: string]: string | TranslationData;
}

interface I18nConfig {
  defaultLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
  storageKey: string;
}

type SubscriberCallback = (locale: string) => void;

class I18nManager {
  private config: I18nConfig = {
    defaultLocale: 'en',
    fallbackLocale: 'en',
    supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'pt'],
    storageKey: 'webos_language'
  };

  private currentLocale: string = 'en';
  private translations: Map<string, TranslationData> = new Map();
  private subscribers: Set<SubscriberCallback> = new Set();
  private devMode: boolean = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize i18n system
   */
  private async init(): Promise<void> {
    // Check for dev mode (show translation keys when missing)
    this.devMode = import.meta.env.DEV || false;

    // Detect browser language
    const browserLang = this.detectBrowserLanguage();

    // Load language from localStorage or use browser language
    const savedLang = localStorage.getItem(this.config.storageKey);
    const initialLang = savedLang || browserLang || this.config.defaultLocale;

    // Load initial language
    await this.loadLanguage(initialLang);
  }

  /**
   * Detect browser language
   */
  private detectBrowserLanguage(): string {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Check if supported
    if (this.config.supportedLocales.includes(langCode)) {
      return langCode;
    }

    return this.config.defaultLocale;
  }

  /**
   * Load language file dynamically
   */
  async loadLanguage(locale: string): Promise<boolean> {
    try {
      // Normalize locale
      const normalizedLocale = locale.toLowerCase();

      // Check if supported
      if (!this.config.supportedLocales.includes(normalizedLocale)) {
        console.warn(`Language "${locale}" not supported. Falling back to ${this.config.fallbackLocale}`);
        return this.loadLanguage(this.config.fallbackLocale);
      }

      // Check if already loaded
      if (this.translations.has(normalizedLocale)) {
        this.currentLocale = normalizedLocale;
        this.notifySubscribers();
        return true;
      }

      // Load translation file
      const response = await fetch(`/locales/${normalizedLocale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${normalizedLocale}.json`);
      }

      const data = await response.json();
      this.translations.set(normalizedLocale, data);
      this.currentLocale = normalizedLocale;

      // Save to localStorage
      localStorage.setItem(this.config.storageKey, normalizedLocale);

      // Notify subscribers
      this.notifySubscribers();

      return true;
    } catch (error) {
      console.error(`Failed to load language "${locale}":`, error);

      // Try fallback if not already trying fallback
      if (locale !== this.config.fallbackLocale) {
        return this.loadLanguage(this.config.fallbackLocale);
      }

      return false;
    }
  }

  /**
   * Translate a key with optional parameters
   * @param key - Translation key (e.g., 'menu.workbench')
   * @param params - Optional parameters for interpolation
   * @returns Translated string
   */
  t(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key, this.currentLocale);

    if (!translation) {
      return this.handleMissingTranslation(key);
    }

    // Interpolate parameters
    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * Get translation for a specific key
   */
  private getTranslation(key: string, locale: string): string | null {
    const localeData = this.translations.get(locale);
    if (!localeData) return null;

    // Navigate nested keys (e.g., 'menu.workbench')
    const keys = key.split('.');
    let value: any = localeData;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Try fallback locale
        if (locale !== this.config.fallbackLocale) {
          return this.getTranslation(key, this.config.fallbackLocale);
        }
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  }

  /**
   * Interpolate parameters into translation string
   * Example: "Hello {name}" with {name: "World"} => "Hello World"
   */
  private interpolate(template: string, params: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, _key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * Handle missing translation
   */
  private handleMissingTranslation(key: string): string {
    if (this.devMode) {
      console.warn(`Missing translation for key: ${key}`);
      return `[${key}]`; // Show key in dev mode
    }
    return key.split('.').pop() || key; // Return last part of key
  }

  /**
   * Pluralization helper
   * @param key - Translation key
   * @param count - Number for pluralization
   * @param params - Additional parameters
   */
  plural(key: string, count: number, params?: Record<string, any>): string {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    const translation = this.t(pluralKey, { count, ...params });

    // Fallback to base key with count
    if (translation.startsWith('[') || translation === pluralKey) {
      return this.t(key, { count, ...params });
    }

    return translation;
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Format time according to locale
   */
  formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...options
    };
    return new Intl.DateTimeFormat(this.currentLocale, defaultOptions).format(date);
  }

  /**
   * Format number according to locale
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(num);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format relative time (e.g., "2 minutes ago")
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return this.t('time.justNow');
    } else if (diffMinutes < 60) {
      return this.plural('time.minutesAgo', diffMinutes);
    } else if (diffHours < 24) {
      return this.plural('time.hoursAgo', diffHours);
    } else if (diffDays < 30) {
      return this.plural('time.daysAgo', diffDays);
    } else {
      return this.formatDate(date);
    }
  }

  /**
   * Set current language
   */
  async setLanguage(locale: string): Promise<boolean> {
    return this.loadLanguage(locale);
  }

  /**
   * Get current language
   */
  getLanguage(): string {
    return this.currentLocale;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.config.supportedLocales];
  }

  /**
   * Check if locale is RTL (Right-to-Left)
   */
  isRTL(): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(this.currentLocale);
  }

  /**
   * Get language display name
   */
  getLanguageName(locale?: string): string {
    const lang = locale || this.currentLocale;
    const names: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      ja: '日本語',
      pt: 'Português'
    };
    return names[lang] || lang;
  }

  /**
   * Get language flag emoji
   */
  getLanguageFlag(locale?: string): string {
    const lang = locale || this.currentLocale;
    const flags: Record<string, string> = {
      en: '🇬🇧',
      es: '🇪🇸',
      fr: '🇫🇷',
      de: '🇩🇪',
      ja: '🇯🇵',
      pt: '🇵🇹'
    };
    return flags[lang] || '🌐';
  }

  /**
   * Subscribe to language changes
   */
  subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of language change
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback(this.currentLocale);
    });
  }

  /**
   * Export missing translations for translators
   * Returns keys that are in fallback locale but missing in current locale
   */
  exportMissingKeys(): string[] {
    const fallbackData = this.translations.get(this.config.fallbackLocale);
    const currentData = this.translations.get(this.currentLocale);

    if (!fallbackData || !currentData || this.currentLocale === this.config.fallbackLocale) {
      return [];
    }

    const missingKeys: string[] = [];
    const checkKeys = (obj: TranslationData, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') {
          checkKeys(value, fullKey);
        } else {
          const translation = this.getTranslation(fullKey, this.currentLocale);
          if (!translation || translation.startsWith('[')) {
            missingKeys.push(fullKey);
          }
        }
      }
    };

    checkKeys(fallbackData);
    return missingKeys;
  }

  /**
   * Get translation completion percentage
   */
  getCompletionPercentage(locale?: string): number {
    const lang = locale || this.currentLocale;

    if (lang === this.config.fallbackLocale) {
      return 100;
    }

    const fallbackData = this.translations.get(this.config.fallbackLocale);
    if (!fallbackData) return 0;

    const countKeys = (obj: TranslationData): number => {
      let count = 0;
      for (const value of Object.values(obj)) {
        if (typeof value === 'object') {
          count += countKeys(value);
        } else {
          count++;
        }
      }
      return count;
    };

    const totalKeys = countKeys(fallbackData);
    const missingKeys = this.exportMissingKeys().length;

    return Math.round(((totalKeys - missingKeys) / totalKeys) * 100);
  }
}

// Create singleton instance
const i18nManager = new I18nManager();

export default i18nManager;
