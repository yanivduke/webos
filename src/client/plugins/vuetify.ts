import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Custom Amiga-themed color palette for Vuetify
export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'amigaLight',
    themes: {
      amigaLight: {
        dark: false,
        colors: {
          primary: '#0055aa', // Amiga blue
          secondary: '#ffaa00', // Amiga orange/folder color
          background: '#a0a0a0', // Classic Amiga gray
          surface: '#c0c0c0',
          error: '#ff0000',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
      amigaDark: {
        dark: true,
        colors: {
          primary: '#0066cc',
          secondary: '#ffbb33',
          background: '#1e1e1e',
          surface: '#2d2d2d',
          error: '#ff5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
    },
  },
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
  defaults: {
    VBtn: {
      variant: 'elevated',
      color: 'primary',
    },
    VCard: {
      elevation: 2,
    },
  },
});
