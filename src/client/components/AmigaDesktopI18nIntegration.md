# How to Integrate i18n into AmigaDesktop

## Step 1: Add Imports

Add these imports to `AmigaDesktop.vue` after the existing imports:

```typescript
import AmigaLanguageSelector from './apps/AmigaLanguageSelector.vue';
import AmigaLanguageIndicator from './AmigaLanguageIndicator.vue';
```

## Step 2: Add Language Indicator to Menu Bar

In the template, update the `menu-right` section (around line 31-37):

```vue
<div class="menu-right">
  <AmigaLanguageIndicator @openLanguageSelector="handleOpenTool('Language Selector')" />
  <div v-if="hasClipboardItems" class="clipboard-indicator" @click="handleOpenTool('Clipboard')" title="Clipboard has items">
    📋
  </div>
  <div class="system-time">{{ currentTime }}</div>
  <div class="memory-indicator">Chip: {{ chipMem }} | Fast: {{ fastMem }}</div>
</div>
```

## Step 3: Add Language Selector to Tools Menu

Update the Tools menu items (around line 216):

```typescript
{ name: 'Tools', items: ['Search Files', 'Calculator', 'Clock', 'NotePad', 'Paint', 'MultiView', 'Shell', 'System Monitor', 'Task Manager', 'Clipboard', 'Workspace Manager', 'Language Selector', 'AWML Runner', 'AWML Wizard', 'Preferences'] }
```

## Step 4: Add Tool Configuration

Add this to the `toolConfigs` object (around line 550-640):

```typescript
'Language Selector': {
  title: 'Language Selector',
  width: 520,
  height: 480,
  component: AmigaLanguageSelector,
  baseX: 200,
  baseY: 120
},
```

## Step 5: Optional - Add Translations

To use translations in the component, import the useI18n composable:

```typescript
import { useI18n } from '../composables/useI18n';

// In setup
const { t } = useI18n();

// In template
<div>{{ t('menu.workbench') }}</div>
```

## Components to Update

For full i18n support, update these components:

1. **AmigaDesktop.vue** - Menu bar, tooltips, messages
2. **AmigaFolder.vue** - Button labels, file info
3. **AmigaContextMenu.vue** - Menu items
4. **All apps** - Button labels, messages

Example translations:
- `t('common.save')` → "Save"
- `t('menu.workbench')` → "Workbench"
- `t('messages.fileDeleted', { name: 'test.txt' })` → "File test.txt deleted"
