import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import './style.css';
import './amiga-common.css';
import './styles/theme-variables.css';
import './styles/accessibility.css';
import { themeManager } from './utils/theme-manager';
import { accessibilityManager } from './utils/accessibility-manager';
import { colorBlindFilters } from './utils/color-blind-filters';
import { vFocusTrap } from './directives/v-focus-trap';
import { vLazy } from './utils/image-optimizer';
import { bundleMonitor } from './utils/bundle-monitor';
import { applyCSSVariables, cssOptimizer } from './utils/css-optimizer';
import { imageOptimizer } from './utils/image-optimizer';

// Initialize performance monitoring (dev only)
if (import.meta.env.DEV) {
  bundleMonitor.initialize();

  // Log performance stats after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      cssOptimizer.analyzeCSS();
      cssOptimizer.logSizeReport();
      imageOptimizer.logStats();
      bundleMonitor.logSummary();
    }, 2000);
  });
}

// Apply CSS variables for optimization
applyCSSVariables();

// Initialize theme system
themeManager.restoreThemePreference().catch(err => {
  console.error('Failed to restore theme:', err);
});

// Initialize accessibility system
accessibilityManager.applySystemPreferences();
colorBlindFilters.initializeSVGFilters();

const app = createApp(App);

// Register Vuetify
app.use(vuetify);

// Register global directives
app.directive('focus-trap', vFocusTrap);
app.directive('lazy', vLazy);

app.mount('#app');