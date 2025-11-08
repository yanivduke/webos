# WebOS Theme System Documentation

## Overview

WebOS features a comprehensive theme system that allows users to switch between different retro operating system aesthetics. The system uses CSS custom properties (variables) for dynamic theming without page reloads.

## Architecture

### Backend Components

#### 1. Theme Schema (`src/server/themes/theme-schema.js`)
Defines the complete structure of a theme, including:
- Desktop appearance (background, wallpaper)
- Color palette (90+ color variables)
- Typography (fonts, sizes, weights)
- Window styling
- UI component styles (buttons, icons, menus, scrollbars)
- System bar appearance
- Animation settings

#### 2. Theme Files (`src/server/themes/*.theme.js`)
Individual theme configuration files that implement the schema. Each theme is a JavaScript object exported as a CommonJS module.

#### 3. Theme Registry (`src/server/themes/index.js`)
Central registry that:
- Exports all available themes
- Provides helper functions (`getAllThemes`, `getThemeById`, `getThemeMetadata`)
- Maintains theme collection

#### 4. Theme API (`src/server/routes/themes.route.js`)
REST API endpoints:
- `GET /api/themes` - List all available themes (metadata only)
- `GET /api/themes/:themeId` - Get full theme configuration
- `GET /api/themes/all/full` - Get all themes with full data (admin/debug)

#### 5. Settings Integration (`src/server/routes/settings.route.js`)
- `GET /api/settings/theme` - Get current theme preference
- `PUT /api/settings/theme` - Save theme preference
- Theme preference persists in settings.theme object

### Frontend Components

#### 1. Theme Composable (`src/client/composables/useTheme.ts`)
Vue 3 composable that manages:
- Theme loading from API
- CSS variable application
- Theme switching
- Theme persistence
- Auto-initialization

Key functions:
```typescript
const {
  currentTheme,          // ref: Current active theme
  availableThemes,       // ref: List of available themes
  isLoading,            // ref: Loading state
  error,                // ref: Error state
  fetchThemeList,       // fn: Load theme list
  loadTheme,            // fn: Load specific theme
  applyTheme,           // fn: Apply theme to DOM
  switchTheme,          // fn: Switch to new theme
  initializeTheme       // fn: Initialize on app start
} = useTheme();
```

#### 2. Theme Selector UI (`src/client/components/ThemeSelector.vue`)
Visual theme picker component featuring:
- Grid layout of theme cards
- Theme preview windows
- Active theme indicator
- Theme descriptions
- One-click theme switching

#### 3. Global CSS Variables (`src/client/style.css`)
90+ CSS custom properties organized into categories:
- Desktop: `--desktop-bg-*`
- Colors: `--color-*`
- Typography: `--font-*`
- Windows: `--window-*`
- Buttons: `--button-*`
- Icons: `--icon-*`
- Menus: `--menu-*`
- Scrollbars: `--scrollbar-*`
- System bar: `--systembar-*`
- Animations: `--animation-*`

## Available Themes

