/**
 * Enhanced Drag & Drop Composable with Advanced Features
 * - Undo/redo functionality
 * - Drag preview thumbnails
 * - Touch device support
 * - Prediction areas
 * - History management
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
const undoneHistory = ref<DragHistory[]>([]);
const MAX_HISTORY = 50;

// Prediction state
const predictionState = reactive({
  predictedZone: null as DropZone | null,
  predictedPosition: { x: 0, y: 0 },
  confidence: 0,
});

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

    // Create custom drag preview with thumbnails
    if (items.length > 1) {
      createMultiItemPreview(items);
    } else {
      createThumbnailPreview(items[0]);
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

      // Update prediction
      updatePrediction(zone);
    } else {
      globalDragState.canDrop = false;
      predictionState.predictedZone = null;
    }
  };

  /**
   * Update prediction based on drag position
   */
  const updatePrediction = (zone: DropZone) => {
    predictionState.predictedZone = zone;
    predictionState.confidence = globalDragState.canDrop ? 1.0 : 0.5;
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

    // Store original state for undo
    const originalState = await captureState(operation);

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
      if (dragResult.success && operation.type !== 'copy') {
        addToHistory({
          operation,
          result: dragResult,
          timestamp: Date.now(),
          canUndo: true,
          originalState,
        });
      }

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
   * Capture current state for undo
   */
  const captureState = async (operation: DragOperation): Promise<any> => {
    return {
      operation: JSON.parse(JSON.stringify(operation)),
      items: operation.items.map(item => ({
        ...item,
        originalPath: item.path,
      })),
    };
  };

  /**
   * End drag operation
   */
  const endDrag = () => {
    globalDragState.isDragging = false;
    globalDragState.dragOperation = null;
    globalDragState.dropZone = null;
    globalDragState.canDrop = false;
    predictionState.predictedZone = null;

    // Clean up preview
    if (globalDragState.dragPreview && globalDragState.dragPreview.parentNode) {
      globalDragState.dragPreview.parentNode.removeChild(globalDragState.dragPreview);
      globalDragState.dragPreview = null;
    }
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
      padding: 8px 12px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
    `;
    preview.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>📦</span>
        <span>${items.length} items</span>
      </div>
    `;
    document.body.appendChild(preview);
    globalDragState.dragPreview = preview;
  };

  /**
   * Create thumbnail preview for single item
   */
  const createThumbnailPreview = (item: DragItem) => {
    const preview = document.createElement('div');
    preview.className = 'drag-preview-thumbnail';
    preview.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      background: #a0a0a0;
      border: 2px solid;
      border-color: #ffffff #000000 #000000 #ffffff;
      padding: 12px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
      min-width: 120px;
    `;

    // Create icon based on type
    const iconMap: Record<string, string> = {
      file: '📄',
      folder: '📁',
      disk: '💾',
      tool: '🔧',
      setting: '⚙️',
      icon: '🖼️',
    };

    preview.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="font-size: 32px;">${iconMap[item.type] || '📦'}</div>
        <div style="text-align: center; word-break: break-word; max-width: 100px;">
          ${item.name}
        </div>
        ${item.size ? `<div style="font-size: 8px; color: #555;">${item.size}</div>` : ''}
      </div>
    `;
    document.body.appendChild(preview);
    globalDragState.dragPreview = preview;
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
    const originalState = { items: [...items] };

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

    const result: DragResult = {
      success: results.every(r => r.success),
      operation,
      results,
    };

    // Add to undo history
    if (result.success) {
      addToHistory({
        operation,
        result,
        timestamp: Date.now(),
        canUndo: true,
        originalState,
      });
    }

    return result;
  };

  /**
   * History management
   */
  const addToHistory = (entry: DragHistory) => {
    dragHistory.value.unshift(entry);
    if (dragHistory.value.length > MAX_HISTORY) {
      dragHistory.value.pop();
    }
    // Clear redo history when new action is performed
    undoneHistory.value = [];
  };

  /**
   * Undo last operation
   */
  const undo = async (): Promise<boolean> => {
    const lastOperation = dragHistory.value[0];
    if (!lastOperation || !lastOperation.canUndo) return false;

    try {
      const { operation, originalState } = lastOperation;

      // Reverse the operation
      switch (operation.type) {
        case 'move':
          // Move items back to original location
          if (operation.destination === 'trash') {
            // Restore from trash
            for (const item of operation.items) {
              await fetch(`${API_BASE}/files/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  path: `trash/${item.name}`,
                  newName: item.path,
                }),
              });
            }
          } else {
            // Move back to source
            for (const item of originalState.items) {
              const currentPath = `${operation.destination}/${item.name}`;
              await fetch(`${API_BASE}/files/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  path: currentPath,
                  newName: item.originalPath,
                }),
              });
            }
          }
          break;

        case 'reorder':
          // Restore original order
          if (originalState.operation) {
            await reorderItems(originalState.operation.items, operation.source);
          }
          break;
      }

      // Move to undo history
      undoneHistory.value.unshift(dragHistory.value.shift()!);
      if (undoneHistory.value.length > MAX_HISTORY) {
        undoneHistory.value.pop();
      }

      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  };

  /**
   * Redo last undone operation
   */
  const redo = async (): Promise<boolean> => {
    const lastUndone = undoneHistory.value[0];
    if (!lastUndone) return false;

    try {
      const { operation } = lastUndone;

      // Re-execute the operation
      if (operation.destination) {
        await executeDrop(operation.destination);
      }

      // Move back to history
      dragHistory.value.unshift(undoneHistory.value.shift()!);

      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      return false;
    }
  };

  /**
   * Clear history
   */
  const clearHistory = () => {
    dragHistory.value = [];
    undoneHistory.value = [];
  };

  /**
   * HTML5 Drag event handlers
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

    // Set custom drag image if preview exists
    if (globalDragState.dragPreview) {
      event.dataTransfer.setDragImage(globalDragState.dragPreview, 50, 50);
    }
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
          destination,
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
   * Touch event handlers
   */
  const handleTouchStart = (event: TouchEvent, items: DragItem[], operation: 'copy' | 'move' = 'move') => {
    const touch = event.touches[0];
    startDrag(items, operation, 'file-system');

    // Track touch for drag preview positioning
    if (globalDragState.dragPreview) {
      updatePreviewPosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!globalDragState.isDragging) return;

    event.preventDefault();
    const touch = event.touches[0];

    // Update preview position
    if (globalDragState.dragPreview) {
      updatePreviewPosition(touch.clientX, touch.clientY);
    }

    // Check for drop zone under touch
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      // Trigger drag over event on the element
      const dropZone = findDropZone(element);
      if (dropZone) {
        setDropZone(dropZone);
      }
    }
  };

  const handleTouchEnd = async (event: TouchEvent) => {
    if (!globalDragState.isDragging) return;

    const touch = event.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && globalDragState.canDrop && globalDragState.dropZone) {
      await executeDrop(globalDragState.dropZone.path || '');
    } else {
      endDrag();
    }
  };

  /**
   * Update preview position
   */
  const updatePreviewPosition = (x: number, y: number) => {
    if (globalDragState.dragPreview) {
      globalDragState.dragPreview.style.left = `${x + 10}px`;
      globalDragState.dragPreview.style.top = `${y + 10}px`;
    }
  };

  /**
   * Find drop zone from element
   */
  const findDropZone = (element: Element): DropZone | null => {
    // This would need to be implemented based on your specific drop zone registration
    // For now, return null
    return null;
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
    undoneHistory: computed(() => undoneHistory.value),
    canUndo: computed(() => dragHistory.value.length > 0),
    canRedo: computed(() => undoneHistory.value.length > 0),
    predictionState: computed(() => predictionState),

    // Operations
    startDrag,
    setDropZone,
    executeDrop,
    endDrag,
    moveToTrash,
    undo,
    redo,
    clearHistory,

    // HTML5 Drag handlers
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,

    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Vuetify draggable
    getDraggableOptions,
  };
}
