import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import './amiga-common.css';
import './styles/theme-variables.css';
import './styles/accessibility.css';
import { themeManager } from './utils/theme-manager';
import { accessibilityManager } from './utils/accessibility-manager';
import { colorBlindFilters } from './utils/color-blind-filters';
import { vFocusTrap } from './directives/v-focus-trap';

// Initialize theme system
themeManager.restoreThemePreference().catch(err => {
  console.error('Failed to restore theme:', err);
});

// Initialize accessibility system
accessibilityManager.applySystemPreferences();
colorBlindFilters.initializeSVGFilters();

const app = createApp(App);

// Register global directives
app.directive('focus-trap', vFocusTrap);

app.mount('#app');