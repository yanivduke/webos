import { ref, computed } from 'vue';

export interface QuickViewItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'tool' | 'awml-app';
  path: string;
  size?: string;
  created?: string;
  modified?: string;
}

interface QuickViewState {
  isVisible: boolean;
  currentItem: QuickViewItem | null;
  items: QuickViewItem[];
  currentIndex: number;
  content: string | null;
  isLoading: boolean;
  error: string | null;
}

const state = ref<QuickViewState>({
  isVisible: false,
  currentItem: null,
  items: [],
  currentIndex: 0,
  content: null,
  isLoading: false,
  error: null
});

export function useQuickView() {
  const open = (item: QuickViewItem, allItems: QuickViewItem[] = []) => {
    state.value.isVisible = true;
    state.value.items = allItems.length > 0 ? allItems : [item];
    state.value.currentIndex = allItems.findIndex(i => i.id === item.id);
    if (state.value.currentIndex === -1) state.value.currentIndex = 0;
    state.value.currentItem = item;
    state.value.content = null;
    state.value.error = null;
    loadContent(item);
  };

  const close = () => {
    state.value.isVisible = false;
    state.value.currentItem = null;
    state.value.items = [];
    state.value.currentIndex = 0;
    state.value.content = null;
    state.value.error = null;
  };

  const next = () => {
    if (state.value.items.length === 0) return;

    const nextIndex = (state.value.currentIndex + 1) % state.value.items.length;
    state.value.currentIndex = nextIndex;
    state.value.currentItem = state.value.items[nextIndex];
    state.value.content = null;
    state.value.error = null;
    loadContent(state.value.currentItem);
  };

  const previous = () => {
    if (state.value.items.length === 0) return;

    const prevIndex = state.value.currentIndex - 1;
    state.value.currentIndex = prevIndex < 0 ? state.value.items.length - 1 : prevIndex;
    state.value.currentItem = state.value.items[state.value.currentIndex];
    state.value.content = null;
    state.value.error = null;
    loadContent(state.value.currentItem);
  };

  const loadContent = async (item: QuickViewItem) => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      if (item.type === 'folder') {
        // Load folder contents
        const response = await fetch(`/api/files/list?path=${encodeURIComponent(item.path)}`);
        if (!response.ok) throw new Error('Failed to load folder contents');

        const data = await response.json();
        state.value.content = JSON.stringify(data.items || [], null, 2);
      } else if (item.type === 'file' || item.type === 'awml-app') {
        // Load file contents
        const response = await fetch('/api/files/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: item.path })
        });

        if (!response.ok) throw new Error('Failed to load file');

        const data = await response.json();
        state.value.content = data.content || '';
      } else if (item.type === 'tool') {
        // Show tool info
        state.value.content = `Tool: ${item.name}\n\nThis is a system tool that can be launched from the Utilities drawer or Tools menu.`;
      } else {
        state.value.content = 'Preview not available for this item type.';
      }
    } catch (error) {
      console.error('Error loading content:', error);
      state.value.error = error instanceof Error ? error.message : 'Failed to load content';
      state.value.content = null;
    } finally {
      state.value.isLoading = false;
    }
  };

  const canNavigate = computed(() => state.value.items.length > 1);

  const navigationInfo = computed(() => {
    if (state.value.items.length === 0) return '';
    return `${state.value.currentIndex + 1} of ${state.value.items.length}`;
  });

  return {
    // State
    isVisible: computed(() => state.value.isVisible),
    currentItem: computed(() => state.value.currentItem),
    content: computed(() => state.value.content),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    canNavigate,
    navigationInfo,

    // Actions
    open,
    close,
    next,
    previous
  };
}
