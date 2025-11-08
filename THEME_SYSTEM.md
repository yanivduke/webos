# WebOS Theme System

## Overview

A comprehensive theme engine with customization system for WebOS, enabling users to completely customize the look and feel of the interface while maintaining the authentic Amiga aesthetic or exploring modern alternatives.

## Features Implemented

### 1. Theme Management System (`src/client/utils/theme-manager.ts`)

Core functionality for theme handling:

- **Theme Definition Interface**: Comprehensive TypeScript interfaces defining all themeable aspects
  - Colors (27 properties): primary, background, text, borders, windows, highlights, etc.
  - Fonts: primary/secondary families and three size levels
  - Window Chrome: border width, radius, shadow, title bar height
  - Spacing: small, medium, large
  - Animation: duration and easing

- **Theme Operations**:
  - `applyTheme()`: Dynamically applies theme by injecting CSS custom properties
  - `loadTheme()`: Loads theme from JSON file (built-in) or custom storage
  - `getCurrentTheme()`: Returns currently active theme
  - `saveCustomTheme()`: Persists user-created themes to localStorage
  - `deleteCustomTheme()`: Removes custom themes
  - `exportTheme()`: Exports theme as JSON string
  - `importTheme()`: Imports and validates theme from JSON
  - `downloadTheme()`: Downloads theme as JSON file
  - `createThemeFromTemplate()`: Creates new theme based on existing one

- **Persistence**:
  - Saves theme preference to localStorage
  - Automatically restores last selected theme on app load
  - Stores custom themes persistently

- **Event System**:
  - `onChange()` listener registration for theme changes
  - Notifies all registered listeners when theme updates

### 2. Theme Builder Utilities (`src/client/utils/theme-builder.ts`)

Advanced color theory and accessibility tools:

- **Color Manipulation**:
  - `generatePalette()`: Creates complementary, analogous, and triadic color schemes
  - `lighten()` / `darken()`: Adjust color brightness by percentage
  - `saturate()`: Adjust color saturation
  - `getComplementary()`: Generate complementary color

- **Accessibility Validation**:
  - `getContrastRatio()`: Calculates WCAG contrast ratio between colors
  - `meetsContrastAA()`: Validates WCAG AA compliance (4.5:1)
  - `meetsContrastAAA()`: Validates WCAG AAA compliance (7:1)
  - `validateAccessibility()`: Comprehensive theme accessibility check
  - Returns warnings for insufficient contrast ratios

- **Theme Generation**:
  - `generateThemeColors()`: Auto-generates complete color scheme from single primary color
  - Smart text color selection based on contrast requirements
  - Separate light/dark mode generation

- **Preview Generation**:
  - `createPreview()`: Renders theme preview as canvas data URL
  - Shows miniature window with title bar, buttons, and text

- **Color Utilities**:
  - HSL/Hex conversion
  - Luminance calculation
  - Color normalization

### 3. Pre-built Themes (5 included)

