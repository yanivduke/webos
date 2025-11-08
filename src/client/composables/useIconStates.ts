import { ref, computed } from 'vue';

export interface IconState {
  id: string;
  isSelected: boolean;
  isHovered: boolean;
  isOpen: boolean;
  isActive: boolean;
}

export function useIconStates() {
  const iconStates = ref<Map<string, IconState>>(new Map());
  const selectedIcons = computed(() => {
    return Array.from(iconStates.value.values()).filter(icon => icon.isSelected);
  });

  const getIconState = (iconId: string): IconState => {
    if (!iconStates.value.has(iconId)) {
      iconStates.value.set(iconId, {
        id: iconId,
        isSelected: false,
        isHovered: false,
        isOpen: false,
        isActive: false
      });
    }
    return iconStates.value.get(iconId)!;
  };

  const selectIcon = (iconId: string, multiSelect: boolean = false) => {
    if (!multiSelect) {
      // Clear all selections
      iconStates.value.forEach(state => {
        state.isSelected = false;
      });
    }

    const state = getIconState(iconId);
    state.isSelected = !state.isSelected;
  };

  const clearSelection = () => {
    iconStates.value.forEach(state => {
      state.isSelected = false;
    });
  };

  const setHovered = (iconId: string, isHovered: boolean) => {
    const state = getIconState(iconId);
    state.isHovered = isHovered;
  };

  const setOpen = (iconId: string, isOpen: boolean) => {
    const state = getIconState(iconId);
    state.isOpen = isOpen;
  };

  const setActive = (iconId: string, isActive: boolean) => {
    const state = getIconState(iconId);
    state.isActive = isActive;

    // Auto-clear active state after animation
    if (isActive) {
      setTimeout(() => {
        state.isActive = false;
      }, 500);
    }
  };

  const isIconSelected = (iconId: string): boolean => {
    return getIconState(iconId).isSelected;
  };

  const isIconHovered = (iconId: string): boolean => {
    return getIconState(iconId).isHovered;
  };

  const isIconOpen = (iconId: string): boolean => {
    return getIconState(iconId).isOpen;
  };

  const isIconActive = (iconId: string): boolean => {
    return getIconState(iconId).isActive;
  };

  return {
    iconStates,
    selectedIcons,
    getIconState,
    selectIcon,
    clearSelection,
    setHovered,
    setOpen,
    setActive,
    isIconSelected,
    isIconHovered,
    isIconOpen,
    isIconActive
  };
}
