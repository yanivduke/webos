/**
 * Unit tests for useDragDrop composable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDragDrop } from '../composables/useDragDrop';
import type { DragItem, DropZone } from '../types/drag';

// Mock fetch globally
global.fetch = vi.fn();

describe('useDragDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Drag State Management', () => {
    it('should initialize with correct default state', () => {
      const { dragState, isDragging, canDrop } = useDragDrop();

      expect(dragState.value.isDragging).toBe(false);
      expect(isDragging.value).toBe(false);
      expect(canDrop.value).toBe(false);
      expect(dragState.value.dragOperation).toBe(null);
    });

    it('should start drag operation correctly', () => {
      const { dragState, startDrag } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/test.txt' },
      ];

      startDrag(items, 'move', 'folder1');

      expect(dragState.value.isDragging).toBe(true);
      expect(dragState.value.dragOperation?.type).toBe('move');
      expect(dragState.value.dragOperation?.items).toEqual(items);
      expect(dragState.value.dragOperation?.source).toBe('folder1');
    });

    it('should end drag operation and clean up', () => {
      const { dragState, startDrag, endDrag } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file' },
      ];

      startDrag(items, 'move', 'folder1');
      expect(dragState.value.isDragging).toBe(true);

      endDrag();
      expect(dragState.value.isDragging).toBe(false);
      expect(dragState.value.dragOperation).toBe(null);
    });
  });

  describe('Drop Zone Validation', () => {
    it('should validate drop zone correctly for valid items', () => {
      const { setDropZone, startDrag, canDrop } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file' },
      ];

      const zone: DropZone = {
        id: 'folder1',
        type: 'folder',
        accepts: ['file', 'folder'],
      };

      startDrag(items, 'move', 'source');
      setDropZone(zone);

      expect(canDrop.value).toBe(true);
    });

    it('should reject drop for invalid item types', () => {
      const { setDropZone, startDrag, canDrop } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'system.exe', type: 'tool' },
      ];

      const zone: DropZone = {
        id: 'folder1',
        type: 'folder',
        accepts: ['file', 'folder'], // Does not accept 'tool'
      };

      startDrag(items, 'move', 'source');
      setDropZone(zone);

      expect(canDrop.value).toBe(false);
    });

    it('should call custom validator if provided', () => {
      const { setDropZone, startDrag, canDrop } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'large-file.zip', type: 'file', size: '500MB' },
      ];

      const validator = vi.fn(() => false);

      const zone: DropZone = {
        id: 'folder1',
        type: 'folder',
        accepts: ['file'],
        validator,
      };

      startDrag(items, 'move', 'source');
      setDropZone(zone);

      expect(validator).toHaveBeenCalledWith(items);
      expect(canDrop.value).toBe(false);
    });
  });

  describe('Copy Operations', () => {
    it('should execute copy operation successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { startDrag, executeDrop } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/source/test.txt' },
      ];

      startDrag(items, 'copy', 'source');

      // Need to set drop zone and canDrop for executeDrop to work
      const { setDropZone } = useDragDrop();
      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
      });

      const result = await executeDrop('/destination');

      expect(result.success).toBe(true);
      expect(result.operation.type).toBe('copy');
    });
  });

  describe('Move Operations', () => {
    it('should execute move operation successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { startDrag, setDropZone, executeDrop } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/source/test.txt' },
      ];

      startDrag(items, 'move', 'source');
      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
      });

      const result = await executeDrop('/destination');

      expect(result.success).toBe(true);
      expect(result.operation.type).toBe('move');
    });

    it('should handle move operation failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const { startDrag, setDropZone, executeDrop } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/source/test.txt' },
      ];

      startDrag(items, 'move', 'source');
      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
      });

      const result = await executeDrop('/destination');

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('Move failed');
    });
  });

  describe('Trash Operations', () => {
    it('should move items to trash successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { moveToTrash } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/test.txt' },
      ];

      const result = await moveToTrash(items);

      expect(result.success).toBe(true);
      expect(result.operation.destination).toBe('trash');
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should track history after successful operations', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { startDrag, setDropZone, executeDrop, dragHistory, canUndo } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/test.txt' },
      ];

      startDrag(items, 'move', 'source');
      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
      });

      await executeDrop('/destination');

      expect(dragHistory.value.length).toBeGreaterThan(0);
      expect(canUndo.value).toBe(true);
    });

    it('should not track history for copy operations', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { startDrag, setDropZone, executeDrop, dragHistory } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/test.txt' },
      ];

      const initialHistoryLength = dragHistory.value.length;

      startDrag(items, 'copy', 'source');
      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
      });

      await executeDrop('/destination');

      // Copy operations should not be added to undo history
      expect(dragHistory.value.length).toBe(initialHistoryLength);
    });

    it('should perform undo operation', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { startDrag, setDropZone, executeDrop, undo, canUndo } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/source/test.txt' },
      ];

      startDrag(items, 'move', 'source');
      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
      });

      await executeDrop('/destination');

      expect(canUndo.value).toBe(true);

      const undoResult = await undo();
      expect(undoResult).toBe(true);
    });
  });

  describe('Multi-item Operations', () => {
    it('should handle multiple items in drag operation', () => {
      const { startDrag, dragState } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'file1.txt', type: 'file' },
        { id: '2', name: 'file2.txt', type: 'file' },
        { id: '3', name: 'file3.txt', type: 'file' },
      ];

      startDrag(items, 'move', 'source');

      expect(dragState.value.dragOperation?.items.length).toBe(3);
    });

    it('should execute batch operations for multiple items', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { startDrag, setDropZone, executeDrop } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'file1.txt', type: 'file', path: '/file1.txt' },
        { id: '2', name: 'file2.txt', type: 'file', path: '/file2.txt' },
      ];

      startDrag(items, 'move', 'source');
      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
      });

      const result = await executeDrop('/destination');

      expect(result.results.length).toBe(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Prediction System', () => {
    it('should update prediction state when drop zone is set', () => {
      const { startDrag, setDropZone, predictionState } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file' },
      ];

      const zone: DropZone = {
        id: 'folder1',
        type: 'folder',
        accepts: ['file'],
      };

      startDrag(items, 'move', 'source');
      setDropZone(zone);

      expect(predictionState.value.predictedZone).toEqual(zone);
      expect(predictionState.value.confidence).toBe(1.0);
    });
  });

  describe('HTML5 Drag Events', () => {
    it('should handle drag start event', () => {
      const { handleDragStart } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/test.txt' },
      ];

      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
          setDragImage: vi.fn(),
        },
      } as any;

      handleDragStart(mockEvent, items, 'move');

      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalled();
    });

    it('should handle drag over event', () => {
      const { handleDragOver, startDrag } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file' },
      ];

      const zone: DropZone = {
        id: 'folder1',
        type: 'folder',
        accepts: ['file'],
      };

      startDrag(items, 'move', 'source');

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as any;

      handleDragOver(mockEvent, zone);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('Touch Events', () => {
    it('should handle touch start event', () => {
      const { handleTouchStart, dragState } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file' },
      ];

      const mockEvent = {
        touches: [{ clientX: 100, clientY: 200 }],
      } as any;

      handleTouchStart(mockEvent, items, 'move');

      expect(dragState.value.isDragging).toBe(true);
    });

    it('should handle touch end event', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { handleTouchStart, handleTouchEnd, setDropZone, dragState } = useDragDrop();

      const items: DragItem[] = [
        { id: '1', name: 'test.txt', type: 'file', path: '/test.txt' },
      ];

      setDropZone({
        id: 'dest',
        type: 'folder',
        accepts: ['file'],
        path: '/destination',
      });

      const mockStartEvent = {
        touches: [{ clientX: 100, clientY: 200 }],
      } as any;

      handleTouchStart(mockStartEvent, items, 'move');

      const mockEndEvent = {
        changedTouches: [{ clientX: 150, clientY: 250 }],
      } as any;

      // Mock elementFromPoint
      document.elementFromPoint = vi.fn(() => document.createElement('div'));

      await handleTouchEnd(mockEndEvent);

      expect(dragState.value.isDragging).toBe(false);
    });
  });
});
