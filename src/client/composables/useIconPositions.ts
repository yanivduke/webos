import { ref, watch } from 'vue';

export interface IconPosition {
  x: number;
  y: number;
}

export type IconPositions = Record<string, IconPosition>;

// Default positions for icons (top-left corner, stacked vertically)
const defaultPositions: IconPositions = {
  'df0': { x: 20, y: 20 },
  'dh0': { x: 20, y: 120 },
  'dh1': { x: 20, y: 220 },
  'ram': { x: 20, y: 320 },
  'utils': { x: 20, y: 420 },
  'trash': { x: 20, y: 520 }
};

// Load positions from localStorage or use defaults
const loadPositions = (): IconPositions => {
  try {
    const stored = localStorage.getItem('webos-icon-positions');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all icons have positions
      return { ...defaultPositions, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load icon positions:', error);
  }
  return { ...defaultPositions };
};

// Global icon positions state
const iconPositions = ref<IconPositions>(loadPositions());

// Save positions to localStorage whenever they change
watch(iconPositions, (newPositions) => {
  try {
    localStorage.setItem('webos-icon-positions', JSON.stringify(newPositions));
  } catch (error) {
    console.error('Failed to save icon positions:', error);
  }
}, { deep: true });

export const useIconPositions = () => {
  const getPosition = (iconId: string): IconPosition => {
    return iconPositions.value[iconId] || defaultPositions[iconId] || { x: 20, y: 20 };
  };

  const setPosition = (iconId: string, x: number, y: number) => {
    iconPositions.value[iconId] = { x, y };
  };

  const resetPositions = () => {
    iconPositions.value = { ...defaultPositions };
  };

  const resetPosition = (iconId: string) => {
    if (defaultPositions[iconId]) {
      iconPositions.value[iconId] = { ...defaultPositions[iconId] };
    }
  };

  return {
    iconPositions,
    getPosition,
    setPosition,
    resetPositions,
    resetPosition
  };
};