#### Classic Amiga (default)
- Authentic Amiga Workbench 3.1 aesthetic
- Gray (#a0a0a0) background
- Blue (#0055aa) primary
- Pixel-perfect beveled borders
- Press Start 2P font

#### Dark Mode
- Modern dark theme
- Dark gray (#2d2d2d) background
- Blue (#1a73e8) primary
- Reduced eye strain
- Subtle shadows

#### High Contrast
- Maximum accessibility
- Black/white high contrast
- Bold 3px borders
- Larger font sizes (10px/12px/14px)
- Instant transitions (no animations)

#### Modern
- Contemporary design
- Light gray (#f5f5f5) background
- Indigo (#6366f1) primary
- Rounded corners (8px)
- System fonts
- Smooth animations (0.2s cubic-bezier)

#### Workbench 1.3
- Original Amiga Workbench 1.3 palette
- Blue background (#5555aa)
- Orange (#ff8800) highlights
- Classic retro feel
- Tighter spacing

### 4. CSS Variables System (`src/client/styles/theme-variables.css`)

Dynamic theming infrastructure:

- **CSS Custom Properties**: 50+ variables for all theme aspects
- **Theme-Aware Classes**:
  - `.theme-bg`, `.theme-text`, `.theme-button`, etc.
  - `.theme-bevel-out` / `.theme-bevel-in` for borders
  - `.theme-window`, `.theme-window-title`
  - `.theme-input`, `.theme-panel`, `.theme-menu`
  - Font utilities, spacing utilities, animation utilities

- **Backwards Compatible**: Works alongside existing Amiga classes
- **Progressive Enhancement**: Components can gradually adopt theme variables

### 5. Theme Editor UI (`src/client/components/apps/AmigaThemeEditor.vue`)

Full-featured theme customization interface:

#### Gallery Tab
- Grid display of all built-in themes
- Visual previews (200x150px rendered windows)
- Custom themes section
- One-click apply
- Delete custom themes

#### Customize Tab
- Color pickers for all 27 color properties
- Organized into sections:
  - Primary Colors (primary, background, text)
  - Window Colors (chrome, title, title text)
  - Highlight Colors (highlight, highlight text, accent)
  - Border Colors (border, light, dark)
- Hex input fields alongside color pickers
- Live preview updates
- Save custom theme with name

#### Typography Tab
- Font family selector:
  - Press Start 2P (Amiga authentic)
  - Monospace
  - System fonts
  - Courier New
  - Arial
- Size inputs for small/medium/large

#### Window Chrome Tab
- Border width control
- Border radius (0px = square, 8px = rounded)
- Shadow configuration (CSS shadow syntax)
- Title bar height

#### Preview Tab
- Live preview panel with:
  - Styled window
  - Primary and regular buttons
  - Text input
  - List items (normal and selected)
  - Sample text
- Real-time accessibility report:
  - WCAG AA compliance check
  - Specific warnings for insufficient contrast
  - Pass/fail indicators

#### Import/Export Tab
- Import theme from JSON (paste or upload)
- Export current theme to clipboard
- Download theme as JSON file
- Share themes between users

### 6. Integration

- **Main App**: Theme system initializes on app load (`main.ts`)
- **Desktop Menu**: "Theme Editor" added to Tools menu
- **Tool Config**: Theme Editor opens as 800x600 window
- **Persistence**: Selected theme survives page reload
- **Event-Driven**: Theme changes propagate to all components

## File Structure

```
src/client/
├── utils/
│   ├── theme-manager.ts        (9.5KB - core theme system)
│   └── theme-builder.ts        (10.4KB - color utilities)
├── styles/
│   └── theme-variables.css     (8.7KB - CSS variables)
├── themes/                     (source JSON files)
│   ├── classic-amiga.json
│   ├── dark-mode.json
│   ├── high-contrast.json
│   ├── modern.json
│   └── workbench-13.json
├── public/themes/              (served to browser)
│   ├── classic-amiga.json
│   ├── dark-mode.json
│   ├── high-contrast.json
│   ├── modern.json
│   └── workbench-13.json
├── components/apps/
│   └── AmigaThemeEditor.vue    (15KB - full UI)
└── main.ts                     (theme init)
```

## Usage

### For Users

1. Open **Tools > Theme Editor** from menu
2. Browse pre-built themes in Gallery tab
3. Click "Apply" to change theme instantly
4. Create custom themes in Customize tab
5. Export/share themes via Import/Export tab

### For Developers

#### Apply a theme programmatically:
```typescript
import { themeManager } from '@/utils/theme-manager';

// Load built-in theme
await themeManager.loadTheme('dark-mode');

// Load custom theme
const customTheme = themeManager.getCustomThemes()[0];
themeManager.applyTheme(customTheme);
```

#### Listen for theme changes:
```typescript
const unsubscribe = themeManager.onChange((theme) => {
  console.log('Theme changed to:', theme.name);
});

// Later...
unsubscribe();
```

#### Use theme variables in components:
```vue
<template>
  <div class="theme-window">
    <div class="theme-window-title">My Window</div>
    <button class="theme-button">Click Me</button>
  </div>
</template>

<style scoped>
.custom-element {
  background: var(--theme-background);
  color: var(--theme-text);
  border: var(--theme-border-width) solid var(--theme-border);
}
</style>
```

#### Create a custom theme:
```typescript
import { themeManager, ThemeDefinition } from '@/utils/theme-manager';
import { ThemeBuilder } from '@/utils/theme-builder';

// Generate from primary color
const colors = ThemeBuilder.generateThemeColors('#ff6600', false);

const myTheme: ThemeDefinition = {
  id: 'my-orange-theme',
  name: 'Orange Dream',
  description: 'Custom orange theme',
  version: '1.0.0',
  colors: colors,
  // ... fonts, windowChrome, spacing, animation
};

// Validate accessibility
const validation = ThemeBuilder.validateAccessibility(myTheme);
if (!validation.valid) {
  console.warn('Accessibility issues:', validation.warnings);
}

// Save and apply
themeManager.saveCustomTheme(myTheme);
themeManager.applyTheme(myTheme);
```

## Key Features

### Accessibility First
- WCAG AA/AAA contrast validation
- High contrast theme included
- Accessibility warnings in editor
- Color-blind friendly palette generation

### Performance
- CSS variables for instant theme switching
- No component re-renders needed
- Efficient localStorage caching
- Lazy-loaded preview generation

### Flexibility
- Full control over all visual aspects
- Export/import for sharing
- Template-based theme creation
- Backwards compatible with existing styles

### User Experience
- Live preview in editor
- One-click theme switching
- Persistent preferences
- Amiga-styled editor (meta!)

## Theme JSON Schema

```json
{
  "id": "theme-id",
  "name": "Theme Name",
  "description": "Theme description",
  "version": "1.0.0",
  "colors": {
    "primary": "#0055aa",
    "background": "#a0a0a0",
    "text": "#000000",
    // ... 24 more color properties
  },
  "fonts": {
    "primary": "'Press Start 2P', monospace",
    "secondary": "monospace",
    "size": {
      "small": "8px",
      "medium": "10px",
      "large": "12px"
    }
  },
  "windowChrome": {
    "borderWidth": "2px",
    "borderRadius": "0px",
    "shadow": "none",
    "titleBarHeight": "20px"
  },
  "spacing": {
    "small": "4px",
    "medium": "8px",
    "large": "12px"
  },
  "animation": {
    "duration": "0.1s",
    "easing": "linear"
  }
}
```

## Future Enhancements

Potential additions:
- Theme marketplace/sharing
- Gradient support
- Custom icon colors
- Sound theme integration
- Preset color palette library
- Theme preview animations
- A/B theme comparison
- Auto-theme based on time of day
- Import from CSS/SCSS
- Theme versioning and migration

## Browser Support

- Modern browsers with CSS custom properties support
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## License

Part of WebOS - Amiga Workbench-style OS interface for the web.
