/**
 * Vuetify 3 Plugin Configuration
 * Custom Amiga Workbench Theme
 */

import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

// Amiga Workbench Color Palette
const amigaColors = {
  background: '#a0a0a0',
  amigaBlue: '#0055aa',
  amigaOrange: '#ffaa00',
  white: '#ffffff',
  black: '#000000',
  darkGray: '#555555',
  lightGray: '#cccccc',
  shadow: '#000000',
  highlight: '#ffffff',
  dragOver: 'rgba(255, 170, 0, 0.3)',
  success: '#00aa00',
  error: '#aa0000',
  warning: '#ffaa00',
};

// Custom Amiga Theme
const amigaTheme = {
  dark: false,
  colors: {
    background: amigaColors.background,
    surface: amigaColors.background,
    primary: amigaColors.amigaBlue,
    secondary: amigaColors.amigaOrange,
    accent: amigaColors.amigaOrange,
    error: amigaColors.error,
    info: amigaColors.amigaBlue,
    success: amigaColors.success,
    warning: amigaColors.warning,
    'drag-over': amigaColors.dragOver,
  },
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'amigaTheme',
    themes: {
      amigaTheme,
    },
  },
  defaults: {
    // Global component defaults to match Amiga style
    VBtn: {
      style: [
        {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
          textTransform: 'uppercase',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#ffffff #000000 #000000 #ffffff',
          boxShadow: 'none',
        },
      ],
    },
    VCard: {
      style: [
        {
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#ffffff #000000 #000000 #ffffff',
          boxShadow: 'none',
        },
      ],
    },
    VList: {
      style: [
        {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
        },
      ],
    },
  },
});

export { amigaColors };
