# WebOS Internationalization (i18n) System

## Overview

A comprehensive multi-language support system for WebOS with hot-reload, browser detection, and locale-specific formatting.

## Features Implemented

### Core Features
- ✅ **Dynamic Language Loading** - Load translation files on demand
- ✅ **Browser Language Detection** - Auto-detect user's preferred language
- ✅ **localStorage Persistence** - Remember user's language choice
- ✅ **Hot-Reload** - Switch languages instantly without page refresh
- ✅ **Fallback System** - Gracefully fall back to English if translation missing
- ✅ **Parameter Interpolation** - `t('msg', { name: 'file.txt' })`
- ✅ **Pluralization** - Different translations for singular/plural
- ✅ **Date/Time Formatting** - Locale-aware date and time display
- ✅ **Number Formatting** - Locale-aware number display
- ✅ **Currency Formatting** - Currency with proper symbols
- ✅ **Relative Time** - "2 minutes ago", "5 hours ago"
- ✅ **RTL Support** - Right-to-left language detection
- ✅ **Dev Mode** - Shows missing translation keys in development
- ✅ **Translation Coverage** - Shows completion percentage per language

### Supported Languages

| Language | Code | Completion | Flag |
|----------|------|------------|------|
| English | en | 100% | 🇬🇧 |
| Spanish | es | ~85% | 🇪🇸 |
| French | fr | ~85% | 🇫🇷 |
| German | de | ~85% | 🇩🇪 |
| Japanese | ja | ~60% | 🇯🇵 |
| Portuguese | pt | ~85% | 🇵🇹 |

## File Structure

```
src/client/
├── utils/
│   └── i18n-manager.ts          # Core i18n manager singleton
├── composables/
│   └── useI18n.ts                # Vue composition API wrapper
├── components/
│   ├── AmigaLanguageIndicator.vue   # Menu bar language switcher
│   └── apps/
│       ├── AmigaLanguageSelector.vue  # Full language settings app
│       └── AmigaI18nDemo.vue         # Demo/testing component
├── public/
│   └── locales/
│       ├── en.json               # English (base)
│       ├── es.json               # Spanish
│       ├── fr.json               # French
│       ├── de.json               # German
│       ├── ja.json               # Japanese
│       └── pt.json               # Portuguese
└── I18N_IMPLEMENTATION.md        # This file
```

## Usage Guide

### 1. Basic Translation in Components

```vue
<template>
  <div>
    <button>{{ t('common.save') }}</button>
    <button>{{ t('common.cancel') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n';
const { t } = useI18n();
</script>
```

### 2. Parameter Interpolation

```vue
<template>
  <p>{{ t('messages.fileDeleted', { name: 'readme.txt' }) }}</p>
  <!-- Output: "File readme.txt deleted" -->
</template>
```

### 3. Pluralization

```vue
<template>
  <p>{{ plural('messages.itemsSelected', count) }}</p>
  <!-- count=1: "1 item selected" -->
  <!-- count=5: "5 items selected" -->
</template>

<script setup>
import { useI18n } from '@/composables/useI18n';
const { plural } = useI18n();
const count = ref(5);
</script>
```

### 4. Date and Number Formatting

```vue
<template>
  <div>
    <p>{{ formatDate(new Date()) }}</p>
    <p>{{ formatTime(new Date()) }}</p>
    <p>{{ formatNumber(1234567.89) }}</p>
    <p>{{ formatCurrency(99.99, 'USD') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n';
const { formatDate, formatTime, formatNumber, formatCurrency } = useI18n();
</script>
```

### 5. Language Switching

```vue
<template>
  <button @click="changeLanguage('es')">Español</button>
  <button @click="changeLanguage('fr')">Français</button>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n';
const { setLanguage } = useI18n();

const changeLanguage = async (lang) => {
  await setLanguage(lang);
};
</script>
```

### 6. Get Current Language Info

```vue
<template>
  <div>
    Current: {{ getLanguageName() }} {{ getLanguageFlag() }}
    <span v-if="isRTL">RTL Mode</span>
  </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n';
const { locale, isRTL, getLanguageName, getLanguageFlag } = useI18n();
</script>
```

## Translation File Structure

Each language file (`public/locales/{lang}.json`) follows this structure:

```json
{
  "common": {
    "ok": "OK",
    "cancel": "Cancel",
    "save": "Save"
  },
  "menu": {
    "workbench": "Workbench",
    "tools": "Tools"
  },
  "apps": {
    "calculator": "Calculator",
    "notepad": "NotePad"
  },
  "messages": {
    "fileDeleted": "File {name} deleted",
    "itemsSelected": {
      "singular": "{count} item selected",
      "plural": "{count} items selected"
    }
  },
  "time": {
    "justNow": "Just now",
    "minutesAgo": {
      "singular": "{count} minute ago",
      "plural": "{count} minutes ago"
    }
  }
}
```

## API Reference

### useI18n Composable