### 1. Amiga Workbench 3.1 (Default)
**ID:** `amiga`
**Colors:** Classic gray (#a0a0a0) with blue (#0055aa) accents
**Font:** Press Start 2P
**Style:** Iconic Commodore Amiga aesthetic with beveled borders
**Perfect for:** Authentic retro computing experience

### 2. Commodore 64
**ID:** `commodore64`
**Colors:** Deep blue (#3e31a2) background with light blue (#7869c4) text
**Font:** Press Start 2P / C64 Pro Mono
**Style:** Classic BASIC interface with CRT-style colors
**Perfect for:** 1980s home computing nostalgia

### 3. Atari TOS
**ID:** `atari-tos`
**Colors:** Monochrome-inspired with white background
**Font:** Courier New
**Style:** Clean GEM Desktop interface
**Perfect for:** Minimalist, professional look

### 4. Apple IIc
**ID:** `apple-iic`
**Colors:** Green phosphor (#33ff33) on black (#0a0a0a)
**Font:** Press Start 2P
**Style:** Terminal-style green screen monitor
**Perfect for:** Hacker/terminal aesthetic with glowing effects

### 5. Apple Lisa
**ID:** `apple-lisa`
**Colors:** Light gray (#f0f0f0) with subtle shadows
**Font:** Chicago / Geneva
**Style:** Pioneer GUI with rounded corners
**Perfect for:** Classic business computing look

### 6. Classic Macintosh
**ID:** `classic-mac`
**Colors:** Platinum gray (#cccccc) with blue highlights
**Font:** Chicago / Charcoal
**Style:** Mac OS Classic System 6/7 interface
**Perfect for:** 1990s Mac nostalgia

## Usage

### For Users

#### Switching Themes via UI
1. Open **Workbench** menu
2. Select **Preferences**
3. Click **Themes** tab
4. Click on any theme card to apply it
5. Theme is saved automatically

### For Developers

#### Using Theme Variables in Components
Always use CSS variables instead of hardcoded values:

```vue
<style scoped>
/* ✅ CORRECT - Uses theme variables */
.my-component {
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family);
  border: var(--window-border-width) solid var(--color-border);
}

/* ❌ WRONG - Hardcoded values won't adapt to themes */
.my-component {
  background: #a0a0a0;
  color: #000000;
  font-family: 'Press Start 2P';
  border: 2px solid #888888;
}
</style>
```

#### Programmatically Switching Themes
```typescript
import { useTheme } from '@/composables/useTheme';

const { switchTheme } = useTheme();

// Switch to Commodore 64 theme
await switchTheme('commodore64');
```

#### Loading Current Theme
```typescript
import { useTheme } from '@/composables/useTheme';

const { currentTheme } = useTheme();

// Access theme data
console.log(currentTheme.value.name);
console.log(currentTheme.value.colors.primary);
```

## Creating New Themes

### Step 1: Create Theme File
Create a new file in `src/server/themes/` following the naming pattern `mytheme.theme.js`:

```javascript
/**
 * My Custom Theme
 * Description of the theme
 */

const myCustomTheme = {
  id: 'my-custom',
  name: 'My Custom Theme',
  description: 'A unique retro OS aesthetic',

  desktop: {
    backgroundColor: '#123456',
    backgroundImage: '',  // Optional: URL to background image
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    backgroundPosition: 'center',
  },

  colors: {
    primary: '#ff0000',
    secondary: '#00ff00',
    background: '#123456',
    surface: '#234567',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#888888',
    borderLight: '#ffffff',
    borderDark: '#000000',
    accent: '#ff0000',
    success: '#00ff00',
    warning: '#ffaa00',
    error: '#ff0000',
    selection: '#0000ff',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  typography: {
    fontFamily: "'Press Start 2P', monospace",
    fontFamilyMono: "'Courier New', monospace",
    fontSize: {
      base: '10px',
      small: '8px',
      large: '12px',
      title: '10px',
      menu: '10px',
    },
    fontWeight: {
      normal: '400',
      bold: '700',
    },
    lineHeight: '1.6',
  },

  // ... (copy remaining properties from theme-schema.js)
};

module.exports = myCustomTheme;
```

### Step 2: Register Theme
Add your theme to `src/server/themes/index.js`:

```javascript
const myCustomTheme = require('./my-custom.theme');

const themes = {
  amiga: amigaTheme,
  // ... existing themes
  'my-custom': myCustomTheme,  // Add your theme
};
```

### Step 3: Add Preview Colors (Optional)
Update `src/client/components/ThemeSelector.vue` to add preview styling:

```css
.theme-preview[data-theme="my-custom"] .preview-titlebar {
  background: #123456;
}
.theme-preview[data-theme="my-custom"] .preview-content {
  background: #234567;
}
```

### Step 4: Test Your Theme
1. Restart the server
2. Open Preferences → Themes
3. Your theme should appear in the list
4. Click to apply and test

## CSS Variables Reference

### Desktop Variables
```css
--desktop-bg-color         /* Solid background color */
--desktop-bg-image         /* Background image URL */
--desktop-bg-repeat        /* Background repeat mode */
--desktop-bg-size          /* Background size */
--desktop-bg-position      /* Background position */
```

### Color Variables
```css
--color-primary            /* Primary brand color */
--color-secondary          /* Secondary color */
--color-background         /* Main background */
--color-surface            /* Surface/panel color */
--color-text               /* Primary text */
--color-text-secondary     /* Secondary text */
--color-border             /* Border color */
--color-border-light       /* Light bevel edge */
--color-border-dark        /* Dark bevel edge */
--color-accent             /* Accent/highlight */
--color-success            /* Success state */
--color-warning            /* Warning state */
--color-error              /* Error state */
--color-selection          /* Selection highlight */
--color-shadow             /* Shadow color */
```

### Typography Variables
```css
--font-family              /* Primary font stack */
--font-family-mono         /* Monospace font */
--font-size-base           /* Base font size */
--font-size-small          /* Small text */
--font-size-large          /* Large text */
--font-size-title          /* Window titles */
--font-size-menu           /* Menu items */
--font-weight-normal       /* Normal weight */
--font-weight-bold         /* Bold weight */
--line-height              /* Line height */
```

### Window Variables
```css
--window-border-width      /* Window border thickness */
--window-border-style      /* Border style */
--window-titlebar-height   /* Title bar height */
--window-titlebar-bg       /* Title bar color */
--window-titlebar-text     /* Title bar text */
--window-content-bg        /* Content area background */
--window-shadow            /* Window shadow */
--window-border-radius     /* Corner rounding */
```

### Button Variables
```css
--button-bg                /* Button background */
--button-text              /* Button text */
--button-border-width      /* Button border */
--button-border-style      /* Border style */
--button-padding           /* Button padding */
--button-border-radius     /* Corner rounding */
--button-hover-bg          /* Hover state */
--button-active-bg         /* Active state */
--button-disabled-bg       /* Disabled background */
--button-disabled-text     /* Disabled text */
```

### Icon Variables
```css
--icon-folder-color        /* Folder icon color */
--icon-disk-color          /* Disk icon color */
--icon-file-color          /* File icon color */
--icon-executable-color    /* Executable icon color */
--icon-size-small          /* Small icon size */
--icon-size-medium         /* Medium icon size */
--icon-size-large          /* Large icon size */
```

### Menu Variables
```css
--menu-bg                  /* Menu background */
--menu-text                /* Menu text */
--menu-hover-bg            /* Hover background */
--menu-hover-text          /* Hover text */
--menu-separator           /* Separator color */
--menu-border              /* Menu border */
```

### Scrollbar Variables
```css
--scrollbar-width          /* Scrollbar width */
--scrollbar-track          /* Track background */
--scrollbar-thumb          /* Thumb color */
--scrollbar-thumb-hover    /* Thumb hover */
--scrollbar-button         /* Button color */
--scrollbar-arrow          /* Arrow color */
```

### System Bar Variables
```css
--systembar-height         /* System bar height */
--systembar-bg             /* Background color */
--systembar-text           /* Text color */
--systembar-border         /* Border color */
```

### Animation Variables
```css
--animation-duration       /* Transition duration */
--animation-easing         /* Timing function */
```

## API Reference

### GET /api/themes
Returns metadata for all available themes.

**Response:**
```json
{
  "success": true,
  "themes": [
    {
      "id": "amiga",
      "name": "Amiga Workbench 3.1",
      "description": "Classic Commodore Amiga..."
    }
  ],
  "count": 6
}
```

### GET /api/themes/:themeId
Returns full theme configuration.

**Parameters:**
- `themeId` (string) - Theme identifier

**Response:**
```json
{
  "success": true,
  "theme": {
    "id": "amiga",
    "name": "Amiga Workbench 3.1",
    "description": "...",
    "desktop": { ... },
    "colors": { ... },
    "typography": { ... }
  }
}
```

### GET /api/settings/theme
Returns current theme preference.

**Response:**
```json
{
  "category": "theme",
  "settings": {
    "currentTheme": "amiga",
    "customColors": {},
    "customFonts": {}
  }
}
```

### PUT /api/settings/theme
Save theme preference.

**Request Body:**
```json
{
  "currentTheme": "commodore64"
}
```

**Response:**
```json
{
  "message": "Settings updated successfully",
  "category": "theme",
  "settings": { ... }
}
```

## Best Practices

### For Component Development

1. **Always use CSS variables** - Never hardcode colors or sizes
2. **Test with all themes** - Ensure your component looks good in every theme
3. **Use semantic variable names** - Choose variables based on purpose, not appearance
4. **Respect animation settings** - Use `var(--animation-duration)` for transitions
5. **Maintain fallbacks** - Default values in `:root` ensure graceful degradation

### For Theme Creation

1. **Stay authentic** - Research the original OS for accurate colors and styling
2. **Ensure contrast** - Text must be readable on all backgrounds
3. **Test accessibility** - Verify color contrast meets WCAG guidelines
4. **Provide descriptions** - Help users understand the theme's origin
5. **Match the era** - Font choices should reflect the time period

### Performance Considerations

1. **Themes load once** - No performance impact after initial load
2. **CSS variables are fast** - Browser-native feature with minimal overhead
3. **Theme switching is instant** - No page reload required
4. **Minimal API calls** - Themes cached after first fetch

## Troubleshooting

### Theme not appearing
- Verify theme is registered in `src/server/themes/index.js`
- Check theme file exports correctly (`module.exports`)
- Restart server after adding new themes

### Colors not changing
- Confirm component uses CSS variables, not hardcoded values
- Check browser DevTools to verify CSS variables are set
- Clear browser cache if styles seem stale

### Theme persists incorrectly
- Check `/api/settings/theme` endpoint response
- Verify localStorage is enabled
- Check browser console for API errors

## Future Enhancements

Potential improvements to the theme system:

- [ ] User-uploaded background images
- [ ] Custom theme creator UI
- [ ] Theme import/export functionality
- [ ] Color picker for live customization
- [ ] Theme marketplace
- [ ] Dark mode variants for each theme
- [ ] Seasonal/holiday themes
- [ ] Per-window theme override
- [ ] Theme transitions/animations
- [ ] A/B theme preview

## Contributing

To contribute a new theme:

1. Fork the repository
2. Create your theme file following the schema
3. Test thoroughly with all components
4. Submit a pull request with:
   - Theme file
   - Updated theme registry
   - Preview screenshot
   - Description and historical context

---

**Version:** 1.0.0
**Last Updated:** 2025-01-08
**Maintainer:** WebOS Team
