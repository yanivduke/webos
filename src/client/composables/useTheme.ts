import { ref, watch } from 'vue';

export type Theme = 'bright' | 'dark';

export interface ThemeColors {
  background: string;
  windowBackground: string;
  menuBackground: string;
  menuText: string;
  text: string;
  border: string;
  borderLight: string;
  borderDark: string;
  highlight: string;
  highlightText: string;
  shadow: string;
  diskIcon: string;
  folderColor: string;
}

const themes: Record<Theme, ThemeColors> = {
  bright: {
    background: '#a0a0a0',
    windowBackground: '#ffffff',
    menuBackground: '#ffffff',
    menuText: '#000000',
    text: '#000000',
    border: '#808080',
    borderLight: '#ffffff',
    borderDark: '#000000',
    highlight: '#0055aa',
    highlightText: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.4)',
    diskIcon: '#666666',
    folderColor: '#ffaa00'
  },
  dark: {
    background: '#2a2a2a',
    windowBackground: '#1a1a1a',
    menuBackground: '#333333',
    menuText: '#e0e0e0',
    text: '#e0e0e0',
    border: '#555555',
    borderLight: '#666666',
    borderDark: '#000000',
    highlight: '#0088ff',
    highlightText: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.8)',
    diskIcon: '#888888',
    folderColor: '#ffcc00'
  }
};

// Load theme from localStorage or default to bright
const storedTheme = localStorage.getItem('webos-theme') as Theme | null;
const currentTheme = ref<Theme>(storedTheme || 'bright');

// Apply theme to CSS variables
const applyTheme = (theme: Theme) => {
  const colors = themes[theme];
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
};

// Watch for theme changes
watch(currentTheme, (newTheme) => {
  applyTheme(newTheme);
  localStorage.setItem('webos-theme', newTheme);
});

// Initialize theme on load
applyTheme(currentTheme.value);

export const useTheme = () => {
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'bright' ? 'dark' : 'bright';
  };

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
  };

  const getThemeColors = () => {
    return themes[currentTheme.value];
  };

  return {
    currentTheme,
    toggleTheme,
    setTheme,
    getThemeColors,
    themes
  };
};
