/**
 * Enhanced Drag & Drop Composable
 * Provides unified drag and drop functionality for WebOS
 * Supports file operations, settings reordering, and desktop management
 */

import { ref, computed, onUnmounted, reactive } from 'vue';
import type {
  DragItem,
  DragOperation,
  DropZone,
  DragState,
  DragResult,
  DragOptions,
  DragHistory,
} from '../types/drag';

const API_BASE = '/api';

// Global drag state (shared across components)
const globalDragState = reactive<DragState>({
  isDragging: false,
  dragOperation: null,
  dropZone: null,
  dragPreview: null,
  canDrop: false,
});

// Drag history for undo/redo
const dragHistory = ref<DragHistory[]>([]);
const MAX_HISTORY = 50;

export function useDragDrop() {
  const localDragState = reactive({ ...globalDragState });

  /**
   * Initialize drag operation
   */
  const startDrag = (items: DragItem[], operation: 'copy' | 'move' | 'reorder', source: string) => {
    globalDragState.isDragging = true;
    globalDragState.dragOperation = {
      type: operation,
      items,
      source,
      timestamp: Date.now(),
    };

    // Create custom drag preview
    if (items.length > 1) {
      createMultiItemPreview(items);
    }
  };

  /**
   * Set drop zone for validation
   */
  const setDropZone = (zone: DropZone | null) => {
    globalDragState.dropZone = zone;

    if (zone && globalDragState.dragOperation) {
      // Validate if drop is allowed
      const items = globalDragState.dragOperation.items;
      globalDragState.canDrop = items.every(item =>
        zone.accepts.includes(item.type)
      ) && (!zone.validator || zone.validator(items));
    } else {
      globalDragState.canDrop = false;
    }
  };

  /**
   * Execute drop operation
   */
  const executeDrop = async (destination: string): Promise<DragResult> => {
    if (!globalDragState.dragOperation || !globalDragState.canDrop) {
      return {
        success: false,
        operation: globalDragState.dragOperation!,
        results: [],
      };
    }

    const operation = globalDragState.dragOperation;
    const results: DragResult['results'] = [];

    try {
      // Execute based on operation type
      switch (operation.type) {
        case 'copy':
          for (const item of operation.items) {
            const result = await copyItem(item, destination);
            results.push(result);
          }
          break;

        case 'move':
          for (const item of operation.items) {
            const result = await moveItem(item, destination);
            results.push(result);
          }
          break;

        case 'reorder':
          const reorderResult = await reorderItems(operation.items, destination);
          results.push(...reorderResult);
          break;
      }

      const dragResult: DragResult = {
        success: results.every(r => r.success),
        operation,
        results,
      };

      // Add to history for undo
      addToHistory({
        operation,
        result: dragResult,
        timestamp: Date.now(),
        canUndo: operation.type === 'move' || operation.type === 'reorder',
      });

      return dragResult;
    } catch (error) {
      console.error('Drop operation failed:', error);
      return {
        success: false,
        operation,
        results: results.length > 0 ? results : [
          {
            item: operation.items[0],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      };
    } finally {
      endDrag();
    }
  };

  /**
   * End drag operation
   */
  const endDrag = () => {
    globalDragState.isDragging = false;
    globalDragState.dragOperation = null;
    globalDragState.dropZone = null;
    globalDragState.dragPreview = null;
    globalDragState.canDrop = false;
  };

  /**
   * Create multi-item drag preview
   */
  const createMultiItemPreview = (items: DragItem[]) => {
    const preview = document.createElement('div');
    preview.className = 'drag-preview-multi';
    preview.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      background: #a0a0a0;
      border: 2px solid;
      border-color: #ffffff #000000 #000000 #ffffff;
      padding: 8px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      z-index: 10000;
      pointer-events: none;
    `;
    preview.textContent = `${items.length} items`;
    document.body.appendChild(preview);
    globalDragState.dragPreview = preview;

    // Clean up on unmount
    onUnmounted(() => {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    });
  };

  /**
   * API Operations
   */
  const copyItem = async (item: DragItem, destination: string) => {
    try {
      const response = await fetch(`${API_BASE}/files/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath: item.path || `${item.id}`,
          destinationPath: destination,
          newName: item.name,
        }),
      });

      if (!response.ok) throw new Error(`Copy failed: ${response.statusText}`);

      return { item, success: true };
    } catch (error) {
      return {
        item,
        success: false,
        error: error instanceof Error ? error.message : 'Copy failed',
      };
    }
  };

  const moveItem = async (item: DragItem, destination: string) => {
    try {
      const newPath = `${destination}/${item.name}`;
      const response = await fetch(`${API_BASE}/files/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: item.path,
          newName: newPath,
        }),
      });

      if (!response.ok) throw new Error(`Move failed: ${response.statusText}`);

      return { item, success: true };
    } catch (error) {
      return {
        item,
        success: false,
        error: error instanceof Error ? error.message : 'Move failed',
      };
    }
  };

  const reorderItems = async (items: DragItem[], context: string) => {
    try {
      const response = await fetch(`${API_BASE}/settings/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          items: items.map((item, index) => ({
            id: item.id,
            order: index,
          })),
        }),
      });

      if (!response.ok) throw new Error(`Reorder failed: ${response.statusText}`);

      return items.map(item => ({ item, success: true }));
    } catch (error) {
      return items.map(item => ({
        item,
        success: false,
        error: error instanceof Error ? error.message : 'Reorder failed',
      }));
    }
  };

  /**
   * Trash operations
   */
  const moveToTrash = async (items: DragItem[]): Promise<DragResult> => {
    const results: DragResult['results'] = [];

    for (const item of items) {
      try {
        const response = await fetch(`${API_BASE}/files/delete?path=${encodeURIComponent(item.path || item.name)}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);

        results.push({ item, success: true });
      } catch (error) {
        results.push({
          item,
          success: false,
          error: error instanceof Error ? error.message : 'Delete failed',
        });
      }
    }

    const operation: DragOperation = {
      type: 'move',
      items,
      source: 'unknown',
      destination: 'trash',
      timestamp: Date.now(),
    };

    return {
      success: results.every(r => r.success),
      operation,
      results,
    };
  };

  /**
   * History management
   */
  const addToHistory = (entry: DragHistory) => {
    dragHistory.value.unshift(entry);
    if (dragHistory.value.length > MAX_HISTORY) {
      dragHistory.value.pop();
    }
  };

  const undo = async (): Promise<boolean> => {
    const lastOperation = dragHistory.value.find(h => h.canUndo);
    if (!lastOperation) return false;

    // TODO: Implement undo logic based on operation type
    // For now, just remove from history
    const index = dragHistory.value.indexOf(lastOperation);
    if (index > -1) {
      dragHistory.value.splice(index, 1);
    }

    return true;
  };

  /**
   * Drag event handlers for HTML5 API
   */
  const handleDragStart = (event: DragEvent, items: DragItem[], operation: 'copy' | 'move' = 'move') => {
    if (!event.dataTransfer) return;

    startDrag(items, operation, 'file-system');

    event.dataTransfer.effectAllowed = operation === 'copy' ? 'copy' : 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        path: i.path,
        type: i.type,
      })),
    }));
  };

  const handleDragOver = (event: DragEvent, zone: DropZone) => {
    event.preventDefault();

    setDropZone(zone);

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = globalDragState.canDrop
        ? (globalDragState.dragOperation?.type === 'copy' ? 'copy' : 'move')
        : 'none';
    }
  };

  const handleDragLeave = () => {
    setDropZone(null);
  };

  const handleDrop = async (event: DragEvent, destination: string) => {
    event.preventDefault();

    if (!event.dataTransfer) return null;

    // Parse dropped data
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (data.items) {
        globalDragState.dragOperation = {
          type: event.ctrlKey || event.metaKey ? 'copy' : 'move',
          items: data.items,
          source: 'unknown',
          timestamp: Date.now(),
        };

        return await executeDrop(destination);
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }

    return null;
  };

  const handleDragEnd = () => {
    endDrag();
  };

  /**
   * Vuetify draggable options generator
   */
  const getDraggableOptions = (type: string, accepts: string[] = []): DragOptions => {
    return {
      group: type,
      animation: 150,
      ghostClass: 'drag-ghost',
      dragClass: 'drag-dragging',
      chosenClass: 'drag-chosen',
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: true,
    };
  };

  return {
    // State
    dragState: computed(() => globalDragState),
    isDragging: computed(() => globalDragState.isDragging),
    canDrop: computed(() => globalDragState.canDrop),
    dragHistory: computed(() => dragHistory.value),

    // Operations
    startDrag,
    setDropZone,
    executeDrop,
    endDrag,
    moveToTrash,
    undo,

    // HTML5 Drag handlers
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,

    // Vuetify draggable
    getDraggableOptions,
  };
}
