import { ref, computed } from 'vue';

export interface Tab {
  id: string;
  title: string;
  component: any;
  data: any;
  icon: string;
  path?: string;
}

export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

export function useWindowTabs() {
  const tabStates = ref<Map<string, TabState>>(new Map());

  // Get tabs for a specific window
  const getWindowTabs = (windowId: string) => {
    const state = tabStates.value.get(windowId);
    return state?.tabs || [];
  };

  // Get active tab for a window
  const getActiveTab = (windowId: string) => {
    const state = tabStates.value.get(windowId);
    if (!state || !state.activeTabId) return null;
    return state.tabs.find(tab => tab.id === state.activeTabId) || null;
  };

  // Initialize window with tabs
  const initializeWindow = (windowId: string, initialTab?: Tab) => {
    if (!tabStates.value.has(windowId)) {
      const tabs = initialTab ? [initialTab] : [];
      tabStates.value.set(windowId, {
        tabs,
        activeTabId: initialTab?.id || null
      });
    }
  };

  // Add a new tab to a window
  const addTab = (windowId: string, tab: Tab, makeActive = true) => {
    const state = tabStates.value.get(windowId);
    if (!state) {
      initializeWindow(windowId, tab);
      return;
    }

    // Check if tab with same path already exists
    const existingTab = state.tabs.find(t => t.path && t.path === tab.path);
    if (existingTab) {
      // Just activate the existing tab
      state.activeTabId = existingTab.id;
      return;
    }

    state.tabs.push(tab);
    if (makeActive) {
      state.activeTabId = tab.id;
    }
  };

  // Remove a tab from a window
  const removeTab = (windowId: string, tabId: string) => {
    const state = tabStates.value.get(windowId);
    if (!state) return false;

    const index = state.tabs.findIndex(tab => tab.id === tabId);
    if (index === -1) return false;

    // If removing the active tab, switch to adjacent tab
    if (state.activeTabId === tabId) {
      if (state.tabs.length > 1) {
        // Switch to the tab to the left, or right if it's the first tab
        const nextIndex = index > 0 ? index - 1 : 1;
        state.activeTabId = state.tabs[nextIndex]?.id || null;
      } else {
        state.activeTabId = null;
      }
    }

    state.tabs.splice(index, 1);

    // Return true if no tabs left (window should close)
    return state.tabs.length === 0;
  };

  // Set active tab
  const setActiveTab = (windowId: string, tabId: string) => {
    const state = tabStates.value.get(windowId);
    if (!state) return;

    const tab = state.tabs.find(t => t.id === tabId);
    if (tab) {
      state.activeTabId = tabId;
    }
  };

  // Reorder tabs
  const reorderTabs = (windowId: string, fromIndex: number, toIndex: number) => {
    const state = tabStates.value.get(windowId);
    if (!state) return;

    const [removed] = state.tabs.splice(fromIndex, 1);
    state.tabs.splice(toIndex, 0, removed);
  };

  // Move tab to another window
  const moveTabToWindow = (fromWindowId: string, toWindowId: string, tabId: string) => {
    const fromState = tabStates.value.get(fromWindowId);
    const toState = tabStates.value.get(toWindowId);

    if (!fromState || !toState) return false;

    const tabIndex = fromState.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return false;

    const [tab] = fromState.tabs.splice(tabIndex, 1);

    // Update active tab in source window if needed
    if (fromState.activeTabId === tabId) {
      if (fromState.tabs.length > 0) {
        const nextIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        fromState.activeTabId = fromState.tabs[nextIndex]?.id || null;
      } else {
        fromState.activeTabId = null;
      }
    }

    // Add to target window
    toState.tabs.push(tab);
    toState.activeTabId = tab.id;

    return fromState.tabs.length === 0; // Return true if source window should close
  };

  // Close other tabs
  const closeOtherTabs = (windowId: string, keepTabId: string) => {
    const state = tabStates.value.get(windowId);
    if (!state) return;

    const keepTab = state.tabs.find(t => t.id === keepTabId);
    if (!keepTab) return;

    state.tabs = [keepTab];
    state.activeTabId = keepTabId;
  };

  // Close tabs to the right
  const closeTabsToRight = (windowId: string, fromTabId: string) => {
    const state = tabStates.value.get(windowId);
    if (!state) return;

    const index = state.tabs.findIndex(t => t.id === fromTabId);
    if (index === -1 || index === state.tabs.length - 1) return;

    // Check if active tab is in the range being closed
    const removedTabs = state.tabs.slice(index + 1);
    const activeTabRemoved = removedTabs.some(t => t.id === state.activeTabId);

    state.tabs = state.tabs.slice(0, index + 1);

    if (activeTabRemoved) {
      state.activeTabId = fromTabId;
    }
  };

  // Get tab index
  const getTabIndex = (windowId: string, tabId: string): number => {
    const state = tabStates.value.get(windowId);
    if (!state) return -1;
    return state.tabs.findIndex(t => t.id === tabId);
  };

  // Navigate to next/previous tab
  const navigateTab = (windowId: string, direction: 'next' | 'prev') => {
    const state = tabStates.value.get(windowId);
    if (!state || !state.activeTabId) return;

    const currentIndex = state.tabs.findIndex(t => t.id === state.activeTabId);
    if (currentIndex === -1) return;

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % state.tabs.length;
    } else {
      nextIndex = currentIndex === 0 ? state.tabs.length - 1 : currentIndex - 1;
    }

    state.activeTabId = state.tabs[nextIndex].id;
  };

  // Clean up window state
  const cleanupWindow = (windowId: string) => {
    tabStates.value.delete(windowId);
  };

  return {
    getWindowTabs,
    getActiveTab,
    initializeWindow,
    addTab,
    removeTab,
    setActiveTab,
    reorderTabs,
    moveTabToWindow,
    closeOtherTabs,
    closeTabsToRight,
    getTabIndex,
    navigateTab,
    cleanupWindow
  };
}