```typescript
const {
  // Reactive values
  locale,           // ref<string> - Current locale code
  isRTL,            // computed<boolean> - Is current language RTL
  availableLanguages, // computed<string[]> - All supported languages

  // Translation functions
  t,                // (key, params?) => string
  plural,           // (key, count, params?) => string

  // Language management
  setLanguage,      // (locale) => Promise<boolean>
  getLanguageName,  // (locale?) => string
  getLanguageFlag,  // (locale?) => string
  getCompletionPercentage, // (locale?) => number

  // Formatting
  formatDate,       // (date, options?) => string
  formatTime,       // (date, options?) => string
  formatNumber,     // (num, options?) => string
  formatCurrency,   // (amount, currency) => string
  formatRelativeTime, // (date) => string
} = useI18n();
```

### i18nManager Direct API

For use outside of Vue components:

```typescript
import i18nManager from '@/utils/i18n-manager';

// Translation
i18nManager.t('common.save');
i18nManager.t('messages.fileDeleted', { name: 'test.txt' });

// Language management
await i18nManager.loadLanguage('es');
await i18nManager.setLanguage('fr');
i18nManager.getLanguage(); // 'fr'

// Utilities
i18nManager.isRTL(); // false
i18nManager.getLanguageName('ja'); // '日本語'
i18nManager.getLanguageFlag('de'); // '🇩🇪'
i18nManager.getCompletionPercentage('es'); // 85

// Subscribe to changes
const unsubscribe = i18nManager.subscribe((newLocale) => {
  console.log('Language changed to:', newLocale);
});
// Later: unsubscribe();
```

## Components

### AmigaLanguageIndicator

Small language indicator for menu bar with dropdown.

**Props:** None

**Events:**
- `@openLanguageSelector` - Emitted when user wants full language selector

**Usage:**
```vue
<AmigaLanguageIndicator @openLanguageSelector="openLanguageApp" />
```

### AmigaLanguageSelector

Full-featured language management application.

**Features:**
- Visual list of all languages with flags
- Completion percentage bars
- Search languages
- Live preview of translations
- One-click language switching

**Props:** None

**Usage:**
Open as a window using the desktop's window manager.

### AmigaI18nDemo

Demonstration component showing all i18n features.

**Features:**
- Translation examples
- Pluralization demos
- Formatting examples
- Quick language switcher
- Language info display

**Usage:**
For testing and demonstration purposes.

## Integration into Existing Components

### Step 1: Import the Composable

```typescript
import { useI18n } from '@/composables/useI18n';
const { t } = useI18n();
```

### Step 2: Replace Hardcoded Strings

**Before:**
```vue
<button>Save</button>
```

**After:**
```vue
<button>{{ t('common.save') }}</button>
```

### Step 3: Handle Dynamic Content

**Before:**
```vue
<p>File {{ fileName }} deleted</p>
```

**After:**
```vue
<p>{{ t('messages.fileDeleted', { name: fileName }) }}</p>
```

## Adding New Languages

1. Create new translation file: `public/locales/{lang}.json`
2. Copy structure from `en.json`
3. Translate strings (start with most common ones)
4. Add language to `i18n-manager.ts` supportedLocales array
5. Add language name and flag to `getLanguageName()` and `getLanguageFlag()`

## Missing Translations

In development mode, missing translations will:
- Log warnings to console
- Display as `[translation.key]` in the UI

To find missing translations:
```typescript
import i18nManager from '@/utils/i18n-manager';

// Switch to target language
await i18nManager.setLanguage('es');

// Get missing keys
const missing = i18nManager.exportMissingKeys();
console.log(missing); // ['menu.newFeature', 'apps.newApp', ...]
```

## Performance Considerations

- **Lazy Loading**: Language files loaded on-demand (not all at startup)
- **Caching**: Once loaded, translations cached in memory
- **localStorage**: Current language persisted to avoid re-detection
- **Reactivity**: Efficient Vue reactivity system for instant updates

## Future Enhancements

- [ ] Arabic (ar) and Hebrew (he) for full RTL support
- [ ] Download additional language packs from server
- [ ] User-contributed translations
- [ ] Translation editor/contributor tool
- [ ] Locale-specific date formats (DD/MM vs MM/DD)
- [ ] Language-specific fonts for better CJK support
- [ ] Translation interpolation with HTML/components
- [ ] Namespace support for large applications
- [ ] Translation validation/linting tools

## Testing

To test the i18n system:

1. **Open i18n Demo App**
   - Add to Tools menu
   - Open "i18n Demo" window
   - Test all features interactively

2. **Manual Language Switching**
   - Click language indicator in menu bar
   - Select different languages
   - Verify instant updates

3. **Browser Language Detection**
   - Clear localStorage: `localStorage.removeItem('webos_language')`
   - Reload page
   - Should detect browser language

4. **Missing Translation Handling**
   - Open browser console
   - Switch to partially-translated language
   - Check for warnings about missing keys

## Troubleshooting

**Language not loading:**
- Check browser console for network errors
- Verify JSON files in `public/locales/` directory
- Check JSON syntax is valid

**Translations not updating:**
- Ensure component uses `useI18n()` composable
- Check that `t()` function is used in template
- Verify reactivity by accessing `locale.value`

**Wrong language on startup:**
- Check localStorage: `localStorage.getItem('webos_language')`
- Clear if corrupted: `localStorage.removeItem('webos_language')`
- Check browser language settings

**RTL not working:**
- RTL detection only for ar, he, fa, ur languages
- May need CSS updates for full RTL layout support

## Credits

Implemented as Phase 7 feature for WebOS.
Designed to be lightweight, performant, and Amiga-authentic.
