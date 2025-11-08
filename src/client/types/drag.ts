/**
 * TypeScript Type Definitions for Enhanced Drag & Drop System
 */

export interface DragItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'disk' | 'tool' | 'setting' | 'icon';
  path?: string;
  size?: string;
  created?: Date;
  modified?: Date;
  data?: any; // Additional metadata
}

export interface DragOperation {
  type: 'copy' | 'move' | 'link' | 'reorder';
  items: DragItem[];
  source: string;
  destination?: string;
  timestamp: number;
}

export interface DropZone {
  id: string;
  type: 'folder' | 'trash' | 'desktop' | 'settings' | 'disk';
  accepts: Array<'file' | 'folder' | 'disk' | 'tool' | 'setting' | 'icon'>;
  path?: string;
  validator?: (items: DragItem[]) => boolean;
}

export interface DragState {
  isDragging: boolean;
  dragOperation: DragOperation | null;
  dropZone: DropZone | null;
  dragPreview: HTMLElement | null;
  canDrop: boolean;
}

export interface DragResult {
  success: boolean;
  operation: DragOperation;
  results: Array<{
    item: DragItem;
    success: boolean;
    error?: string;
  }>;
}

export interface DragOptions {
  group?: string;
  animation?: number;
  ghostClass?: string;
  dragClass?: string;
  chosenClass?: string;
  fallbackClass?: string;
  filter?: string;
  preventOnFilter?: boolean;
  handle?: string;
  draggable?: string;
  swapThreshold?: number;
  invertSwap?: boolean;
  direction?: 'horizontal' | 'vertical';
  scrollSensitivity?: number;
  scrollSpeed?: number;
  bubbleScroll?: boolean;
}

export interface SettingItem {
  id: string;
  category: 'display' | 'sound' | 'workbench' | 'system';
  label: string;
  value: any;
  type: 'toggle' | 'slider' | 'select' | 'text';
  order?: number;
}

export interface DragHistory {
  operation: DragOperation;
  result: DragResult;
  timestamp: number;
  canUndo: boolean;
}
