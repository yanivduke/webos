/**
 * Keyboard Navigation Composable
 *
 * Provides keyboard navigation utilities for lists, grids, menus, and other
 * interactive components. Implements ARIA keyboard patterns.
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { screenReader } from '../utils/screen-reader';

export interface KeyboardNavOptions {
  orientation?: 'horizontal' | 'vertical' | 'grid';
  loop?: boolean; // Whether to loop from last to first
  activateOnFocus?: boolean; // Whether Enter/Space activates or just focuses
  homeEndSupport?: boolean; // Whether Home/End keys are supported
  typeaheadSearch?: boolean; // Whether typing searches items
}

export interface KeyboardNavItem {
  id: string;
  element: HTMLElement;
  label: string;
  disabled?: boolean;
}

/**
 * Composable for arrow key navigation in lists and grids
 */
export function useKeyboardNav(
  containerRef: Ref<HTMLElement | null>,
  options: KeyboardNavOptions = {}
) {
  const {
    orientation = 'vertical',
    loop = true,
    activateOnFocus = false,
    homeEndSupport = true,
    typeaheadSearch = true
  } = options;

  const currentIndex = ref(-1);
  const items = ref<KeyboardNavItem[]>([]);
  const typeaheadString = ref('');
  const typeaheadTimeout = ref<number | null>(null);

  /**
   * Get all navigable items in the container
   */
  const updateItems = () => {
    if (!containerRef.value) return;

    const elements = Array.from(
      containerRef.value.querySelectorAll<HTMLElement>('[data-nav-item]')
    );

    items.value = elements.map((el, index) => ({
      id: el.getAttribute('data-nav-id') || `item-${index}`,
      element: el,
      label: el.getAttribute('aria-label') || el.textContent?.trim() || '',
      disabled: el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled')
    }));
  };

  /**
   * Focus item at index
   */
  const focusItem = (index: number, announce: boolean = true) => {
    if (index < 0 || index >= items.value.length) return;

    const item = items.value[index];
    if (item.disabled) return;

    currentIndex.value = index;
    item.element.focus();

    // Update ARIA attributes
    items.value.forEach((item, i) => {
      item.element.setAttribute('tabindex', i === index ? '0' : '-1');
      item.element.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    if (announce) {
      screenReader.announceMenuItemFocused(item.label, {
        current: index + 1,
        total: items.value.length
      });
    }
  };

  /**
   * Navigate to next item
   */
  const focusNext = () => {
    let nextIndex = currentIndex.value + 1;

    // Skip disabled items
    while (nextIndex < items.value.length && items.value[nextIndex].disabled) {
      nextIndex++;
    }

    if (nextIndex >= items.value.length) {
      nextIndex = loop ? 0 : items.value.length - 1;
    }

    focusItem(nextIndex);
  };

  /**
   * Navigate to previous item
   */
  const focusPrevious = () => {
    let prevIndex = currentIndex.value - 1;

    // Skip disabled items
    while (prevIndex >= 0 && items.value[prevIndex].disabled) {
      prevIndex--;
    }

    if (prevIndex < 0) {
      prevIndex = loop ? items.value.length - 1 : 0;
    }

    focusItem(prevIndex);
  };

  /**
   * Navigate to first item
   */
  const focusFirst = () => {
    const firstEnabled = items.value.findIndex(item => !item.disabled);
    if (firstEnabled !== -1) {
      focusItem(firstEnabled);
    }
  };

  /**
   * Navigate to last item
   */
  const focusLast = () => {
    const lastEnabled = items.value.reverse().findIndex(item => !item.disabled);
    if (lastEnabled !== -1) {
      focusItem(items.value.length - 1 - lastEnabled);
    }
  };

  /**
   * Activate current item
   */
  const activateItem = (index: number = currentIndex.value) => {
    if (index < 0 || index >= items.value.length) return;

    const item = items.value[index];
    if (item.disabled) return;

    // Trigger click event
    item.element.click();
  };

  /**
   * Search items by typeahead
   */
  const searchByTypeahead = (char: string) => {
    if (!typeaheadSearch) return;

    // Clear existing timeout
    if (typeaheadTimeout.value) {
      clearTimeout(typeaheadTimeout.value);
    }

    // Add character to search string
    typeaheadString.value += char.toLowerCase();

    // Find matching item starting from current position
    const startIndex = currentIndex.value + 1;
    let foundIndex = -1;

    // Search from current position to end
    for (let i = startIndex; i < items.value.length; i++) {
      if (items.value[i].label.toLowerCase().startsWith(typeaheadString.value)) {
        foundIndex = i;
        break;
      }
    }

    // If not found, search from beginning
    if (foundIndex === -1) {
      for (let i = 0; i < startIndex; i++) {
        if (items.value[i].label.toLowerCase().startsWith(typeaheadString.value)) {
          foundIndex = i;
          break;
        }
      }
    }

    if (foundIndex !== -1) {
      focusItem(foundIndex);
    }

    // Reset typeahead after 1 second
    typeaheadTimeout.value = window.setTimeout(() => {
      typeaheadString.value = '';
    }, 1000);
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey } = event;

    // Ignore if modifier keys (except shift for special cases)
    if (ctrlKey || metaKey) return;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        if (orientation === 'vertical' || orientation === 'grid') {
          focusNext();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (orientation === 'vertical' || orientation === 'grid') {
          focusPrevious();
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (orientation === 'horizontal' || orientation === 'grid') {
          focusNext();
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (orientation === 'horizontal' || orientation === 'grid') {
          focusPrevious();
        }
        break;

      case 'Home':
        if (homeEndSupport) {
          event.preventDefault();
          focusFirst();
        }
        break;

      case 'End':
        if (homeEndSupport) {
          event.preventDefault();
          focusLast();
        }
        break;

      case 'Enter':
      case ' ':
        if (activateOnFocus || key === 'Enter') {
          event.preventDefault();
          activateItem();
        }
        break;

      case 'Tab':
        // Allow default tab behavior
        break;

      default:
        // Typeahead search for printable characters
        if (key.length === 1 && !ctrlKey && !metaKey) {
          event.preventDefault();
          searchByTypeahead(key);
        }
        break;
    }
  };

  /**
   * Initialize keyboard navigation
   */
  const initialize = () => {
    updateItems();

    if (containerRef.value) {
      containerRef.value.addEventListener('keydown', handleKeyDown);

      // Set initial tabindex
      items.value.forEach((item, index) => {
        item.element.setAttribute('tabindex', index === 0 ? '0' : '-1');
        item.element.setAttribute('data-nav-index', index.toString());
      });
    }
  };

  /**
   * Cleanup
   */
  const cleanup = () => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('keydown', handleKeyDown);
    }

    if (typeaheadTimeout.value) {
      clearTimeout(typeaheadTimeout.value);
    }
  };

  onMounted(() => {
    initialize();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    currentIndex,
    items,
    updateItems,
    focusItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    activateItem
  };
}

/**
 * Composable for roving tabindex pattern
 */
export function useRovingTabindex(containerRef: Ref<HTMLElement | null>) {
  const focusedIndex = ref(0);

  const updateTabindex = (newIndex: number) => {
    if (!containerRef.value) return;

    const items = Array.from(
      containerRef.value.querySelectorAll<HTMLElement>('[data-roving-tabindex]')
    );

    items.forEach((item, index) => {
      if (index === newIndex) {
        item.setAttribute('tabindex', '0');
        item.focus();
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });

    focusedIndex.value = newIndex;
  };

  return {
    focusedIndex,
    updateTabindex
  };
}

/**
 * Composable for escape key handling
 */
export function useEscapeKey(callback: () => void) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return { handleKeyDown };
}

/**
 * Composable for tab key trapping (focus within container)
 */
export function useTabTrap(containerRef: Ref<HTMLElement | null>) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !containerRef.value) return;

    const focusableElements = containerRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const focusableArray = Array.from(focusableElements);
    const firstElement = focusableArray[0];
    const lastElement = focusableArray[focusableArray.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: moving backward
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab: moving forward
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return { handleKeyDown };
}

/**
 * Composable for global keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const modifiers: string[] = [];

    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    const shortcut = [...modifiers, key].join('+');

    if (shortcuts[shortcut]) {
      event.preventDefault();
      shortcuts[shortcut]();
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return { handleKeyDown };
}
