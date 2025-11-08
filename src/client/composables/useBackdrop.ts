import { ref, watch } from 'vue';

export type BackdropPattern = 'solid' | 'checkerboard' | 'diagonal' | 'dots' | 'grid' | 'copper';

export interface BackdropSettings {
  pattern: BackdropPattern;
  color: string;
  opacity: number;
}

export interface BackdropPreset {
  name: string;
  color: string;
}

// Classic Amiga color presets
export const colorPresets: BackdropPreset[] = [
  { name: 'Amiga Gray', color: '#a0a0a0' },
  { name: 'Dark Gray', color: '#2a2a2a' },
  { name: 'Amiga Blue', color: '#0055aa' },
  { name: 'Copper', color: '#cc6633' },
  { name: 'Mint', color: '#66cc99' },
  { name: 'Lavender', color: '#9966cc' },
  { name: 'Teal', color: '#008888' },
  { name: 'Amber', color: '#ffaa00' }
];

// Load backdrop settings from localStorage or default
const storedSettings = localStorage.getItem('webos-backdrop');
const defaultSettings: BackdropSettings = {
  pattern: 'solid',
  color: '#a0a0a0',
  opacity: 1.0
};

const currentSettings = ref<BackdropSettings>(
  storedSettings ? JSON.parse(storedSettings) : defaultSettings
);

// Generate CSS background based on pattern and settings
const generateBackdropCSS = (settings: BackdropSettings): string => {
  const { pattern, color, opacity } = settings;
  const rgbaColor = hexToRGBA(color, opacity);

  switch (pattern) {
    case 'solid':
      return color;

    case 'checkerboard':
      return `
        repeating-conic-gradient(
          ${color} 0% 25%,
          ${adjustBrightness(color, -15)} 0% 50%
        ) 0 0 / 20px 20px
      `;

    case 'diagonal':
      return `
        repeating-linear-gradient(
          45deg,
          ${color},
          ${color} 10px,
          ${adjustBrightness(color, -10)} 10px,
          ${adjustBrightness(color, -10)} 20px
        )
      `;

    case 'dots':
      return `
        radial-gradient(circle, ${adjustBrightness(color, -20)} 2px, transparent 2px) 0 0 / 15px 15px,
        ${color}
      `;

    case 'grid':
      return `
        linear-gradient(${adjustBrightness(color, -15)} 1px, transparent 1px),
        linear-gradient(90deg, ${adjustBrightness(color, -15)} 1px, transparent 1px),
        ${color}
      `;

    case 'copper':
      // Classic Amiga copper bar effect
      return `
        linear-gradient(
          to bottom,
          ${color} 0%,
          ${adjustBrightness(color, 20)} 15%,
          ${adjustBrightness(color, -20)} 30%,
          ${color} 45%,
          ${adjustBrightness(color, 20)} 60%,
          ${adjustBrightness(color, -20)} 75%,
          ${color} 100%
        )
      `;

    default:
      return color;
  }
};

// Helper function to convert hex to RGBA
function hexToRGBA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const adjust = (value: number) => {
    const adjusted = value + (value * percent / 100);
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const newR = adjust(r).toString(16).padStart(2, '0');
  const newG = adjust(g).toString(16).padStart(2, '0');
  const newB = adjust(b).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
}

// Apply backdrop to CSS variables
const applyBackdrop = (settings: BackdropSettings) => {
  const root = document.documentElement;
  const backgroundCSS = generateBackdropCSS(settings);

  root.style.setProperty('--backdrop-background', backgroundCSS);
  root.style.setProperty('--backdrop-opacity', settings.opacity.toString());

  // For grid pattern, also set the background size
  if (settings.pattern === 'grid') {
    root.style.setProperty('--backdrop-grid-size', '20px 20px');
  } else {
    root.style.setProperty('--backdrop-grid-size', 'auto');
  }
};

// Watch for settings changes
watch(currentSettings, (newSettings) => {
  applyBackdrop(newSettings);
  localStorage.setItem('webos-backdrop', JSON.stringify(newSettings));
}, { deep: true });

// Initialize backdrop on load
applyBackdrop(currentSettings.value);

export const useBackdrop = () => {
  const setPattern = (pattern: BackdropPattern) => {
    currentSettings.value.pattern = pattern;
  };

  const setColor = (color: string) => {
    currentSettings.value.color = color;
  };

  const setOpacity = (opacity: number) => {
    currentSettings.value.opacity = opacity;
  };

  const setSettings = (settings: Partial<BackdropSettings>) => {
    currentSettings.value = {
      ...currentSettings.value,
      ...settings
    };
  };

  const resetToDefault = () => {
    currentSettings.value = { ...defaultSettings };
  };

  return {
    currentSettings,
    setPattern,
    setColor,
    setOpacity,
    setSettings,
    resetToDefault,
    colorPresets
  };
};
