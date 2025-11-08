import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  category: 'file' | 'window' | 'navigation' | 'menu' | 'tools' | 'other';
  action: () => void;
  global?: boolean; // If true, works even in input fields
  preventDefault?: boolean; // If true, prevents default browser behavior
}

export interface ShortcutConfig {
  key: string;
  modifiers: string[];
  label: string;
}

// Singleton state for shortcuts registry
const shortcutsRegistry = ref<Map<string, KeyboardShortcut>>(new Map());
const isEnabled = ref(true);
const customBindings = ref<Map<string, string>>(new Map());

// Load custom bindings from localStorage
const loadCustomBindings = () => {
  try {
    const stored = localStorage.getItem('webos-keyboard-bindings');
    if (stored) {
      const parsed = JSON.parse(stored);
      customBindings.value = new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Failed to load custom keyboard bindings:', error);
  }
};

// Save custom bindings to localStorage
const saveCustomBindings = () => {
  try {
    const obj = Object.fromEntries(customBindings.value);
    localStorage.setItem('webos-keyboard-bindings', JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save custom keyboard bindings:', error);
  }
};

// Generate a unique key for a shortcut
const getShortcutKey = (key: string, ctrl: boolean, alt: boolean, shift: boolean, meta: boolean): string => {
  const parts: string[] = [];
  if (ctrl) parts.push('Ctrl');
  if (alt) parts.push('Alt');
  if (shift) parts.push('Shift');
  if (meta) parts.push('Meta');
  parts.push(key.toUpperCase());
  return parts.join('+');
};

// Parse a shortcut key string (e.g., "Ctrl+C" -> { key: 'C', ctrl: true })
const parseShortcutKey = (shortcutKey: string): { key: string; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean } => {
  const parts = shortcutKey.split('+');
  const key = parts[parts.length - 1];
  return {
    key,
    ctrl: parts.includes('Ctrl'),
    alt: parts.includes('Alt'),
    shift: parts.includes('Shift'),
    meta: parts.includes('Meta')
  };
};

// Format shortcut for display (e.g., "Ctrl+C" or "⌘+C" on Mac)
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');

  // Format special keys
  let keyDisplay = shortcut.key;
  const keyMap: Record<string, string> = {
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'Delete': 'Del',
    'Escape': 'Esc',
    'Enter': '↵'
  };
  keyDisplay = keyMap[shortcut.key] || shortcut.key.toUpperCase();

  parts.push(keyDisplay);
  return parts.join('+');
};

export function useKeyboardShortcuts() {
  // Register a keyboard shortcut
  const registerShortcut = (shortcut: KeyboardShortcut) => {
    const shortcutKey = getShortcutKey(
      shortcut.key,
      shortcut.ctrl || false,
      shortcut.alt || false,
      shortcut.shift || false,
      shortcut.meta || false
    );

    shortcutsRegistry.value.set(shortcutKey, shortcut);
    console.log(`Registered shortcut: ${shortcutKey} - ${shortcut.description}`);
  };

  // Unregister a keyboard shortcut
  const unregisterShortcut = (key: string, ctrl = false, alt = false, shift = false, meta = false) => {
    const shortcutKey = getShortcutKey(key, ctrl, alt, shift, meta);
    shortcutsRegistry.value.delete(shortcutKey);
  };

  // Handle keyboard events
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isEnabled.value) return;

    const key = event.key;
    const ctrl = event.ctrlKey;
    const alt = event.altKey;
    const shift = event.shiftKey;
    const meta = event.metaKey;

    // Check if we're in an input field
    const target = event.target as HTMLElement;
    const isInInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.contentEditable === 'true';

    const shortcutKey = getShortcutKey(key, ctrl, alt, shift, meta);
    const shortcut = shortcutsRegistry.value.get(shortcutKey);

    if (shortcut) {
      // Don't trigger if in input field unless it's a global shortcut
      if (isInInput && !shortcut.global) {
        return;
      }

      // Prevent default browser behavior if specified
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }

      // Execute the shortcut action
      try {
        shortcut.action();
      } catch (error) {
        console.error(`Error executing shortcut ${shortcutKey}:`, error);
      }
    }
  };

  // Get all registered shortcuts
  const getAllShortcuts = (): KeyboardShortcut[] => {
    return Array.from(shortcutsRegistry.value.values());
  };

  // Get shortcuts by category
  const getShortcutsByCategory = (category: string): KeyboardShortcut[] => {
    return getAllShortcuts().filter(s => s.category === category);
  };

  // Enable/disable all shortcuts
  const setEnabled = (enabled: boolean) => {
    isEnabled.value = enabled;
  };

  // Clear all shortcuts
  const clearShortcuts = () => {
    shortcutsRegistry.value.clear();
  };

  // Set custom binding for a shortcut
  const setCustomBinding = (actionId: string, newShortcutKey: string) => {
    customBindings.value.set(actionId, newShortcutKey);
    saveCustomBindings();
  };

  // Get custom binding for a shortcut
  const getCustomBinding = (actionId: string): string | undefined => {
    return customBindings.value.get(actionId);
  };

  // Initialize
  loadCustomBindings();

  // Setup global keyboard listener
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return {
    registerShortcut,
    unregisterShortcut,
    getAllShortcuts,
    getShortcutsByCategory,
    setEnabled,
    clearShortcuts,
    formatShortcut,
    setCustomBinding,
    getCustomBinding,
    isEnabled
  };
}

// Create a singleton instance for global access
let globalShortcutsInstance: ReturnType<typeof useKeyboardShortcuts> | null = null;

export function useGlobalKeyboardShortcuts() {
  if (!globalShortcutsInstance) {
    globalShortcutsInstance = useKeyboardShortcuts();
  }
  return globalShortcutsInstance;
}
