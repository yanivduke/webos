# i18n Quick Start Guide

## 🚀 5-Minute Integration

### 1. Import in Your Component
```vue
<script setup>
import { useI18n } from '@/composables/useI18n';
const { t } = useI18n();
</script>
```

### 2. Use in Template
```vue
<template>
  <button>{{ t('common.save') }}</button>
</template>
```

### 3. Done!
Language will automatically switch when user changes it.

---

## 📚 Common Use Cases

### Static Text
```vue
{{ t('common.ok') }}
{{ t('menu.workbench') }}
{{ t('apps.calculator') }}
```

### With Variables
```vue
{{ t('messages.fileDeleted', { name: 'readme.txt' }) }}
```

### Pluralization
```vue
{{ plural('messages.itemsSelected', count) }}
```

### Dates & Numbers
```vue
{{ formatDate(new Date()) }}
{{ formatNumber(1234.56) }}
{{ formatCurrency(99.99, 'USD') }}
```

### Change Language
```vue
<script setup>
const { setLanguage } = useI18n();
await setLanguage('es'); // Spanish
</script>
```

---

## 🗂️ Available Translation Keys

### Common (`common.*`)
- ok, cancel, save, delete, close
- open, copy, paste, cut, rename
- new, edit, search, yes, no

### Menu (`menu.*`)
- workbench, window, icons, tools
- about, quit, update, preferences

### Apps (`apps.*`)
- calculator, notepad, shell, clock
- paint, multiview, preferences

### Messages (`messages.*`)
- fileDeleted, fileCopied, fileRenamed
- itemsSelected, confirmDelete

See `public/locales/en.json` for complete list.

---

## 🌍 Supported Languages

- 🇬🇧 English (en) - 100%
- 🇪🇸 Spanish (es) - 85%
- 🇫🇷 French (fr) - 85%
- 🇩🇪 German (de) - 85%
- 🇯🇵 Japanese (ja) - 60%
- 🇵🇹 Portuguese (pt) - 85%

---

## 🔗 Full Documentation

See `I18N_IMPLEMENTATION.md` for complete API reference and examples.
